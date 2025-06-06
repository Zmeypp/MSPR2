import json, os, time, base64, qrcode, io
import mysql.connector
import pyotp

def handle(event, context):
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if hasattr(event, "httpMethod") and event.httpMethod == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": cors_headers,
            "body": ""
        }

    try:
        data = json.loads(event.body)
        username = data.get("username")

        if not username:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"error": "Missing username"})
            }

        # Lire le mot de passe MySQL
        with open('/var/openfaas/secrets/mysql-pwd', 'r') as f:
            mysql_pwd = f.read().strip()

        # Générer une clé MFA TOTP
        totp_secret = pyotp.random_base32()

        # Créer un QR code en base64
        totp_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(name=username, issuer_name="MSPR-Project")
        qr = qrcode.make(totp_uri)
        buf = io.BytesIO()
        qr.save(buf, format='PNG')
        qr_totp_base64 = base64.b64encode(buf.getvalue()).decode()

        # Connexion MySQL
        conn = mysql.connector.connect(
            host="mysql.default.svc.cluster.local",
            user="root",
            password=mysql_pwd
        )
        cursor = conn.cursor()

        # Créer la BDD + table si besoin
        cursor.execute("CREATE DATABASE IF NOT EXISTS openfaas")
        cursor.execute("USE openfaas")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE,
                mfa_secret TEXT,
                gendate BIGINT,
                expired BOOLEAN DEFAULT FALSE
            )
        """)

        # Vérifier doublon
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return {
                "statusCode": 409,
                "headers": cors_headers,
                "body": json.dumps({"error": "User already exists"})
            }

        # Insérer l'utilisateur
        now = int(time.time())
        cursor.execute(
            "INSERT INTO users (username, mfa_secret, gendate, expired) VALUES (%s, %s, %s, %s)",
            (username, totp_secret, now, False)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({
                "mfa_qrcode_base64": qr_totp_base64
            })
        }

    except Exception as e:
        print("Exception:", str(e))  # <-- ajoute ça pour debug dans les logs
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }

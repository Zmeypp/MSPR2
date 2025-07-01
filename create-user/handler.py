import json, os, time, base64, io
import mysql.connector
import qrcode
import secrets
import string
import bcrypt

def generate_password(length=20):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

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

        # Générer mot de passe fort
        plain_password = generate_password()

        # Hasher mot de passe
        hashed_password = bcrypt.hashpw(plain_password.encode(), bcrypt.gensalt()).decode()

        # Secret MFA vide au départ
        totp_secret = ""

        # QR code mot de passe (en clair)
        qr_pass = qrcode.make(plain_password)
        buf_pass = io.BytesIO()
        qr_pass.save(buf_pass, format='PNG')
        qr_pass_base64 = base64.b64encode(buf_pass.getvalue()).decode()

        # Connexion MySQL
        conn = mysql.connector.connect(
            host="mysql.default.svc.cluster.local",
            user="root",
            password=mysql_pwd
        )
        cursor = conn.cursor()

        # Créer BDD + table si besoin
        cursor.execute("CREATE DATABASE IF NOT EXISTS openfaas")
        cursor.execute("USE openfaas")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE,
                password VARCHAR(255) NOT NULL,
                mfa_secret TEXT,
                gendate BIGINT
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

        # Insérer utilisateur avec secret MFA vide
        now = int(time.time())
        six_months_later = now + 15778800
        cursor.execute(
            "INSERT INTO users (username, password, mfa_secret, gendate) VALUES (%s, %s, %s, %s)",
            (username, hashed_password, totp_secret, six_months_later)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({
                "password_qrcode_base64": qr_pass_base64
            })
        }

    except Exception as e:
        print("Exception:", str(e))
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }

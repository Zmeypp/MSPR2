import json, os, time, base64, io
import mysql.connector
import pyotp
import qrcode

def handle(event, context):
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    # Gérer la requête OPTIONS (pré-vol CORS)
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

        # Connexion MySQL
        conn = mysql.connector.connect(
            host="mysql.default.svc.cluster.local",
            user="root",
            password=mysql_pwd,
            database="openfaas"
        )
        cursor = conn.cursor()
        cursor.execute("SELECT mfa_secret, gendate FROM users WHERE username = %s", (username,))
        row = cursor.fetchone()

        if not row:
            cursor.close()
            conn.close()
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"error": "User not found"})
            }

        mfa_secret, gendate = row
        now = int(time.time())
        six_months = 15778800  # 6 mois en secondes

        if now - gendate < six_months:
            # MFA pas expirée
            cursor.close()
            conn.close()
            return {
                "statusCode": 200,
                "headers": cors_headers,
                "body": json.dumps({"message": "MFA is not expired"})
            }

        # MFA expirée => générer un nouveau secret et QR code
        new_secret = pyotp.random_base32()
        totp_uri = pyotp.totp.TOTP(new_secret).provisioning_uri(name=username, issuer_name="MSPR-Project")

        qr = qrcode.make(totp_uri)
        buf = io.BytesIO()
        qr.save(buf, format='PNG')
        qr_base64 = base64.b64encode(buf.getvalue()).decode()

        # Mise à jour en base
        now = int(time.time())
        cursor.execute("UPDATE users SET mfa_secret = %s, gendate = %s WHERE username = %s",
                       (new_secret, now, username))
        conn.commit()
        cursor.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"mfa_qrcode_base64": qr_base64})
        }

    except Exception as e:
        print("Exception:", str(e))
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }

import json, time, base64, io
import mysql.connector
import pyotp
import qrcode

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

        # Lecture mot de passe MySQL secret
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

        # Générer un nouveau secret MFA
        new_secret = pyotp.random_base32()
        totp_uri = pyotp.totp.TOTP(new_secret).provisioning_uri(name=username, issuer_name="MSPR-Project")

        # Générer QR code du TOTP URI
        qr = qrcode.make(totp_uri)
        buf = io.BytesIO()
        qr.save(buf, format='PNG')
        qr_base64 = base64.b64encode(buf.getvalue()).decode()

        # Mettre à jour le secret MFA en base pour cet utilisateur
        cursor.execute("UPDATE users SET mfa_secret = %s WHERE username = %s", (new_secret, username))
        conn.commit()

        cursor.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({
                "mfa_qrcode_base64": qr_base64
            })
        }

    except Exception as e:
        print("Exception:", str(e))
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }

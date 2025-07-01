import json, time, base64, io
import mysql.connector
import secrets
import string
import bcrypt
import qrcode

def generate_password(length=20):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

cors_headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def handle(event, context):
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

        # Lecture secret MySQL
        with open('/var/openfaas/secrets/mysql-pwd', 'r') as f:
            mysql_pwd = f.read().strip()

        conn = mysql.connector.connect(
            host="mysql.default.svc.cluster.local",
            user="root",
            password=mysql_pwd,
            database="openfaas"
        )
        cursor = conn.cursor()

        cursor.execute("SELECT gendate FROM users WHERE username = %s", (username,))
        row = cursor.fetchone()

        if not row:
            cursor.close()
            conn.close()
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"error": "User not found"})
            }

        gendate = row[0]
        now = int(time.time())

        # Mot de passe encore valide ?
        if gendate > now:
            cursor.close()
            conn.close()
            return {
                "statusCode": 200,
                "headers": cors_headers,
                "body": json.dumps({"message": "Password is still valid"})
            }

        # Générer mot de passe + hash
        new_password = generate_password()
        hashed_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

        # Générer QR code du mot de passe (simple, pas otp)
        qr = qrcode.make(new_password)
        buf = io.BytesIO()
        qr.save(buf, format='PNG')
        qr_base64 = base64.b64encode(buf.getvalue()).decode()

        six_months_later = now + 15778800
        cursor.execute(
            "UPDATE users SET password = %s, gendate = %s WHERE username = %s",
            (hashed_password, six_months_later, username)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"password_qrcode_base64": qr_base64})
        }

    except Exception as e:
        print("Exception:", str(e))
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }

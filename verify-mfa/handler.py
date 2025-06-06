import json, os, time
import mysql.connector
import pyotp

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
        code = data.get("code")

        if not username or not code:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"error": "Missing username or code"})
            }

        # Secrets
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
        cursor.execute("SELECT mfa_secret FROM users WHERE username = %s", (username,))
        row = cursor.fetchone()

        if not row:
            cursor.close()
            conn.close()
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"error": "User not found"})
            }

        mfa_secret = row[0]
        totp = pyotp.TOTP(mfa_secret)

        if not totp.verify(code):
            cursor.close()
            conn.close()
            return {
                "statusCode": 401,
                "headers": cors_headers,
                "body": json.dumps({"error": "Invalid MFA code"})
            }

        cursor.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"message": "MFA verified successfully"})
        }

    except Exception as e:
        print("Exception:", str(e))  # Pour debug dans les logs
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }

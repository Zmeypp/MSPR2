import json, os, time
import mysql.connector
import bcrypt

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
        password = data.get("password")

        if not username or not password:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"error": "Missing username or password"})
            }

        # Lire mot de passe MySQL
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
        cursor.execute("SELECT password, mfa_secret FROM users WHERE username = %s", (username,))
        row = cursor.fetchone()

        if not row:
            cursor.close()
            conn.close()
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"error": "User not found"})
            }

        hashed_password, mfa_secret = row

        # Vérifier mot de passe
        if not bcrypt.checkpw(password.encode(), hashed_password.encode()):
            cursor.close()
            conn.close()
            return {
                "statusCode": 401,
                "headers": cors_headers,
                "body": json.dumps({"error": "Invalid password"})
            }

        cursor.close()
        conn.close()

        # Indiquer si MFA est configuré
        mfa_configured = mfa_secret is not None and mfa_secret != ""

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({"mfa_configured": mfa_configured})
        }

    except Exception as e:
        print("Exception:", str(e))
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }

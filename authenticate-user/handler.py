import psycopg2, os, time, json
import pyotp

def handle(event, context):
    try:
        body = json.loads(event.body)
        username = body.get("username", "").strip()
        password = body.get("password", "").strip()
        token = body.get("token", "").strip()

        if not (username and password and token):
            return {"statusCode": 400, "body": "Missing fields"}

        conn = psycopg2.connect(
            host=os.environ["host"],
            user=os.environ["user"],
            password=os.environ["password"],
            dbname="postgres"
        )
        cur = conn.cursor()
        cur.execute("SELECT password_enc, mfa_secret_enc, gendate, expired FROM users WHERE username = %s", (username,))
        row = cur.fetchone()
        conn.close()

        if not row:
            return {"statusCode": 404, "body": "User not found"}

        password_db, mfa_secret, gendate, expired = row

        # Vérifier expiration (6 mois = 6*30*24*60*60)
        if time.time() - gendate > 15552000:
            # Expire le compte
            conn = psycopg2.connect(
                host=os.environ["host"],
                user=os.environ["user"],
                password=os.environ["password"],
                dbname="postgres"
            )
            cur = conn.cursor()
            cur.execute("UPDATE users SET expired = true WHERE username = %s", (username,))
            conn.commit()
            conn.close()
            return {"statusCode": 403, "body": "Account expired. Please regenerate."}

        # Vérifier mot de passe et TOTP
        if password != password_db:
            return {"statusCode": 401, "body": "Invalid password"}

        totp = pyotp.TOTP(mfa_secret)
        if not totp.verify(token):
            return {"statusCode": 401, "body": "Invalid 2FA token"}

        return {"statusCode": 200, "body": "Authenticated successfully"}

    except Exception as e:
        return {"statusCode": 500, "body": f"Error: {str(e)}"}


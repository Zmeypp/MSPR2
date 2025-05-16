import random, string, qrcode, io, base64
import psycopg2, os, time, json

def read_secret(name):
    path = f"/var/openfaas/secrets/{name}"
    with open(path, "r") as f:
        return f.read().strip()

def handle(event, context):
    try:
        body = json.loads(event.body)
        username = body.get("username", "").strip()
        if not username:
            return {"statusCode": 400, "body": "Missing username"}

        password = ''.join(random.choices(string.ascii_letters + string.digits + "!@#$%^&*", k=24))
        gendate = int(time.time())

        # Générer QR Code
        img = qrcode.make(password)
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()

        # Lire les secrets depuis fichiers
        host = read_secret("host")
        user = read_secret("user")
        password_db = read_secret("password")

        # Connexion DB
        conn = psycopg2.connect(
            host=host,
            user=user,
            password=password_db,
            dbname="postgres"
        )
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO users(username, password_enc, mfa_secret_enc, gendate)
            VALUES (%s, %s, '', %s)
            ON CONFLICT (username) DO UPDATE
            SET password_enc = EXCLUDED.password_enc, gendate = EXCLUDED.gendate, expired = false
        """, (username, password, gendate))
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "body": json.dumps({
                "qr": qr_base64,
                "password": password
            })
        }
    except Exception as e:
        return {"statusCode": 500, "body": f"Error: {str(e)}"}

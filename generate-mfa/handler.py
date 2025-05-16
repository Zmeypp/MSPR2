import pyotp, qrcode, io, base64
import psycopg2, os, json

def handle(event, context):
    try:
        body = json.loads(event.body)
        username = body.get("username", "").strip()
        if not username:
            return {"statusCode": 400, "body": "Missing username"}

        # Générer secret TOTP
        secret = pyotp.random_base32()
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name="SecureApp")

        # Générer QR Code du secret
        img = qrcode.make(totp_uri)
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode()

        # Enregistrer en DB
        conn = psycopg2.connect(
            host=os.environ["host"],
            user=os.environ["user"],
            password=os.environ["password"],
            dbname="postgres"
        )
        cur = conn.cursor()
        cur.execute("UPDATE users SET mfa_secret_enc = %s WHERE username = %s", (secret, username))
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "body": json.dumps({
                "secret": secret,
                "qr": qr_base64
            })
        }

    except Exception as e:
        return {"statusCode": 500, "body": f"Error: {str(e)}"}


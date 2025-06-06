import React, { useState } from "react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQrCodeBase64(null);

    try {
        const res = await fetch("/function/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      setQrCodeBase64(data.mfa_qrcode_base64);
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Créer un compte</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Création en cours..." : "Créer"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {qrCodeBase64 && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <p>Scanne ce QR code dans ton application d’authentification :</p>
          <img
            alt="QR Code MFA"
            src={`data:image/png;base64,${qrCodeBase64}`}
            style={{ width: 200, height: 200 }}
          />
        </div>
      )}
    </div>
  );
}

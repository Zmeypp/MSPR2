import React, { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";

export default function Home() {
  const location = useLocation();
  const username = location.state?.username;

  const [loading, setLoading] = useState(true);
  const [qrCodeBase64, setQrCodeBase64] = useState(null);
  const [error, setError] = useState(null);
  const [needsChange, setNeedsChange] = useState(false);

  useEffect(() => {
    if (!username) return; // Pas d'username => on ne fait rien

    async function checkQrCode() {
      setLoading(true);
      setError(null);
      setQrCodeBase64(null);
      setNeedsChange(false);

      try {
        const res = await fetch("/function/rotate-mfa-secret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Erreur serveur");
        } else if (data.mfa_qrcode_base64) {
          setQrCodeBase64(data.mfa_qrcode_base64);
          setNeedsChange(true);
        } else if (data.message) {
          setNeedsChange(false);
        } else {
          setError("Réponse inattendue");
        }
      } catch {
        setError("Erreur réseau");
      } finally {
        setLoading(false);
      }
    }

    checkQrCode();
  }, [username]);

  if (!username) {
    // Pas d'username => rediriger vers login
    return <Navigate to="/" replace />;
  }

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  if (needsChange) {
    return (
      <div style={{ maxWidth: 400, margin: "auto", padding: 20, textAlign: "center" }}>
        <h2>Votre QR code MFA doit être renouvelé</h2>
        <p>Merci de scanner ce nouveau QR code dans votre application d’authentification :</p>
        <img
          alt="Nouveau QR Code MFA"
          src={`data:image/png;base64,${qrCodeBase64}`}
          style={{ width: 200, height: 200, marginTop: 20 }}
        />
      </div>
    );
  } else {
    return (
      <div style={{ maxWidth: 400, margin: "auto", padding: 20, textAlign: "center" }}>
        <h2>Bonjour {username} !</h2>
        <p>Le QR code MFA n'a pas besoin d'être changé.</p>
      </div>
    );
  }
}

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
    if (!username) return;

    async function rotatePassword() {
      setLoading(true);
      setError(null);
      setQrCodeBase64(null);
      setNeedsChange(false);

      try {
        const res = await fetch("/function/rotate-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Erreur serveur");
        } else if (data.password_qrcode_base64) {
          setQrCodeBase64(data.password_qrcode_base64);
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

    rotatePassword();
  }, [username]);

  if (!username) return <Navigate to="/" replace />;

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e6ebf1",
        padding: 20,
        boxSizing: "border-box",
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: "#fff",
          padding: 32,
          borderRadius: 14,
          boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
          textAlign: "center",
          color: "#222",
        }}
      >
        {loading && <p style={{ fontSize: 18, color: "#555" }}>Chargement...</p>}

        {error && (
          <p
            style={{
              color: "crimson",
              marginBottom: 20,
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            {error}
          </p>
        )}

        {!loading && !error && needsChange && (
          <>
            <h2 style={{ marginBottom: 25, fontWeight: "700", fontSize: "1.8rem" }}>
              Votre mot de passe doit être renouvelé
            </h2>
            <p style={{ fontSize: 16, marginBottom: 25, color: "#444" }}>
              Merci de scanner ce QR code pour récupérer votre nouveau mot de passe :
            </p>
            <img
              alt="Nouveau QR Code Mot de Passe"
              src={`data:image/png;base64,${qrCodeBase64}`}
              style={{
                width: 220,
                height: 220,
                borderRadius: 14,
                boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                margin: "0 auto",
              }}
            />
          </>
        )}

        {!loading && !error && !needsChange && (
          <>
            <h2 style={{ marginBottom: 25, fontWeight: "700", fontSize: "1.8rem" }}>
              Bonjour {username} !
            </h2>
            <p style={{ fontSize: 16, marginBottom: 25, color: "#444" }}>
              Le mot de passe n'a pas besoin d'être changé.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

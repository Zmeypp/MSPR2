import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [qrPassword, setQrPassword] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQrPassword(null);

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

      setQrPassword(data.password_qrcode_base64);
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

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
        fontSize: 16,
        color: "#444",
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
        }}
      >
        <h2
          style={{
            marginBottom: 35,
            color: "#222",
            fontWeight: "700",
            fontSize: "2rem",
          }}
        >
          Créer un compte
        </h2>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column" }}>
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              padding: 16,
              fontSize: 17,
              borderRadius: 8,
              border: "1.8px solid #ccc",
              marginBottom: 30,
              outline: "none",
              transition: "border-color 0.4s ease, box-shadow 0.3s ease",
              boxShadow: "inset 0 0 5px #eee",
              color: "#fff", // <-- texte blanc
              backgroundColor: "#333", // <-- fond plus sombre pour contraste sinon texte blanc illisible
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#4a90e2";
              e.target.style.boxShadow = "0 0 8px #4a90e2";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ccc";
              e.target.style.boxShadow = "inset 0 0 5px #eee";
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 16,
              fontSize: 18,
              borderRadius: 8,
              border: "none",
              backgroundColor: loading ? "#a1c0f0" : "#4a90e2",
              color: "#fff",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.3s ease, box-shadow 0.3s ease",
              boxShadow: loading ? "none" : "0 3px 8px rgba(53, 122, 189, 0.5)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#357ABD";
                e.target.style.boxShadow = "0 6px 16px rgba(53, 122, 189, 0.7)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#4a90e2";
                e.target.style.boxShadow = "0 3px 8px rgba(53, 122, 189, 0.5)";
              }
            }}
          >
            {loading ? "Création en cours..." : "Créer"}
          </button>
        </form>

        {error && (
          <p
            style={{
              color: "crimson",
              marginTop: 25,
              fontWeight: "600",
            }}
          >
            {error}
          </p>
        )}

        <p style={{ marginTop: 30 }}>
          Déjà inscrit ?{" "}
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "none",
              border: "none",
              color: "#4a90e2",
              fontWeight: "600",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "1rem",
              padding: 0,
            }}
          >
            Connectez-vous
          </button>
        </p>


        {qrPassword && (
          <div
            style={{
              marginTop: 45,
              padding: 25,
              backgroundColor: "#fafafa",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <p
              style={{
                marginBottom: 25,
                fontWeight: "600",
                fontSize: 17,
                color: "#333",
              }}
            >
              Scanne ce QR code pour récupérer ton mot de passe :
            </p>
            <img
              alt="QR Code Mot de Passe"
              src={`data:image/png;base64,${qrPassword}`}
              style={{ width: 240, height: 240, borderRadius: 12, display: "block", margin: "0 auto" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

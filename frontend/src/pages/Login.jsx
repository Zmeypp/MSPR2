import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/function/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la connexion");
      } else {
        if (data.mfa_configured) {
          navigate("/verify-mfa", { state: { username } });
        } else {
          navigate("/setup-mfa", { state: { username } });
        }
      }
    } catch {
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
          Connexion
        </h2>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column" }}>
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
              marginBottom: 25,
              outline: "none",
              transition: "border-color 0.4s ease, box-shadow 0.3s ease",
              boxShadow: "inset 0 0 5px #eee",
              color: "#fff",           // <-- ici, couleur du texte en blanc
              backgroundColor: "#222", // <-- optionnel, met un fond foncé pour contraste
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

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
              color: "#fff",           // <-- texte en blanc
              backgroundColor: "#222", // <-- fond foncé pour bien voir le texte
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
            {loading ? "Connexion en cours..." : "Se connecter"}
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
          Pas encore de compte ?{" "}
          <button
            onClick={() => navigate("/register")}
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
            Inscrivez-vous
          </button>
        </p>

      </div>
    </div>
  );
}

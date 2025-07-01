import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyMFA() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;

  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!username) {
    // Pas d'username en state => rediriger vers login
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/function/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la vérification MFA");
      } else {
        navigate("/home", { state: { username } });
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
          Vérification MFA
        </h2>

        <p
          style={{
            color: "#333",
            marginBottom: 25,
            fontWeight: "600",
            fontSize: 16,
          }}
        >
          Bienvenue {username}, veuillez saisir votre code MFA pour continuer.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
          <input
            type="text"
            placeholder="Code MFA"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            pattern="\d{6}"
            title="Code MFA à 6 chiffres"
            style={{
              padding: 16,
              fontSize: 17,
              borderRadius: 8,
              border: "1.8px solid #ccc",
              marginBottom: 25,
              outline: "none",
              transition: "border-color 0.4s ease, box-shadow 0.3s ease",
              boxShadow: "inset 0 0 5px #eee",
              color: "#fff",
              backgroundColor: "#222",
              textAlign: "center",
              letterSpacing: "0.25em",
              caretColor: "#4a90e2",
              fontWeight: "600",
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
            {loading ? "Vérification en cours..." : "Valider"}
          </button>
        </form>

        {error && (
          <p
            style={{
              color: "crimson",
              marginTop: 20,
              fontWeight: "600",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

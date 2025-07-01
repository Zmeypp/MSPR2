import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function SetupMFA() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;

  const [qrCode, setQrCode] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate("/login", { replace: true });
      return;
    }

    async function fetchSetupMfa() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/function/setup-mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Erreur lors de la génération du QR code MFA");
        } else {
          setQrCode(data.mfa_qrcode_base64);
        }
      } catch {
        setError("Erreur réseau");
      } finally {
        setLoading(false);
      }
    }

    fetchSetupMfa();
  }, [username, navigate]);

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
        setError(data.error || "Code MFA invalide");
      } else {
        navigate("/home", { state: { username } });
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  if (!username) return null;

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
          Configurer votre MFA
        </h2>

        {loading && <p>Chargement...</p>}
        {error && (
          <p
            style={{
              color: "crimson",
              marginBottom: 20,
              fontWeight: "600",
            }}
          >
            {error}
          </p>
        )}

        {qrCode && (
          <>
            <p
              style={{
                color: "#333",
                marginBottom: 25,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Scanne ce QR code dans ton application d’authentification :
            </p>
            <img
              alt="QR Code MFA"
              src={`data:image/png;base64,${qrCode}`}
              style={{
                width: 220,
                height: 220,
                borderRadius: 14,
                marginBottom: 30,
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
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
          </>
        )}
      </div>
    </div>
  );
}

// src/pages/LoginPage.jsx
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brain, Shield, Zap, Target } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/select-domain", { replace: true });
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await login();
      toast.success("Welcome to PlacementPro!");
      navigate("/profile");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error("Sign-in failed. Please try again.");
      }
    }
  };

  const perks = [
    { icon: Shield, text: "Secure Google authentication" },
    { icon: Zap, text: "AI-powered adaptive questions" },
    { icon: Target, text: "Personalised feedback reports" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page, #f0f2f5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* CSS Variables Injection */}
      <style>{`
        :root {
          --bg-page: #f0f2f5;
          --bg-card: #ffffff;
          --bg-card-alt: #f8f9fb;
          --border: #e2e5ea;
          --text-primary: #111827;
          --text-secondary: #4b5563;
          --text-muted: #9ca3af;
          --accent: #2563eb;
          --accent-light: #dbeafe;
          --success: #16a34a;
          --success-light: #dcfce7;
          --warning: #d97706;
          --warning-light: #fef3c7;
          --danger: #dc2626;
          --danger-light: #fee2e2;
          --shadow: 0 1px 4px rgba(0,0,0,0.08);
          --radius: 10px;
          --radius-lg: 14px;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .lp-google-btn {
          transition: box-shadow 0.18s, background 0.18s;
        }
        .lp-google-btn:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
          background: #f8f9fb !important;
        }
        .lp-google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .lp-perk-row {
          transition: background 0.15s;
          border-radius: 8px;
          padding: 8px 10px;
        }
        .lp-perk-row:hover {
          background: var(--accent-light);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-fadein { animation: fadeInUp 0.45s ease both; }
      `}</style>

      <div
        className="lp-fadein"
        style={{
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "0",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                background: "var(--accent)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 12px rgba(37,99,235,0.25)",
              }}
            >
              <Brain style={{ width: "26px", height: "26px", color: "#fff" }} />
            </div>
            <span
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "var(--text-primary)",
                letterSpacing: "-0.3px",
              }}
            >
              Placement<span style={{ color: "var(--accent)" }}>Pro</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 2px 24px rgba(0,0,0,0.09)",
            border: "1px solid var(--border)",
            padding: "36px 32px 28px",
          }}
        >
          {/* Title */}
          <div style={{ marginBottom: "28px" }}>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "var(--text-primary)",
                margin: "0 0 6px",
                letterSpacing: "-0.3px",
              }}
            >
              Sign in to your account
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>
              Continue your AI-powered interview prep journey
            </p>
          </div>

          {/* Google Sign-in Button */}
          <button
            id="google-signin-btn"
            className="lp-google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "13px 20px",
              background: "#ffffff",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-primary)",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "var(--shadow)",
            }}
          >
            <svg style={{ width: "20px", height: "20px", flexShrink: 0 }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "24px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--text-muted)",
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              What you get
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          {/* Perks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {perks.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="lp-perk-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "var(--accent-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    fontWeight: "500",
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "18px",
            lineHeight: "1.6",
          }}
        >
          By signing in, you agree to our{" "}
          <span style={{ color: "var(--accent)", cursor: "pointer" }}>terms of service</span>{" "}
          and{" "}
          <span style={{ color: "var(--accent)", cursor: "pointer" }}>privacy policy</span>.
        </p>
      </div>
    </div>
  );
}

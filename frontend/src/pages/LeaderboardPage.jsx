// src/pages/LeaderboardPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getLeaderboard, getDomainStats, getUserPercentile } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Trophy, Medal, Crown, Loader2, Users, TrendingUp, Target, Zap,
} from "lucide-react";

const DOMAINS = [
  { id: "web_development",  label: "Web Dev", icon: "💻" },
  { id: "data_science_ml",  label: "DS / ML",  icon: "🤖" },
  { id: "cloud_computing",  label: "Cloud",    icon: "☁️" },
  { id: "core_cs",          label: "Core CS",  icon: "🧮" },
  { id: "hr_behavioral",    label: "HR",       icon: "🎯" },
];

// Avatar gradient by first letter
const AVATAR_GRADIENTS = [
  "#2563eb,#60a5fa", "#7c3aed,#a78bfa", "#059669,#34d399",
  "#d97706,#fbbf24", "#dc2626,#f87171", "#0891b2,#22d3ee",
];
function avatarGradient(name = "A") {
  const idx = (name.charCodeAt(0) - 65) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[Math.max(0, idx)];
}

function RankBadge({ rank }) {
  if (rank === 1) return <Crown style={{ width: "20px", height: "20px", color: "#f59e0b" }} />;
  if (rank === 2) return <Medal style={{ width: "20px", height: "20px", color: "#94a3b8" }} />;
  if (rank === 3) return <Medal style={{ width: "20px", height: "20px", color: "#b45309" }} />;
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: "13px",
        color: "var(--text-muted)",
        fontWeight: "600",
        width: "20px",
        textAlign: "center",
        display: "inline-block",
      }}
    >
      #{rank}
    </span>
  );
}

function scoreColor(rank) {
  if (rank === 1) return "#f59e0b";
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#b45309";
  return "var(--accent)";
}

function scoreBarColor(rank) {
  if (rank === 1) return "#f59e0b";
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#b45309";
  return "var(--accent)";
}

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [activeDomain, setActiveDomain] = useState("web_development");
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [percentile, setPercentile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async (domain) => {
    setLoading(true);
    try {
      const [lb, st] = await Promise.all([
        getLeaderboard(domain, 10),
        getDomainStats(domain),
      ]);
      setData(lb.leaderboard || []);
      setStats(st);

      if (user) {
        try {
          const p = await getUserPercentile(domain, user.uid, profile?.lastScore?.[domain] || 0);
          setPercentile(p);
        } catch { setPercentile(null); }
      }
    } catch {
      setData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeDomain);
  }, [activeDomain]);

  const domainInfo = DOMAINS.find((d) => d.id === activeDomain);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page, #f0f2f5)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lb-fadein { animation: fadeInUp 0.4s ease both; }

        .lb-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 50px;
          border: 1.5px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          box-shadow: var(--shadow);
        }
        .lb-tab:hover { border-color: var(--accent); color: var(--accent); }
        .lb-tab.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
          box-shadow: 0 2px 10px rgba(37,99,235,0.28);
        }

        .lb-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 24px;
          border-bottom: 1px solid var(--border);
          transition: background 0.13s;
        }
        .lb-row:last-child { border-bottom: none; }
        .lb-row:hover { background: var(--bg-card-alt); }
        .lb-row.top3 { background: #fffbeb; }
        .lb-row.top3:hover { background: #fef9e0; }

        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 18px 16px;
          text-align: center;
          box-shadow: var(--shadow);
          flex: 1;
        }
      `}</style>

      <Navbar />

      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "100px 16px 60px",
        }}
      >
        {/* Header */}
        <div className="lb-fadein" style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "50px",
              border: "1.5px solid #fde68a",
              background: "var(--warning-light, #fef3c7)",
              color: "var(--warning, #d97706)",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            <Trophy style={{ width: "15px", height: "15px" }} /> Domain Leaderboards
          </div>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: "800",
              color: "var(--text-primary)",
              margin: "0 0 10px",
              letterSpacing: "-0.5px",
            }}
          >
            Leaderboard
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", margin: 0 }}>
            Anonymous benchmarking — only usernames and scores shown
          </p>
        </div>

        {/* Domain Tab Bar */}
        <div
          className="lb-fadein"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "28px",
            animationDelay: "0.06s",
          }}
        >
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              id={`tab-${d.id}`}
              className={`lb-tab${activeDomain === d.id ? " active" : ""}`}
              onClick={() => setActiveDomain(d.id)}
            >
              <span>{d.icon}</span> {d.label}
            </button>
          ))}
        </div>

        {/* Stat Cards */}
        {stats && (
          <div
            className="lb-fadein"
            style={{
              display: "flex",
              gap: "14px",
              marginBottom: "20px",
              animationDelay: "0.1s",
            }}
          >
            {[
              { icon: Users,       label: "Participants",    value: stats.total || 0,       iconColor: "var(--accent)" },
              { icon: TrendingUp,  label: "Average Score",   value: stats.average || 0,     iconColor: "var(--success)" },
              { icon: Target,      label: "Your Percentile", value: percentile ? `${percentile.percentile}%` : "—", iconColor: "var(--warning)" },
            ].map(({ icon: Icon, label, value, iconColor }) => (
              <div key={label} className="stat-card">
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--bg-page)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <Icon style={{ width: "18px", height: "18px", color: iconColor }} />
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", fontWeight: "500" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Percentile Callout Banner */}
        {percentile && percentile.percentile > 0 && (
          <div
            className="lb-fadein"
            style={{
              background: "var(--accent-light)",
              border: "1.5px solid #93c5fd",
              borderRadius: "var(--radius)",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              animationDelay: "0.14s",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap style={{ width: "20px", height: "20px", color: "#fff" }} />
            </div>
            <div>
              <p style={{ margin: "0 0 3px", fontWeight: "600", color: "var(--accent)", fontSize: "14px" }}>
                {percentile.message}
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                Domain avg:{" "}
                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                  {percentile.average_score}
                </span>{" "}
                · Your score:{" "}
                <span style={{ fontWeight: "700", color: "var(--accent)" }}>
                  {percentile.user_score}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div
          className="lb-fadein"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow)",
            overflow: "hidden",
            animationDelay: "0.18s",
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-card-alt)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: "700",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>{domainInfo?.icon}</span>
              {domainInfo?.label} — Top 10
            </h2>
            <span
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                fontWeight: "500",
              }}
            >
              {data.length} entries
            </span>
          </div>

          {/* Table Body */}
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "64px 0",
              }}
            >
              <Loader2
                style={{
                  width: "32px",
                  height: "32px",
                  color: "var(--accent)",
                  animation: "spin 1s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : data.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 24px",
              }}
            >
              <Trophy
                style={{
                  width: "48px",
                  height: "48px",
                  color: "var(--text-muted)",
                  margin: "0 auto 16px",
                  opacity: 0.4,
                  display: "block",
                }}
              />
              <p
                style={{
                  margin: "0 0 6px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  fontSize: "15px",
                }}
              >
                No scores yet for this domain.
              </p>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-muted)" }}>
                Be the first — complete an interview!
              </p>
              <Link
                to="/select-domain"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 22px",
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: "var(--radius)",
                  fontSize: "14px",
                  fontWeight: "600",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                }}
              >
                Start Interview
              </Link>
            </div>
          ) : (
            <div>
              {data.map((entry) => (
                <div
                  key={entry.rank}
                  className={`lb-row${entry.rank <= 3 ? " top3" : ""}`}
                >
                  {/* Rank */}
                  <div
                    style={{
                      width: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <RankBadge rank={entry.rank} />
                  </div>

                  {/* Avatar */}
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${avatarGradient(entry.displayName)})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontWeight: "700",
                      fontSize: "15px",
                      color: "#fff",
                    }}
                  >
                    {(entry.displayName || "A").charAt(0).toUpperCase()}
                  </div>

                  {/* Name + Date */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {entry.displayName || "Anonymous"}
                    </div>
                    {entry.date && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "1px" }}>
                        {new Date(entry.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </div>
                    )}
                  </div>

                  {/* Score Bar */}
                  <div
                    style={{
                      width: "120px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    className="lb-scorebar"
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "6px",
                        background: "var(--bg-page)",
                        borderRadius: "99px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${entry.score}%`,
                          height: "100%",
                          background: scoreBarColor(entry.rank),
                          borderRadius: "99px",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Score Number */}
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "800",
                      width: "44px",
                      textAlign: "right",
                      color: scoreColor(entry.rank),
                      letterSpacing: "-0.5px",
                      flexShrink: 0,
                    }}
                  >
                    {entry.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign-in CTA for logged-out users */}
        {!user && (
          <div
            className="lb-fadein"
            style={{
              marginTop: "24px",
              textAlign: "center",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "28px",
              boxShadow: "var(--shadow)",
              animationDelay: "0.24s",
            }}
          >
            <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", fontSize: "14px" }}>
              Sign in to see your ranking and compare with peers
            </p>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 24px",
                background: "var(--accent)",
                color: "#fff",
                borderRadius: "var(--radius)",
                fontWeight: "600",
                fontSize: "14px",
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(37,99,235,0.25)",
              }}
            >
              Sign In with Google
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

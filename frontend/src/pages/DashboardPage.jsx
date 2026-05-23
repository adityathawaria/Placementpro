// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { getUserSessions } from "../services/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import {
  TrendingUp, BarChart3, Trophy, AlertTriangle,
  Calendar, ExternalLink, Loader2, Target, Zap
} from "lucide-react";

const DOMAIN_LABELS = {
  web_development: "Web Dev", data_science_ml: "DS/ML",
  cloud_computing: "Cloud", core_cs: "Core CS", hr_behavioral: "HR",
};

const SCORE_COLOR = (v) =>
  v >= 70 ? "var(--success)" : v >= 50 ? "var(--warning)" : "var(--danger)";

const SCORE_BG = (v) =>
  v >= 70 ? "var(--success-light)" : v >= 50 ? "var(--warning-light)" : "var(--danger-light)";

/* ── White tooltip for Recharts ────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "10px 14px",
      fontSize: 13,
      boxShadow: "var(--shadow-md)",
    }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 4, fontWeight: 500 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 700, margin: "2px 0" }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

/* ── Stat Card ──────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: "20px",
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      boxShadow: "var(--shadow)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon style={{ width: 20, height: 20, color: iconColor }} />
      </div>
      <div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 2 }}>{label}</p>
        <p style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{value}</p>
        {sub && <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Chart section wrapper ──────────────────────────────────────────────────── */
function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      boxShadow: "var(--shadow)",
    }}>
      <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: subtitle ? 2 : 18 }}>{title}</p>
      {subtitle && <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 18 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserSessions(user.uid)
      .then((res) => setSessions(res.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const last10 = sorted.slice(-10);

  const scoreOverTime = last10.map((s, i) => ({
    label: `S${i + 1}`,
    Overall: s.overallScore,
    Confidence: Math.round(s.confidenceScore),
    Communication: Math.round(s.communicationScore),
  }));

  // Domain-wise avg scores
  const domainMap = {};
  sessions.forEach((s) => {
    if (!domainMap[s.domain]) domainMap[s.domain] = { total: 0, count: 0 };
    domainMap[s.domain].total += s.overallScore;
    domainMap[s.domain].count += 1;
  });
  const domainChart = Object.entries(domainMap).map(([d, v]) => ({
    name: DOMAIN_LABELS[d] || d,
    avg: Math.round(v.total / v.count),
  }));

  // Filler words per session
  const fillerChart = last10.map((s, i) => ({
    label: `S${i + 1}`,
    Fillers: s.totalFillerWords || 0,
  }));

  // Weak topics (questions scoring < 60)
  const weakTopics = {};
  sessions.forEach((s) => {
    (s.questions || []).forEach((q) => {
      if ((q.technicalScore || 0) < 60 && q.topic) {
        weakTopics[q.topic] = (weakTopics[q.topic] || 0) + 1;
      }
    });
  });
  const weakList = Object.entries(weakTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, b) => a + b.overallScore, 0) / sessions.length)
    : 0;
  const bestScore = sessions.length ? Math.max(...sessions.map((s) => s.overallScore)) : 0;
  const totalSessions = sessions.length;

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg-page)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 style={{ width: 40, height: 40, color: "var(--accent)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!sessions.length) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
        <Navbar />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px", paddingTop: 160, textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", background: "var(--accent-light)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
          }}>
            <BarChart3 style={{ width: 36, height: 36, color: "var(--accent)" }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            No sessions yet
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
            Complete your first mock interview to see your progress dashboard.
          </p>
          <Link to="/select-domain" className="btn-primary" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: "var(--radius)", textDecoration: "none",
            fontWeight: 700, fontSize: 15,
          }}>
            <Zap style={{ width: 18, height: 18 }} /> Start First Interview
          </Link>
        </div>
      </div>
    );
  }

  // ── Axis tick style ──────────────────────────────────────────────────────────
  const tickStyle = { fill: "#9ca3af", fontSize: 12 };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", paddingTop: 80, paddingBottom: 64 }}>

        {/* Page Header */}
        <div className="fade-in-up" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
            Progress Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Track your improvement across {totalSessions} interview session{totalSessions !== 1 ? "s" : ""}.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          <StatCard
            icon={TrendingUp} label="Avg Score" value={avgScore} sub="across all sessions"
            iconBg="var(--accent-light)" iconColor="var(--accent)"
          />
          <StatCard
            icon={Trophy} label="Best Score" value={bestScore} sub="personal best"
            iconBg="var(--warning-light)" iconColor="var(--warning)"
          />
          <StatCard
            icon={BarChart3} label="Sessions" value={totalSessions} sub="completed"
            iconBg="var(--success-light)" iconColor="var(--success)"
          />
          <StatCard
            icon={Target} label="Domains" value={Object.keys(domainMap).length} sub="practiced"
            iconBg="#ede9fe" iconColor="#7c3aed"
          />
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20, marginBottom: 20 }}>
          <ChartCard title="Score Over Time">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Overall" stroke="var(--accent)" strokeWidth={2.5}
                  dot={{ fill: "var(--accent)", r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Confidence" stroke="var(--success)" strokeWidth={2}
                  dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="Communication" stroke="var(--warning)" strokeWidth={2}
                  dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {[
                { label: "Overall", color: "var(--accent)" },
                { label: "Confidence", color: "var(--success)" },
                { label: "Communication", color: "var(--warning)" },
              ].map(({ label, color }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <span style={{ width: 16, height: 3, background: color, borderRadius: 2, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Domain Performance">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={domainChart} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                  {domainChart.map((d) => (
                    <Cell key={d.name} fill={SCORE_COLOR(d.avg)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20, marginBottom: 20 }}>
          <ChartCard title="Filler Word Frequency" subtitle="Decreasing bars = improvement in fluency">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={fillerChart} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Fillers" fill="var(--danger)" fillOpacity={0.75} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Weak Topics */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: 24, boxShadow: "var(--shadow)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: "var(--warning)" }} />
              <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15 }}>Weak Topics</p>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 20 }}>
              Topics where you scored below 60%
            </p>
            {weakList.length === 0 ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 100, color: "var(--text-muted)", fontSize: 14,
              }}>
                🎉 No weak topics detected!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {weakList.map(([topic, count]) => (
                  <div key={topic} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>{topic}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 96, height: 6, background: "var(--bg-card-alt)",
                        borderRadius: 99, overflow: "hidden", border: "1px solid var(--border)",
                      }}>
                        <div style={{
                          height: "100%", background: "var(--warning)",
                          borderRadius: 99, width: `${Math.min(100, count * 20)}%`,
                        }} />
                      </div>
                      <span style={{ color: "var(--warning)", fontSize: 12, fontWeight: 600, minWidth: 60, textAlign: "right" }}>
                        {count} time{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Session History Table */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: 24, boxShadow: "var(--shadow)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Calendar style={{ width: 18, height: 18, color: "var(--accent)" }} />
            <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15 }}>Session History</p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{
                    paddingBottom: 12, textAlign: "left", fontSize: 11,
                    fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.06em", borderBottom: "1px solid var(--border)",
                  }}>Date</th>
                  <th style={{
                    paddingBottom: 12, textAlign: "left", fontSize: 11,
                    fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.06em", borderBottom: "1px solid var(--border)",
                  }}>Domain</th>
                  <th style={{
                    paddingBottom: 12, textAlign: "center", fontSize: 11,
                    fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.06em", borderBottom: "1px solid var(--border)",
                  }}>Overall</th>
                  <th style={{
                    paddingBottom: 12, textAlign: "center", fontSize: 11,
                    fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.06em", borderBottom: "1px solid var(--border)",
                  }}>Confidence</th>
                  <th style={{
                    paddingBottom: 12, textAlign: "center", fontSize: 11,
                    fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.06em", borderBottom: "1px solid var(--border)",
                  }}>Technical</th>
                  <th style={{
                    paddingBottom: 12, textAlign: "right", fontSize: 11,
                    fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.06em", borderBottom: "1px solid var(--border)",
                  }}>Report</th>
                </tr>
              </thead>
              <tbody>
                {[...sessions].reverse().map((s) => (
                  <tr
                    key={s.id || s.sessionId}
                    style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-alt)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "13px 0", color: "var(--text-secondary)", fontSize: 14 }}>
                      {new Date(s.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </td>
                    <td style={{ padding: "13px 0" }}>
                      <span className="tag-blue" style={{ fontSize: 12 }}>
                        {DOMAIN_LABELS[s.domain] || s.domain}
                      </span>
                    </td>
                    <td style={{ padding: "13px 0", textAlign: "center" }}>
                      <span style={{
                        fontWeight: 800, fontSize: 15,
                        color: SCORE_COLOR(s.overallScore),
                        background: SCORE_BG(s.overallScore),
                        padding: "2px 10px", borderRadius: 6,
                      }}>
                        {s.overallScore}
                      </span>
                    </td>
                    <td style={{ padding: "13px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
                      {Math.round(s.confidenceScore)}
                    </td>
                    <td style={{ padding: "13px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
                      {s.technicalScore || "—"}
                    </td>
                    <td style={{ padding: "13px 0", textAlign: "right" }}>
                      <Link
                        to={`/report/${s.id || s.sessionId}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          color: "var(--accent)", fontSize: 13, fontWeight: 600, textDecoration: "none",
                        }}
                      >
                        View <ExternalLink style={{ width: 12, height: 12 }} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

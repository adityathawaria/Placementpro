// src/pages/ReportPage.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { getSessionById } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Download, ArrowLeft, Star, TrendingUp, AlertTriangle,
  MessageSquare, Eye, Mic, Clock, ChevronDown, ChevronUp,
  CheckCircle, BookOpen, Target, Loader2
} from "lucide-react";

const EMOTION_COLORS = {
  happy: "#16a34a", neutral: "#6b7280", sad: "#2563eb",
  fear: "#d97706", angry: "#dc2626", surprised: "#7c3aed", confident: "#059669",
};

const DOMAIN_LABELS = {
  web_development: "Web Development", data_science_ml: "Data Science / ML",
  cloud_computing: "Cloud Computing", core_cs: "Core Computer Science", hr_behavioral: "HR / Behavioral",
};

// ── Grade helper ─────────────────────────────────────────────────────────────
function getGrade(score) {
  if (score >= 80) return { grade: "A", cls: "grade-a", color: "var(--success)", bg: "var(--success-light)" };
  if (score >= 70) return { grade: "B", cls: "grade-b", color: "#0891b2", bg: "#e0f2fe" };
  if (score >= 60) return { grade: "C", cls: "grade-c", color: "var(--warning)", bg: "var(--warning-light)" };
  if (score >= 50) return { grade: "D", cls: "grade-d", color: "#ea580c", bg: "#fff7ed" };
  return { grade: "F", cls: "grade-f", color: "var(--danger)", bg: "var(--danger-light)" };
}

// ── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120, label, color = "var(--accent)" }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={8} strokeDasharray={circ}
          strokeDashoffset={offset} strokeLinecap="round"
          className="score-ring"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        {/* Score text */}
        <text
          x="50%" y="50%"
          dominantBaseline="middle" textAnchor="middle"
          fill="var(--text-primary)"
          fontSize={size / 4}
          fontWeight="800"
          transform={`rotate(90, ${size / 2}, ${size / 2})`}
        >
          {score}
        </text>
      </svg>
      <span style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Filler Highlight ─────────────────────────────────────────────────────────
function FillerHighlight({ text, fillerWords = [] }) {
  if (!text) return (
    <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No transcription available</p>
  );
  if (!fillerWords.length) return (
    <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{text}</p>
  );

  const escaped = fillerWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const parts = text.split(pattern);

  return (
    <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
      {parts.map((part, i) =>
        fillerWords.some((f) => f.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="filler-highlight" style={{
            background: "#fef3c7", color: "#92400e",
            borderRadius: 3, padding: "1px 3px",
          }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(index === 0);
  const emotionColor = EMOTION_COLORS[q.dominantEmotion] || "#6b7280";
  const scoreColor = q.technicalScore >= 70
    ? "var(--success)"
    : q.technicalScore >= 50
    ? "var(--warning)"
    : "var(--danger)";
  const scoreBg = q.technicalScore >= 70
    ? "var(--success-light)"
    : q.technicalScore >= 50
    ? "var(--warning-light)"
    : "var(--danger-light)";

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow)",
    }}>
      {/* Accordion header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px", textAlign: "left", cursor: "pointer",
          background: "transparent", border: "none",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-alt)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <span style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "var(--accent-light)", color: "var(--accent)",
            fontSize: 13, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {index + 1}
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{
              color: "var(--text-primary)", fontWeight: 600, fontSize: 14,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {q.question}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              {q.question_type && (
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {q.question_type.replace("_", " ")}
                </span>
              )}
              {q.topic && (
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>· {q.topic}</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{
            fontWeight: 800, fontSize: 14,
            color: scoreColor, background: scoreBg,
            padding: "2px 10px", borderRadius: 6,
          }}>
            {q.technicalScore || 0}%
          </span>
          {open
            ? <ChevronUp style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
            : <ChevronDown style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
          }
        </div>
      </button>

      {open && (
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "20px",
          display: "flex", flexDirection: "column", gap: 20,
        }} className="fade-in-up">

          {/* Metrics grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { icon: Mic, label: "WPM", value: q.wordsPerMinute || 0 },
              { icon: Eye, label: "Eye Contact", value: `${q.eyeContactScore || 0}%` },
              { icon: Clock, label: "Duration", value: `${Math.round(q.duration || 0)}s` },
              { icon: MessageSquare, label: "Fillers", value: q.fillerWordCount || 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                background: "var(--bg-card-alt)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "12px 8px", textAlign: "center",
              }}>
                <Icon style={{ width: 16, height: 16, color: "var(--accent)", margin: "0 auto 6px" }} />
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15 }}>{value}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Emotion badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Dominant emotion:</span>
            <span style={{
              padding: "3px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
              color: emotionColor, background: `${emotionColor}18`,
              border: `1px solid ${emotionColor}30`,
            }}>
              {q.dominantEmotion || "neutral"}
            </span>
          </div>

          {/* Transcript */}
          <div>
            <p style={{
              fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase",
              letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8,
            }}>
              Your Answer
            </p>
            <div style={{
              background: "var(--bg-card-alt)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "14px 16px",
            }}>
              <FillerHighlight text={q.transcribedAnswer} fillerWords={q.fillerWords || []} />
            </div>
            {q.fillerWords?.length > 0 && (
              <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>
                🔴 Filler words highlighted: {q.fillerWords.join(", ")}
              </p>
            )}
          </div>

          {/* AI Feedback */}
          {q.aiFeedback && (
            <div style={{
              background: "var(--accent-light)", border: "1px solid #bfdbfe",
              borderRadius: "var(--radius)", padding: "14px 16px",
            }}>
              <p style={{
                fontSize: 11, color: "var(--accent)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
              }}>
                AI Feedback
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
                {q.aiFeedback}
              </p>
            </div>
          )}

          {/* Suggested Answer */}
          {q.suggestedAnswer && (
            <div style={{
              background: "var(--success-light)", border: "1px solid #bbf7d0",
              borderRadius: "var(--radius)", padding: "14px 16px",
            }}>
              <p style={{
                fontSize: 11, color: "var(--success)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
              }}>
                Ideal Answer Outline
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
                {q.suggestedAnswer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ReportPage ───────────────────────────────────────────────────────────
export default function ReportPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState(location.state?.session || null);
  const [loading, setLoading] = useState(!session);

  useEffect(() => {
    if (!session && sessionId && sessionId !== "demo") {
      getSessionById(sessionId).then(setSession).catch(() => {
        navigate("/dashboard");
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const handlePrint = () => window.print();

  // ── Loading ──────────────────────────────────────────────────────────────────
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

  // ── Error ────────────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg-page)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <AlertTriangle style={{ width: 48, height: 48, color: "var(--warning)", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            Report not found
          </h2>
          <Link to="/dashboard" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const {
    overallScore = 0, confidenceScore = 0, communicationScore = 0,
    technicalScore = 0, domain, report = {}, questions = []
  } = session;

  const scoreChartData = [
    { name: "Overall", score: overallScore, color: "var(--accent)" },
    { name: "Technical", score: technicalScore, color: "#7c3aed" },
    { name: "Confidence", score: confidenceScore, color: "var(--success)" },
    { name: "Communication", score: communicationScore, color: "var(--warning)" },
  ];

  const overallGrade = getGrade(overallScore);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px", paddingTop: 80, paddingBottom: 64 }}
        className="print:pt-4">

        {/* Page Header */}
        <div className="fade-in-up" style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 32, flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                color: "var(--text-muted)", fontSize: 14, background: "none", border: "none",
                cursor: "pointer", marginBottom: 10, padding: 0, transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Dashboard
            </button>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
              Interview Report
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
              {DOMAIN_LABELS[domain]} · {new Date(session.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </p>
          </div>

          <button
            id="print-report-btn"
            onClick={handlePrint}
            className="btn-ghost print:hidden"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: "var(--radius)",
              border: "1px solid var(--border)", background: "var(--bg-card)",
              color: "var(--text-secondary)", fontWeight: 600, fontSize: 14, cursor: "pointer",
              boxShadow: "var(--shadow)", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Download style={{ width: 16, height: 16 }} /> Export PDF
          </button>
        </div>

        {/* Score Overview Card */}
        <div className="fade-in-up" style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "32px 28px", marginBottom: 20,
          boxShadow: "var(--shadow)",
        }}>
          {/* Overall grade badge */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span style={{
              display: "inline-block", padding: "4px 18px", borderRadius: 99,
              background: overallGrade.bg, color: overallGrade.color,
              fontWeight: 800, fontSize: 13, letterSpacing: "0.04em",
            }}>
              Grade {overallGrade.grade}
            </span>
          </div>

          {/* Score rings */}
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            gap: 32, marginBottom: 28,
          }}>
            <ScoreRing score={overallScore} label="Overall Score" color="var(--accent)" size={130} />
            <ScoreRing score={technicalScore} label="Technical" color="#7c3aed" size={100} />
            <ScoreRing score={Math.round(confidenceScore)} label="Confidence" color="var(--success)" size={100} />
            <ScoreRing score={Math.round(communicationScore)} label="Communication" color="var(--warning)" size={100} />
          </div>

          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={scoreChartData} barSize={38}>
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 8, boxShadow: "var(--shadow-md)",
                }}
                labelStyle={{ color: "var(--text-muted)" }}
                itemStyle={{ color: "var(--text-primary)" }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {scoreChartData.map((d) => <Cell key={d.name} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="fade-in-up" style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 20,
            boxShadow: "var(--shadow)",
          }}>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: 15 }}>
              {report.summary}
            </p>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 20 }}>
          {/* Strengths */}
          <div className="fade-in-up" style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "20px 24px",
            boxShadow: "var(--shadow)",
          }}>
            <h3 style={{
              fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <Star style={{ width: 18, height: 18, color: "var(--success)" }} />
              Top Strengths
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
              {(report.strengths || []).map((s, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <CheckCircle style={{ width: 16, height: 16, color: "var(--success)", marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="fade-in-up" style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "20px 24px",
            boxShadow: "var(--shadow)",
          }}>
            <h3 style={{
              fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <TrendingUp style={{ width: 18, height: 18, color: "var(--warning)" }} />
              Areas to Improve
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
              {(report.improvements || []).map((s, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: "var(--warning)", marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Resources */}
        {report.recommendedResources?.length > 0 && (
          <div className="fade-in-up" style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 20,
            boxShadow: "var(--shadow)",
          }}>
            <h3 style={{
              fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <BookOpen style={{ width: 18, height: 18, color: "var(--accent)" }} />
              Recommended Resources
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {report.recommendedResources.map((r, i) => (
                <a
                  key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 14px",
                    background: "var(--bg-card-alt)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius)", textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.background = "var(--accent-light)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg-card-alt)";
                  }}
                >
                  <Target style={{ width: 18, height: 18, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600 }}>{r.title}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{r.type}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Question Breakdown */}
        <div className="fade-in-up" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>
            Question-by-Question Breakdown
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q, i) => <QuestionCard key={i} q={q} index={i} />)}
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <Link
            to="/select-domain"
            className="btn-primary"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 28px", borderRadius: "var(--radius)", textDecoration: "none",
              fontWeight: 700, fontSize: 15,
            }}
          >
            Practice Again
          </Link>
          <Link
            to="/dashboard"
            className="btn-outline"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 28px", borderRadius: "var(--radius)", textDecoration: "none",
              fontWeight: 700, fontSize: 15,
            }}
          >
            View Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}

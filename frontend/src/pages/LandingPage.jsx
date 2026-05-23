// src/pages/LandingPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { Brain, Mic, Video, BarChart3, Trophy, ChevronRight, Zap, Target, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "AI-Generated Questions", desc: "Gemini adapts questions based on your resume, domain, and live performance.", color: "#2563eb", bg: "#dbeafe" },
  { icon: Video, title: "Emotion Analysis", desc: "DeepFace tracks confidence, eye contact and nervousness frame-by-frame.", color: "#7c3aed", bg: "#ede9fe" },
  { icon: Mic, title: "Speech Transcription", desc: "Whisper transcribes every answer. Filler words flagged, speaking speed measured.", color: "#059669", bg: "#d1fae5" },
  { icon: BarChart3, title: "Progress Dashboard", desc: "Interactive charts track your improvement across sessions and topics.", color: "#d97706", bg: "#fef3c7" },
  { icon: Trophy, title: "Peer Benchmarking", desc: "Anonymous leaderboard shows how you rank against students in your domain.", color: "#db2777", bg: "#fce7f3" },
  { icon: Target, title: "Domain-Specific Prep", desc: "Web Dev, Data Science, Cloud, Core CS, or HR — tailored questions and scoring.", color: "#0891b2", bg: "#cffafe" },
];

const DOMAINS = [
  { name: "Web Development", icon: "💻" },
  { name: "Data Science / ML", icon: "🤖" },
  { name: "Cloud Computing", icon: "☁️" },
  { name: "Core CS", icon: "🧮" },
  { name: "HR / Behavioral", icon: "🎯" },
];

const STATS = [
  { value: "8", label: "Questions per session" },
  { value: "5", label: "Interview domains" },
  { value: "3", label: "AI models powering it" },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", color: "#111827" }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-4">
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid #bfdbfe" }}>
            <Zap className="w-3 h-3" /> AI-Powered Mock Interview Platform
          </div>

          <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.15, marginBottom: 16 }}>
            Ace Your Campus Placements<br />
            <span style={{ color: "var(--accent)" }}>with AI-Powered Coaching</span>
          </h1>

          <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Practice mock interviews with real-time emotion analysis, speech transcription,
            and personalised Gemini AI feedback. Know exactly where to improve.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate(user ? "/select-domain" : "/login")}
              className="btn-primary"
              style={{ fontSize: 15, padding: "11px 28px" }}
            >
              {user ? "Start Practicing" : "Get Started Free"} <ArrowRight className="w-4 h-4" />
            </button>
            <Link to="/leaderboard" className="btn-ghost" style={{ fontSize: 14, padding: "11px 22px" }}>
              View Leaderboard
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex justify-center gap-10 mt-12 flex-wrap">
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Domain pills ─────────────────────────────────────── */}
      <section className="py-8 px-4">
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
            Available Domains
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DOMAINS.map((d) => (
              <div key={d.name} className="tag tag-gray"
                style={{ padding: "6px 14px", fontSize: 13, borderRadius: 8, cursor: "default" }}>
                {d.icon} {d.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 32 }}>
            Everything you need to succeed
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="card p-6 fade-in-up"
                style={{ transition: "box-shadow 0.2s, transform 0.2s", cursor: "default" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div className="card p-10 text-center" style={{ borderColor: "#bfdbfe", background: "#f0f7ff" }}>
            <Brain className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--accent)" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              Ready to land your dream job?
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
              Join thousands of engineering students who practice smarter and interview with confidence.
            </p>
            <Link to={user ? "/select-domain" : "/login"} className="btn-primary"
              style={{ fontSize: 14, padding: "11px 28px" }}>
              Start Your First Interview <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
              Placement<span style={{ color: "var(--accent)" }}>Pro</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Built for engineering students. Powered by Gemini AI.</p>
          <div className="flex items-center gap-4">
            {[{ to: "/leaderboard", label: "Leaderboard" }, { to: "/login", label: "Sign In" }].map((l) => (
              <Link key={l.to} to={l.to} style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

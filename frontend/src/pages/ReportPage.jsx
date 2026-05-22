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
  happy: "#4ade80", neutral: "#94a3b8", sad: "#60a5fa",
  fear: "#fb923c", angry: "#f87171", surprised: "#c084fc", confident: "#34d399",
};

const DOMAIN_LABELS = {
  web_development: "Web Development", data_science_ml: "Data Science / ML",
  cloud_computing: "Cloud Computing", core_cs: "Core Computer Science", hr_behavioral: "HR / Behavioral",
};

function ScoreRing({ score, size = 120, label, color = "#3b82f6" }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a3258" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={8} strokeDasharray={circ}
          strokeDashoffset={offset} strokeLinecap="round"
          className="score-ring transition-all duration-1000"
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize={size / 4} fontWeight="bold"
          transform={`rotate(90, ${size / 2}, ${size / 2})`}>
          {score}
        </text>
      </svg>
      <span className="text-slate-400 text-xs text-center">{label}</span>
    </div>
  );
}

function FillerHighlight({ text, fillerWords = [] }) {
  if (!text) return <p className="text-slate-500 italic">No transcription available</p>;
  if (!fillerWords.length) return <p className="text-slate-300 leading-relaxed">{text}</p>;

  const escaped = fillerWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const parts = text.split(pattern);

  return (
    <p className="text-slate-300 leading-relaxed">
      {parts.map((part, i) =>
        fillerWords.some((f) => f.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="filler-highlight">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(index === 0);
  const emotionColor = EMOTION_COLORS[q.dominantEmotion] || "#94a3b8";

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <div>
            <p className="text-white font-medium text-sm line-clamp-1">{q.question}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">{q.question_type?.replace("_", " ")}</span>
              {q.topic && <span className="text-xs text-slate-600">· {q.topic}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${q.technicalScore >= 70 ? "text-emerald-400" : q.technicalScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {q.technicalScore || 0}%
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-blue-900/30 p-5 space-y-5 fade-in-up">
          {/* Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Mic, label: "WPM", value: q.wordsPerMinute || 0 },
              { icon: Eye, label: "Eye Contact", value: `${q.eyeContactScore || 0}%` },
              { icon: Clock, label: "Duration", value: `${Math.round(q.duration || 0)}s` },
              { icon: MessageSquare, label: "Fillers", value: q.fillerWordCount || 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/5 rounded-lg p-3 text-center">
                <Icon className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-white font-bold">{value}</div>
                <div className="text-slate-500 text-xs">{label}</div>
              </div>
            ))}
          </div>

          {/* Emotion */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">Dominant emotion:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold emotion-${q.dominantEmotion}`}
              style={{ color: emotionColor, background: `${emotionColor}20` }}>
              {q.dominantEmotion || "neutral"}
            </span>
          </div>

          {/* Transcript */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Your Answer</p>
            <div className="bg-white/5 rounded-lg p-4">
              <FillerHighlight text={q.transcribedAnswer} fillerWords={q.fillerWords || []} />
            </div>
            {(q.fillerWords?.length > 0) && (
              <p className="text-xs text-red-400/80 mt-1.5">
                🔴 Filler words highlighted: {q.fillerWords.join(", ")}
              </p>
            )}
          </div>

          {/* AI Feedback */}
          {q.aiFeedback && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2">AI Feedback</p>
              <p className="text-slate-300 text-sm leading-relaxed">{q.aiFeedback}</p>
            </div>
          )}

          {/* Suggested answer */}
          {q.suggestedAnswer && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">Ideal Answer Outline</p>
              <p className="text-slate-300 text-sm leading-relaxed">{q.suggestedAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Report not found</h2>
          <Link to="/dashboard" className="text-blue-400 hover:underline">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const { overallScore = 0, confidenceScore = 0, communicationScore = 0,
    technicalScore = 0, domain, report = {}, questions = [] } = session;

  const scoreChartData = [
    { name: "Overall", score: overallScore, color: "#3b82f6" },
    { name: "Technical", score: technicalScore, color: "#8b5cf6" },
    { name: "Confidence", score: confidenceScore, color: "#34d399" },
    { name: "Communication", score: communicationScore, color: "#f59e0b" },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 print:pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 fade-in-up">
          <div>
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-white">Interview Report</h1>
            <p className="text-slate-400 mt-1">
              {DOMAIN_LABELS[domain]} · {new Date(session.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </p>
          </div>
          <button
            id="print-report-btn"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all print:hidden"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>

        {/* Score overview */}
        <div className="glass p-8 rounded-2xl mb-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-wrap justify-center gap-10 mb-8">
            <ScoreRing score={overallScore} label="Overall Score" color="#3b82f6" size={130} />
            <ScoreRing score={technicalScore} label="Technical" color="#8b5cf6" size={100} />
            <ScoreRing score={Math.round(confidenceScore)} label="Confidence" color="#34d399" size={100} />
            <ScoreRing score={Math.round(communicationScore)} label="Communication" color="#f59e0b" size={100} />
          </div>

          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={scoreChartData} barSize={40}>
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{ background: "#071428", border: "1px solid #1a3258", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {scoreChartData.map((d) => <Cell key={d.name} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="glass p-6 rounded-2xl mb-6 fade-in-up" style={{ animationDelay: "0.15s" }}>
            <p className="text-slate-300 leading-relaxed">{report.summary}</p>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="glass p-6 rounded-2xl fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-400" /> Top Strengths
            </h3>
            <ul className="space-y-3">
              {(report.strengths || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass p-6 rounded-2xl fade-in-up" style={{ animationDelay: "0.25s" }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Areas to Improve
            </h3>
            <ul className="space-y-3">
              {(report.improvements || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Resources */}
        {report.recommendedResources?.length > 0 && (
          <div className="glass p-6 rounded-2xl mb-6 fade-in-up" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" /> Recommended Resources
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {report.recommendedResources.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-blue-900/30 rounded-xl transition-all group">
                  <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">{r.title}</div>
                    <div className="text-slate-500 text-xs mt-0.5 capitalize">{r.type}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Per-question breakdown */}
        <div className="fade-in-up" style={{ animationDelay: "0.35s" }}>
          <h3 className="text-xl font-bold text-white mb-4">Question-by-Question Breakdown</h3>
          <div className="space-y-3">
            {questions.map((q, i) => <QuestionCard key={i} q={q} index={i} />)}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center fade-in-up">
          <Link to="/select-domain"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-all">
            Practice Again
          </Link>
          <Link to="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 font-semibold rounded-xl transition-all">
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

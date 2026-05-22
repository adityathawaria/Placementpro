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

const SCORE_COLOR = (v) => v >= 70 ? "#34d399" : v >= 50 ? "#f59e0b" : "#f87171";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#071428] border border-blue-900/50 rounded-xl p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function StatCard({ icon: Icon, label, value, sub, color = "text-blue-400" }) {
  return (
    <div className="glass p-5 rounded-2xl flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
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

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-32 text-center">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">No sessions yet</h2>
          <p className="text-slate-400 mb-8">Complete your first mock interview to see your progress dashboard.</p>
          <Link to="/select-domain"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all">
            <Zap className="w-5 h-5" /> Start First Interview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8 fade-in-up">
          <h1 className="text-3xl font-bold text-white mb-1">Progress Dashboard</h1>
          <p className="text-slate-400">Track your improvement across {totalSessions} interview session{totalSessions !== 1 ? "s" : ""}.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={TrendingUp} label="Avg Score" value={`${avgScore}`} sub="across all sessions" color="text-blue-400" />
          <StatCard icon={Trophy} label="Best Score" value={`${bestScore}`} sub="personal best" color="text-amber-400" />
          <StatCard icon={BarChart3} label="Sessions" value={totalSessions} sub="completed" color="text-emerald-400" />
          <StatCard icon={Target} label="Domains" value={Object.keys(domainMap).length} sub="practiced" color="text-violet-400" />
        </div>

        {/* Charts row 1 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Overall score over time */}
          <div className="glass p-6 rounded-2xl fade-in-up">
            <h3 className="text-lg font-semibold text-white mb-5">Overall Score Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3258" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Overall" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Confidence" stroke="#34d399" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="Communication" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-400 inline-block" />Overall</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-emerald-400 inline-block" />Confidence</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-amber-400 inline-block" />Communication</span>
            </div>
          </div>

          {/* Domain-wise performance */}
          <div className="glass p-6 rounded-2xl fade-in-up">
            <h3 className="text-lg font-semibold text-white mb-5">Domain Performance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={domainChart} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3258" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                  {domainChart.map((d) => <Cell key={d.name} fill={SCORE_COLOR(d.avg)} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Filler word frequency */}
          <div className="glass p-6 rounded-2xl fade-in-up">
            <h3 className="text-lg font-semibold text-white mb-1">Filler Word Frequency</h3>
            <p className="text-slate-500 text-xs mb-5">Decreasing bars = improvement in fluency</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={fillerChart} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3258" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Fillers" fill="#f87171" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weak topics */}
          <div className="glass p-6 rounded-2xl fade-in-up">
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Weak Topics
            </h3>
            <p className="text-slate-500 text-xs mb-5">Topics where you scored below 60%</p>
            {weakList.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                🎉 No weak topics detected!
              </div>
            ) : (
              <div className="space-y-3">
                {weakList.map(([topic, count]) => (
                  <div key={topic} className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{topic}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-blue-900/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.min(100, count * 20)}%` }}
                        />
                      </div>
                      <span className="text-amber-400 text-xs font-medium w-16 text-right">
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
        <div className="glass p-6 rounded-2xl fade-in-up">
          <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Session History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-900/40 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="pb-3 text-left font-medium">Date</th>
                  <th className="pb-3 text-left font-medium">Domain</th>
                  <th className="pb-3 text-center font-medium">Overall</th>
                  <th className="pb-3 text-center font-medium">Confidence</th>
                  <th className="pb-3 text-center font-medium">Technical</th>
                  <th className="pb-3 text-right font-medium">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/20">
                {[...sessions].reverse().map((s) => (
                  <tr key={s.id || s.sessionId} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-slate-400">
                      {new Date(s.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">
                        {DOMAIN_LABELS[s.domain] || s.domain}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-bold" style={{ color: SCORE_COLOR(s.overallScore) }}>
                        {s.overallScore}
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-300">{Math.round(s.confidenceScore)}</td>
                    <td className="py-3 text-center text-slate-300">{s.technicalScore || "—"}</td>
                    <td className="py-3 text-right">
                      <Link to={`/report/${s.id || s.sessionId}`}
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition-colors">
                        View <ExternalLink className="w-3 h-3" />
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

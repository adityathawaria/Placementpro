// src/pages/LeaderboardPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getLeaderboard, getDomainStats, getUserPercentile } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Trophy, Medal, Crown, Loader2, Users, TrendingUp, Target, Zap
} from "lucide-react";

const DOMAINS = [
  { id: "web_development", label: "Web Dev", icon: "💻", color: "border-blue-500/50 bg-blue-500/10 text-blue-400" },
  { id: "data_science_ml", label: "DS / ML", icon: "🤖", color: "border-violet-500/50 bg-violet-500/10 text-violet-400" },
  { id: "cloud_computing", label: "Cloud", icon: "☁️", color: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" },
  { id: "core_cs", label: "Core CS", icon: "🧮", color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" },
  { id: "hr_behavioral", label: "HR", icon: "🎯", color: "border-orange-500/50 bg-orange-500/10 text-orange-400" },
];

const RANK_ICONS = [
  <Crown className="w-5 h-5 text-amber-400" />,
  <Medal className="w-5 h-5 text-slate-300" />,
  <Medal className="w-5 h-5 text-amber-600" />,
];

function RankBadge({ rank }) {
  if (rank <= 3) return RANK_ICONS[rank - 1];
  return <span className="text-slate-500 font-mono text-sm w-5 text-center">#{rank}</span>;
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

      // If user has a session score in this domain, fetch percentile
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
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-10 fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium mb-5">
            <Trophy className="w-4 h-4" /> Domain Leaderboards
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            See How You{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300">
              Stack Up
            </span>
          </h1>
          <p className="text-slate-400">Anonymous benchmarking — only usernames and scores shown</p>
        </div>

        {/* Domain tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              id={`tab-${d.id}`}
              onClick={() => setActiveDomain(d.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                activeDomain === d.id ? d.color : "border-blue-900/30 text-slate-500 hover:text-slate-300 hover:border-blue-900/50"
              }`}
            >
              <span>{d.icon}</span> {d.label}
            </button>
          ))}
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6 fade-in-up">
            {[
              { icon: Users, label: "Participants", value: stats.total || 0, color: "text-blue-400" },
              { icon: TrendingUp, label: "Average Score", value: stats.average || 0, color: "text-emerald-400" },
              { icon: Target, label: "Your Percentile", value: percentile ? `${percentile.percentile}%` : "—", color: "text-amber-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass p-4 rounded-xl text-center">
                <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-slate-500 text-xs">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Percentile callout */}
        {percentile && percentile.percentile > 0 && (
          <div className="glass p-5 rounded-xl border border-blue-500/30 mb-6 flex items-center gap-4 fade-in-up">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold">{percentile.message}</p>
              <p className="text-slate-400 text-sm">
                Domain avg: <span className="text-white">{percentile.average_score}</span> ·
                Your score: <span className="text-blue-400 font-bold"> {percentile.user_score}</span>
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard table */}
        <div className="glass rounded-2xl overflow-hidden fade-in-up">
          <div className="px-6 py-4 border-b border-blue-900/30 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              {domainInfo?.icon} {domainInfo?.label} — Top 10
            </h2>
            <span className="text-slate-500 text-sm">{data.length} entries</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No scores yet for this domain.</p>
              <p className="text-sm mt-1">Be the first — complete an interview!</p>
              <Link to="/select-domain"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-all">
                Start Interview
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-blue-900/20">
              {data.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/5 ${
                    entry.rank <= 3 ? "bg-white/5" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    <RankBadge rank={entry.rank} />
                  </div>

                  {/* Avatar placeholder */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {(entry.displayName || "A").charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{entry.displayName || "Anonymous"}</div>
                    {entry.date && (
                      <div className="text-slate-500 text-xs">
                        {new Date(entry.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </div>
                    )}
                  </div>

                  {/* Score bar */}
                  <div className="hidden sm:flex items-center gap-3 w-40">
                    <div className="flex-1 h-2 bg-blue-900/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${entry.score}%`,
                          background: entry.rank === 1 ? "#f59e0b" : entry.rank === 2 ? "#94a3b8" : entry.rank === 3 ? "#92400e" : "#3b82f6",
                        }}
                      />
                    </div>
                  </div>

                  {/* Score number */}
                  <div className={`text-xl font-bold w-12 text-right ${
                    entry.rank === 1 ? "text-amber-400" :
                    entry.rank === 2 ? "text-slate-300" :
                    entry.rank === 3 ? "text-amber-700" : "text-blue-400"
                  }`}>
                    {entry.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!user && (
          <div className="mt-8 text-center glass p-6 rounded-2xl fade-in-up">
            <p className="text-slate-400 mb-4">Sign in to see your ranking and compare with peers</p>
            <Link to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-all">
              Sign In with Google
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

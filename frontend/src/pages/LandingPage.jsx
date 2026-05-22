// src/pages/LandingPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
  Brain, Mic, Video, BarChart3, Trophy, ChevronRight,
  Zap, Shield, Target, Star, ArrowRight, Play
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Questions",
    desc: "Gemini generates adaptive questions based on your resume, domain, and performance in real time.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Video,
    title: "Webcam + Emotion Analysis",
    desc: "DeepFace detects your emotions frame-by-frame — confidence, nervousness, and eye contact scored automatically.",
    color: "from-violet-500 to-purple-400",
  },
  {
    icon: Mic,
    title: "Speech Transcription",
    desc: "OpenAI Whisper transcribes every answer. Filler words highlighted, speaking speed measured.",
    color: "from-emerald-500 to-teal-400",
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    desc: "Track improvement across sessions with interactive charts. See your weak topics and skill growth.",
    color: "from-orange-500 to-amber-400",
  },
  {
    icon: Trophy,
    title: "Peer Benchmarking",
    desc: "See how you rank against other students in your domain. Anonymous leaderboard updated in real time.",
    color: "from-pink-500 to-rose-400",
  },
  {
    icon: Target,
    title: "Domain-Specific Prep",
    desc: "Choose from Web Dev, Data Science, Cloud, Core CS, or HR — each with tailored questions and scoring.",
    color: "from-sky-500 to-blue-400",
  },
];

const DOMAINS = [
  { name: "Web Development", icon: "💻", color: "border-blue-500/40 bg-blue-500/5" },
  { name: "Data Science / ML", icon: "🤖", color: "border-violet-500/40 bg-violet-500/5" },
  { name: "Cloud Computing", icon: "☁️", color: "border-cyan-500/40 bg-cyan-500/5" },
  { name: "Core CS", icon: "🧮", color: "border-emerald-500/40 bg-emerald-500/5" },
  { name: "HR / Behavioral", icon: "🎯", color: "border-orange-500/40 bg-orange-500/5" },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-96 h-48 bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Mock Interview Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            Ace Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 glow-text">
              Campus Placements
            </span>
            <br />with AI Coaching
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice mock interviews with real-time emotion analysis, speech transcription,
            and personalized AI feedback. Know exactly where to improve before the big day.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <button
                onClick={() => navigate("/select-domain")}
                className="flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white text-lg font-bold rounded-xl transition-all glow-blue"
              >
                Start Practicing <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white text-lg font-bold rounded-xl transition-all glow-blue"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 px-8 py-4 border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-lg font-semibold rounded-xl transition-all"
            >
              <Play className="w-5 h-5" /> View Leaderboard
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "8", label: "Questions per session" },
              { value: "5", label: "Interview domains" },
              { value: "AI", label: "Powered feedback" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-blue-400">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domains */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Practice in Your{" "}
            <span className="text-blue-400">Domain</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {DOMAINS.map((d) => (
              <div
                key={d.name}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium text-slate-300 ${d.color}`}
              >
                <span className="text-lg">{d.icon}</span>
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Succeed
              </span>
            </h2>
            <p className="text-slate-400 text-lg">Professional-grade tools used by top hiring companies, built for students.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="glass p-6 group hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass p-12 glow-blue">
            <Star className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-slate-400 mb-8">
              Join thousands of engineering students who practice smarter and interview with confidence.
            </p>
            <Link
              to={user ? "/select-domain" : "/login"}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white text-lg font-bold rounded-xl transition-all"
            >
              Start Your First Interview <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-900/30 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white">Placement<span className="text-blue-400">Pro</span></span>
          </div>
          <p className="text-slate-500 text-sm">Built for engineering students. Powered by Gemini AI.</p>
          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <Link to="/leaderboard" className="hover:text-blue-400 transition-colors">Leaderboard</Link>
            <Link to="/login" className="hover:text-blue-400 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// src/pages/DomainSelectorPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const DOMAINS = [
  {
    id: "web_development",
    name: "Web Development",
    icon: "💻",
    description: "React, APIs, CSS, performance, security, browser internals",
    topics: ["JavaScript", "React", "Node.js", "REST APIs", "CSS", "Performance"],
    gradient: "from-blue-500 to-cyan-400",
    border: "border-blue-500/40",
    bg: "hover:bg-blue-500/5",
  },
  {
    id: "data_science_ml",
    name: "Data Science / ML",
    icon: "🤖",
    description: "ML algorithms, deep learning, NLP, statistics, model deployment",
    topics: ["Python", "ML Algorithms", "Neural Networks", "NLP", "Statistics"],
    gradient: "from-violet-500 to-purple-400",
    border: "border-violet-500/40",
    bg: "hover:bg-violet-500/5",
  },
  {
    id: "cloud_computing",
    name: "Cloud Computing",
    icon: "☁️",
    description: "AWS/GCP/Azure, Docker, Kubernetes, serverless, system design",
    topics: ["AWS", "Docker", "Kubernetes", "Serverless", "System Design"],
    gradient: "from-cyan-500 to-sky-400",
    border: "border-cyan-500/40",
    bg: "hover:bg-cyan-500/5",
  },
  {
    id: "core_cs",
    name: "Core Computer Science",
    icon: "🧮",
    description: "Data structures, algorithms, OS, networks, databases",
    topics: ["DSA", "Operating Systems", "Networking", "DBMS", "OOP"],
    gradient: "from-emerald-500 to-teal-400",
    border: "border-emerald-500/40",
    bg: "hover:bg-emerald-500/5",
  },
  {
    id: "hr_behavioral",
    name: "HR / Behavioral",
    icon: "🎯",
    description: "Situational, STAR-method, leadership, teamwork, motivation",
    topics: ["Leadership", "Teamwork", "Problem Solving", "Communication", "Goal Setting"],
    gradient: "from-orange-500 to-amber-400",
    border: "border-orange-500/40",
    bg: "hover:bg-orange-500/5",
  },
];

export default function DomainSelectorPage() {
  const [selected, setSelected] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (!selected) {
      toast.error("Please select a domain first");
      return;
    }
    navigate("/interview", { state: { domain: selected } });
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-10 fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-3">
            Choose Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Interview Domain
            </span>
          </h1>
          <p className="text-slate-400">Select the area you want to practice. Questions will be tailored to your domain and resume.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {DOMAINS.map((domain, i) => (
            <button
              key={domain.id}
              id={`domain-${domain.id}`}
              onClick={() => setSelected(domain.id)}
              className={`relative text-left glass p-6 rounded-2xl border transition-all duration-200 ${domain.bg} fade-in-up ${
                selected === domain.id
                  ? `${domain.border} ring-2 ring-offset-2 ring-offset-transparent ring-blue-500/50`
                  : "border-blue-900/30 hover:border-blue-500/30"
              }`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {selected === domain.id && (
                <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-blue-400" />
              )}
              <div className={`text-3xl mb-3`}>{domain.icon}</div>
              <h3 className="text-lg font-bold text-white mb-1">{domain.name}</h3>
              <p className="text-slate-400 text-sm mb-3">{domain.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {domain.topics.map((t) => (
                  <span key={t} className="px-2 py-0.5 text-xs rounded-md bg-white/5 text-slate-400 border border-white/10">
                    {t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Interview info */}
        <div className="glass p-5 rounded-xl border border-blue-900/30 mb-8">
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: "Total Questions", value: "8" },
              { label: "Warm-up", value: "2" },
              { label: "Technical", value: "4" },
              { label: "HR", value: "2" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-2xl font-bold text-blue-400">{item.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          id="start-interview-btn"
          onClick={handleStart}
          disabled={!selected}
          className="w-full flex items-center justify-center gap-2 py-4 px-8 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl transition-all glow-blue"
        >
          Start Interview <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

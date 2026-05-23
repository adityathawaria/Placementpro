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
  },
  {
    id: "data_science_ml",
    name: "Data Science / ML",
    icon: "🤖",
    description: "ML algorithms, deep learning, NLP, statistics, model deployment",
    topics: ["Python", "ML Algorithms", "Neural Networks", "NLP", "Statistics"],
  },
  {
    id: "cloud_computing",
    name: "Cloud Computing",
    icon: "☁️",
    description: "AWS/GCP/Azure, Docker, Kubernetes, serverless, system design",
    topics: ["AWS", "Docker", "Kubernetes", "Serverless", "System Design"],
  },
  {
    id: "core_cs",
    name: "Core Computer Science",
    icon: "🧮",
    description: "Data structures, algorithms, OS, networks, databases",
    topics: ["DSA", "Operating Systems", "Networking", "DBMS", "OOP"],
  },
  {
    id: "hr_behavioral",
    name: "HR / Behavioral",
    icon: "🎯",
    description: "Situational, STAR-method, leadership, teamwork, motivation",
    topics: ["Leadership", "Teamwork", "Problem Solving", "Communication", "Goal Setting"],
  },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function DomainSelectorPage() {
  const [selected, setSelected] = useState(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (!selected) {
      toast.error("Please select a domain first");
      return;
    }
    navigate("/interview", { state: { domain: selected, difficulty } });
  };

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
          --shadow: 0 1px 4px rgba(0,0,0,0.08);
          --radius: 10px;
          --radius-lg: 14px;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ds-fadein { animation: fadeInUp 0.4s ease both; }
        .domain-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 22px 20px 18px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          box-shadow: var(--shadow);
          position: relative;
        }
        .domain-card:hover {
          border-color: var(--accent);
          box-shadow: 0 4px 16px rgba(37,99,235,0.13);
        }
        .domain-card.selected {
          border-color: var(--accent);
          background: #f0f5ff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12), 0 4px 16px rgba(37,99,235,0.10);
        }
        .diff-pill {
          padding: 8px 22px;
          border-radius: 50px;
          border: 1.5px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .diff-pill:hover { border-color: var(--accent); color: var(--accent); }
        .diff-pill.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
          box-shadow: 0 2px 8px rgba(37,99,235,0.25);
        }
        .topic-tag {
          padding: 3px 9px;
          font-size: 11px;
          border-radius: 6px;
          background: var(--bg-page);
          color: var(--text-muted);
          border: 1px solid var(--border);
          font-weight: 500;
        }
        .start-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 15px 24px;
          background: var(--accent);
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(37,99,235,0.25);
          transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
          letter-spacing: -0.2px;
        }
        .start-btn:hover:not(:disabled) {
          background: #1d4ed8;
          box-shadow: 0 4px 20px rgba(37,99,235,0.35);
          transform: translateY(-1px);
        }
        .start-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
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
        {/* Page Header */}
        <div
          className="ds-fadein"
          style={{ textAlign: "center", marginBottom: "40px" }}
        >
          <h1
            style={{
              fontSize: "30px",
              fontWeight: "800",
              color: "var(--text-primary)",
              margin: "0 0 10px",
              letterSpacing: "-0.5px",
            }}
          >
            Select Interview Domain
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", margin: 0 }}>
            Select the area you want to practice. Questions will be tailored to your domain and resume.
          </p>
        </div>

        {/* Domain Cards Grid */}
        <div
          className="ds-fadein"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
            animationDelay: "0.05s",
          }}
        >
          {DOMAINS.map((domain, i) => (
            <button
              key={domain.id}
              id={`domain-${domain.id}`}
              className={`domain-card${selected === domain.id ? " selected" : ""}`}
              onClick={() => setSelected(domain.id)}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {selected === domain.id && (
                <CheckCircle2
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    width: "18px",
                    height: "18px",
                    color: "var(--accent)",
                  }}
                />
              )}

              {/* Emoji Icon */}
              <div style={{ fontSize: "40px", marginBottom: "12px", lineHeight: 1 }}>
                {domain.icon}
              </div>

              {/* Domain Name */}
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  margin: "0 0 5px",
                  letterSpacing: "-0.2px",
                }}
              >
                {domain.name}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  margin: "0 0 14px",
                  lineHeight: "1.5",
                }}
              >
                {domain.description}
              </p>

              {/* Topic Tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {domain.topics.map((t) => (
                  <span key={t} className="topic-tag">{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Difficulty Selector */}
        <div
          className="ds-fadein"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            marginBottom: "24px",
            boxShadow: "var(--shadow)",
            animationDelay: "0.18s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  marginBottom: "2px",
                }}
              >
                Difficulty Level
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Choose how challenging the questions should be
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  id={`difficulty-${d.toLowerCase()}`}
                  className={`diff-pill${difficulty === d ? " active" : ""}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interview Info Bar */}
        <div
          className="ds-fadein"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "16px 24px",
            marginBottom: "24px",
            boxShadow: "var(--shadow)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
            textAlign: "center",
            animationDelay: "0.22s",
          }}
        >
          {[
            { label: "Total Questions", value: "8" },
            { label: "Warm-up", value: "2" },
            { label: "Technical", value: "4" },
            { label: "HR", value: "2" },
          ].map((item) => (
            <div key={item.label}>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "var(--accent)",
                  letterSpacing: "-0.5px",
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                  fontWeight: "500",
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <div className="ds-fadein" style={{ animationDelay: "0.28s" }}>
          <button
            id="start-interview-btn"
            className="start-btn"
            onClick={handleStart}
            disabled={!selected}
          >
            Start Interview <ChevronRight style={{ width: "20px", height: "20px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

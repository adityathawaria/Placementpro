// src/services/api.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000, // 90s for Whisper
});

// ── Health check ──────────────────────────────────────────────────────────────
export const checkBackendHealth = async () => {
  try {
    const res = await api.get("/health", { timeout: 3000 });
    return res.status === 200;
  } catch {
    return false;
  }
};

// ── Resume ────────────────────────────────────────────────────────────────────
export const parseResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/parse-resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ── Questions ─────────────────────────────────────────────────────────────────
export const generateQuestion = async ({
  domain,
  questionHistory = [],
  resumeText = "",
  questionIndex = 0,
  lastScore = 50,
}) => {
  try {
    const res = await api.post("/generate-question", {
      domain,
      question_history: questionHistory,
      resume_text: resumeText,
      question_index: questionIndex,
      last_score: lastScore,
    });
    return res.data;
  } catch (err) {
    console.warn("generateQuestion failed, using fallback:", err?.message);
    // Return a domain-specific fallback question so interview never stalls
    return getFallbackQuestion(domain, questionIndex);
  }
};

// ── Analysis ──────────────────────────────────────────────────────────────────
export const analyzeAnswer = async ({ audioBlob, frames = [], questionIndex = 0 }) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "answer.webm");
  if (frames.length > 0) {
    formData.append("frames", JSON.stringify(frames));
  }
  formData.append("question_index", String(questionIndex));
  try {
    const res = await api.post("/analyze-answer", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 90000,
    });
    return res.data;
  } catch (err) {
    console.warn("analyzeAnswer failed, using defaults:", err?.message);
    // Return a neutral mock result — interview always moves forward
    return {
      transcription: {
        text: "",
        duration_seconds: 0,
        words_per_minute: 0,
        filler_words: [],
        filler_word_count: 0,
      },
      emotion: {
        dominant_emotion: "neutral",
        emotion_distribution: {},
        eye_contact_score: 70,
        confidence_score: 70,
      },
      scores: {
        speaking_score: 70,
        confidence_score: 70,
        communication_score: 70,
        eye_contact_score: 70,
      },
    };
  }
};

// ── Report ────────────────────────────────────────────────────────────────────
export const generateReport = async (sessionPayload) => {
  try {
    const res = await api.post("/generate-report", sessionPayload, {
      timeout: 90000,
    });
    return res.data;
  } catch (err) {
    console.warn("generateReport backend failed, generating client-side report:", err?.message);
    // Build a minimal local report so user sees results even without backend
    return buildLocalReport(sessionPayload);
  }
};

export const getSessionById = async (sessionId) => {
  const res = await api.get(`/session/${sessionId}`);
  return res.data;
};

export const getUserSessions = async (userId) => {
  try {
    const res = await api.get(`/sessions/${userId}`);
    return res.data;
  } catch {
    return { sessions: [] };
  }
};

// ── Leaderboard ───────────────────────────────────────────────────────────────
export const getLeaderboard = async (domain, limit = 10) => {
  try {
    const res = await api.get(`/leaderboard/${domain}`, { params: { limit } });
    return res.data;
  } catch {
    return { leaderboard: [] };
  }
};

export const getDomainStats = async (domain) => {
  try {
    const res = await api.get(`/leaderboard/${domain}/stats`);
    return res.data;
  } catch {
    return { total: 0, average: 0 };
  }
};

export const getUserPercentile = async (domain, userId, score) => {
  try {
    const res = await api.get(`/leaderboard/${domain}/percentile/${userId}`, {
      params: { score },
    });
    return res.data;
  } catch {
    return null;
  }
};

// ── Fallback helpers (work without backend) ───────────────────────────────────

const FALLBACK_QUESTIONS = {
  web_development: [
    "Explain the difference between CSS Flexbox and Grid, and when you would use each.",
    "What is the Virtual DOM in React and how does it improve performance?",
    "How does JavaScript's event loop work? Explain with an example.",
    "What are React hooks? Explain useState and useEffect with examples.",
    "Describe the REST API principles and HTTP methods.",
    "What is CORS and how do you handle it in a web application?",
    "Explain the difference between authentication and authorization.",
    "What are Web Vitals and how do you optimize them?",
  ],
  data_science_ml: [
    "Explain the bias-variance tradeoff in machine learning.",
    "What is gradient descent and how does it work?",
    "Explain overfitting and three ways to prevent it.",
    "What is the difference between supervised and unsupervised learning?",
    "Explain precision, recall, and F1-score with examples.",
    "What is a confusion matrix and how do you read it?",
    "Explain how a Random Forest works.",
    "What is the difference between L1 and L2 regularization?",
  ],
  cloud_computing: [
    "Explain the difference between IaaS, PaaS, and SaaS.",
    "What is auto-scaling and when should you use it?",
    "Explain the CAP theorem in distributed systems.",
    "What is a load balancer and what types exist?",
    "How does containerization with Docker differ from virtual machines?",
    "Explain CI/CD pipeline and its benefits.",
    "What are microservices and how do they differ from monoliths?",
    "Explain the concept of serverless computing.",
  ],
  core_cs: [
    "Explain the difference between a stack and a queue with use cases.",
    "What is Big O notation? Explain O(n), O(log n), and O(n²).",
    "Describe the difference between BFS and DFS graph traversal.",
    "What is a hash table and how does it handle collisions?",
    "Explain the concept of dynamic programming with an example.",
    "What are the four pillars of Object-Oriented Programming?",
    "Explain deadlock and how to prevent it in operating systems.",
    "What is a binary search tree and what are its time complexities?",
  ],
  hr_behavioral: [
    "Tell me about yourself and your technical background.",
    "Describe a situation where you had to work under pressure to meet a deadline.",
    "Tell me about a time you had a conflict with a team member and how you resolved it.",
    "What is your greatest technical strength and how have you applied it?",
    "Describe your most challenging project and what you learned from it.",
    "Where do you see yourself in 5 years?",
    "Why do you want to work for our company specifically?",
    "Tell me about a time you failed and what you did next.",
  ],
};

function getFallbackQuestion(domain, index) {
  const questions = FALLBACK_QUESTIONS[domain] || FALLBACK_QUESTIONS.core_cs;
  const q = questions[index % questions.length];
  const types = ["warm_up", "warm_up", "technical", "technical", "technical", "technical", "hr_behavioral", "hr_behavioral"];
  return {
    question: q,
    difficulty: index < 2 ? "easy" : index < 6 ? "medium" : "hard",
    topic: "General",
    question_type: types[index] || "technical",
    hints: [],
  };
}

function buildLocalReport(payload) {
  const { domain, questions = [], confidenceScore = 70, communicationScore = 70 } = payload;
  const overallScore = Math.round((confidenceScore + communicationScore) / 2);
  const sessionId = `local-${Date.now()}`;

  return {
    sessionId,
    session: {
      id: sessionId,
      userId: payload.userId,
      domain,
      date: new Date().toISOString(),
      overallScore,
      confidenceScore: Math.round(confidenceScore),
      communicationScore: Math.round(communicationScore),
      technicalScore: Math.round(overallScore * 0.9),
      totalFillerWords: questions.reduce((a, q) => a + (q.fillerWordCount || 0), 0),
      questions: questions.map((q, i) => ({
        ...q,
        technicalScore: q.confidenceScore || 70,
        aiFeedback: "Complete your interview and check back when the AI server is connected for detailed feedback.",
        suggestedAnswer: "",
      })),
      report: {
        summary: `You completed ${questions.length} questions in the ${domain?.replace(/_/g, " ")} domain. Connect the backend server for detailed AI feedback.`,
        strengths: [
          "Completed the full interview session",
          "Demonstrated willingness to practice",
          "Engaged with all questions",
        ],
        improvements: [
          "Connect the AI backend for personalised feedback",
          "Practice speaking at 130-160 words per minute",
          "Reduce filler words like 'um', 'uh', 'like'",
        ],
        recommendedResources: [
          { title: "LeetCode Practice", url: "https://leetcode.com", type: "course" },
          { title: "Pramp Mock Interviews", url: "https://www.pramp.com", type: "course" },
          { title: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "article" },
        ],
      },
    },
  };
}

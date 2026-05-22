// src/services/api.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min for AI calls
});

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
  const res = await api.post("/generate-question", {
    domain,
    question_history: questionHistory,
    resume_text: resumeText,
    question_index: questionIndex,
    last_score: lastScore,
  });
  return res.data;
};

// ── Analysis ──────────────────────────────────────────────────────────────────

export const analyzeAnswer = async ({ audioBlob, frames = [], questionIndex = 0 }) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "answer.webm");
  if (frames.length > 0) {
    formData.append("frames", JSON.stringify(frames));
  }
  formData.append("question_index", String(questionIndex));
  const res = await api.post("/analyze-answer", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ── Report ────────────────────────────────────────────────────────────────────

export const generateReport = async (sessionPayload) => {
  const res = await api.post("/generate-report", sessionPayload);
  return res.data;
};

export const saveSession = async (sessionData) => {
  const res = await api.post("/save-session", sessionData);
  return res.data;
};

export const getSessionById = async (sessionId) => {
  const res = await api.get(`/session/${sessionId}`);
  return res.data;
};

export const getUserSessions = async (userId) => {
  const res = await api.get(`/sessions/${userId}`);
  return res.data;
};

// ── Leaderboard ───────────────────────────────────────────────────────────────

export const getLeaderboard = async (domain, limit = 10) => {
  const res = await api.get(`/leaderboard/${domain}`, { params: { limit } });
  return res.data;
};

export const getDomainStats = async (domain) => {
  const res = await api.get(`/leaderboard/${domain}/stats`);
  return res.data;
};

export const getUserPercentile = async (domain, userId, score) => {
  const res = await api.get(`/leaderboard/${domain}/percentile/${userId}`, {
    params: { score },
  });
  return res.data;
};

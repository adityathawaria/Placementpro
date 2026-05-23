// src/pages/InterviewPage.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { generateQuestion, analyzeAnswer, generateReport } from "../services/api";
import { Mic, MicOff, Video, VideoOff, Clock, Brain, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const TOTAL_QUESTIONS = 8;
const ANSWER_TIME_LIMIT = 120;
const DOMAIN_LABELS = {
  web_development: "Web Development", data_science_ml: "Data Science / ML",
  cloud_computing: "Cloud Computing", core_cs: "Core Computer Science", hr_behavioral: "HR / Behavioral",
};

export default function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const domain = location.state?.domain || "core_cs";

  const [phase, setPhase] = useState("setup");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME_LIMIT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [mediaError, setMediaError] = useState(null);

  const questionIndexRef = useRef(0);
  const questionHistoryRef = useRef([]);
  const questionResultsRef = useRef([]);
  const currentQuestionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const framesRef = useRef([]);
  const timerRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => { questionIndexRef.current = questionIndex; }, [questionIndex]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true); setMediaError(null);
    } catch {
      setMediaError("Camera/mic access denied. Please allow permissions and refresh.");
      setCameraOn(false);
    }
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };

  const loadQuestion = async (index, score = 50) => {
    setLoadingQuestion(true); setCurrentQuestion(null);
    try {
      const q = await generateQuestion({ domain, questionHistory: questionHistoryRef.current, resumeText: profile?.resumeText || "", questionIndex: index, lastScore: score });
      currentQuestionRef.current = q; setCurrentQuestion(q);
    } catch {
      const fb = { question: "Describe a key concept in this domain that excites you.", difficulty: "medium", topic: "General", question_type: "technical", hints: [] };
      currentQuestionRef.current = fb; setCurrentQuestion(fb);
    } finally { setLoadingQuestion(false); }
  };

  const captureFrame = () => {
    if (!videoRef.current || !cameraOn) return;
    try {
      const c = document.createElement("canvas"); c.width = 320; c.height = 240;
      c.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
      framesRef.current.push(c.toDataURL("image/jpeg", 0.5).split(",")[1]);
      if (framesRef.current.length > 20) framesRef.current = framesRef.current.slice(-20);
    } catch (_) {}
  };

  const startRecording = () => {
    if (!streamRef.current || processingRef.current) return;
    chunksRef.current = []; framesRef.current = [];
    try {
      const mr = new MediaRecorder(streamRef.current, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus" : "video/webm",
      });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(200); mediaRecorderRef.current = mr;
    } catch { toast.error("Could not start recording."); return; }

    setIsRecording(true); setTimeLeft(ANSWER_TIME_LIMIT);
    frameIntervalRef.current = setInterval(captureFrame, 2500);
    let remaining = ANSWER_TIME_LIMIT;
    timerRef.current = setInterval(() => {
      remaining -= 1; setTimeLeft(remaining);
      if (remaining <= 0) { clearInterval(timerRef.current); submitAnswer(); }
    }, 1000);
  };

  const submitAnswer = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    clearInterval(timerRef.current); clearInterval(frameIntervalRef.current);
    setIsRecording(false); setIsAnalyzing(true);

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      await new Promise((resolve) => { mr.onstop = resolve; mr.stop(); });
    }

    const audioBlob = new Blob(chunksRef.current, { type: "video/webm" });
    const frames = [...framesRef.current];
    const idx = questionIndexRef.current;
    const q = currentQuestionRef.current;

    let res = null;
    try { res = await analyzeAnswer({ audioBlob, frames, questionIndex: idx }); }
    catch (err) { console.warn("Analysis failed:", err); }

    const answerData = {
      question: q?.question || "", question_index: idx,
      question_type: q?.question_type || "technical", topic: q?.topic || "",
      transcribedAnswer: res?.transcription?.text || "",
      dominantEmotion: res?.emotion?.dominant_emotion || "neutral",
      emotionDistribution: res?.emotion?.emotion_distribution || {},
      fillerWords: res?.transcription?.filler_words || [],
      fillerWordCount: res?.transcription?.filler_word_count || 0,
      wordsPerMinute: res?.transcription?.words_per_minute || 0,
      eyeContactScore: res?.scores?.eye_contact_score ?? 70,
      confidenceScore: res?.scores?.confidence_score ?? 70,
      communicationScore: res?.scores?.communication_score ?? 70,
      speakingScore: res?.scores?.speaking_score ?? 70,
      duration: res?.transcription?.duration_seconds || 0,
    };

    questionHistoryRef.current.push({ question: answerData.question, answer: answerData.transcribedAnswer, score: answerData.confidenceScore });
    questionResultsRef.current.push(answerData);
    setIsAnalyzing(false); processingRef.current = false;

    const nextIndex = idx + 1;
    if (nextIndex >= TOTAL_QUESTIONS) {
      await finishInterview(questionResultsRef.current);
    } else {
      setQuestionIndex(nextIndex); questionIndexRef.current = nextIndex;
      await loadQuestion(nextIndex, answerData.confidenceScore);
    }
  };

  const finishInterview = async (results) => {
    setPhase("submitting"); stopCamera();
    const avgConf = results.reduce((a, b) => a + (b.confidenceScore || 50), 0) / results.length;
    const avgComm = results.reduce((a, b) => a + (b.communicationScore || 50), 0) / results.length;
    try {
      const report = await generateReport({ userId: user?.uid || "demo", domain, questions: results, confidenceScore: avgConf, communicationScore: avgComm, saveToFirestore: !!user, displayName: profile?.name || user?.displayName || "Anonymous" });
      navigate(`/report/${report.sessionId || "demo"}`, { state: { session: report.session } });
    } catch { toast.error("Failed to generate report."); setPhase("interview"); }
  };

  useEffect(() => {
    if (phase === "interview") { startCamera().then(() => loadQuestion(0)); }
    return () => { stopCamera(); clearInterval(timerRef.current); clearInterval(frameIntervalRef.current); };
  }, [phase]);

  const timerPct = (timeLeft / ANSWER_TIME_LIMIT) * 100;
  const timerColor = timeLeft > 60 ? "var(--success)" : timeLeft > 30 ? "var(--warning)" : "var(--danger)";

  // ── Setup Screen ──────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div style={{ background: "var(--bg-page)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div className="card p-8 fade-in-up" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, background: "var(--accent-light)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Brain className="w-8 h-8" style={{ color: "var(--accent)" }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Ready to Interview?</h1>
          <div className="tag tag-blue" style={{ marginBottom: 12 }}>{DOMAIN_LABELS[domain]}</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
            You'll answer {TOTAL_QUESTIONS} questions. Each answer is recorded and analyzed for speech, emotion, and technical accuracy.
          </p>

          {mediaError && (
            <div className="alert alert-danger mb-4" style={{ marginBottom: 16, textAlign: "left" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {mediaError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[{ icon: Video, label: "Webcam required" }, { icon: Mic, label: "Microphone required" }, { icon: Clock, label: `${ANSWER_TIME_LIMIT}s per question` }, { icon: Brain, label: "AI feedback after" }].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--bg-card-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--text-secondary)" }}>
                <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} /> {label}
              </div>
            ))}
          </div>

          <button id="begin-interview-btn" onClick={() => setPhase("interview")} className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15 }}>
            Begin Interview
          </button>
        </div>
      </div>
    );
  }

  // ── Submitting Screen ─────────────────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div style={{ background: "var(--bg-page)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card p-10 text-center fade-in-up" style={{ maxWidth: 400 }}>
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-5" style={{ color: "var(--accent)" }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Generating Your Report</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>AI is analyzing your performance across all {TOTAL_QUESTIONS} questions...</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, fontSize: 12, color: "var(--text-muted)" }}>
            <CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} /> All answers recorded
          </div>
        </div>
      </div>
    );
  }

  // ── Interview Screen ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)" }}>
      {/* Top bar */}
      <div style={{ background: "var(--nav-bg)", borderBottom: "1px solid #2d3748", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Brain className="w-4 h-4" style={{ color: "#60a5fa" }} />
          <span style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{DOMAIN_LABELS[domain]}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: i < questionIndex ? "var(--success)" : i === questionIndex ? "#60a5fa" : "#374151",
              transform: i === questionIndex ? "scale(1.3)" : "scale(1)",
              transition: "all 0.3s",
            }} />
          ))}
          <span style={{ color: "#9ca3af", fontSize: 12, marginLeft: 8 }}>Q{questionIndex + 1}/{TOTAL_QUESTIONS}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" }}>
        {/* Left: Question */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "28px 32px", borderRight: "1px solid var(--border)", background: "var(--bg-card)" }}>
          {/* Timer */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                <Clock className="w-3.5 h-3.5" /> Time remaining
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: timeLeft <= 30 ? "var(--danger)" : "var(--text-primary)" }}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
            </div>
          </div>

          {/* Question type badge */}
          {currentQuestion && !isAnalyzing && (
            <div style={{ marginBottom: 16 }}>
              <span className="tag tag-blue" style={{ marginRight: 6 }}>{currentQuestion.question_type?.replace("_", " ").toUpperCase()}</span>
              <span className="tag tag-gray" style={{ marginRight: 6 }}>{currentQuestion.difficulty?.toUpperCase()}</span>
              {currentQuestion.topic && <span className="tag tag-gray">{currentQuestion.topic}</span>}
            </div>
          )}

          {/* Question */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-start" }}>
            {isAnalyzing ? (
              <div style={{ width: "100%", textAlign: "center", paddingTop: 40 }}>
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "var(--accent)" }} />
                <p style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 500 }}>Analyzing your answer...</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Transcribing speech & detecting emotions</p>
              </div>
            ) : loadingQuestion ? (
              <div style={{ width: "100%" }}>
                <div className="skeleton" style={{ height: 28, marginBottom: 12, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 28, width: "80%", marginBottom: 12, borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 28, width: "60%", borderRadius: 8 }} />
              </div>
            ) : currentQuestion ? (
              <h2 style={{ fontSize: "clamp(18px,2.5vw,26px)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }} className="fade-in-up">
                {currentQuestion.question}
              </h2>
            ) : null}
          </div>

          {/* Hints */}
          {currentQuestion?.hints?.length > 0 && !isRecording && !isAnalyzing && (
            <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--accent-light)", border: "1px solid #bfdbfe", borderRadius: "var(--radius)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Hints</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                {currentQuestion.hints.map((h, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#1e40af", display: "flex", gap: 6 }}>
                    <span style={{ color: "var(--accent)" }}>•</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Controls */}
          <div style={{ marginTop: 24 }}>
            {isAnalyzing ? (
              <div style={{ padding: "14px", background: "var(--bg-card-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius)", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                Please wait while we analyze your answer...
              </div>
            ) : !isRecording ? (
              <button id="start-answer-btn" onClick={startRecording}
                disabled={loadingQuestion || !currentQuestion}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 15 }}>
                <Mic className="w-5 h-5" /> Start Answering
              </button>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10, fontSize: 12, color: "var(--danger)" }}>
                  <span className="w-2 h-2 recording-dot" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--danger)" }} />
                  Recording... speak clearly
                </div>
                <button id="stop-answer-btn" onClick={submitAnswer}
                  style={{ width: "100%", padding: "13px", background: "var(--danger-light)", border: "1.5px solid #fca5a5", color: "var(--danger)", fontWeight: 700, borderRadius: "var(--radius)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <MicOff className="w-5 h-5" /> Stop & Submit Answer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Webcam */}
        <div style={{ width: 340, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, background: "#1a1d23" }}>
          <div style={{ width: "100%", aspectRatio: "4/3", background: "#111", borderRadius: 12, overflow: "hidden", border: "1px solid #374151", position: "relative" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraOn ? "block" : "none" }} />
            {!cameraOn && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#4b5563" }}>
                <VideoOff className="w-10 h-10 mb-2" /> <p style={{ fontSize: 12 }}>Camera unavailable</p>
              </div>
            )}
            {isRecording && (
              <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.7)", padding: "4px 10px", borderRadius: 99 }}>
                <span className="recording-dot" style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>REC</span>
              </div>
            )}
            {isAnalyzing && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#60a5fa" }} />
              </div>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 10, textAlign: "center" }}>
            Look directly at the camera for best eye contact score
          </p>
        </div>
      </div>
    </div>
  );
}

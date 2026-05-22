// src/pages/InterviewPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { generateQuestion, analyzeAnswer, generateReport } from "../services/api";
import {
  Mic, MicOff, Video, VideoOff, Clock, Brain,
  AlertCircle, Loader2, CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";

const TOTAL_QUESTIONS = 8;
const ANSWER_TIME_LIMIT = 120;

const DOMAIN_LABELS = {
  web_development: "Web Development",
  data_science_ml: "Data Science / ML",
  cloud_computing: "Cloud Computing",
  core_cs: "Core Computer Science",
  hr_behavioral: "HR / Behavioral",
};

export default function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const domain = location.state?.domain || "core_cs";

  // ── UI state (for rendering) ─────────────────────────────────────────────
  const [phase, setPhase] = useState("setup"); // setup | interview | submitting
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME_LIMIT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);

  // ── Refs (always-current values used inside async callbacks) ─────────────
  const questionIndexRef = useRef(0);
  const questionHistoryRef = useRef([]);
  const questionResultsRef = useRef([]);
  const currentQuestionRef = useRef(null);
  const lastScoreRef = useRef(50);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const framesRef = useRef([]);
  const timerRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const processingRef = useRef(false); // prevent double-submit

  // ── Keep refs in sync with state ─────────────────────────────────────────
  useEffect(() => { questionIndexRef.current = questionIndex; }, [questionIndex]);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setMediaError(null);
      setCameraOn(true);
    } catch (err) {
      setMediaError("Camera/mic access denied. Please allow permissions and refresh.");
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // ── Load question ─────────────────────────────────────────────────────────
  const loadQuestion = async (index, score = 50) => {
    setLoadingQuestion(true);
    setCurrentQuestion(null);
    try {
      const q = await generateQuestion({
        domain,
        questionHistory: questionHistoryRef.current,
        resumeText: profile?.resumeText || "",
        questionIndex: index,
        lastScore: score,
      });
      currentQuestionRef.current = q;
      setCurrentQuestion(q);
    } catch (err) {
      const fallback = {
        question: "Describe a technical challenge you have faced and how you solved it.",
        difficulty: "medium",
        topic: "General",
        question_type: "technical",
        hints: [],
      };
      currentQuestionRef.current = fallback;
      setCurrentQuestion(fallback);
    } finally {
      setLoadingQuestion(false);
    }
  };

  // ── Capture frame ─────────────────────────────────────────────────────────
  const captureFrame = () => {
    if (!videoRef.current || !cameraOn) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
      const b64 = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];
      framesRef.current.push(b64);
      if (framesRef.current.length > 20) framesRef.current = framesRef.current.slice(-20);
    } catch (_) {}
  };

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = () => {
    if (!streamRef.current || processingRef.current) return;
    chunksRef.current = [];
    framesRef.current = [];

    try {
      const mr = new MediaRecorder(streamRef.current, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm",
      });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(200);
      mediaRecorderRef.current = mr;
    } catch (err) {
      toast.error("Could not start recording. Check mic/camera permissions.");
      return;
    }

    setIsRecording(true);
    setTimeLeft(ANSWER_TIME_LIMIT);

    frameIntervalRef.current = setInterval(captureFrame, 2500);

    let remaining = ANSWER_TIME_LIMIT;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        submitAnswer();
      }
    }, 1000);
  };

  // ── Submit answer (stop recording + analyze + advance) ────────────────────
  const submitAnswer = async () => {
    if (processingRef.current) return; // guard double-fire
    processingRef.current = true;

    clearInterval(timerRef.current);
    clearInterval(frameIntervalRef.current);
    setIsRecording(false);
    setIsAnalyzing(true);

    const mr = mediaRecorderRef.current;
    // Stop recorder and wait for final data
    if (mr && mr.state !== "inactive") {
      await new Promise((resolve) => {
        mr.onstop = resolve;
        mr.stop();
      });
    }

    const audioBlob = new Blob(chunksRef.current, { type: "video/webm" });
    const frames = [...framesRef.current];
    const idx = questionIndexRef.current;
    const q = currentQuestionRef.current;

    let analysisResult = null;
    try {
      analysisResult = await analyzeAnswer({
        audioBlob,
        frames,
        questionIndex: idx,
      });
    } catch (err) {
      console.warn("Analysis failed, using defaults:", err);
    }

    const answerData = {
      question: q?.question || "",
      question_index: idx,
      question_type: q?.question_type || "technical",
      topic: q?.topic || "",
      transcribedAnswer: analysisResult?.transcription?.text || "",
      dominantEmotion: analysisResult?.emotion?.dominant_emotion || "neutral",
      emotionDistribution: analysisResult?.emotion?.emotion_distribution || {},
      fillerWords: analysisResult?.transcription?.filler_words || [],
      fillerWordCount: analysisResult?.transcription?.filler_word_count || 0,
      wordsPerMinute: analysisResult?.transcription?.words_per_minute || 0,
      eyeContactScore: analysisResult?.scores?.eye_contact_score ?? 70,
      confidenceScore: analysisResult?.scores?.confidence_score ?? 70,
      communicationScore: analysisResult?.scores?.communication_score ?? 70,
      speakingScore: analysisResult?.scores?.speaking_score ?? 70,
      duration: analysisResult?.transcription?.duration_seconds || 0,
    };

    // Append to history refs
    questionHistoryRef.current.push({
      question: answerData.question,
      answer: answerData.transcribedAnswer,
      score: answerData.confidenceScore,
    });
    questionResultsRef.current.push(answerData);
    lastScoreRef.current = answerData.confidenceScore;

    setIsAnalyzing(false);
    processingRef.current = false;

    const nextIndex = idx + 1;

    if (nextIndex >= TOTAL_QUESTIONS) {
      // All done — generate report
      await finishInterview(questionResultsRef.current);
    } else {
      // Move to next question
      setQuestionIndex(nextIndex);
      questionIndexRef.current = nextIndex;
      await loadQuestion(nextIndex, answerData.confidenceScore);
    }
  };

  // ── Finish & generate report ──────────────────────────────────────────────
  const finishInterview = async (results) => {
    setPhase("submitting");
    stopCamera();

    const avgConf = results.reduce((a, b) => a + (b.confidenceScore || 50), 0) / results.length;
    const avgComm = results.reduce((a, b) => a + (b.communicationScore || 50), 0) / results.length;

    try {
      const report = await generateReport({
        userId: user?.uid || "demo",
        domain,
        questions: results,
        confidenceScore: avgConf,
        communicationScore: avgComm,
        saveToFirestore: !!user,
        displayName: profile?.name || user?.displayName || "Anonymous",
      });
      navigate(`/report/${report.sessionId || "demo"}`, {
        state: { session: report.session },
      });
    } catch (err) {
      toast.error("Failed to generate report. Please try again.");
      setPhase("interview");
    }
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "interview") {
      startCamera().then(() => loadQuestion(0));
    }
    return () => {
      stopCamera();
      clearInterval(timerRef.current);
      clearInterval(frameIntervalRef.current);
    };
  }, [phase]);

  const timerPct = (timeLeft / ANSWER_TIME_LIMIT) * 100;
  const timerColor = timeLeft > 60 ? "bg-emerald-400" : timeLeft > 30 ? "bg-amber-400" : "bg-red-400";

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center glass p-10 rounded-2xl fade-in-up">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Brain className="w-9 h-9 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Ready to Interview?</h1>
          <p className="text-slate-400 mb-2">
            Domain: <span className="text-blue-400 font-medium">{DOMAIN_LABELS[domain]}</span>
          </p>
          <p className="text-slate-500 text-sm mb-8">
            You'll answer {TOTAL_QUESTIONS} questions. Each answer is recorded and analyzed
            for speech, emotion, and technical accuracy. Allow camera & microphone when prompted.
          </p>

          {mediaError && (
            <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6 text-left">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {mediaError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-8 text-sm">
            {[
              { icon: Video, label: "Webcam required" },
              { icon: Mic, label: "Microphone required" },
              { icon: Clock, label: `${ANSWER_TIME_LIMIT}s per question` },
              { icon: Brain, label: "AI feedback after" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl text-slate-300">
                <Icon className="w-4 h-4 text-blue-400" /> {label}
              </div>
            ))}
          </div>

          <button
            id="begin-interview-btn"
            onClick={() => setPhase("interview")}
            className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all text-lg glow-blue"
          >
            Begin Interview
          </button>
        </div>
      </div>
    );
  }

  // ── Submitting screen ─────────────────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="text-center fade-in-up">
          <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Generating Your Report</h2>
          <p className="text-slate-400">
            Gemini AI is analyzing your performance across all {TOTAL_QUESTIONS} questions...
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-slate-500 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            All answers recorded and analyzed
          </div>
        </div>
      </div>
    );
  }

  // ── Interview screen ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Top bar */}
      <div className="border-b border-blue-900/40 bg-[#040d1a]/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white text-sm">{DOMAIN_LABELS[domain]}</span>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i < questionIndex
                  ? "bg-emerald-400"
                  : i === questionIndex
                  ? "bg-blue-400 scale-125"
                  : "bg-slate-700"
              }`}
            />
          ))}
          <span className="text-slate-400 text-sm ml-2">
            {questionIndex + 1}/{TOTAL_QUESTIONS}
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Question + controls */}
        <div className="flex-1 flex flex-col p-6 lg:p-10 lg:border-r border-blue-900/30">
          {/* Timer bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" /> Time remaining
              </div>
              <span className={`text-lg font-bold ${timeLeft <= 30 ? "text-red-400" : "text-white"}`}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
          </div>

          {/* Question badge */}
          {currentQuestion && !isAnalyzing && (
            <div className="mb-4">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {currentQuestion.question_type?.replace("_", " ").toUpperCase()} ·{" "}
                {currentQuestion.difficulty?.toUpperCase()} · {currentQuestion.topic}
              </span>
            </div>
          )}

          {/* Question text */}
          <div className="flex-1 flex items-start">
            {isAnalyzing ? (
              <div className="w-full flex flex-col items-center justify-center gap-4 py-10">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                <p className="text-slate-400 text-lg">Analyzing your answer...</p>
                <p className="text-slate-600 text-sm">Transcribing speech & detecting emotions</p>
              </div>
            ) : loadingQuestion ? (
              <div className="w-full space-y-3 pt-2">
                <div className="skeleton h-7 w-full rounded-lg" />
                <div className="skeleton h-7 w-4/5 rounded-lg" />
                <div className="skeleton h-7 w-3/5 rounded-lg" />
              </div>
            ) : currentQuestion ? (
              <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight fade-in-up">
                {currentQuestion.question}
              </h2>
            ) : null}
          </div>

          {/* Hints */}
          {currentQuestion?.hints?.length > 0 && !isRecording && !isAnalyzing && (
            <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Hints</p>
              <ul className="space-y-1">
                {currentQuestion.hints.map((h, i) => (
                  <li key={i} className="text-slate-400 text-sm flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Controls */}
          <div className="mt-8">
            {isAnalyzing ? (
              <div className="w-full py-4 bg-white/5 rounded-xl text-center text-slate-400 text-sm">
                Please wait while we analyze your answer...
              </div>
            ) : !isRecording ? (
              <button
                id="start-answer-btn"
                onClick={startRecording}
                disabled={loadingQuestion || !currentQuestion}
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all glow-blue"
              >
                <Mic className="w-5 h-5" /> Start Answering
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-400 recording-dot" />
                  Recording... speak your answer clearly
                </div>
                <button
                  id="stop-answer-btn"
                  onClick={submitAnswer}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold rounded-xl transition-all"
                >
                  <MicOff className="w-5 h-5" /> Stop & Submit Answer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Webcam */}
        <div className="lg:w-96 flex flex-col items-center justify-center p-6 bg-black/20">
          <div className="relative w-full aspect-video bg-[#071428] rounded-2xl overflow-hidden border border-blue-900/40">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!cameraOn ? "hidden" : ""}`}
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <VideoOff className="w-12 h-12 mb-2" />
                <p className="text-sm">Camera unavailable</p>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-400 recording-dot" />
                <span className="text-white text-xs font-medium">REC</span>
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-3 text-center">
            Look directly at the camera for best eye contact score
          </p>
        </div>
      </div>
    </div>
  );
}

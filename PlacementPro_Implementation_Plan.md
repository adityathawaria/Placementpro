# PlacementPro — Implementation Plan

## Overview

A full-stack AI-powered mock interview platform for engineering students. The app records webcam + mic during answers, transcribes speech via Whisper, detects emotions via DeepFace, and generates personalized feedback reports using Gemini.

---

## Architecture

```
Frontend (React + Tailwind)  ──→  FastAPI Backend (Python)
        │                               │
        │                               ├── Firebase Firestore (DB)
        │                               ├── Google Gemini API (LLM)
        │                               ├── OpenAI Whisper (STT)
        │                               ├── DeepFace (Emotion)
        │                               └── pdfplumber (Resume)
        │
        └── Firebase Auth (Google Login)
```

**Hosting**: Vercel (frontend), Render (backend)

---

## Project Structure

```
c:\Users\Asus\OneDrive\Desktop\AI interview analyzer\
├── frontend/                  ← React + Tailwind app
│   ├── src/
│   │   ├── components/        ← Shared UI components
│   │   ├── pages/             ← Route pages
│   │   ├── hooks/             ← Custom React hooks
│   │   ├── services/          ← API & Firebase calls
│   │   ├── context/           ← Auth context
│   │   └── utils/             ← Helpers
│   ├── public/
│   ├── .env.example
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                   ← FastAPI Python app
│   ├── main.py
│   ├── routers/
│   │   ├── resume.py
│   │   ├── questions.py
│   │   ├── analysis.py
│   │   ├── report.py
│   │   └── leaderboard.py
│   ├── services/
│   │   ├── gemini_service.py
│   │   ├── whisper_service.py
│   │   ├── deepface_service.py
│   │   └── firebase_service.py
│   ├── data/
│   │   └── question_banks.py  ← 20+ questions per domain
│   ├── .env.example
│   ├── requirements.txt
│   └── firebase_config.json   ← (gitignored)
│
└── README.md
```

---

## Frontend Pages & Components

### Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Hero, features, CTA |
| `/login` | `LoginPage` | Google Sign-in |
| `/profile` | `ProfilePage` | Profile + resume upload |
| `/select-domain` | `DomainSelector` | Domain picker |
| `/interview` | `InterviewPage` | Live interview + recording |
| `/report/:sessionId` | `ReportPage` | AI feedback report |
| `/dashboard` | `DashboardPage` | Charts + history |
| `/leaderboard` | `LeaderboardPage` | Peer comparison |

### Key Components
- `Navbar`, `ProtectedRoute`, `LoadingSpinner`, `SkeletonLoader`
- `WebcamFeed`, `QuestionCard`, `TimerBar`, `RecordingControls`
- `ScoreCard`, `FillerWordHighlighter`, `ProgressChart`
- `SessionHistoryTable`, `LeaderboardTable`, `DomainBadge`

---

## Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/parse-resume` | Upload PDF → extract text + skills |
| POST | `/generate-question` | domain + history → next question |
| POST | `/analyze-answer` | audio + frames → scores |
| POST | `/generate-report` | session data → full AI report |
| GET | `/leaderboard/{domain}` | top 10 scores per domain |
| POST | `/save-session` | persist session to Firestore |

---

## Proposed Changes

### Backend

#### [NEW] `backend/main.py`
FastAPI app entry point with CORS, routers, health check

#### [NEW] `backend/requirements.txt`
All Python dependencies

#### [NEW] `backend/routers/resume.py`
`/parse-resume` — pdfplumber parsing, skill extraction

#### [NEW] `backend/routers/questions.py`
`/generate-question` — Gemini-powered adaptive question generation

#### [NEW] `backend/routers/analysis.py`
`/analyze-answer` — Whisper transcription + DeepFace emotion + filler word analysis

#### [NEW] `backend/routers/report.py`
`/generate-report` — Gemini report generation, Firestore save

#### [NEW] `backend/routers/leaderboard.py`
`/leaderboard/{domain}` + `/save-session` — Firestore read/write

#### [NEW] `backend/services/gemini_service.py`
Gemini API wrapper for question generation and report writing

#### [NEW] `backend/services/whisper_service.py`
Whisper transcription, speaking speed, filler word detection

#### [NEW] `backend/services/deepface_service.py`
Frame extraction + DeepFace emotion analysis

#### [NEW] `backend/services/firebase_service.py`
Firestore CRUD operations

#### [NEW] `backend/data/question_banks.py`
20+ curated questions per domain (5 domains × 20+)

---

### Frontend

#### [NEW] `frontend/src/context/AuthContext.jsx`
Firebase Auth provider, Google sign-in

#### [NEW] `frontend/src/services/api.js`
Axios client wrapping all backend API calls

#### [NEW] `frontend/src/services/firebase.js`
Firebase init + Firestore helpers

#### [NEW] `frontend/src/pages/LandingPage.jsx`
Hero section, animated features, demo mode CTA

#### [NEW] `frontend/src/pages/LoginPage.jsx`
Google sign-in button, auth flow

#### [NEW] `frontend/src/pages/ProfilePage.jsx`
Profile form + PDF resume upload

#### [NEW] `frontend/src/pages/DomainSelectorPage.jsx`
5 domain cards with icons and descriptions

#### [NEW] `frontend/src/pages/InterviewPage.jsx`
Split layout: question+timer (left) + webcam (right), recording controls

#### [NEW] `frontend/src/pages/ReportPage.jsx`
Full report: scores, per-question breakdown, filler heatmap, PDF export

#### [NEW] `frontend/src/pages/DashboardPage.jsx`
Recharts line/bar charts, session history table, weak topics panel

#### [NEW] `frontend/src/pages/LeaderboardPage.jsx`
Domain tabs, top-10 table, percentile comparison

---

## Verification Plan

### Backend
- Run `uvicorn main:app --reload` and test each endpoint via `/docs`
- Validate PDF parsing, question generation, and report structure

### Frontend
- Run `npm run dev` and walk through all pages
- Test Google login, resume upload, interview flow, report generation

### Integration
- End-to-end: login → upload resume → select domain → answer 8 questions → view report → check dashboard

---

## Open Questions

> [!IMPORTANT]
> **Firebase credentials**: You will need to provide your Firebase project config (API key, project ID, etc.) and a service account JSON for the backend. The plan includes `.env.example` files with all required keys listed.

> [!NOTE]
> **Whisper mode**: Whisper will be configured to run locally (faster-whisper) by default. If you prefer the OpenAI API version, you can swap the service. Both options are documented.

> [!NOTE]
> **Demo mode**: The landing page will have a "Try Demo" button that runs 3 sample questions without login, using pre-baked responses (no real AI calls needed for demo).

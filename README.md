# PlacementPro 🎯

**AI-Powered Mock Interview Preparation Platform for Engineering Students**

PlacementPro helps students practice mock interviews with real-time emotion analysis, speech transcription, adaptive AI-generated questions, and personalised performance reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Backend | FastAPI (Python 3.11+) |
| Database | Firebase Firestore |
| Auth | Firebase Auth (Google Sign-in) |
| AI/LLM | Google Gemini 1.5 Flash |
| Speech-to-Text | faster-whisper (local) |
| Emotion | DeepFace |
| Resume Parsing | pdfplumber |
| Charts | Recharts |

---

## Project Structure

```
AI interview analyzer/
├── frontend/          ← React + Tailwind app
│   ├── src/
│   │   ├── pages/     ← 8 route pages
│   │   ├── components/
│   │   ├── services/  ← Firebase + API clients
│   │   └── context/   ← Auth context
│   ├── .env.example
│   └── package.json
│
├── backend/           ← FastAPI Python app
│   ├── main.py
│   ├── routers/       ← 5 API routers
│   ├── services/      ← Gemini, Whisper, DeepFace, Firebase
│   ├── data/          ← Question banks (100+ questions)
│   ├── .env.example
│   └── requirements.txt
│
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Firebase** project (free Spark plan works)
- **Google Gemini API key** — [Get one free](https://aistudio.google.com/app/apikey)

---

## Setup: Backend

### 1. Create a virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> ⚠️ **DeepFace** and **faster-whisper** may take a few minutes to install and will download model weights on first run.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_CREDENTIALS_PATH=./firebase_config.json
FIREBASE_PROJECT_ID=your_firebase_project_id
ALLOWED_ORIGINS=http://localhost:5173
WHISPER_MODEL=base
ENVIRONMENT=development
```

### 4. Add Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Project Settings → Service Accounts
2. Click **Generate new private key** → download JSON
3. Save it as `backend/firebase_config.json`

### 5. Run the backend

```bash
uvicorn main:app --reload --port 8000
```

The API docs are available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Setup: Frontend

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Firebase web app config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:8000/api
```

**To get these values:**
1. Go to Firebase Console → Project Settings → Your Apps
2. Click **Add App** → Web → Register
3. Copy the `firebaseConfig` values

### 3. Enable Firebase services

In Firebase Console:
- **Authentication** → Sign-in method → Enable **Google**
- **Firestore Database** → Create database (Start in test mode for dev)
- **Storage** → Get started (for resume PDF uploads)

### 4. Run the frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Features

### 🎤 Live Interview
- Webcam + microphone recording via browser MediaRecorder API
- 8 adaptive questions: 2 resume-based warm-up → 4 technical → 2 HR
- Real-time countdown timer per question
- Difficulty adapts based on your performance

### 🤖 AI Analysis (per answer)
- **Whisper** transcribes your speech to text
- **DeepFace** detects your emotions frame-by-frame
- Filler word detection: "umm", "uh", "like", "basically", etc.
- Speaking speed (words per minute) calculated
- Eye contact score from face position

### 📊 AI Feedback Report
- Overall score (0–100) + sub-scores
- Filler word heatmap with red highlights
- Per-question breakdown with AI feedback
- Top 3 strengths and improvements
- Recommended resources with links

### 📈 Progress Dashboard
- Score over time (line chart)
- Domain-wise performance (bar chart)
- Filler word trend (bar chart)
- Weak topics panel
- Session history table

### 🏆 Leaderboard
- Anonymous peer benchmarking
- Your percentile vs domain participants
- Top 10 per domain

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/parse-resume` | Upload PDF → skills + text |
| POST | `/api/generate-question` | Adaptive question generation |
| POST | `/api/analyze-answer` | Audio + frames → scores |
| POST | `/api/generate-report` | Full AI report |
| GET | `/api/leaderboard/{domain}` | Top 10 scores |
| GET | `/api/leaderboard/{domain}/stats` | Domain stats |
| GET | `/api/leaderboard/{domain}/percentile/{userId}` | User percentile |
| GET | `/api/session/{sessionId}` | Fetch one session |
| GET | `/api/sessions/{userId}` | User session history |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Push to GitHub → import in Vercel
# Set all VITE_* env vars in Vercel dashboard
```

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all env vars from `.env.example`
6. Add `FIREBASE_CREDENTIALS_JSON` env var with the full JSON content of your service account (as a single-line JSON string)

---

## Whisper Models

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| tiny | 39M | Fastest | Low |
| base | 74M | Fast | Good |
| small | 244M | Medium | Better |
| medium | 769M | Slow | Best for production |

Set `WHISPER_MODEL=base` for development. Use `small` or `medium` for production.

---

## Firestore Schema

```
users/{userId}
  name, email, photoURL, college, degree, graduationYear
  resumeText, resumeSkills, allSkills, resumeUrl
  createdAt, updatedAt

sessions/{sessionId}
  userId, displayName, domain, date
  overallScore, confidenceScore, communicationScore, technicalScore
  totalFillerWords, questions[]
  report { summary, strengths, improvements, recommendedResources }

leaderboard/{domain}/scores/{userId}
  userId, displayName, score, date
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `FIREBASE_CREDENTIALS_PATH` | Path to service account JSON |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `WHISPER_MODEL` | tiny / base / small / medium |
| `ENVIRONMENT` | development / production |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_API_URL` | Backend API base URL |
| `VITE_DEMO_MODE` | true = skip login (demo) |

---

## License

MIT License — free for personal and educational use.

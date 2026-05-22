"""
PlacementPro FastAPI Backend
Main application entry point
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import resume, questions, analysis, report, leaderboard

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown tasks."""
    print("PlacementPro backend starting up...")
    yield
    print("PlacementPro backend shutting down...")


app = FastAPI(
    title="PlacementPro API",
    description="AI-powered mock interview preparation platform backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(resume.router, prefix="/api", tags=["Resume"])
app.include_router(questions.router, prefix="/api", tags=["Questions"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(report.router, prefix="/api", tags=["Report"])
app.include_router(leaderboard.router, prefix="/api", tags=["Leaderboard"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "PlacementPro API is running 🎯"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "version": "1.0.0"}

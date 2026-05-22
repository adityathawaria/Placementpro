"""
Analysis router — audio transcription + emotion analysis.
POST /api/analyze-answer
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import json

from services import whisper_service, deepface_service

router = APIRouter()


@router.post("/analyze-answer")
async def analyze_answer(
    audio: UploadFile = File(...),
    frames: Optional[str] = Form(None),  # JSON array of base64 frame strings
    question_index: int = Form(0),
):
    """
    Analyze a recorded answer:
    1. Transcribe audio via Whisper
    2. Detect emotions via DeepFace on sampled frames
    3. Return combined analysis with scores

    Expects multipart/form-data:
    - audio: WebM/audio blob
    - frames: JSON string of base64 image frames (optional)
    - question_index: which question (0-7)
    """
    if audio.size and audio.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large (max 50 MB).")

    audio_bytes = await audio.read()
    audio_format = "webm"
    if audio.content_type:
        if "mp4" in audio.content_type:
            audio_format = "mp4"
        elif "wav" in audio.content_type:
            audio_format = "wav"
        elif "ogg" in audio.content_type:
            audio_format = "ogg"

    # ── Whisper Transcription ──────────────────────────────────────────────────
    transcription = await whisper_service.transcribe_audio(audio_bytes, audio_format)

    # ── Emotion Analysis ──────────────────────────────────────────────────────
    emotion_result = {"dominant_emotion": "neutral", "emotion_distribution": {}, "eye_contact_score": 70, "confidence_score": 70}
    if frames:
        try:
            frames_list = json.loads(frames)
            if isinstance(frames_list, list) and frames_list:
                emotion_result = deepface_service.analyze_frames(frames_list)
        except Exception:
            pass  # Non-fatal: emotion analysis is optional

    # ── Confidence Score Calculation ──────────────────────────────────────────
    speaking_score = whisper_service.calculate_speaking_score(
        wpm=transcription["words_per_minute"],
        filler_count=transcription["filler_word_count"],
        duration=transcription["duration_seconds"],
    )

    # Weighted confidence: 40% emotion, 60% speaking quality
    confidence_score = int(
        0.4 * emotion_result["confidence_score"] + 0.6 * speaking_score
    )

    # ── Communication Score ───────────────────────────────────────────────────
    # Based on: answer length, WPM, filler count, duration
    word_count = len(transcription["text"].split()) if transcription["text"] else 0
    length_score = min(100, int((word_count / 80) * 100))  # ~80 words = full score
    filler_penalty = min(40, transcription["filler_word_count"] * 8)
    communication_score = max(0, int((length_score + speaking_score) / 2 - filler_penalty / 2))

    return {
        "transcription": transcription,
        "emotion": emotion_result,
        "scores": {
            "speaking_score": speaking_score,
            "confidence_score": confidence_score,
            "communication_score": communication_score,
            "eye_contact_score": emotion_result.get("eye_contact_score", 70),
        },
        "question_index": question_index,
    }

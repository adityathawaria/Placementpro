"""
Report router — AI report generation and session saving.
POST /api/generate-report
POST /api/save-session
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from services import gemini_service, firebase_service

router = APIRouter()


class QuestionResult(BaseModel):
    question: str
    question_index: int
    question_type: str = "technical"
    topic: str = ""
    transcribedAnswer: str = ""
    dominantEmotion: str = "neutral"
    emotionDistribution: dict = {}
    fillerWords: list[str] = []
    fillerWordCount: int = 0
    wordsPerMinute: int = 0
    eyeContactScore: int = 70
    confidenceScore: int = 70
    communicationScore: int = 70
    speakingScore: int = 70
    duration: float = 0.0


class GenerateReportRequest(BaseModel):
    userId: str
    domain: str
    questions: list[QuestionResult]
    confidenceScore: float = 0.0
    communicationScore: float = 0.0
    saveToFirestore: bool = True
    displayName: str = "Anonymous"


class SaveSessionRequest(BaseModel):
    userId: str
    domain: str
    sessionData: dict
    displayName: str = "Anonymous"


@router.post("/generate-report")
async def generate_report(req: GenerateReportRequest):
    """
    Generate a full AI feedback report for the interview session,
    then save it to Firestore.
    """
    if not req.questions:
        raise HTTPException(status_code=400, detail="No questions provided.")

    # Compute aggregate scores
    q_list = [q.dict() for q in req.questions]
    avg_confidence = req.confidenceScore or (
        sum(q["confidenceScore"] for q in q_list) / len(q_list)
    )
    avg_communication = req.communicationScore or (
        sum(q["communicationScore"] for q in q_list) / len(q_list)
    )
    avg_eye_contact = sum(q["eyeContactScore"] for q in q_list) / len(q_list)
    total_fillers = sum(q["fillerWordCount"] for q in q_list)

    session_data = {
        "domain": req.domain,
        "questions": q_list,
        "confidenceScore": round(avg_confidence, 1),
        "communicationScore": round(avg_communication, 1),
    }

    # Generate AI report
    ai_report = await gemini_service.generate_full_report(session_data)

    overall_score = ai_report.get("overallScore", int((avg_confidence + avg_communication) / 2))
    technical_score = ai_report.get("technicalAccuracyScore", 60)

    # Merge per-question AI feedback back into question list
    pq_feedback = {f["questionIndex"]: f for f in ai_report.get("perQuestionFeedback", [])}
    for q in q_list:
        idx = q["question_index"] + 1
        if idx in pq_feedback:
            q["aiFeedback"] = pq_feedback[idx].get("feedback", "")
            q["technicalScore"] = pq_feedback[idx].get("technicalScore", 60)
            q["suggestedAnswer"] = pq_feedback[idx].get("suggestedAnswer", "")

    # Full session document
    full_session = {
        "userId": req.userId,
        "displayName": req.displayName,
        "domain": req.domain,
        "date": datetime.now(timezone.utc).isoformat(),
        "overallScore": overall_score,
        "confidenceScore": round(avg_confidence, 1),
        "communicationScore": round(avg_communication, 1),
        "technicalScore": technical_score,
        "eyeContactScore": round(avg_eye_contact, 1),
        "totalFillerWords": total_fillers,
        "questions": q_list,
        "report": {
            "summary": ai_report.get("summary", ""),
            "strengths": ai_report.get("strengths", []),
            "improvements": ai_report.get("improvements", []),
            "recommendedResources": ai_report.get("recommendedResources", []),
        },
    }

    session_id = None
    if req.saveToFirestore:
        try:
            session_id = await firebase_service.save_session(full_session)
            full_session["sessionId"] = session_id

            # Update leaderboard (anonymous)
            await firebase_service.upsert_leaderboard_score(
                domain=req.domain,
                user_id=req.userId,
                score=overall_score,
                display_name=req.displayName,
            )
        except Exception as e:
            # Non-fatal: report generation succeeds even if save fails
            full_session["saveError"] = str(e)

    return {
        "success": True,
        "sessionId": session_id,
        "session": full_session,
    }


@router.post("/save-session")
async def save_session(req: SaveSessionRequest):
    """Save a session directly to Firestore (used for partial/manual saves)."""
    try:
        session_id = await firebase_service.save_session(req.sessionData)
        return {"success": True, "sessionId": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save session: {str(e)}")


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Retrieve a session by ID."""
    try:
        session = await firebase_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{user_id}")
async def get_user_sessions(user_id: str, limit: int = 10):
    """Get a user's session history."""
    try:
        sessions = await firebase_service.get_user_sessions(user_id, limit=limit)
        return {"sessions": sessions, "count": len(sessions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

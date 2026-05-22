"""
Questions router — adaptive question generation using Gemini + question banks.
POST /api/generate-question
"""

import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import gemini_service
from data.question_banks import QUESTION_BANKS

router = APIRouter()


class GenerateQuestionRequest(BaseModel):
    domain: str
    question_history: list[dict] = []
    resume_text: str = ""
    question_index: int = 0  # 0-7 (8 questions total)
    last_score: float = 50.0  # Score of previous answer (for difficulty adaptation)


def _determine_question_type(question_index: int) -> str:
    """Map question index to question type."""
    if question_index < 2:
        return "warm_up"
    elif question_index < 6:
        return "technical"
    else:
        return "hr_behavioral"


def _determine_difficulty(last_score: float, current_difficulty: str = "medium") -> str:
    """Adapt difficulty based on last answer score."""
    if last_score >= 75:
        return "hard"
    elif last_score <= 40:
        return "easy"
    return "medium"


def _get_fallback_question(domain: str, question_type: str, used_questions: list[str]) -> dict:
    """Return a curated bank question if Gemini fails."""
    bank = QUESTION_BANKS.get(domain, QUESTION_BANKS["core_cs"])
    pool = bank.get(question_type, bank.get("technical", []))
    available = [q for q in pool if q not in used_questions]
    if not available:
        available = pool  # Allow repeats if exhausted

    question_text = random.choice(available) if available else "Tell me about your technical background."
    return {
        "question": question_text,
        "difficulty": "medium",
        "topic": "General",
        "question_type": question_type,
        "hints": [],
        "source": "question_bank",
    }


@router.post("/generate-question")
async def generate_question(req: GenerateQuestionRequest):
    """
    Generate the next interview question adaptively.
    Uses Gemini for personalized questions, falls back to question bank.
    """
    if req.domain not in QUESTION_BANKS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown domain '{req.domain}'. Valid: {list(QUESTION_BANKS.keys())}",
        )

    if req.question_index < 0 or req.question_index > 7:
        raise HTTPException(status_code=400, detail="question_index must be 0-7.")

    question_type = _determine_question_type(req.question_index)
    difficulty = _determine_difficulty(req.last_score)

    # For warm-up questions with resume: use Gemini for personalization
    used_questions = [h.get("question", "") for h in req.question_history]

    try:
        if req.question_index < 2 and req.resume_text:
            # Personalized resume-based questions
            resume_questions = await gemini_service.generate_resume_questions(
                req.resume_text, req.domain
            )
            if resume_questions and req.question_index < len(resume_questions):
                q_text = resume_questions[req.question_index]
                if q_text not in used_questions:
                    return {
                        "question": q_text,
                        "difficulty": "easy",
                        "topic": "Resume / Background",
                        "question_type": "warm_up",
                        "hints": [],
                        "source": "gemini_resume",
                        "question_index": req.question_index,
                    }

        # Generate via Gemini for technical / HR questions
        question_data = await gemini_service.generate_next_question(
            domain=req.domain,
            question_history=req.question_history,
            resume_text=req.resume_text,
            difficulty=difficulty,
            question_type=question_type,
        )

        # Avoid repeating questions
        if question_data.get("question") in used_questions:
            question_data = _get_fallback_question(req.domain, question_type, used_questions)

        question_data["source"] = "gemini"
        question_data["question_index"] = req.question_index
        return question_data

    except Exception as e:
        # Graceful fallback to question bank
        fallback = _get_fallback_question(req.domain, question_type, used_questions)
        fallback["question_index"] = req.question_index
        return fallback

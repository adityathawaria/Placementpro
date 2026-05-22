"""
Google Gemini API service — question generation and report writing.
Uses the new google-genai SDK.
"""

import os
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))
    return _client


def _extract_json(text: str) -> dict | list:
    """Extract JSON from Gemini response, stripping markdown code fences."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def _generate(prompt: str) -> str:
    """Call Gemini and return the text response."""
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    return response.text


# ── Question Generation ────────────────────────────────────────────────────────

async def generate_next_question(
    domain: str,
    question_history: list[dict],
    resume_text: str = "",
    difficulty: str = "medium",
    question_type: str = "technical",
) -> dict:
    history_text = ""
    if question_history:
        history_text = "\n".join(
            f"Q: {h['question']}\nA: {h.get('answer', '')}\nScore: {h.get('score', 50)}/100"
            for h in question_history[-4:]
        )

    prompt = f"""You are an expert technical interviewer conducting a campus placement interview.

Domain: {domain.replace("_", " ").title()}
Question Type: {question_type}
Difficulty: {difficulty}
Resume Snippet: {resume_text[:800] if resume_text else "Not provided"}

Previous Q&A (for context):
{history_text if history_text else "This is the first question."}

Generate ONE interview question. Return ONLY valid JSON:
{{
  "question": "The interview question text here",
  "difficulty": "{difficulty}",
  "topic": "Brief topic label (e.g., React Hooks, Gradient Descent)",
  "question_type": "{question_type}",
  "hints": ["hint 1", "hint 2"]
}}

Rules:
- Question must be specific, clear, and interview-appropriate
- For warm_up: focus on resume/background
- For technical: domain-specific technical depth at {difficulty} level
- For hr_behavioral: STAR-method answerable situational question
- Do NOT repeat any question from the history above
"""

    try:
        text = _generate(prompt)
        return _extract_json(text)
    except Exception as e:
        return {
            "question": f"Can you explain a key concept in {domain.replace('_', ' ')} that you find particularly interesting?",
            "difficulty": difficulty,
            "topic": "General",
            "question_type": question_type,
            "hints": ["Think about a specific example", "Be concise and clear"],
        }


# ── Report Generation ─────────────────────────────────────────────────────────

async def generate_full_report(session_data: dict) -> dict:
    domain = session_data.get("domain", "general")
    questions_data = session_data.get("questions", [])

    qa_block = ""
    for i, q in enumerate(questions_data, 1):
        qa_block += f"""
Question {i}: {q.get('question', '')}
Answer: {q.get('transcribedAnswer', '')}
Emotion: {q.get('dominantEmotion', 'neutral')}
Filler words: {q.get('fillerWords', [])}
Speaking speed: {q.get('wordsPerMinute', 0)} WPM
"""

    prompt = f"""You are an expert interview coach evaluating a campus placement mock interview.

Domain: {domain.replace("_", " ").title()}
Overall Scores Detected:
- Confidence Score: {session_data.get('confidenceScore', 50)}/100
- Communication Score: {session_data.get('communicationScore', 50)}/100

Interview Transcript:
{qa_block}

Generate a comprehensive JSON feedback report. Return ONLY valid JSON:
{{
  "overallScore": <0-100 integer>,
  "technicalAccuracyScore": <0-100>,
  "summary": "2-3 sentence overall performance summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "recommendedResources": [
    {{"title": "Resource name", "url": "https://...", "type": "article|video|course"}},
    {{"title": "Resource name", "url": "https://...", "type": "article|video|course"}},
    {{"title": "Resource name", "url": "https://...", "type": "article|video|course"}}
  ],
  "perQuestionFeedback": [
    {{
      "questionIndex": 1,
      "feedback": "What was good and what to improve for this answer",
      "technicalScore": <0-100>,
      "suggestedAnswer": "Brief ideal answer outline"
    }}
  ]
}}

Be specific, actionable, and encouraging. Base technical accuracy on domain knowledge demonstrated.
"""

    try:
        text = _generate(prompt)
        return _extract_json(text)
    except Exception as e:
        return {
            "overallScore": 65,
            "technicalAccuracyScore": 60,
            "summary": "Your interview performance showed good potential with room for improvement in technical depth.",
            "strengths": ["Clear communication", "Good structure in answers", "Positive attitude"],
            "improvements": ["Increase technical depth", "Reduce filler words", "Provide more specific examples"],
            "recommendedResources": [
                {"title": "Cracking the Coding Interview", "url": "https://www.crackingthecodinginterview.com/", "type": "book"},
                {"title": "LeetCode Practice", "url": "https://leetcode.com", "type": "course"},
                {"title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "type": "article"},
            ],
            "perQuestionFeedback": [
                {"questionIndex": i + 1, "feedback": "Good attempt. Focus on being more specific.", "technicalScore": 65, "suggestedAnswer": ""}
                for i in range(len(questions_data))
            ],
        }


async def generate_resume_questions(resume_text: str, domain: str) -> list[str]:
    """Generate 2 personalised warm-up questions based on the resume."""
    prompt = f"""Based on the following resume, generate exactly 2 warm-up interview questions
that are personalised to the candidate's actual experience.

Domain: {domain.replace("_", " ").title()}
Resume:
{resume_text[:1500]}

Return ONLY valid JSON array of 2 question strings:
["question 1", "question 2"]
"""
    try:
        text = _generate(prompt)
        questions = _extract_json(text)
        return questions[:2] if isinstance(questions, list) else []
    except Exception:
        return [
            "Tell me about yourself and your technical background.",
            "Walk me through the most significant project on your resume.",
        ]

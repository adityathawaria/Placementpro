"""
Firebase Admin SDK service — Firestore CRUD operations.
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

_db = None


def _get_db():
    global _db
    if _db is not None:
        return _db

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase_config.json")

    if not firebase_admin._apps:
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            # Allow env-var based credentials for hosting environments
            cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
            if cred_json:
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
            else:
                raise RuntimeError(
                    "Firebase credentials not found. Set FIREBASE_CREDENTIALS_PATH "
                    "or FIREBASE_CREDENTIALS_JSON environment variable."
                )
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db


# ── Users ─────────────────────────────────────────────────────────────────────

async def save_user(user_id: str, data: dict) -> None:
    db = _get_db()
    db.collection("users").document(user_id).set(data, merge=True)


async def get_user(user_id: str) -> dict | None:
    db = _get_db()
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None


# ── Sessions ──────────────────────────────────────────────────────────────────

async def save_session(session_data: dict) -> str:
    db = _get_db()
    ref = db.collection("sessions").document()
    session_data["sessionId"] = ref.id
    ref.set(session_data)
    return ref.id


async def get_session(session_id: str) -> dict | None:
    db = _get_db()
    doc = db.collection("sessions").document(session_id).get()
    return doc.to_dict() if doc.exists else None


async def get_user_sessions(user_id: str, limit: int = 10) -> list[dict]:
    db = _get_db()
    docs = (
        db.collection("sessions")
        .where("userId", "==", user_id)
        .order_by("date", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [d.to_dict() for d in docs]


# ── Leaderboard ───────────────────────────────────────────────────────────────

async def upsert_leaderboard_score(domain: str, user_id: str, score: float, display_name: str) -> None:
    db = _get_db()
    db.collection("leaderboard").document(domain).collection("scores").document(user_id).set(
        {
            "userId": user_id,
            "displayName": display_name,
            "score": score,
            "date": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )


async def get_leaderboard(domain: str, limit: int = 10) -> list[dict]:
    db = _get_db()
    docs = (
        db.collection("leaderboard")
        .document(domain)
        .collection("scores")
        .order_by("score", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [d.to_dict() for d in docs]


async def get_domain_stats(domain: str) -> dict:
    """Returns average score and total participants for a domain."""
    db = _get_db()
    docs = db.collection("leaderboard").document(domain).collection("scores").stream()
    scores = [d.to_dict().get("score", 0) for d in docs]
    if not scores:
        return {"average": 0, "total": 0}
    return {"average": round(sum(scores) / len(scores), 1), "total": len(scores)}


async def count_lower_scores(domain: str, user_score: float) -> int:
    """Count how many users scored below user_score in a domain."""
    db = _get_db()
    docs = (
        db.collection("leaderboard")
        .document(domain)
        .collection("scores")
        .where("score", "<", user_score)
        .stream()
    )
    return sum(1 for _ in docs)

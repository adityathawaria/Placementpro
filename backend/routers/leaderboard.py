"""
Leaderboard router — peer comparison and domain rankings.
GET /api/leaderboard/{domain}
GET /api/leaderboard/{domain}/stats
"""

from fastapi import APIRouter, HTTPException
from data.question_banks import QUESTION_BANKS
from services import firebase_service

router = APIRouter()

VALID_DOMAINS = list(QUESTION_BANKS.keys())


@router.get("/leaderboard/{domain}")
async def get_leaderboard(domain: str, limit: int = 10):
    """Get top scores for a domain (anonymous display)."""
    if domain not in VALID_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain. Valid: {VALID_DOMAINS}",
        )
    try:
        scores = await firebase_service.get_leaderboard(domain, limit=limit)
        # Sanitize: only return displayName and score (no userId)
        sanitized = [
            {
                "rank": i + 1,
                "displayName": s.get("displayName", "Anonymous"),
                "score": s.get("score", 0),
                "date": s.get("date", ""),
            }
            for i, s in enumerate(scores)
        ]
        return {"domain": domain, "leaderboard": sanitized, "count": len(sanitized)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaderboard/{domain}/stats")
async def get_domain_stats(domain: str):
    """Get aggregate stats (average score, total participants) for a domain."""
    if domain not in VALID_DOMAINS:
        raise HTTPException(status_code=400, detail="Invalid domain.")
    try:
        stats = await firebase_service.get_domain_stats(domain)
        return {"domain": domain, **stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaderboard/{domain}/percentile/{user_id}")
async def get_user_percentile(domain: str, user_id: str, score: float = 0):
    """Get the user's percentile ranking compared to all participants in the domain."""
    if domain not in VALID_DOMAINS:
        raise HTTPException(status_code=400, detail="Invalid domain.")
    try:
        stats = await firebase_service.get_domain_stats(domain)
        lower_count = await firebase_service.count_lower_scores(domain, score)
        total = stats["total"]
        percentile = round((lower_count / max(total, 1)) * 100, 1) if total > 0 else 50.0
        return {
            "domain": domain,
            "user_score": score,
            "percentile": percentile,
            "average_score": stats["average"],
            "total_participants": total,
            "message": f"You scored better than {percentile}% of students in {domain.replace('_', ' ').title()}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

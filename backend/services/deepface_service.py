"""
DeepFace service — facial emotion analysis from video frames.
"""

import os
import base64
import tempfile
import numpy as np
from PIL import Image
import io
from collections import Counter

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False


def analyze_frames(frames_b64: list[str]) -> dict:
    """
    Analyze facial emotions from a list of base64-encoded image frames.

    Args:
        frames_b64: List of base64-encoded JPEG/PNG frame strings

    Returns:
        {
            dominant_emotion: str,
            emotion_distribution: {emotion: percentage},
            eye_contact_score: int (0-100),
            confidence_score: int (0-100),
            frame_count: int
        }
    """
    if not frames_b64:
        return _default_result()

    if not DEEPFACE_AVAILABLE:
        return _mock_result()

    emotion_counts = Counter()
    eye_contact_frames = 0
    analyzed_count = 0

    # Sample at most 10 frames for performance
    sample_step = max(1, len(frames_b64) // 10)
    sampled = frames_b64[::sample_step][:10]

    for frame_b64 in sampled:
        try:
            # Decode base64 to PIL Image
            img_bytes = base64.b64decode(frame_b64)
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            img_array = np.array(img)

            result = DeepFace.analyze(
                img_path=img_array,
                actions=["emotion"],
                enforce_detection=False,
                silent=True,
            )

            if isinstance(result, list):
                result = result[0]

            emotions = result.get("emotion", {})
            dominant = result.get("dominant_emotion", "neutral")
            emotion_counts[dominant] += 1

            # Eye contact heuristic: face detected and roughly centered
            region = result.get("region", {})
            if region:
                img_w = img.width
                face_x = region.get("x", 0) + region.get("w", 0) / 2
                center_ratio = abs(face_x - img_w / 2) / img_w
                if center_ratio < 0.25:  # face within center 50%
                    eye_contact_frames += 1

            analyzed_count += 1

        except Exception:
            # Frame analysis failed (no face detected, etc.)
            emotion_counts["neutral"] += 1

    if analyzed_count == 0:
        return _default_result()

    # Dominant emotion
    dominant_emotion = emotion_counts.most_common(1)[0][0] if emotion_counts else "neutral"
    total = sum(emotion_counts.values())
    emotion_dist = {k: round(v / total * 100, 1) for k, v in emotion_counts.items()}

    # Eye contact score (% of frames with good eye contact)
    eye_contact_score = int((eye_contact_frames / analyzed_count) * 100)

    # Confidence score: weight toward confident/happy, penalise fear/sad
    positive_emotions = emotion_counts.get("happy", 0) + emotion_counts.get("neutral", 0)
    negative_emotions = emotion_counts.get("fear", 0) + emotion_counts.get("sad", 0) + emotion_counts.get("angry", 0)
    confidence_score = max(
        0,
        min(100, int(((positive_emotions - negative_emotions) / max(total, 1)) * 100) + 50),
    )

    return {
        "dominant_emotion": dominant_emotion,
        "emotion_distribution": emotion_dist,
        "eye_contact_score": eye_contact_score,
        "confidence_score": confidence_score,
        "frame_count": analyzed_count,
    }


def _default_result() -> dict:
    return {
        "dominant_emotion": "neutral",
        "emotion_distribution": {"neutral": 100.0},
        "eye_contact_score": 70,
        "confidence_score": 70,
        "frame_count": 0,
    }


def _mock_result() -> dict:
    """Returned when DeepFace is not installed (dev/demo mode)."""
    return {
        "dominant_emotion": "neutral",
        "emotion_distribution": {"neutral": 60.0, "happy": 30.0, "surprised": 10.0},
        "eye_contact_score": 75,
        "confidence_score": 72,
        "frame_count": 0,
        "note": "DeepFace not installed; using mock emotion data.",
    }

"""
Whisper speech-to-text service using faster-whisper.
Handles transcription, speaking speed calculation, and filler word detection.
"""

import os
import re
import tempfile
import aiofiles
try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    WhisperModel = None

from dotenv import load_dotenv

load_dotenv()

_model = None
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")

FILLER_WORDS = [
    "umm", "um", "uh", "uhh", "like", "basically", "you know",
    "so", "actually", "literally", "right", "okay", "hmm",
    "well", "i mean", "sort of", "kind of",
]


def _get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device="cpu",
            compute_type="int8",
        )
    return _model


async def transcribe_audio(audio_bytes: bytes, audio_format: str = "webm") -> dict:
    """
    Transcribe audio bytes using faster-whisper.

    Returns:
        {
            text: str,
            duration_seconds: float,
            words_per_minute: int,
            filler_words: list[str],
            filler_word_count: int,
            filler_positions: list[{word, start, end}]
        }
    """
    # Write to temp file
    suffix = f".{audio_format}"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        model = _get_model()
        segments, info = model.transcribe(
            tmp_path,
            beam_size=5,
            word_timestamps=True,
            language="en",
        )

        segments_list = list(segments)
        full_text = " ".join(s.text.strip() for s in segments_list)
        duration = info.duration if info.duration else 1.0

        # Words per minute
        word_count = len(full_text.split())
        wpm = int((word_count / duration) * 60) if duration > 0 else 0

        # Filler word detection
        detected_fillers = []
        filler_positions = []
        text_lower = full_text.lower()

        for filler in FILLER_WORDS:
            pattern = r"\b" + re.escape(filler) + r"\b"
            matches = list(re.finditer(pattern, text_lower))
            for m in matches:
                detected_fillers.append(filler)
                filler_positions.append({
                    "word": filler,
                    "start_char": m.start(),
                    "end_char": m.end(),
                })

        return {
            "text": full_text,
            "duration_seconds": round(duration, 2),
            "words_per_minute": wpm,
            "filler_words": list(set(detected_fillers)),
            "filler_word_count": len(detected_fillers),
            "filler_positions": filler_positions,
        }

    except Exception as e:
        return {
            "text": "",
            "duration_seconds": 0,
            "words_per_minute": 0,
            "filler_words": [],
            "filler_word_count": 0,
            "filler_positions": [],
            "error": str(e),
        }
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


def calculate_speaking_score(wpm: int, filler_count: int, duration: float) -> int:
    """
    Score speaking quality 0-100 based on WPM and filler words.
    Ideal WPM range: 130-160. Filler words penalise score.
    """
    # WPM score (peak at 140 wpm)
    if wpm == 0:
        wpm_score = 0
    elif 120 <= wpm <= 160:
        wpm_score = 100
    elif wpm < 120:
        wpm_score = max(0, int(wpm / 120 * 100))
    else:
        excess = wpm - 160
        wpm_score = max(50, 100 - excess)

    # Filler word penalty: -5 per filler, max -50
    filler_penalty = min(50, filler_count * 5)

    score = max(0, wpm_score - filler_penalty)
    return score

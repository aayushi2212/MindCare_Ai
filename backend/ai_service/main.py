"""
MindCare AI — Emotion Detection Service
========================================
Python FastAPI service that classifies the emotional content of text
using a DistilBERT-based model fine-tuned on emotion datasets.

BLUEPRINT COMPLIANCE
--------------------
- Module 3: Emotion Detection
- Model: DistilBERT (distilbert-base-uncased fine-tuned on emotion data)
- Endpoint: POST /predict
- V1 supported emotions: happy, sad, angry, fear, anxiety, neutral, surprise

SUPPORTED EMOTIONS (V1)
-----------------------
The service maps the underlying model's labels to the V1 Blueprint vocabulary:
  joy       → happy
  sadness   → sad
  anger     → angry
  fear      → fear
  disgust   → anxiety   (closest V1 label)
  surprise  → surprise
  neutral   → neutral

MODEL LOADING
-------------
The service attempts to load the model from the path configured in
AI_MODEL_PATH (env var). If that path does not exist, it falls back to
downloading "bhadresh-savani/distilbert-base-uncased-emotion" from
HuggingFace Hub — a DistilBERT model fine-tuned on the emotion dataset
that covers: joy, sadness, anger, fear, disgust, surprise.

STARTUP
-------
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8000

ENVIRONMENT VARIABLES
---------------------
  AI_MODEL_PATH    — local path to a saved model directory (optional)
  AI_SERVICE_HOST  — host to bind to (default: 0.0.0.0)
  AI_SERVICE_PORT  — port to bind to (default: 8000)
"""

import os
import time
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

# ── Logging ───────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("mindcare.emotion")

# ── V1 emotion vocabulary ─────────────────────────────────────────
V1_EMOTIONS = {"happy", "sad", "angry", "fear", "anxiety", "neutral", "surprise"}

# Map from model label → V1 Blueprint label
#
# Model labels for bhadresh-savani/distilbert-base-uncased-emotion:
#   joy, sadness, anger, fear, disgust, surprise
#
# Notes:
#   - "love" is NOT a label in this model — no mapping needed.
#   - "disgust" → "anxiety": closest V1 semantic equivalent.
#     Disgust in this model context often reflects aversion/discomfort
#     that maps most appropriately to anxiety in the V1 vocabulary.
#   - "neutral" is not in the model's label set. If encountered (e.g.
#     from a different model), it passes through directly.
LABEL_MAP: dict[str, str] = {
    # Primary model labels → V1 Blueprint labels
    "joy":      "happy",
    "sadness":  "sad",
    "anger":    "angry",
    "fear":     "fear",
    "disgust":  "anxiety",   # closest V1 semantic equivalent
    "surprise": "surprise",
    # Pass-through for labels already in V1 set (future model compatibility)
    "happy":    "happy",
    "sad":      "sad",
    "angry":    "angry",
    "anxiety":  "anxiety",
    "neutral":  "neutral",
    # Unmappable labels (e.g. "love") are intentionally absent:
    # they will be skipped and the next-best mapped label used instead.
    # If no mapped label is found, the fallback "neutral" is returned.
}

# ── Model container (loaded at startup) ───────────────────────────
_pipeline = None  # transformers pipeline instance


def _load_model():
    """Load or download the DistilBERT emotion model."""
    global _pipeline

    try:
        from transformers import pipeline as hf_pipeline
    except ImportError:
        logger.error(
            "transformers not installed. Run: pip install -r requirements.txt"
        )
        raise RuntimeError("transformers library is required")

    model_path = os.getenv("AI_MODEL_PATH", "")

    if model_path and os.path.isdir(model_path):
        logger.info(f"Loading DistilBERT model from local path: {model_path}")
        model_id = model_path
    else:
        model_id = "bhadresh-savani/distilbert-base-uncased-emotion"
        logger.info(
            f"AI_MODEL_PATH not set or not found — downloading '{model_id}' "
            f"from HuggingFace Hub (first run may take a few minutes)"
        )

    _pipeline = hf_pipeline(
        "text-classification",
        model=model_id,
        top_k=None,          # return all label scores
        truncation=True,
        max_length=512,
    )
    logger.info("Emotion model loaded successfully")


# ── FastAPI app ───────────────────────────────────────────────────
app = FastAPI(
    title="MindCare AI — Emotion Detection Service",
    description="DistilBERT-based emotion classification for the MindCare AI platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # restricted further by the Node backend
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting MindCare emotion service…")
    _load_model()
    logger.info("Emotion service ready")


# ── Request / Response schemas ────────────────────────────────────

class PredictRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("text must not be empty")
        return stripped


class PredictResponse(BaseModel):
    emotion: str
    confidence: float
    secondaryEmotion: Optional[str]
    timestamp: str


# ── Helpers ───────────────────────────────────────────────────────

def _map_label(raw_label: str) -> Optional[str]:
    """Map a raw model label to a V1 Blueprint emotion label."""
    key = raw_label.strip().lower()
    return LABEL_MAP.get(key)


def _build_result(scores: list[dict]) -> tuple[str, float, Optional[str]]:
    """
    Given a list of {label, score} dicts (all labels), return:
      (primary_v1_emotion, confidence, secondary_v1_emotion_or_None)
    """
    # Sort by score descending
    sorted_scores = sorted(scores, key=lambda x: x["score"], reverse=True)

    # Map each to V1; keep only mappable labels
    mapped: list[tuple[str, float]] = []
    for item in sorted_scores:
        v1 = _map_label(item["label"])
        if v1:
            mapped.append((v1, float(item["score"])))

    if not mapped:
        # Fallback — should not happen with the chosen model
        return "neutral", 0.5, None

    primary_label, primary_score = mapped[0]

    # Secondary: next mapped label if different from primary and score > 0.1
    secondary_label = None
    for label, score in mapped[1:]:
        if label != primary_label and score > 0.10:
            secondary_label = label
            break

    return primary_label, primary_score, secondary_label


# ── Routes ────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Health probe — used by the Node backend to verify the service is up."""
    return {
        "status": "ok",
        "model_loaded": _pipeline is not None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    """
    Classify the emotional content of the supplied text.

    Input:
      { "text": "I feel really anxious about tomorrow's presentation." }

    Output:
      {
        "emotion": "anxiety",
        "confidence": 0.87,
        "secondaryEmotion": "fear",
        "timestamp": "2025-01-15T10:30:00Z"
      }
    """
    if _pipeline is None:
        logger.error("Model not loaded — predict called before startup completed")
        raise HTTPException(status_code=503, detail="Emotion model not loaded")

    text = request.text

    try:
        # top_k=None returns scores for all labels as a list of dicts
        raw_output = _pipeline(text)

        # transformers returns [[{label, score}, ...]] when top_k=None
        scores = raw_output[0] if isinstance(raw_output[0], list) else raw_output

        emotion, confidence, secondary = _build_result(scores)

    except Exception as exc:
        logger.exception("Model inference error")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(exc)}")

    result = PredictResponse(
        emotion=emotion,
        confidence=round(confidence, 4),
        secondaryEmotion=secondary,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    logger.info(
        f"Prediction: text_len={len(text)} emotion={emotion} "
        f"confidence={result.confidence} secondary={secondary}"
    )

    return result


# ── Entry point (for direct invocation) ──────────────────────────
if __name__ == "__main__":
    import uvicorn

    host = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)

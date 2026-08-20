# MindCare AI — Emotion Detection Service

Python FastAPI service providing DistilBERT-based emotion classification.

## Architecture

```
React Frontend
    ↓
Node/Express Backend
    ↓
Python FastAPI (this service)
    ↓
DistilBERT (distilbert-base-uncased-emotion)
    ↓
Emotion Prediction
    ↓
Node Backend → Response Engine → React
```

## V1 Supported Emotions

`happy`, `sad`, `angry`, `fear`, `anxiety`, `neutral`, `surprise`

## Setup

### 1. Install Python dependencies

```bash
cd ai_service
python -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

pip install -r requirements.txt
```

### 2. (Optional) Pre-download the model

On first startup the service downloads the model from HuggingFace (~265 MB).
To avoid this at runtime, pre-download it:

```python
from transformers import pipeline
pipe = pipeline("text-classification",
                model="bhadresh-savani/distilbert-base-uncased-emotion",
                top_k=None)
pipe.save_pretrained("./model")
```

Then set:
```bash
export AI_MODEL_PATH=./model
```

### 3. Start the service

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Or using the entry-point:

```bash
python main.py
```

## Environment Variables

| Variable        | Default     | Description                                  |
|-----------------|-------------|----------------------------------------------|
| `AI_MODEL_PATH` | *(empty)*   | Local directory with a saved model. If empty, downloads from HuggingFace. |
| `AI_SERVICE_HOST` | `0.0.0.0` | Bind host                                    |
| `AI_SERVICE_PORT` | `8000`    | Bind port                                    |

## API

### `GET /health`

Health probe used by the Node backend.

```json
{ "status": "ok", "model_loaded": true, "timestamp": "..." }
```

### `POST /predict`

Classify the emotional content of a text string.

**Request:**
```json
{ "text": "I feel really anxious about tomorrow." }
```

**Response:**
```json
{
  "emotion": "anxiety",
  "confidence": 0.87,
  "secondaryEmotion": "fear",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Error responses:**

| Status | Reason                        |
|--------|-------------------------------|
| 400    | Empty or invalid text         |
| 422    | Pydantic validation failure   |
| 500    | Model inference error         |
| 503    | Model not loaded yet          |

## Model Information

- **Base model:** `distilbert-base-uncased`
- **Fine-tuned on:** Emotion dataset (Hugging Face: `dair-ai/emotion`)
- **HuggingFace ID:** `bhadresh-savani/distilbert-base-uncased-emotion`
- **Labels:** joy, sadness, anger, fear, disgust, surprise
- **V1 mapping:** joy→happy, sadness→sad, anger→angry, fear→fear, disgust→anxiety, surprise→surprise

## Integration with Node Backend

The Node backend's `EmotionService` calls this service via `fastapi.client.js`.
Configure the URL in the backend's `.env`:

```
AI_SERVICE_URL=http://localhost:8000
```

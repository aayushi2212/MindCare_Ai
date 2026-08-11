# Emotion Module — Emotion Detection Engine

**Module 3 of MindCare AI**

Single gateway between the Node.js backend and the Python FastAPI emotion analysis service. Any module that needs emotion classification imports `emotionService` from this module — nothing else ever calls FastAPI directly.

---

## Folder Structure

```
emotion/
├── constants/
│   └── emotion.constants.js      # All magic values: labels, timeouts, limits
├── controllers/
│   └── emotion.controller.js     # Thin HTTP layer
├── services/
│   ├── emotion.service.js        # All business logic — validate, call, normalise
│   └── emotion-mapper.js         # Pure label → display metadata mapping
├── clients/
│   └── fastapi.client.js         # All HTTP comms with Python FastAPI
├── validators/
│   └── emotion.validator.js      # Joi schema for /analyze request body
├── routes/
│   └── emotion.routes.js         # Express Router + Swagger JSDoc
├── errors/
│   └── emotion.errors.js         # Module-scoped error subclasses
├── repositories/
│   └── emotion.repository.js     # V1 stub — no persistence yet
├── tests/
│   └── emotion.test.js           # Jest unit tests (client fully mocked)
├── index.js                      # Public entry point
└── README.md
```

---

## REST Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/emotion/analyze` | Classify emotion in a text string |

Requires `Authorization: Bearer <token>`.

### Request

```json
{ "text": "I'm feeling overwhelmed and don't know what to do." }
```

### Response `200`

```json
{
  "success": true,
  "message": "Emotion analysis complete",
  "data": {
    "emotion": "anxiety",
    "confidence": 0.94,
    "secondaryEmotion": "sadness",
    "colour": "#FF9933",
    "icon": "😰",
    "isUncertain": false
  }
}
```

---

## Supported Emotions

`joy` · `sadness` · `anger` · `fear` · `anxiety` · `disgust` · `surprise` · `neutral` · `love` · `optimism`

Any label returned by FastAPI outside this set triggers `UnsupportedEmotionError (422)`.

---

## FastAPI Contract

The Node backend sends:

```json
POST /predict
{ "text": "I failed my interview today." }
```

And expects:

```json
{
  "emotion": "sadness",
  "confidence": 0.91,
  "secondaryEmotion": "anxiety"
}
```

The client applies an **8-second timeout** and **2 retries** on transient failures before surfacing an error.

---

## Error Responses

| Error | HTTP | Trigger |
|-------|------|---------|
| `EmptyInputError` | 400 | Empty or whitespace-only text |
| `UnsupportedEmotionError` | 422 | FastAPI returned unknown emotion label |
| `InvalidConfidenceError` | 422 | Confidence value far outside `[0, 1]` |
| `MalformedPredictionError` | 502 | Missing fields or wrong types in FastAPI response |
| `AIServiceUnavailableError` | 503 | FastAPI is down or unreachable |
| `AIServiceTimeoutError` | 504 | FastAPI did not respond within 8 seconds |

---

## Module-to-Module Usage

Other modules (e.g. Chat, Context) call emotion analysis like this — they never call FastAPI directly:

```js
import { emotionService } from '../emotion/index.js';

const result = await emotionService.analyze(messageText);
// result → { emotion, confidence, secondaryEmotion, colour, icon, isUncertain }
```

---

## Mounting in `app.js`

```js
import emotionRouter from './modules/emotion/index.js';

app.use('/api/v1/emotion', emotionRouter);
```

---

## Environment Variable

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_SERVICE_URL` | `http://localhost:8000` | Base URL of the Python FastAPI service |

---

## What This Module Does NOT Do

- No AI response generation (Module 5)
- No conversation management (Module 2)
- No crisis detection (Module 6)
- No mood analytics or journaling (Modules 7–8)
- No emotion history persistence (V2 placeholder in repository)

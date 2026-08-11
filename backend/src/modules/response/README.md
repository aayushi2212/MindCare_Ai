# Module 5 — Response Engine

## Purpose

Converts a user message, emotion prediction, conversation context, and safety flags into an appropriate supportive response.

The Response Engine is the **communication layer** of the MindCare AI pipeline.

---

## Responsibilities

- Consume emotion results produced by Module 3 — Emotion Detection
- Consume context assembled by Module 4 — Conversation Context
- Select a response strategy based on emotion, confidence, and safety state
- Generate a contextually appropriate supportive response
- Enforce safety bypass when a high-risk safety state is supplied
- Expose a clean service interface for the Chat module integration (Module 2)

## Not Responsible For

- Emotion detection or confidence calculation → Module 3
- Conversation persistence or message storage → Module 2
- Context retrieval → Module 4
- Crisis detection or safety rule evaluation → Module 8

---

## Architecture

```
POST /api/v1/response/generate
          ↓
   response.validator.js       ← Joi validation middleware
          ↓
  response.controller.js       ← Thin HTTP layer
          ↓
   response.service.js         ← Pipeline coordinator
          ↓
  response-strategy.js         ← Strategy selection
          ↓
 response-generator.js         ← Template-based generation (v1, replaceable)
          ↓
    { message, strategy, metadata }
```

---

## Response Strategies

| Emotion(s)                  | Strategy               |
|-----------------------------|------------------------|
| sadness                     | empathetic_support     |
| anxiety, fear               | calming_support        |
| anger, disgust              | de_escalation          |
| joy, love, optimism         | positive_engagement    |
| surprise                    | curious_engagement     |
| neutral / low-confidence    | neutral_support        |
| high_risk safety state      | safety_bypass          |

Confidence threshold: **0.5** — below this, `neutral_support` is used regardless of emotion label.

---

## API Endpoint

### `POST /api/v1/response/generate`

**Request:**
```json
{
  "userMessage": "I feel overwhelmed.",
  "emotion": {
    "label": "anxiety",
    "confidence": 0.92
  },
  "context": {
    "recentMessages": []
  },
  "safety": {
    "status": "not_evaluated"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Response generated successfully",
  "data": {
    "message": "It sounds like you're feeling quite overwhelmed right now. You're not alone in this — many people experience moments like these. What feels most pressing to you right now?",
    "strategy": "calming_support",
    "metadata": {
      "emotion": "anxiety",
      "confidence": 0.92,
      "contextualised": false
    }
  }
}
```

---

## Safety Handling

If `safety.status` is `high_risk`, the service throws `UnsafeResponseGenerationError` (503) rather than generating a normal response. This enforces the requirement that the Safety module's response takes precedence.

---

## Replacing the Generator (Future LLM upgrade)

Replace `strategies/response-generator.js` with an LLM client implementation that satisfies the same interface:

```js
generateResponse(input, strategy) → { message, strategy, metadata }
```

No other file needs to change.

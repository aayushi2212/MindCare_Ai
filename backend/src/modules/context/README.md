# Context Module — Conversation Context Engine

**Module 4 of MindCare AI**

The application's memory layer. Given a conversation, it retrieves, filters, orders, and returns a clean context window ready for downstream modules. It is **read-only** — it never writes to any collection.

---

## Folder Structure

```
context/
├── constants/
│   └── context.constants.js      # Window limits, sort order, role mapping
├── controllers/
│   └── context.controller.js     # Thin HTTP layer
├── services/
│   └── context.service.js        # All business logic — filter, sort, budget, assemble
├── repositories/
│   └── context.repository.js     # Read-only queries against Chat module's collections
├── validators/
│   └── context.validator.js      # Joi schemas for params and query strings
├── routes/
│   └── context.routes.js         # Express Router + Swagger JSDoc
├── errors/
│   └── context.errors.js         # Module-scoped error subclasses
├── tests/
│   └── context.test.js           # Jest unit tests (repository fully mocked)
├── index.js                      # Public entry point
└── README.md
```

---

## REST Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/context/:conversationId` | Retrieve assembled conversation context |

Requires `Authorization: Bearer <token>`.

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | `10` | Max messages to include (1–20) |
| `includeMetadata` | boolean | `false` | Attach conversation-level metadata |
| `includeAssistantMessages` | boolean | `true` | Include AI messages |
| `includeUserMessages` | boolean | `true` | Include user messages |

### Response `200`

```json
{
  "success": true,
  "message": "Context retrieved successfully",
  "data": {
    "conversationId": "64b3c12a1f0b2a0012345678",
    "recentMessages": [
      { "role": "user",      "content": "I have an interview tomorrow." },
      { "role": "assistant", "content": "Good luck! You've prepared well." }
    ],
    "messageCount": 42,
    "lastInteraction": "2026-08-04T10:15:00.000Z"
  }
}
```

With `includeMetadata=true`:

```json
{
  "data": {
    "conversationId": "...",
    "recentMessages": [...],
    "messageCount": 42,
    "lastInteraction": "...",
    "metadata": {
      "title": "Evening session",
      "status": "active",
      "archived": false,
      "createdAt": "...",
      "lastEmotion": "anxiety"
    }
  }
}
```

---

## Context Window Rules

1. Messages are returned **oldest → newest** (LLM-ready order)
2. Soft-deleted messages are excluded
3. Empty or whitespace-only messages are excluded
4. Archived and deleted conversations are not served (`404`)
5. If total character count exceeds `12,000`, oldest messages are dropped first
6. The `limit` param further trims the window to the N newest messages

---

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_CONTEXT_MESSAGES` | `10` | Used when `limit` is not supplied |
| `MAX_CONTEXT_MESSAGES` | `20` | Hard ceiling on `limit` |
| `MIN_CONTEXT_MESSAGES` | `1` | Floor on `limit` |
| `MAX_CONTEXT_CHARACTERS` | `12,000` | Total character budget |
| `REPOSITORY_FETCH_MULTIPLIER` | `3` | Fetch 3× the limit so filtering still fills the window |

---

## Error Responses

| Error | HTTP | Trigger |
|-------|------|---------|
| `ConversationNotFoundError` | 404 | Conversation does not exist, is soft-deleted, or has status ≠ active |
| `UnauthorizedConversationAccessError` | 403 | Authenticated user does not own the conversation |
| `InvalidContextLimitError` | 400 | `limit` outside `[1, 20]` or non-integer |
| `ValidationError` | 400 | Invalid `conversationId` format or bad query params |

---

## Module-to-Module Usage

Module 5 (Response Engine) calls this directly — no HTTP round-trip:

```js
import { contextService } from '../context/index.js';

const ctx = await contextService.buildContext(userId, conversationId, {
  limit:                   15,
  includeMetadata:         true,
  includeAssistantMessages: true,
  includeUserMessages:      true,
});

// ctx.recentMessages → array of { role, content } ready for the LLM prompt
```

---

## Mounting in `app.js`

```js
import contextRouter from './modules/context/index.js';

app.use('/api/v1/context', contextRouter);
```

---

## Future Extension Points (V2+)

The module is designed so these can be added without changing existing interfaces:

| Feature | Extension point |
|---------|----------------|
| Long-term memory | New `findSignificantMessages()` in repository |
| Memory summarisation | New `summarize()` in service; result added to context object |
| Semantic / vector search | New repository method calling a vector DB |
| Important event extraction | Post-processing step in `buildContext()` |
| User preference memory | New `findUserPreferences()` in repository |

---

## What This Module Does NOT Do

- No AI response generation (Module 5)
- No emotion detection (Module 3)
- No conversation writes (Module 2)
- No crisis detection (Module 6)
- No mood analytics (Module 7)
- No FastAPI calls (Module 3 only)

# Chat Module — Conversation Management

**Module 2 of MindCare AI**

Owns the full lifecycle of conversations and messages. This module is a clean persistence layer — it has no awareness of emotions, AI responses, prompts, or safety logic. Those belong to later modules.

---

## Folder Structure

```
chat/
├── constants/
│   └── chat.constants.js         # All magic values (limits, enums, defaults)
├── controllers/
│   └── chat.controller.js        # Thin HTTP layer — validates input, calls service, returns response
├── services/
│   └── chat.service.js           # All business logic — ownership, title generation, meta updates
├── repositories/
│   └── chat.repository.js        # All MongoDB queries — zero business logic
├── models/
│   ├── conversation.model.js     # Mongoose schema for Conversations collection
│   └── message.model.js          # Mongoose schema for Messages collection
├── validators/
│   └── chat.validator.js         # Joi schemas — body and query validation
├── routes/
│   └── chat.routes.js            # Express Router with Swagger JSDoc
├── errors/
│   └── chat.errors.js            # Module-scoped error subclasses
├── tests/
│   └── chat.test.js              # Jest unit tests (repository mocked)
├── index.js                      # Public entry point — exports router only
└── README.md
```

---

## REST Endpoints

| Method   | Path                                    | Description                                    |
|----------|-----------------------------------------|------------------------------------------------|
| `POST`   | `/api/v1/chat`                          | Create a new conversation                      |
| `GET`    | `/api/v1/chat`                          | List conversations (paginated, search, filter) |
| `GET`    | `/api/v1/chat/:conversationId`          | Get a single conversation                      |
| `POST`   | `/api/v1/chat/:conversationId/messages` | Save a new message (no AI reply generated)     |
| `GET`    | `/api/v1/chat/:conversationId/messages` | Get paginated messages                         |
| `PATCH`  | `/api/v1/chat/:conversationId`          | Rename conversation                            |
| `DELETE` | `/api/v1/chat/:conversationId`          | Soft delete                                    |
| `DELETE` | `/api/v1/chat/:conversationId/permanent`| Permanent delete (also wipes messages)         |

All endpoints require a valid `Authorization: Bearer <token>` header.

---

## Query Parameters

### `GET /api/v1/chat`

| Param      | Type    | Default  | Description                              |
|------------|---------|----------|------------------------------------------|
| `page`     | integer | `1`      | Page number                              |
| `limit`    | integer | `20`     | Results per page (max 100)               |
| `sort`     | string  | `newest` | `newest` or `oldest`                     |
| `archived` | string  | —        | `true` or `false` to filter archived     |
| `search`   | string  | —        | Search conversations by title            |

### `GET /api/v1/chat/:conversationId/messages`

| Param   | Type    | Default  | Description                       |
|---------|---------|----------|-----------------------------------|
| `page`  | integer | `1`      | Page number                       |
| `limit` | integer | `20`     | Messages per page (max 100)       |
| `sort`  | string  | `oldest` | `oldest` (chronological) or `newest` |

---

## Data Models

### Conversation

```js
{
  _id:           ObjectId,
  userId:        ObjectId,   // ref: User
  title:         String,     // max 100 chars, auto-generated if not provided
  status:        String,     // 'active' | 'archived' | 'deleted'
  messageCount:  Number,     // incremented atomically on each saveMessage
  lastMessageAt: Date,       // updated atomically on each saveMessage
  lastEmotion:   String,     // null — populated by Module 3
  archived:      Boolean,
  deletedAt:     Date,       // null unless soft-deleted
  createdAt:     Date,
  updatedAt:     Date,
}
```

### Message

```js
{
  _id:            ObjectId,
  conversationId: ObjectId,  // ref: Conversation
  sender:         String,    // 'user' | 'ai'
  content:        String,    // max 5000 chars
  messageType:    String,    // 'text' | 'media'
  metadata:       Mixed,     // {} — extension point for Module 3+
  createdAt:      Date,
  updatedAt:      Date,
}
```

---

## Error Responses

| Error                         | HTTP | Description                                  |
|-------------------------------|------|----------------------------------------------|
| `ConversationNotFoundError`   | 404  | Conversation does not exist or is soft-deleted |
| `ConversationAccessDeniedError` | 403 | Authenticated user does not own the conversation |
| `ValidationError`             | 400  | Invalid request body or query params         |
| `InvalidConversationIdError`  | 400  | conversationId is not a valid ObjectId       |
| `UnauthorizedError`           | 401  | Missing or invalid JWT                       |

---

## Mounting in `app.js`

```js
import chatRouter from './modules/chat/index.js';

app.use('/api/v1/chat', chatRouter);
```

---

## What This Module Does NOT Do

- No emotion detection (Module 3)
- No AI response generation (Module 5 / response)
- No prompt building (Module 5)
- No DistilBERT / FastAPI calls (Module 3)
- No crisis detection (Module 6 / safety)
- No context summarisation (Module 4 / context)

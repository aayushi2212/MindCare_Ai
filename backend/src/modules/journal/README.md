# Module 6 — Mood Journal

## Purpose

The Mood Journal records intentional emotional check-ins over time.

Unlike chat history (Module 2), journal entries represent deliberate reflection rather than conversational exchange. They are structured, personal, and user-initiated.

---

## Responsibilities

- Daily mood entry (user-selected emotion)
- Short reflection text
- Personal notes
- Automatic timestamp
- Ownership enforcement (users can only access their own entries)

---

## Architecture

```
Route
 ↓
authenticate (Module 1 JWT middleware)
 ↓
Joi validation middleware
 ↓
JournalController (thin HTTP layer)
 ↓
JournalService (business logic, ownership enforcement)
 ↓
JournalRepository (MongoDB / Mongoose)
 ↓
JournalEntry model
```

---

## API Endpoints

All endpoints require a valid `Authorization: Bearer <token>` header.

| Method | Path                   | Description                        |
|--------|------------------------|------------------------------------|
| POST   | /api/v1/journal        | Create a new journal entry         |
| GET    | /api/v1/journal        | List own entries (paginated)       |
| GET    | /api/v1/journal/:id    | Get a single owned entry           |
| PATCH  | /api/v1/journal/:id    | Update an owned entry              |
| DELETE | /api/v1/journal/:id    | Delete an owned entry              |

### POST /api/v1/journal

**Request body:**

```json
{
  "emotion":    "anxiety",
  "reflection": "I felt nervous about my interview today.",
  "notes":      "Practice again tomorrow."
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Journal entry created successfully",
  "data": {
    "entry": {
      "_id":        "...",
      "userId":     "...",
      "emotion":    "anxiety",
      "reflection": "I felt nervous about my interview today.",
      "notes":      "Practice again tomorrow.",
      "createdAt":  "2026-08-11T...",
      "updatedAt":  "2026-08-11T..."
    }
  }
}
```

### PATCH /api/v1/journal/:id

Send only the fields to update. At least one field must be provided.

```json
{
  "emotion": "happy",
  "reflection": "Today went better than expected."
}
```

---

## Data Model

| Field       | Type     | Required | Notes                                               |
|-------------|----------|----------|-----------------------------------------------------|
| userId      | ObjectId | Yes      | Set from JWT; never from request body               |
| emotion     | String   | Yes      | One of: happy, sad, angry, fear, anxiety, neutral, surprise |
| reflection  | String   | Yes      | 1–2000 characters; trimmed                          |
| notes       | String   | No       | Up to 1000 characters; trimmed                     |
| createdAt   | Date     | Auto     | Set by Mongoose timestamps                          |
| updatedAt   | Date     | Auto     | Set by Mongoose timestamps                          |

---

## Authentication

Every endpoint requires authentication via Module 1's JWT middleware.

The `userId` is **always** taken from the verified JWT payload. The client cannot set or override it.

---

## Ownership

Each journal entry belongs to exactly one user.

- Users can only create, view, update, or delete their own entries.
- Attempting to access another user's entry by ID returns **404** (not 403), so the existence of another user's entry is not revealed.

---

## Validation

| Field      | Rule                                                |
|------------|-----------------------------------------------------|
| emotion    | Required; must be one of the V1 emotion vocabulary  |
| reflection | Required; non-empty; max 2000 characters            |
| notes      | Optional; max 1000 characters                       |
| :id        | Must be a valid 24-character MongoDB ObjectId       |

---

## Module Boundaries

Module 6 does **not**:

- Call Module 3 (emotion detection) — the user selects the emotion
- Generate AI content
- Perform analytics or summaries (Module 7)
- Replace or modify chat (Module 2)
- Implement crisis detection
- Create journal entries automatically from chat messages

---

## Future (Module 7)

Module 7 (Analytics Dashboard) will consume journal data to produce weekly summaries, emotion frequency charts, and mood trends. Those features are **not** implemented here.

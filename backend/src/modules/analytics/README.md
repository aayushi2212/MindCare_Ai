# Module 7 — Analytics Dashboard

## Purpose

Aggregate and serve simple, privacy-safe analytics derived from the authenticated
user's Mood Journal (Module 6) entries.

The dashboard helps users recognise their own emotional trends over time.
It does **not** diagnose, predict, or score mental health.

---

## Responsibilities

- Mood trend chart data (chronological emotion points)
- Emotion frequency counts
- Weekly summary (current ISO week, Mon–Sun UTC)
- Monthly summary (current calendar month, UTC)
- Journal history (read-only, paginated)

## Does NOT do

- Create / edit / delete journal entries (Module 6 responsibility)
- Detect emotions (Module 3)
- Generate AI content, predictions, or psychological interpretations
- Crisis detection
- Chat management (Module 2)

---

## Architecture

```
Route
   ↓
authenticate (Module 1 JWT middleware)
   ↓
Joi validation middleware
   ↓
AnalyticsController (thin HTTP layer)
   ↓
AnalyticsService (aggregation logic, user isolation)
   ↓
AnalyticsRepository (MongoDB aggregation pipelines)
   ↓
JournalEntry model (Module 6, read-only)
```

---

## API Endpoints

All endpoints require `Authorization: Bearer <token>`.
The authenticated user's ID is taken from the JWT — never from query parameters.

| Method | Path                               | Description                                |
|--------|------------------------------------|--------------------------------------------|
| GET    | /api/v1/analytics/overview         | Full dashboard summary                     |
| GET    | /api/v1/analytics/mood-trend       | Chronological emotion points for chart     |
| GET    | /api/v1/analytics/emotions         | Per-emotion frequency counts               |
| GET    | /api/v1/analytics/weekly           | Current week descriptive statistics        |
| GET    | /api/v1/analytics/monthly          | Current month descriptive statistics       |
| GET    | /api/v1/analytics/journal-history  | Paginated journal history (read-only)      |

### Query parameters

**mood-trend** and **emotions**:
```
startDate=YYYY-MM-DD  (ISO 8601 — must be paired with endDate)
endDate=YYYY-MM-DD    (ISO 8601 — must be paired with startDate)
```

**journal-history**:
```
page=1    (integer ≥ 1, default 1)
limit=20  (integer 1–100, default 20)
```

---

## Response structures

### overview

```json
{
  "success": true,
  "data": {
    "totalEntries": 24,
    "mostFrequentEmotion": "anxiety",
    "emotionDistribution": { "happy": 5, "sad": 3, "angry": 1, "fear": 0, "anxiety": 10, "neutral": 4, "surprise": 1 },
    "moodTrend": [{ "date": "2026-08-01", "emotion": "anxiety" }],
    "weeklySummary":  { "period": "weekly",  "startDate": "...", "endDate": "...", "entryCount": 6, "mostFrequentEmotion": "anxiety", "emotionFrequency": {} },
    "monthlySummary": { "period": "monthly", "month": "2026-08", "startDate": "...", "endDate": "...", "entryCount": 24, "mostFrequentEmotion": "anxiety", "emotionFrequency": {} }
  }
}
```

### mood-trend

```json
{
  "success": true,
  "data": {
    "moodTrend": [
      { "date": "2026-08-01", "emotion": "happy" },
      { "date": "2026-08-02", "emotion": "anxiety" }
    ]
  }
}
```

### journal-history

```json
{
  "success": true,
  "data": [
    { "_id": "...", "emotion": "anxiety", "reflection": "...", "createdAt": "..." }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

---

## Date conventions

- All Mongoose timestamps are stored in **UTC** (Module 6 behaviour).
- Week boundaries: **Monday 00:00:00 UTC → Sunday 23:59:59.999 UTC** (ISO week).
- Month boundaries: **first day of month 00:00:00 UTC → last day 23:59:59.999 UTC**.
- Mood trend dates are returned as `YYYY-MM-DD` strings in UTC.

---

## User isolation

Every query is scoped to the authenticated user's ID from the JWT.
No user can access another user's analytics.
`userId` is never accepted from query parameters or request body.

---

## Empty-data behaviour

All endpoints return `200 OK` with empty arrays / zero counts when a user
has no journal entries. No 404 is thrown for an empty dataset.

---

## Tie-breaking

When multiple emotions share the highest frequency, the winner is chosen
**alphabetically** for deterministic, consistent results.

---

## Module 6 impact

Module 6 is unchanged. Module 7 reads the `JournalEntry` model via
`mongoose.model('JournalEntry')` (lazy lookup after Module 6 registers it at
boot time). No Module 6 files are modified.

---

## Future (not implemented in V1)

- AI-generated summaries
- Streak tracking
- Goal setting
- Predictive mood analysis
- Social comparisons

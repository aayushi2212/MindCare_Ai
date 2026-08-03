# Auth Module

## Business Goal
Verify the identity of users and secure access to the application.
**Authentication is responsible only for *who the user is*. Nothing else.**

---

## Responsibilities

| Responsibility          | Implemented | File                          |
|-------------------------|-------------|-------------------------------|
| Register users          | ✅           | services/auth.service.js      |
| Log users in            | ✅           | services/auth.service.js      |
| Generate JWT tokens     | ✅           | shared/utils/jwt.js           |
| Verify JWT tokens       | ✅           | shared/middleware/auth.middleware.js |
| Refresh sessions        | ✅           | services/auth.service.js      |
| Logout (single device)  | ✅           | services/auth.service.js      |
| Logout (all devices)    | ✅           | services/auth.service.js      |
| Password hashing        | ✅           | models/user.model.js (pre-save hook) |
| Password validation     | ✅           | validators/auth.validator.js  |
| Refresh token hashing   | ✅           | repositories/auth.repository.js |
| Token rotation          | ✅           | services/auth.service.js      |

---

## It MUST NOT

- Store profile preferences (→ User Module / UserPreferences collection)
- Handle chat messages (→ Chat Module)
- Store journal entries (→ Journal Module)
- Process emotions (→ Emotion Module)
- Manage dashboards (→ Dashboard Module)

---

## Routes

```
POST  /api/v1/auth/register   — create account
POST  /api/v1/auth/login      — authenticate
POST  /api/v1/auth/refresh    — rotate refresh token
POST  /api/v1/auth/logout     — revoke session (auth required)
GET   /api/v1/auth/me         — get current user (auth required)
```

---

## Database Collections Owned

| Collection     | Purpose                        |
|----------------|--------------------------------|
| `users`        | Identity and auth state fields |
| `refreshTokens`| One document per active session|

The `users` collection is **shared** — the User Module reads it for
profile data. The Auth Module **writes** to it for auth fields only
(lastLogin, accountStatus). Profile fields (bio, profileImage) are
updated by the User Module.

---

## Security Design Decisions

### 1. Refresh token rotation
Every call to `POST /refresh` deletes the incoming token and issues
a brand-new pair. If a token is stolen and used first, the legitimate
user's next refresh will fail, alerting them to re-authenticate.

### 2. Hashed refresh tokens
Raw refresh tokens are never stored in the database. Only a bcrypt
hash is persisted (10 rounds). This means a database breach does not
expose live sessions.

### 3. TTL index on refreshTokens
MongoDB automatically deletes expired token documents via a TTL index
on `expiresAt`. No cron job needed.

### 4. Timing-safe login
Even when the email does not exist, `comparePassword` is called to
prevent timing attacks that reveal whether an email is registered.

### 5. Access tokens are not revocable
This is intentional — JWTs are stateless. The access token expires
in 15 minutes. For immediate revocation, the access token lifetime
can be shortened or a token blocklist can be introduced in a later
milestone.

---

## Module Structure

```
auth/
├── constants/
│   └── auth.constants.js         — magic values, account statuses
├── controllers/
│   └── auth.controller.js        — HTTP layer only
├── errors/
│   └── auth.errors.js            — typed auth error classes
├── models/
│   ├── user.model.js             — Users collection schema
│   └── refresh-token.model.js    — RefreshTokens collection schema
├── repositories/
│   └── auth.repository.js        — all DB queries for auth
├── routes/
│   └── auth.routes.js            — route definitions + Swagger docs
├── services/
│   └── auth.service.js           — business logic
├── validators/
│   └── auth.validator.js         — Joi request body validation
├── index.js                       — public entry point (exports router)
└── README.md                      — this file
```

---

## Communicates With

```
Auth Module
    │
    ├──▶ User Module (reads User documents for auth state)
    │
    └──▶ Shared Module
              ├── shared/utils/jwt.js
              ├── shared/middleware/auth.middleware.js
              ├── shared/errors/http-errors.js
              ├── shared/response/response.helper.js
              ├── shared/logger/logger.js
              └── shared/events/event-bus.js
```

---

## Events Emitted

| Event             | Payload             | Consumer (future)     |
|-------------------|---------------------|-----------------------|
| `user.registered` | `{ userId }`        | Analytics, Email      |
| `user.loggedIn`   | `{ userId }`        | Analytics             |
| `user.loggedOut`  | `{ userId }`        | Analytics             |

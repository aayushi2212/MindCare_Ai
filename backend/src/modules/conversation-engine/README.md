# Conversation Engine Module

## Purpose
The core of the AI pipeline. Orchestrates the full conversational loop: context retrieval, prompt construction, AI invocation, safety checking, and response delivery.

## Folder Structure
```
conversation-engine/
├── routes/          HTTP route definitions
├── controllers/     Request handlers — thin HTTP layer only
├── services/        Business logic
├── repositories/    MongoDB query layer
├── models/          Mongoose schemas
├── validators/      Input validation schemas
├── constants/       Module-scoped constants
├── errors/          Custom error classes for this module
└── tests/           Unit and integration tests
```

## Public Interface
Import from `modules/conversation-engine/index.js` only.
Do not import internal files directly from other modules.

## Dependencies
See individual service files for detailed dependency declarations.

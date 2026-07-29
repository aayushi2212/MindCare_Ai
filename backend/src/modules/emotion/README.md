# Emotion Module

## Purpose
Detects, maps, and tracks the emotional state of the user throughout a conversation. Acts as a bridge between raw AI output and structured emotion data.

## Folder Structure
```
emotion/
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
Import from `modules/emotion/index.js` only.
Do not import internal files directly from other modules.

## Dependencies
See individual service files for detailed dependency declarations.

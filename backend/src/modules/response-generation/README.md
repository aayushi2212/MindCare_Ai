# Response Generation Module

## Purpose
Formats, enriches, and validates the final AI-generated response before it is returned to the client. Distinct from HTTP response formatting (shared/response) and from AI inference (conversation-engine).

## Folder Structure
```
response-generation/
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
Import from `modules/response-generation/index.js` only.
Do not import internal files directly from other modules.

## Dependencies
See individual service files for detailed dependency declarations.

# Dashboard Module

## Purpose
Aggregates and serves analytics data for the user's personal wellbeing dashboard — emotion trends, session counts, and streak data.

## Folder Structure
```
dashboard/
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
Import from `modules/dashboard/index.js` only.
Do not import internal files directly from other modules.

## Dependencies
See individual service files for detailed dependency declarations.

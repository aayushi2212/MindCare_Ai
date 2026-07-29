# ADR 0002 — Separate AI Service

**Status:** Accepted

## Context
ML dependencies (PyTorch, Transformers) conflict with the Node.js runtime and need independent scaling.

## Decision
Run the AI/ML layer as a separate FastAPI Python microservice.

## Consequences
The backend calls the AI service over HTTP. Adds a network hop but enables independent deployment and scaling.

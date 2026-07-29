# MindCare AI

A modular, production-ready mental health support platform built with a
React frontend, Node.js/Express backend, and a Python FastAPI AI service.

---

## Architecture Overview

```
mindcare-ai/
├── frontend/          React + Vite SPA
├── backend/           Node.js + Express REST API
├── ai-service/        Python FastAPI — AI/ML pipeline
├── docs/              Architecture, API contracts, ADRs
├── docker/            Per-service Dockerfiles + nginx config
└── scripts/           Dev setup and tooling scripts
```

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, React Router        |
| Backend    | Node.js, Express, MongoDB, Mongoose |
| AI Service | Python, FastAPI, LangChain          |
| Auth       | JWT (access + refresh tokens)       |
| DevOps     | Docker, Docker Compose, GitHub CI   |

---

## Setup Instructions

### Prerequisites
- Node.js >= 18
- Python >= 3.11
- Docker + Docker Compose
- MongoDB Atlas account (or local MongoDB)

### Quick Start (Docker)
```bash
cp .env.example .env          # fill in values
docker-compose up --build
```

### Manual Start
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# AI Service
cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload
```

---

## Environment Variables
See `.env.example` at the root and in each service folder.
Full documentation: `docs/development/EnvironmentVariables.md`

---

## Development Workflow
See `docs/development/GitWorkflow.md` for branching strategy and
`docs/development/CodingStandards.md` for code style rules.

---

## Future Roadmap
- WebSocket real-time chat
- Emotion trend analytics dashboard
- Memory-aware conversation context (Redis)
- Mobile app (React Native)

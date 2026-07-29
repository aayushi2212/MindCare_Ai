"""
PURPOSE
-------
Entry point for the FastAPI AI service application.

RESPONSIBILITIES
-------
- Create and configure the FastAPI app instance
- Register all API routers (generation, emotion, health)
- Configure CORS for backend-only access
- Add startup/shutdown lifecycle hooks (model loading, connection checks)

NEVER
-------
- Contain inference logic directly (delegate to services/pipelines)
- Accept unauthenticated requests from the public internet

EXPORTS
-------
app — FastAPI application instance (used by uvicorn)

DEPENDS ON
-------
fastapi, app/api/*, app/config/settings.py
"""

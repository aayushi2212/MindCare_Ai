"""
PURPOSE
-------
Loads and validates all environment variables for the AI service.

RESPONSIBILITIES
-------
- Use Pydantic BaseSettings to read from .env
-------
- Export a settings singleton

NEVER
-------
- Hardcode secrets or model paths

EXPORTS
-------
settings — Settings instance

DEPENDS ON
-------
pydantic-settings
"""

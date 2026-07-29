"""
PURPOSE
-------
Defines the /generate endpoint that receives a prompt and returns an AI-generated response.

RESPONSIBILITIES
-------
- Accept PromptRequest schema
-------
- Delegate to GenerationService
-------
- Return GenerationResponse schema

NEVER
-------
- Run inference directly
-------
- Handle prompt construction

EXPORTS
-------
router — APIRouter with POST /generate

DEPENDS ON
-------
services/generation_service.py, schemas/generation.py
"""

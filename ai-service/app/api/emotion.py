"""
PURPOSE
-------
Defines the /detect-emotion endpoint for classifying emotional tone in text.

RESPONSIBILITIES
-------
- Accept EmotionRequest schema
-------
- Delegate to EmotionService
-------
- Return EmotionResponse schema

NEVER
-------
- Store results
-------
- Perform text preprocessing

EXPORTS
-------
router — APIRouter with POST /detect-emotion

DEPENDS ON
-------
services/emotion_service.py, schemas/emotion.py
"""

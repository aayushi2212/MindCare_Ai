"""
PURPOSE
-------
Classifies the emotional tone of a given text using an ML model.

RESPONSIBILITIES
-------
- Run inference on input text
-------
- Return emotion label and confidence score

NEVER
-------
- Detect crisis signals (that belongs in safety module)
-------
- Store results

EXPORTS
-------
detect(text) → EmotionResult

DEPENDS ON
-------
pipelines/emotion_pipeline.py
"""

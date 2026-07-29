"""
PURPOSE
-------
Low-level pipeline that manages LLM model loading and inference execution.

RESPONSIBILITIES
-------
- Load model on startup
-------
- Execute raw inference calls
-------
- Handle model errors and timeouts

NEVER
-------
- Apply business rules
-------
- Format output for API

EXPORTS
-------
GenerationPipeline class with run(prompt) method

DEPENDS ON
-------
transformers or langchain, config/settings.py
"""

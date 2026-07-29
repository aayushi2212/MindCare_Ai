"""
PURPOSE
-------
Runs the LLM inference pipeline to generate a response from a prompt.

RESPONSIBILITIES
-------
- Load and invoke the LLM
-------
- Apply generation parameters (temperature, max_tokens)
-------
- Return raw model output

NEVER
-------
- Build prompts
-------
- Classify emotions
-------
- Store data

EXPORTS
-------
generate(prompt_object) → str

DEPENDS ON
-------
pipelines/generation_pipeline.py
"""

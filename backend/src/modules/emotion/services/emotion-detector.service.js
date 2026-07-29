/**
 * PURPOSE
 * -------
 * Calls the AI service to classify the emotional tone of a user message.
 *
 * RESPONSIBILITIES
 * -------
 * - Send text to FastAPI /detect-emotion endpoint
 * - Return a structured emotion result
 *
 * NEVER
 * -------
 * - Map emotion codes to display labels
 * - Store emotion data
 *
 * EXPORTS
 * -------
 * detect(text) → { emotion, confidence, rawScores }
 *
 * DEPENDS ON
 * -------
 * axios, config/environment.js
 */

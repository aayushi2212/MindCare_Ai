/**
 * PURPOSE
 * -------
 * Sends the constructed prompt to the AI service and processes the raw response.
 *
 * RESPONSIBILITIES
 * -------
 * - POST to FastAPI /generate endpoint
 * - Parse and validate the raw AI response
 * - Handle timeouts and retry logic
 *
 * NEVER
 * -------
 * - Build the prompt
 * - Store the response
 *
 * EXPORTS
 * -------
 * generate(promptObject) → RawAIResponse
 *
 * DEPENDS ON
 * -------
 * axios or fetch, config/environment.js
 */

/**
 * PURPOSE
 * -------
 * HTTP client wrapper for all emotion-related FastAPI calls.
 *
 * RESPONSIBILITIES
 * -------
 * - Encapsulate endpoint URLs and request formatting
 * - Handle auth headers and error normalisation for the AI service
 *
 * NEVER
 * -------
 * - Contain business logic
 * - Store data
 *
 * EXPORTS
 * -------
 * post(endpoint, payload) → response
 *
 * DEPENDS ON
 * -------
 * axios, config/environment.js
 */

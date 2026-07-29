/**
 * PURPOSE
 * -------
 * Post-processes the raw AI output into a structured, client-ready response.
 *
 * RESPONSIBILITIES
 * -------
 * - Format text, add metadata, attach suggested actions
 * - Validate minimum quality thresholds
 *
 * NEVER
 * -------
 * - Generate AI content
 * - Send HTTP responses
 *
 * EXPORTS
 * -------
 * format(rawAIResponse, context) → FormattedResponse
 *
 * DEPENDS ON
 * -------
 * shared/response
 */

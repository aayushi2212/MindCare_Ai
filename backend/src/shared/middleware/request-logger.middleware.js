/**
 * PURPOSE
 * -------
 * Logs every incoming HTTP request with method, path, status, and duration.
 *
 * RESPONSIBILITIES
 * -------
 * - Log request start and completion
 * - Attach request ID for tracing
 *
 * NEVER
 * -------
 * - Log sensitive body data (passwords, tokens)
 *
 * EXPORTS
 * -------
 * requestLogger — Express middleware
 *
 * DEPENDS ON
 * -------
 * shared/logger
 */

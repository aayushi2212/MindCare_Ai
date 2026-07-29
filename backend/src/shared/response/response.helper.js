/**
 * PURPOSE
 * -------
 * Provides helper functions to send standardised JSON responses.
 *
 * RESPONSIBILITIES
 * -------
 * - success(res, data, statusCode)
 * - error(res, message, statusCode)
 * - paginated(res, data, pagination)
 *
 * NEVER
 * -------
 * - Handle business logic
 * - Determine what data to return
 *
 * EXPORTS
 * -------
 * success, error, paginated
 *
 * DEPENDS ON
 * -------
 * express
 */

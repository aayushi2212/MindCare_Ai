/**
 * PURPOSE
 * -------
 * Global Express error handler. Must be registered last in app.js.
 *
 * RESPONSIBILITIES
 * -------
 * - Catch all errors passed via next(err)
 * - Map known AppError types to HTTP status codes
 * - Return standardised error response
 * - Log unexpected errors
 *
 * NEVER
 * -------
 * - Throw errors
 * - Contain route logic
 *
 * EXPORTS
 * -------
 * errorHandler — Express error middleware (4-argument)
 *
 * DEPENDS ON
 * -------
 * shared/response, shared/logger
 */

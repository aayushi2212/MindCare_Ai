/**
 * PURPOSE
 * -------
 * Wraps async route handlers to automatically forward errors to next().
 *
 * RESPONSIBILITIES
 * -------
 * - Eliminate try/catch boilerplate in controllers
 *
 * NEVER
 * -------
 * - Handle errors itself
 *
 * EXPORTS
 * -------
 * asyncHandler(fn) — higher-order function
 *
 * DEPENDS ON
 * -------
 * express
 */

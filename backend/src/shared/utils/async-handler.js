/**
 * PURPOSE
 * -------
 * Wraps an async Express route handler and forwards any thrown error to next().
 * Eliminates try/catch boilerplate in every controller.
 *
 * EXPORTS
 * -------
 * asyncHandler(fn) — returns a standard Express middleware
 *
 * DEPENDS ON
 * ----------
 * none
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;

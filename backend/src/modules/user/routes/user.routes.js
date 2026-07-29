/**
 * PURPOSE
 * -------
 * Defines HTTP routes for user profile operations.
 *
 * RESPONSIBILITIES
 * -------
 * - Map GET /me, PATCH /me, DELETE /me to controller methods
 * - Apply auth middleware
 *
 * NEVER
 * -------
 * - Contain logic
 *
 * EXPORTS
 * -------
 * userRouter — Express Router
 *
 * DEPENDS ON
 * -------
 * express, user.controller.js, shared/middleware/auth.middleware.js
 */

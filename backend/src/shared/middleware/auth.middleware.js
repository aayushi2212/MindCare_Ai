/**
 * PURPOSE
 * -------
 * Verifies the JWT access token on protected routes and attaches the decoded user to req.user.
 *
 * RESPONSIBILITIES
 * -------
 * - Extract Bearer token from Authorization header
 * - Verify and decode JWT
 * - Attach user payload to req.user
 * - Call next() or return 401
 *
 * NEVER
 * -------
 * - Issue tokens
 * - Fetch full user from database
 *
 * EXPORTS
 * -------
 * authenticate — Express middleware function
 *
 * DEPENDS ON
 * -------
 * shared/utils/jwt.js, shared/errors
 */

/**
 * PURPOSE
 * -------
 * Utility functions for signing and verifying JWTs.
 *
 * RESPONSIBILITIES
 * -------
 * - signAccessToken(payload), signRefreshToken(payload), verifyToken(token)
 *
 * NEVER
 * -------
 * - Store tokens
 * - Handle HTTP logic
 *
 * EXPORTS
 * -------
 * signAccessToken, signRefreshToken, verifyToken
 *
 * DEPENDS ON
 * -------
 * jsonwebtoken, config/environment.js
 */

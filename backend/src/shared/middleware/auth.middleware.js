/**
 * PURPOSE
 * -------
 * Verifies the JWT access token on protected routes and attaches
 * the decoded payload to req.user.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Extract the Bearer token from the Authorization header
 * - Verify and decode it using shared/utils/jwt.js
 * - Distinguish expired tokens from invalid tokens
 * - Attach { userId, email, iat, exp } to req.user
 *
 * NEVER
 * -----
 * - Issue or refresh tokens
 * - Fetch the full user record from the database
 *
 * EXPORTS
 * -------
 * authenticate, optionalAuthenticate
 *
 * DEPENDS ON
 * ----------
 * shared/utils/jwt.js, shared/errors/http-errors.js
 */

import jwt                   from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/http-errors.js';
import asyncHandler          from '../utils/async-handler.js';

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7); // 'Bearer '.length === 7
};

/**
 * Mandatory authentication.
 * Rejects the request with 401 if no valid token is present.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw new UnauthorizedError('Authentication token required');

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Your session has expired. Please log in again.');
    }
    throw new UnauthorizedError('Invalid authentication token');
  }
});

/**
 * Optional authentication.
 * Attaches req.user if a valid token is present; passes through if not.
 */
export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = verifyAccessToken(token);
  } catch (_err) {
    // Invalid token on optional route — ignore and continue unauthenticated
  }
  next();
});

export default { authenticate, optionalAuthenticate };

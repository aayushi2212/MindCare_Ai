/**
 * PURPOSE
 * -------
 * Utility functions for signing and verifying JWTs.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Sign access tokens (short-lived)
 * - Sign refresh tokens (long-lived)
 * - Verify both token types
 *
 * NEVER
 * -----
 * - Store tokens anywhere
 * - Handle HTTP request/response
 *
 * EXPORTS
 * -------
 * signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken
 *
 * DEPENDS ON
 * ----------
 * jsonwebtoken, config/environment
 */

import jwt from 'jsonwebtoken';
import env from '../../config/environment/index.js';

/** @param {{ userId: string, email: string }} payload */
export const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    issuer:    'mindcare-ai',
    audience:  'mindcare-client',
  });

/** @param {{ userId: string, email: string }} payload */
export const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    issuer:    'mindcare-ai',
    audience:  'mindcare-client',
  });

/** @returns {object} decoded payload */
export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, {
    issuer:   'mindcare-ai',
    audience: 'mindcare-client',
  });

/** @returns {object} decoded payload */
export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer:   'mindcare-ai',
    audience: 'mindcare-client',
  });

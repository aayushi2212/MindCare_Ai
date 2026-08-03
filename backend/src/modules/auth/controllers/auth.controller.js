/**
 * PURPOSE
 * -------
 * Thin HTTP layer for all auth endpoints.
 * Receives requests, delegates to AuthService, returns responses.
 *
 * NEVER
 * -----
 * - Contain business logic (password comparison, token generation)
 * - Query the database directly
 *
 * EXPORTS
 * -------
 * register, login, refresh, logout, getMe
 *
 * DEPENDS ON
 * ----------
 * auth.service, shared/utils/async-handler, shared/response/response.helper
 */

import authService  from '../services/auth.service.js';
import asyncHandler from '../../../shared/utils/async-handler.js';
import { success, created, noContent } from '../../../shared/response/response.helper.js';

const getMeta = (req) => ({
  userAgent: req.headers['user-agent'] || null,
  ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
});

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, getMeta(req));
  created(res, {
    user:         result.user,
    accessToken:  result.accessToken,
    refreshToken: result.refreshToken,
  }, 'Account created successfully');
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, getMeta(req));
  success(res, {
    user:         result.user,
    accessToken:  result.accessToken,
    refreshToken: result.refreshToken,
  }, 200, 'Login successful');
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken: rawToken } = req.body;
  const result = await authService.refresh(rawToken, getMeta(req));
  success(res, {
    user:         result.user,
    accessToken:  result.accessToken,
    refreshToken: result.refreshToken,
  }, 200, 'Token refreshed successfully');
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(req.user.userId, refreshToken);
  noContent(res);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.userId);
  success(res, { user });
});

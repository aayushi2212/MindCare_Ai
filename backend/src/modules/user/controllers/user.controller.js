/**
 * PURPOSE
 * -------
 * Thin HTTP layer for user profile endpoints.
 *
 * EXPORTS
 * -------
 * getProfile, updateProfile
 *
 * DEPENDS ON
 * -------
 * UserService, shared/utils/async-handler, shared/response/response.helper
 */

import userService  from '../services/user.service.js';
import asyncHandler from '../../../shared/utils/async-handler.js';
import { success }  from '../../../shared/response/response.helper.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user.userId);
  success(res, { user }, 200, 'Profile retrieved successfully');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.update(req.user.userId, req.body);
  success(res, { user }, 200, 'Profile updated successfully');
});

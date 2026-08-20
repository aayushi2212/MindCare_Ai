/**
 * PURPOSE
 * -------
 * Business logic for user profile management.
 *
 * RESPONSIBILITIES
 * -------
 * - Fetch and update user records via UserRepository
 *
 * NEVER
 * -------
 * - Handle tokens
 * - Send HTTP responses
 *
 * EXPORTS
 * -------
 * userService.getById(id), userService.update(id, dto)
 *
 * DEPENDS ON
 * -------
 * UserRepository
 */

import userRepository from '../repositories/user.repository.js';
import logger from '../../../shared/logger/logger.js';

class UserService {
  async getById(id) {
    return userRepository.findById(id);
  }

  async update(id, dto) {
    // Only allow safe profile fields to be updated
    const allowed = {};
    if (dto.fullName !== undefined) allowed.fullName = String(dto.fullName).trim().slice(0, 100);
    if (dto.bio      !== undefined) allowed.bio      = String(dto.bio).trim().slice(0, 300);

    logger.info('User profile update', { userId: id, fields: Object.keys(allowed) });
    return userRepository.updateById(id, allowed);
  }
}

export default new UserService();

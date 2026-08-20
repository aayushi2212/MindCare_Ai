/**
 * PURPOSE
 * -------
 * MongoDB query layer for user profile operations.
 *
 * RESPONSIBILITIES
 * -------
 * - findById, updateById, softDeleteById
 *
 * NEVER
 * -------
 * - Contain business logic
 *
 * EXPORTS
 * -------
 * userRepository singleton
 *
 * DEPENDS ON
 * -------
 * User model (auth)
 */

import User from '../models/user.model.js';

class UserRepository {
  findById(id) {
    return User.findById(id);
  }

  updateById(id, updates) {
    return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }

  softDeleteById(id) {
    return User.findByIdAndUpdate(id, { accountStatus: 'deleted' }, { new: true });
  }
}

export default new UserRepository();

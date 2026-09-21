/**
 * PURPOSE
 * -------
 * Single authoritative implementation of the conversationId middleware.
 * Both the chat and context modules import from here — there must be
 * exactly one implementation so any future change applies everywhere.
 *
 * EXPORTS
 * -------
 * validateConversationId — Express middleware
 *
 * DEPENDS ON
 * ----------
 * shared/errors/http-errors
 */

import { ValidationError } from '../errors/http-errors.js';

/**
 * Validates that req.params.conversationId is a 24-character hex string
 * (MongoDB ObjectId format). Uses a direct regex test for ESM compatibility —
 * no require() needed.
 */
export const validateConversationId = (req, _res, next) => {
  const id = req.params.conversationId;
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return next(new ValidationError('Invalid conversation ID — must be a 24-character hex string'));
  }
  next();
};

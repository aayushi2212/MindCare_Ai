/**
 * PURPOSE
 * -------
 * Joi validation schemas for context request params and query strings.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate conversationId as a valid MongoDB ObjectId
 * - Validate and coerce query parameters (limit, boolean flags)
 * - Return 400 ValidationError with all failing fields at once
 * - Strip unknown query params
 *
 * NEVER
 * -----
 * - Perform business validation (ownership, existence)
 *   — that belongs in context.service.js
 *
 * EXPORTS
 * -------
 * validateConversationId, validateContextQuery
 *
 * DEPENDS ON
 * ----------
 * joi, shared/errors/http-errors.js, context.constants.js
 */

import Joi                  from 'joi';
import { ValidationError }  from '../../../shared/errors/http-errors.js';
import CONTEXT              from '../constants/context.constants.js';

// ── Schemas ───────────────────────────────────────────────────────

const contextQuerySchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(CONTEXT.MIN_CONTEXT_MESSAGES)
    .max(CONTEXT.MAX_CONTEXT_MESSAGES)
    .optional()
    .default(CONTEXT.DEFAULT_CONTEXT_MESSAGES)
    .messages({
      'number.min': `Limit must be at least ${CONTEXT.MIN_CONTEXT_MESSAGES}`,
      'number.max': `Limit cannot exceed ${CONTEXT.MAX_CONTEXT_MESSAGES}`,
    }),

  includeMetadata: Joi.boolean()
    .truthy('true', '1')
    .falsy('false', '0')
    .optional()
    .default(false),

  includeAssistantMessages: Joi.boolean()
    .truthy('true', '1')
    .falsy('false', '0')
    .optional()
    .default(true),

  includeUserMessages: Joi.boolean()
    .truthy('true', '1')
    .falsy('false', '0')
    .optional()
    .default(true),
});

// ── Middleware helpers ────────────────────────────────────────────

const validateQuery = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly:   false,
    stripUnknown: true,
    convert:      true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(new ValidationError(message));
  }

  req.query = value;
  next();
};

// ── Named exports ─────────────────────────────────────────────────

export const validateConversationId = (req, _res, next) => {
  const id = req.params.conversationId;
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return next(new ValidationError(
      'Invalid conversation ID — must be a 24-character hex string'
    ));
  }
  next();
};

export const validateContextQuery = validateQuery(contextQuerySchema);

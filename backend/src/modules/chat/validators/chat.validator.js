/**
 * PURPOSE
 * -------
 * Joi validation schemas for all chat request bodies and query parameters.
 * Runs as Express middleware before the request reaches the controller.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate and sanitise conversation creation, rename, and message payloads
 * - Validate pagination, sort, and filter query params
 * - Validate that conversationId is a valid MongoDB ObjectId
 * - Return 400 ValidationError with all failing fields at once
 * - Strip unknown fields from req.body to prevent injection
 *
 * NEVER
 * -----
 * - Perform business validation (ownership, existence checks)
 *   — that belongs in chat.service.js
 *
 * EXPORTS
 * -------
 * validateCreateConversation, validateSendMessage, validateSendAndProcess,
 * validateRenameConversation, validateListConversations, validatePaginationQuery,
 * validateConversationId
 *
 * DEPENDS ON
 * ----------
 * joi, shared/errors/http-errors.js, chat.constants.js
 */

import Joi                 from 'joi';
import { ValidationError } from '../../../shared/errors/http-errors.js';
import CHAT                from '../constants/chat.constants.js';

// ── Re-usable primitives ──────────────────────────────────────────

const objectIdSchema = Joi.string()
  .pattern(/^[a-f\d]{24}$/i)
  .messages({ 'string.pattern.base': 'Invalid ID format' });

// ── Body schemas ──────────────────────────────────────────────────

const createConversationSchema = Joi.object({
  title: Joi.string()
    .min(CHAT.TITLE_MIN_LENGTH)
    .max(CHAT.TITLE_MAX_LENGTH)
    .trim()
    .optional()
    .messages({
      'string.min': `Title must be at least ${CHAT.TITLE_MIN_LENGTH} character`,
      'string.max': `Title cannot exceed ${CHAT.TITLE_MAX_LENGTH} characters`,
    }),
});

const sendMessageSchema = Joi.object({
  sender: Joi.string()
    .valid(...Object.values(CHAT.SENDER))
    .required()
    .messages({
      'any.only':    `Sender must be one of: ${Object.values(CHAT.SENDER).join(', ')}`,
      'any.required': 'Sender is required',
    }),

  content: Joi.string()
    .min(CHAT.MESSAGE_MIN_LENGTH)
    .max(CHAT.MESSAGE_MAX_LENGTH)
    .trim()
    .required()
    .messages({
      'string.empty':  'Message content cannot be empty',
      'string.min':    'Message content cannot be empty',
      'string.max':    `Message cannot exceed ${CHAT.MESSAGE_MAX_LENGTH} characters`,
      'any.required':  'Message content is required',
    }),

  messageType: Joi.string()
    .valid(...Object.values(CHAT.MESSAGE_TYPE))
    .optional()
    .default(CHAT.MESSAGE_TYPE.TEXT),

  metadata: Joi.object().optional().default({}),
});

// ── /send pipeline schema ─────────────────────────────────────────
// The frontend POST /chat/:conversationId/send sends ONLY { content }.
// Do NOT reuse sendMessageSchema here — that requires { sender, content }
// which is the raw message-save contract, not the pipeline contract.
// This validator is the input gate for MessagePipelineService:
// it must fire BEFORE SafetyService ever receives the text.

const sendAndProcessSchema = Joi.object({
  content: Joi.string()
    .min(CHAT.MESSAGE_MIN_LENGTH)
    .max(CHAT.MESSAGE_MAX_LENGTH)
    .trim()
    .required()
    .messages({
      'string.base':   'Message content must be a string',
      'string.empty':  'Message content cannot be empty',
      'string.min':    'Message content cannot be empty',
      'string.max':    `Message cannot exceed ${CHAT.MESSAGE_MAX_LENGTH} characters`,
      'any.required':  'Message content is required',
    }),
});

const renameConversationSchema = Joi.object({
  title: Joi.string()
    .min(CHAT.TITLE_MIN_LENGTH)
    .max(CHAT.TITLE_MAX_LENGTH)
    .trim()
    .required()
    .messages({
      'string.empty':  'Title cannot be empty',
      'string.min':    `Title must be at least ${CHAT.TITLE_MIN_LENGTH} character`,
      'string.max':    `Title cannot exceed ${CHAT.TITLE_MAX_LENGTH} characters`,
      'any.required':  'Title is required',
    }),
});

// ── Query schemas ─────────────────────────────────────────────────

const listConversationsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(CHAT.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(CHAT.MAX_PAGE_SIZE).optional().default(CHAT.DEFAULT_PAGE_SIZE),
  sort: Joi.string().valid(...Object.values(CHAT.SORT)).optional().default(CHAT.SORT.NEWEST),
  archived: Joi.string().valid('true', 'false').optional(),
  search: Joi.string().max(200).trim().optional(),
});

const paginationQuerySchema = Joi.object({
  page:  Joi.number().integer().min(1).optional().default(CHAT.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(CHAT.MAX_PAGE_SIZE).optional().default(CHAT.DEFAULT_PAGE_SIZE),
  sort:  Joi.string().valid(...Object.values(CHAT.SORT)).optional().default(CHAT.SORT.OLDEST),
});

// ── Middleware factory ────────────────────────────────────────────

const validateBody = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:   false,
    stripUnknown: true,
    convert:      true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(new ValidationError(message));
  }

  req.body = value;
  next();
};

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

  // FIX: req.query is read-only in Node ≥ 20 + router package.
  req.validatedQuery = value;
  next();
};

// ── Param validator ───────────────────────────────────────────────
// Re-exported from shared — single authoritative implementation shared
// across all modules. Do not redefine locally.
export { validateConversationId } from '../../../shared/validators/conversation-id.validator.js';

// ── Named exports ─────────────────────────────────────────────────

export const validateCreateConversation  = validateBody(createConversationSchema);
export const validateSendMessage         = validateBody(sendMessageSchema);
export const validateSendAndProcess      = validateBody(sendAndProcessSchema);
export const validateRenameConversation  = validateBody(renameConversationSchema);
export const validateListConversations   = validateQuery(listConversationsSchema);
export const validatePaginationQuery     = validateQuery(paginationQuerySchema);

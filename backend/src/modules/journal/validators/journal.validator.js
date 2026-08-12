/**
 * PURPOSE
 * -------
 * Joi validation schemas for all Journal request bodies and query parameters.
 * Runs as Express middleware before the request reaches the controller.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate emotion, reflection, notes on create/update
 * - Validate pagination query params
 * - Validate MongoDB ObjectId params
 * - Return 400 ValidationError for invalid input
 * - Strip unknown fields from req.body
 *
 * NEVER
 * -----
 * - Perform business validation (ownership, existence) — that belongs in the service
 *
 * EXPORTS
 * -------
 * validateCreateEntry, validateUpdateEntry, validateListQuery, validateEntryId
 *
 * DEPENDS ON
 * ----------
 * joi, shared/errors/http-errors, journal.constants
 */

import Joi                 from 'joi';
import { ValidationError } from '../../../shared/errors/http-errors.js';
import JOURNAL             from '../constants/journal.constants.js';

// ── Reusable primitives ───────────────────────────────────────────

const objectIdPattern = /^[a-f\d]{24}$/i;

const emotionSchema = Joi.string()
  .valid(...JOURNAL.EMOTIONS)
  .messages({
    'any.only':    `Emotion must be one of: ${JOURNAL.EMOTIONS.join(', ')}`,
    'any.required': 'Emotion is required',
  });

const reflectionSchema = Joi.string()
  .trim()
  .min(1)
  .max(JOURNAL.REFLECTION_MAX_LENGTH)
  .messages({
    'string.empty': 'Reflection cannot be empty',
    'string.min':   'Reflection cannot be empty',
    'string.max':   `Reflection cannot exceed ${JOURNAL.REFLECTION_MAX_LENGTH} characters`,
    'any.required': 'Reflection is required',
  });

const notesSchema = Joi.string()
  .trim()
  .max(JOURNAL.NOTES_MAX_LENGTH)
  .allow('')
  .optional()
  .messages({
    'string.max': `Notes cannot exceed ${JOURNAL.NOTES_MAX_LENGTH} characters`,
  });

// ── Body schemas ──────────────────────────────────────────────────

const createEntrySchema = Joi.object({
  emotion:    emotionSchema.required(),
  reflection: reflectionSchema.required(),
  notes:      notesSchema,
});

const updateEntrySchema = Joi.object({
  emotion:    emotionSchema.optional(),
  reflection: reflectionSchema.optional(),
  notes:      notesSchema,
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// ── Query schema ─────────────────────────────────────────────────

const listQuerySchema = Joi.object({
  page:  Joi.number().integer().min(1).optional().default(JOURNAL.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(JOURNAL.MAX_PAGE_SIZE).optional().default(JOURNAL.DEFAULT_PAGE_SIZE),
});

// ── Middleware factories ──────────────────────────────────────────

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

  req.query = value;
  next();
};

// ── Named exports ─────────────────────────────────────────────────

export const validateCreateEntry = validateBody(createEntrySchema);
export const validateUpdateEntry  = validateBody(updateEntrySchema);
export const validateListQuery    = validateQuery(listQuerySchema);

export const validateEntryId = (req, _res, next) => {
  const id = req.params.id;
  if (!id || !objectIdPattern.test(id)) {
    return next(new ValidationError('Invalid entry ID — must be a 24-character hex string'));
  }
  next();
};

/**
 * PURPOSE
 * -------
 * Joi validation schemas for all emotion request bodies.
 * Runs as Express middleware before the request reaches the controller.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate and sanitise the analyze request body
 * - Return 400 ValidationError with all failing fields at once
 * - Strip unknown fields from req.body
 *
 * NEVER
 * -----
 * - Perform business validation (supported labels, confidence ranges)
 *   — that belongs in emotion.service.js
 *
 * EXPORTS
 * -------
 * validateAnalyze — Express middleware
 *
 * DEPENDS ON
 * ----------
 * joi, shared/errors/http-errors.js, emotion.constants.js
 */

import Joi                 from 'joi';
import { ValidationError } from '../../../shared/errors/http-errors.js';
import EMOTION             from '../constants/emotion.constants.js';

// ── Schemas ───────────────────────────────────────────────────────

const analyzeSchema = Joi.object({
  text: Joi.string()
    .min(EMOTION.TEXT_MIN_LENGTH)
    .max(EMOTION.TEXT_MAX_LENGTH)
    .trim()
    .required()
    .messages({
      'string.empty':   'Text cannot be empty',
      'string.min':     'Text cannot be empty',
      'string.max':     `Text cannot exceed ${EMOTION.TEXT_MAX_LENGTH} characters`,
      'any.required':   'Text is required',
    }),
});

// ── Middleware factory ────────────────────────────────────────────

const validate = (schema) => (req, _res, next) => {
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

export const validateAnalyze = validate(analyzeSchema);

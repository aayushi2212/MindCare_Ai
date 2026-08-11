/**
 * PURPOSE
 * -------
 * Joi validation schemas for all response-engine request bodies.
 * Runs as Express middleware before the request reaches the controller.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate and sanitise the generate request body
 * - Return 400 ValidationError with all failing fields at once
 * - Strip unknown fields from req.body
 *
 * NEVER
 * -----
 * - Perform strategy selection or response generation
 * - Import from other feature modules
 *
 * EXPORTS
 * -------
 * validateGenerate — Express middleware
 *
 * DEPENDS ON
 * ----------
 * joi, shared/errors/http-errors.js, response.constants.js
 */

import Joi                 from 'joi';
import { ValidationError } from '../../../shared/errors/http-errors.js';
import RESPONSE            from '../constants/response.constants.js';
import EMOTION_LABELS      from './supported-emotions.js';

// ── Schemas ───────────────────────────────────────────────────────

const emotionSchema = Joi.object({
  label: Joi.string()
    .valid(...EMOTION_LABELS)
    .required()
    .messages({
      'any.only':    `Emotion label must be one of: ${EMOTION_LABELS.join(', ')}`,
      'any.required': 'Emotion label is required',
    }),

  confidence: Joi.number()
    .min(0)
    .max(1)
    .required()
    .messages({
      'number.min':   'Confidence must be at least 0',
      'number.max':   'Confidence must be at most 1',
      'any.required': 'Emotion confidence is required',
    }),

  secondaryEmotion: Joi.string()
    .valid(...EMOTION_LABELS)
    .optional()
    .allow(null),
});

const recentMessageSchema = Joi.object({
  role:    Joi.string().valid('user', 'assistant').required(),
  content: Joi.string().min(1).required(),
}).unknown(true); // allow createdAt and other meta fields

const contextSchema = Joi.object({
  recentMessages: Joi.array().items(recentMessageSchema).default([]),
  messageCount:   Joi.number().integer().min(0).optional(),
  lastInteraction: Joi.alternatives()
    .try(Joi.date(), Joi.string().isoDate())
    .optional()
    .allow(null),
}).default({ recentMessages: [] });

const safetySchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(RESPONSE.SAFETY_STATUS))
    .default(RESPONSE.SAFETY_STATUS.NOT_EVALUATED),
}).default({ status: RESPONSE.SAFETY_STATUS.NOT_EVALUATED });

const generateSchema = Joi.object({
  userMessage: Joi.string()
    .min(RESPONSE.USER_MESSAGE_MIN_LENGTH)
    .max(RESPONSE.USER_MESSAGE_MAX_LENGTH)
    .trim()
    .required()
    .messages({
      'string.empty':   'User message cannot be empty',
      'string.min':     'User message cannot be empty',
      'string.max':     `User message cannot exceed ${RESPONSE.USER_MESSAGE_MAX_LENGTH} characters`,
      'any.required':   'User message is required',
    }),

  emotion:  emotionSchema.required().messages({ 'any.required': 'Emotion object is required' }),
  context:  contextSchema,
  safety:   safetySchema,
});

// ── Middleware factory ────────────────────────────────────────────

const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:   false,
    stripUnknown: false,
    convert:      true,
    allowUnknown: false,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(new ValidationError(message));
  }

  req.body = value;
  next();
};

export const validateGenerate = validate(generateSchema);

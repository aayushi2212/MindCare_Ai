/**
 * PURPOSE
 * -------
 * Joi validation schemas for all auth request bodies.
 * Runs as Express middleware before the request reaches the controller.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate and sanitise register, login, and refresh payloads
 * - Return 400 ValidationError with all failing fields at once
 * - Strip unknown fields from req.body to prevent injection
 *
 * NEVER
 * -----
 * - Perform business validation (e.g. "does this email already exist")
 *   — that belongs in auth.service.js
 *
 * EXPORTS
 * -------
 * validateRegister, validateLogin, validateRefresh — Express middleware
 *
 * DEPENDS ON
 * ----------
 * joi, shared/errors/http-errors.js, auth.constants.js
 */

import Joi                  from 'joi';
import { ValidationError }  from '../../../shared/errors/http-errors.js';
import AUTH                 from '../constants/auth.constants.js';

// ── Schemas ───────────────────────────────────────────────────────

const registerSchema = Joi.object({
  fullName: Joi.string()
    .min(AUTH.FULL_NAME_MIN_LENGTH)
    .max(AUTH.FULL_NAME_MAX_LENGTH)
    .trim()
    .required()
    .messages({
      'string.min':  `Full name must be at least ${AUTH.FULL_NAME_MIN_LENGTH} characters`,
      'string.max':  `Full name cannot exceed ${AUTH.FULL_NAME_MAX_LENGTH} characters`,
      'any.required': 'Full name is required',
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email':  'Please provide a valid email address',
      'any.required':  'Email is required',
    }),

  password: Joi.string()
    .min(AUTH.PASSWORD_MIN_LENGTH)
    .max(AUTH.PASSWORD_MAX_LENGTH)
    .required()
    .messages({
      'string.min':   `Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`,
      'string.max':   `Password cannot exceed ${AUTH.PASSWORD_MAX_LENGTH} characters`,
      'any.required': 'Password is required',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email':  'Please provide a valid email address',
      'any.required':  'Email is required',
    }),

  password: Joi.string()
    .required()
    .messages({ 'any.required': 'Password is required' }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({ 'any.required': 'Refresh token is required' }),
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

export const validateRegister = validate(registerSchema);
export const validateLogin    = validate(loginSchema);
export const validateRefresh  = validate(refreshSchema);

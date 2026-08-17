/**
 * PURPOSE
 * -------
 * Joi validation middleware for analytics query parameters.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate date ranges, pagination, and period identifiers.
 * - Return 400 ValidationError for invalid input.
 * - Strip unknown query params.
 *
 * NEVER
 * -----
 * - Perform business validation (userId, existence checks).
 * - Assign to req.query directly (read-only getter in Node ≥ 20 + router pkg).
 *   Use req.validatedQuery instead.
 *
 * EXPORTS
 * -------
 * validateDateRangeQuery, validatePaginationQuery
 *
 * DEPENDS ON
 * ----------
 * joi, shared/errors/http-errors, analytics.constants
 */

import Joi                 from 'joi';
import { ValidationError } from '../../../shared/errors/http-errors.js';
import ANALYTICS           from '../constants/analytics.constants.js';

// ── Reusable schemas ──────────────────────────────────────────────

const isoDateSchema = Joi.string()
  .isoDate()
  .messages({ 'string.isoDate': '{{#label}} must be a valid ISO 8601 date (e.g. 2026-08-01)' });

const dateRangeSchema = Joi.object({
  startDate: isoDateSchema.optional(),
  endDate:   isoDateSchema.optional(),
})
  .and('startDate', 'endDate')
  .custom((value, helpers) => {
    if (value.startDate && value.endDate) {
      const start = new Date(value.startDate);
      const end   = new Date(value.endDate);
      if (start > end) return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({ 'any.invalid': 'startDate must be before or equal to endDate' });

const paginationSchema = Joi.object({
  page:  Joi.number().integer().min(1).optional().default(ANALYTICS.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(ANALYTICS.MAX_PAGE_SIZE).optional().default(ANALYTICS.DEFAULT_PAGE_SIZE),
});

const dateRangeWithPaginationSchema = dateRangeSchema.concat(paginationSchema);

// ── Middleware factory ────────────────────────────────────────────
// FIX: req.query is a read-only getter in Node ≥ 20 when using the 'router'
// package (as opposed to express directly). Write validated values to
// req.validatedQuery so controllers/services always use that.

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

  // Coerce ISO date strings to Date objects for the service layer
  if (value.startDate) value.startDate = new Date(value.startDate);
  if (value.endDate) {
    const d = new Date(value.endDate);
    d.setUTCHours(23, 59, 59, 999);
    value.endDate = d;
  }

  // Write to req.validatedQuery — do NOT assign to req.query (read-only)
  req.validatedQuery = value;
  next();
};

// ── Named exports ─────────────────────────────────────────────────

export const validateDateRangeQuery                 = validateQuery(dateRangeSchema);
export const validatePaginationQuery                = validateQuery(paginationSchema);
export const validateDateRangeWithPaginationQuery   = validateQuery(dateRangeWithPaginationSchema);

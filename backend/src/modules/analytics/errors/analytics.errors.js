/**
 * PURPOSE
 * -------
 * Domain-specific error classes for the Analytics module.
 *
 * DEPENDS ON
 * ----------
 * shared/errors/http-errors.js
 */

import { ValidationError } from '../../../shared/errors/http-errors.js';

export class AnalyticsValidationError extends ValidationError {
  constructor(message = 'Invalid analytics query parameters') {
    super(message);
  }
}

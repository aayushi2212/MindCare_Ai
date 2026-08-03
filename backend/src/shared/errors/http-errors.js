/**
 * PURPOSE
 * -------
 * Convenience subclasses of AppError for common HTTP error statuses.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Provide named error classes: NotFoundError, ValidationError,
 *   UnauthorizedError, ForbiddenError, ConflictError
 *
 * NEVER
 * -----
 * - Handle or log errors
 *
 * EXPORTS
 * -------
 * Named error classes
 *
 * DEPENDS ON
 * ----------
 * shared/errors/app-error.js
 */

import { AppError } from './app-error.js';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, false);
  }
}

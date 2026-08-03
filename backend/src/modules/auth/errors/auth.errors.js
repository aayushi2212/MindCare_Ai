/**
 * PURPOSE
 * -------
 * Auth-module-specific error subclasses.
 *
 * NEVER
 * -----
 * - Be imported from outside the auth module
 *   (use shared/errors/http-errors.js for generic errors in other modules)
 *
 * DEPENDS ON
 * ----------
 * shared/errors/http-errors.js
 */

import { UnauthorizedError, ConflictError } from '../../../shared/errors/http-errors.js';

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountSuspendedError extends UnauthorizedError {
  constructor() {
    super('Your account has been suspended. Please contact support.');
    this.name = 'AccountSuspendedError';
  }
}

export class AccountDeletedError extends UnauthorizedError {
  constructor() {
    super('This account no longer exists.');
    this.name = 'AccountDeletedError';
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Your session has expired. Please log in again.');
    this.name = 'TokenExpiredError';
  }
}

export class TokenInvalidError extends UnauthorizedError {
  constructor() {
    super('Invalid token. Please log in again.');
    this.name = 'TokenInvalidError';
  }
}

export class EmailAlreadyRegisteredError extends ConflictError {
  constructor() {
    super('An account with this email already exists.');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

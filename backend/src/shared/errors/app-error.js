/**
 * PURPOSE
 * -------
 * Base custom error class for all application errors.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Extend native Error with statusCode and isOperational flag
 * - isOperational = true means a known, expected error (not a bug)
 *
 * NEVER
 * -----
 * - Handle or log errors (that belongs in error.middleware.js)
 *
 * EXPORTS
 * -------
 * AppError
 *
 * DEPENDS ON
 * ----------
 * none
 */

export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = isOperational;
    this.name          = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;

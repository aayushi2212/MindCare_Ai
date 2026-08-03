/**
 * PURPOSE
 * -------
 * Global Express error handler. Must be the last middleware registered in app.js.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Catch all errors forwarded via next(err)
 * - Map AppError subclasses to the correct HTTP status code
 * - Return a standardised { success, message, ...(stack in dev) } response
 * - Log unexpected (non-operational) errors
 *
 * NEVER
 * -----
 * - Throw errors
 * - Contain route or business logic
 *
 * EXPORTS
 * -------
 * errorHandler — Express error middleware (4 arguments)
 *
 * DEPENDS ON
 * ----------
 * shared/logger, shared/errors/app-error
 */

import { AppError } from '../errors/app-error.js';
import logger       from '../logger/logger.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Operational errors — expected, safe to expose message
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational AppError', { message: err.message, stack: err.stack });
    }

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join('; ');
    return res.status(400).json({ success: false, message: messages });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Unknown / programming errors — do not leak details
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;

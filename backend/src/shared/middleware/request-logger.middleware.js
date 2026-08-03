/**
 * PURPOSE
 * -------
 * Logs every incoming HTTP request with method, path, status, and duration.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Log request start (method + path)
 * - Log request completion (status + duration in ms)
 * - Attach a short request ID for distributed tracing
 *
 * NEVER
 * -----
 * - Log req.body (may contain passwords or tokens)
 * - Log Authorization headers
 *
 * EXPORTS
 * -------
 * requestLogger — Express middleware
 *
 * DEPENDS ON
 * ----------
 * shared/logger
 */

import logger from '../logger/logger.js';

const requestLogger = (req, res, next) => {
  const start     = Date.now();
  const requestId = Math.random().toString(36).slice(2, 9);

  req.requestId = requestId;

  logger.debug(`→ ${req.method} ${req.originalUrl}`, { requestId });

  res.on('finish', () => {
    const ms     = Date.now() - start;
    const level  = res.statusCode >= 500 ? 'error'
                 : res.statusCode >= 400 ? 'warn'
                 : 'info';

    logger[level](`← ${req.method} ${req.originalUrl} ${res.statusCode} (${ms}ms)`, {
      requestId,
      statusCode: res.statusCode,
      duration:   ms,
    });
  });

  next();
};

export default requestLogger;

/**
 * PURPOSE
 * -------
 * Entry point. Boots the application by loading environment,
 * connecting to the database, and starting the HTTP server.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Load environment variables (via config/environment)
 * - Connect to MongoDB (via config/database)
 * - Start the Express HTTP server (via app.js)
 * - Handle fatal process signals and unhandled errors
 *
 * NEVER
 * -----
 * - Contain route definitions
 * - Contain middleware registration
 * - Contain business logic
 *
 * DEPENDS ON
 * ----------
 * app.js, config/environment, config/database, shared/logger
 */

import env        from './config/environment/index.js';
import connectDB  from './config/database/index.js';
import logger     from './shared/logger/logger.js';
import app        from './app.js';

// ── Boot ──────────────────────────────────────────────────────────

const start = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`MindCare AI API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`API Docs: http://localhost:${env.PORT}/api/docs`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────

  const shutdown = (signal) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // ── Fatal error handlers ───────────────────────────────────────

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception — shutting down', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection — shutting down', { reason });
    server.close(() => process.exit(1));
  });
};

start().catch((err) => {
  // connectDB threw before app.listen — log and exit immediately
  console.error('Fatal startup error:', err.message);
  process.exit(1);
});

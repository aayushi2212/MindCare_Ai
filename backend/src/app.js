/**
 * PURPOSE
 * -------
 * Configures and assembles the Express application instance.
 * This file is the composition root for all middleware and routes.
 *
 * RESPONSIBILITIES
 * -------
 * - Register global middleware (CORS, body parser, request logger)
 * - Mount all module routers under their respective prefixes
 * - Register the global error handler (must be last middleware)
 *
 * NEVER
 * -------
 * - Start the HTTP server (that belongs in server.js)
 * - Connect to the database (that belongs in config/database.js)
 * - Contain business logic
 *
 * EXPORTS
 * -------
 * app — Express application instance
 *
 * DEPENDS ON
 * -------
 * express, config/cors.js, shared/middleware, all module routers
 */

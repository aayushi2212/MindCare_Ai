/**
 * PURPOSE
 * -------
 * Builds and exports the CORS options object for the Express app.
 *
 * RESPONSIBILITIES
 * -------
 * - Define allowed origins per environment
 * - Set allowed headers and methods
 *
 * NEVER
 * -------
 * - Apply CORS middleware directly (that belongs in app.js)
 *
 * EXPORTS
 * -------
 * corsOptions — object passed to the cors() middleware
 *
 * DEPENDS ON
 * -------
 * config/environment.js
 */

/**
 * PURPOSE
 * -------
 * Builds and exports the CORS options object for the Express app.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Define allowed origins per environment
 * - Set allowed headers and HTTP methods
 * - Support credentials (cookies / Authorization header)
 *
 * NEVER
 * -----
 * - Apply CORS middleware directly (that belongs in app.js)
 *
 * EXPORTS
 * -------
 * corsOptions — object passed to cors() middleware in app.js
 *
 * DEPENDS ON
 * ----------
 * config/environment
 */

import env from '../environment/index.js';

const ALLOWED_ORIGINS = env.isDev
  ? [
      'http://localhost:5173',  // Vite dev server
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      env.CLIENT_URL,
    ]
  : [env.CLIENT_URL];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, curl)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  credentials:     true,
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization'],
  exposedHeaders:  ['X-Request-Id'],
  maxAge:          600,  // seconds the preflight can be cached
};

export default corsOptions;

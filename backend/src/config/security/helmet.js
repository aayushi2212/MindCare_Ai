/**
 * PURPOSE
 * -------
 * Exports the Helmet configuration object for HTTP security headers.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Configure Content Security Policy per environment
 * - Export helmetOptions for use in app.js
 *
 * NEVER
 * -----
 * - Apply helmet directly (that belongs in app.js)
 *
 * EXPORTS
 * -------
 * helmetOptions — object passed to helmet() in app.js
 *
 * DEPENDS ON
 * ----------
 * config/environment
 */

import env from '../environment/index.js';

const helmetOptions = {
  contentSecurityPolicy: env.isProd
    ? undefined  // use helmet defaults in production
    : false,     // disable CSP in development for easier debugging
  crossOriginEmbedderPolicy: false,
};

export default helmetOptions;

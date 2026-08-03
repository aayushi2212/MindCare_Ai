/**
 * PURPOSE
 * -------
 * Public entry point for the auth module.
 * Only the router is exported — all internal services, repositories,
 * and models are private to this module.
 *
 * Other modules that need to verify authentication use:
 *   shared/middleware/auth.middleware.js  ← route protection
 *   shared/utils/jwt.js                  ← token utilities (if needed)
 *
 * NEVER
 * -----
 * - Import auth.service or auth.repository from outside this module
 *
 * DEPENDS ON
 * ----------
 * auth/routes/auth.routes.js
 */

export { default } from './routes/auth.routes.js';

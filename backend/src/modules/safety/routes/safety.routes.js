/**
 * PURPOSE
 * -------
 * HTTP route definitions for the Safety module.
 *
 * ROUTES
 * ------
 * GET /safety/audit — returns the authenticated user's own audit events
 *
 * All routes require authentication.
 * Safety detection itself is NOT exposed as a public endpoint —
 * it runs internally as part of the chat pipeline.
 *
 * NEVER
 * -----
 * - Expose detection patterns
 * - Allow unauthenticated access
 * - Return other users' data
 *
 * DEPENDS ON
 * ----------
 * safety.controller, shared/middleware/auth.middleware
 */

import { Router }      from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import { getMyAuditEvents } from '../controllers/safety.controller.js';

const router = Router();

// All safety HTTP endpoints require a valid JWT
router.use(authenticate);

/**
 * GET /safety/audit
 * Returns the authenticated user's own crisis audit records.
 * Ownership is enforced — the userId comes from the JWT, not query params.
 */
router.get('/audit', getMyAuditEvents);

export default router;

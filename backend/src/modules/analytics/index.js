/**
 * PURPOSE
 * -------
 * Public entry point for the Analytics module (Module 7).
 *
 * IMPORTANT: The existing analytics/index.js registers event-bus listeners
 * as a side-effect module (imported in app.js with no exports). Module 7
 * replaces that file entirely: the event-bus listeners are preserved below,
 * and the router is now exported so app.js can mount it.
 *
 * EXPORTS
 * -------
 * analyticsRouter — Express router mounted at /api/v1/analytics
 *
 * SIDE EFFECTS
 * ------------
 * Registers analytics event-bus listeners (user.registered, user.loggedIn)
 * exactly as the original index.js did.
 *
 * NEVER
 * -----
 * Export internal implementation details (repositories, models directly).
 */

import eventBus from '../../shared/events/event-bus.js';
import logger   from '../../shared/logger/logger.js';

// ── Preserve existing event-bus side effects ──────────────────────
eventBus.on('user.registered', ({ userId }) => {
  logger.debug('Analytics: user.registered', { userId });
});

eventBus.on('user.loggedIn', ({ userId }) => {
  logger.debug('Analytics: user.loggedIn', { userId });
});

// ── Export the HTTP router ────────────────────────────────────────
export { default } from './routes/analytics.routes.js';

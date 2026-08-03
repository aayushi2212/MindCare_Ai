/**
 * PURPOSE
 * -------
 * Boot-time side-effect module for the analytics listeners.
 * Imported once in app.js for its side effects only — no exports.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Subscribe to application events (user.registered, user.loggedIn, etc.)
 * - Delegate analytics work to analytics.service
 *
 * NEVER
 * -----
 * - Export anything (this module exists only for side effects)
 * - Perform analytics logic inline (delegate to analytics.service)
 *
 * DEPENDS ON
 * ----------
 * shared/events/event-bus, modules/analytics/services/analytics.service
 */

import eventBus from '../../shared/events/event-bus.js';
import logger   from '../../shared/logger/logger.js';

// Listen for events — analytics work happens here or in analytics.service
eventBus.on('user.registered', ({ userId }) => {
  logger.debug('Analytics: user.registered', { userId });
});

eventBus.on('user.loggedIn', ({ userId }) => {
  logger.debug('Analytics: user.loggedIn', { userId });
});

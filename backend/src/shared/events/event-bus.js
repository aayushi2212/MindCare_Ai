/**
 * PURPOSE
 * -------
 * Simple in-process event emitter for decoupled inter-module communication.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Emit and subscribe to application events
 * - Keep modules loosely coupled (e.g. auth emits user.registered,
 *   analytics listens without auth knowing about it)
 *
 * NEVER
 * -----
 * - Replace a real message queue (RabbitMQ/Kafka) in production at scale
 * - Be used for request/response patterns
 *
 * EXPORTS
 * -------
 * eventBus — EventEmitter instance
 *
 * DEPENDS ON
 * ----------
 * events (Node built-in)
 */

import { EventEmitter } from 'events';

const eventBus = new EventEmitter();

// Increase listener limit for larger apps
eventBus.setMaxListeners(50);

export default eventBus;

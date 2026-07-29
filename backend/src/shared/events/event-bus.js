/**
 * PURPOSE
 * -------
 * Simple in-process event emitter for decoupled inter-module communication.
 *
 * RESPONSIBILITIES
 * -------
 * - Emit and subscribe to application events (e.g. message.processed, emotion.detected)
 * - Keep modules loosely coupled
 *
 * NEVER
 * -------
 * - Replace a real message queue in production at scale
 * - Handle async queuing
 *
 * EXPORTS
 * -------
 * eventBus — EventEmitter instance, emit(event, payload), on(event, handler)
 *
 * DEPENDS ON
 * -------
 * events (Node built-in)
 */

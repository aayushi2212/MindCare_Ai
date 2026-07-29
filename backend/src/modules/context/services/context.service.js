/**
 * PURPOSE
 * -------
 * Builds, stores, and retrieves long-term contextual memory for a user.
 *
 * RESPONSIBILITIES
 * -------
 * - Persist important facts extracted from conversations
 * - Retrieve relevant context on demand
 *
 * NEVER
 * -------
 * - Perform AI inference
 * - Manage session-level context (that is context-manager.service.js)
 *
 * EXPORTS
 * -------
 * saveContext(userId, facts[]), getRelevantContext(userId, topic)
 *
 * DEPENDS ON
 * -------
 * ContextRepository
 */

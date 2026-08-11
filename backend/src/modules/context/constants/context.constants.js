/**
 * PURPOSE
 * -------
 * Context-module-scoped constants. Centralises all magic values
 * used across services, repositories, validators, and routes.
 *
 * NEVER
 * -----
 * - Be imported from outside the context module
 * - Contain any logic
 *
 * EXPORTS
 * -------
 * CONTEXT — frozen constants object
 *
 * DEPENDS ON
 * ----------
 * none
 */

const CONTEXT = Object.freeze({

  // ── Context window limits ──────────────────────────────────────
  DEFAULT_CONTEXT_MESSAGES: 10,
  MAX_CONTEXT_MESSAGES:     20,
  MIN_CONTEXT_MESSAGES:     1,

  // ── Character budget for total context content ─────────────────
  MAX_CONTEXT_CHARACTERS: 12000,

  // ── Repository fetch ceiling ───────────────────────────────────
  REPOSITORY_FETCH_MULTIPLIER: 3,

  // ── Repeated emotion pattern threshold ────────────────────────
  // An emotion must appear this many times to be considered "repeated".
  REPEATED_EMOTION_MIN_COUNT: 2,

  // ── Sort order ────────────────────────────────────────────────
  SORT: Object.freeze({
    OLDEST_FIRST: 'oldest',
    NEWEST_FIRST: 'newest',
  }),

  // ── Role labels (LLM-convention; used by Module 5) ────────────
  ROLE: Object.freeze({
    USER:      'user',
    ASSISTANT: 'assistant',
    SYSTEM:    'system',
  }),

  // ── Maps Message.sender → context role ────────────────────────
  SENDER_TO_ROLE: Object.freeze({
    user: 'user',
    ai:   'assistant',
  }),

  // ── Conversation statuses that are valid for context retrieval ─
  ALLOWED_STATUSES: Object.freeze(['active']),
});

export default CONTEXT;

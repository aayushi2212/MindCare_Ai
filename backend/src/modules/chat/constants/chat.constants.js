/**
 * PURPOSE
 * -------
 * Chat-module-scoped constants. Centralises all magic values used
 * across chat services, validators, models, and middleware.
 *
 * NEVER
 * -----
 * - Be imported from outside the chat module
 *   (use shared/constants for cross-module values)
 *
 * EXPORTS
 * -------
 * CHAT — frozen constants object
 *
 * DEPENDS ON
 * ----------
 * none
 */

const CHAT = Object.freeze({
  // ── Title constraints ──────────────────────────────────────────
  TITLE_MIN_LENGTH:       1,
  TITLE_MAX_LENGTH:       100,
  DEFAULT_TITLE_PREFIX:   'Conversation',

  // ── Message constraints ────────────────────────────────────────
  MESSAGE_MIN_LENGTH:     1,
  MESSAGE_MAX_LENGTH:     5000,

  // ── Pagination defaults ────────────────────────────────────────
  DEFAULT_PAGE:           1,
  DEFAULT_PAGE_SIZE:      20,
  MAX_PAGE_SIZE:          100,

  // ── Conversation status ────────────────────────────────────────
  STATUS: Object.freeze({
    ACTIVE:   'active',
    ARCHIVED: 'archived',
    DELETED:  'deleted',
  }),

  // ── Message sender types ───────────────────────────────────────
  SENDER: Object.freeze({
    USER: 'user',
    AI:   'ai',
  }),

  // ── Message types ──────────────────────────────────────────────
  MESSAGE_TYPE: Object.freeze({
    TEXT:  'text',
    MEDIA: 'media',
  }),

  // ── Sort options ───────────────────────────────────────────────
  SORT: Object.freeze({
    NEWEST: 'newest',
    OLDEST: 'oldest',
  }),
});

export default CHAT;

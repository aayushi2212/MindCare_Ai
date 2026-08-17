/**
 * PURPOSE
 * -------
 * Shared constants for the Analytics module.
 *
 * NEVER
 * -----
 * - Duplicate constants already defined in other modules.
 *   Journal emotions are kept local here so analytics has no
 *   runtime dependency on the journal module's internals.
 */

const ANALYTICS = Object.freeze({
  // ── Pagination ────────────────────────────────────────────────
  DEFAULT_PAGE:      1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE:     100,

  // ── Trend query limit ────────────────────────────────────────
  MAX_TREND_POINTS: 90, // last 90 days maximum for mood trend

  // ── Supported period identifiers ────────────────────────────
  PERIOD: Object.freeze({
    WEEKLY:  'weekly',
    MONTHLY: 'monthly',
  }),

  // ── V1 emotion vocabulary (mirrors journal.constants) ─────────
  EMOTIONS: Object.freeze([
    'happy',
    'sad',
    'angry',
    'fear',
    'anxiety',
    'neutral',
    'surprise',
  ]),
});

export default ANALYTICS;

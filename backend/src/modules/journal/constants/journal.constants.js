/**
 * PURPOSE
 * -------
 * Shared constants for the Journal module.
 *
 * NEVER
 * -----
 * - Import from other modules (keep this module self-contained)
 */

const JOURNAL = Object.freeze({
  // ── Valid emotion values (V1 vocabulary, matches Module 3) ────────
  EMOTIONS: Object.freeze([
    'happy',
    'sad',
    'angry',
    'fear',
    'anxiety',
    'neutral',
    'surprise',
  ]),

  // ── Field length limits ───────────────────────────────────────────
  REFLECTION_MAX_LENGTH: 2000,
  NOTES_MAX_LENGTH:      1000,

  // ── Pagination defaults ───────────────────────────────────────────
  DEFAULT_PAGE:      1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE:     100,
});

export default JOURNAL;

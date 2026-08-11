/**
 * PURPOSE
 * -------
 * Response-module-scoped constants. Centralises all magic values used
 * across services, strategies, validators, and error classes.
 *
 * NEVER
 * -----
 * - Be imported from outside the response module
 *   (use shared/constants for cross-module values)
 *
 * EXPORTS
 * -------
 * RESPONSE — frozen constants object
 *
 * DEPENDS ON
 * ----------
 * none
 */

const RESPONSE = Object.freeze({

  // ── Confidence threshold ───────────────────────────────────────
  // Below this value the emotion is considered uncertain and the
  // strategy falls back to NEUTRAL_SUPPORT.
  HIGH_CONFIDENCE_THRESHOLD: 0.5,

  // ── Response length constraints ────────────────────────────────
  MIN_RESPONSE_LENGTH: 20,
  MAX_RESPONSE_LENGTH: 1000,

  // ── Input constraints ──────────────────────────────────────────
  USER_MESSAGE_MIN_LENGTH: 1,
  USER_MESSAGE_MAX_LENGTH: 2000,

  // ── Safety statuses ───────────────────────────────────────────
  SAFETY_STATUS: Object.freeze({
    NOT_EVALUATED: 'not_evaluated',
    SAFE:          'safe',
    HIGH_RISK:     'high_risk',
    MEDIUM_RISK:   'medium_risk',
  }),

  // ── Response strategies ────────────────────────────────────────
  STRATEGY: Object.freeze({
    EMPATHETIC_SUPPORT:  'empathetic_support',   // sad
    CALMING_SUPPORT:     'calming_support',       // anxiety / fear
    DE_ESCALATION:       'de_escalation',         // angry
    POSITIVE_ENGAGEMENT: 'positive_engagement',   // happy
    CURIOUS_ENGAGEMENT:  'curious_engagement',    // surprise
    NEUTRAL_SUPPORT:     'neutral_support',       // neutral or low-confidence
    SAFETY_BYPASS:       'safety_bypass',         // high_risk — no normal response
  }),

  // ── Emotion-to-strategy map (V1 blueprint labels) ─────────────
  EMOTION_STRATEGY_MAP: Object.freeze({
    sad:      'empathetic_support',
    anxiety:  'calming_support',
    fear:     'calming_support',
    angry:    'de_escalation',
    happy:    'positive_engagement',
    surprise: 'curious_engagement',
    neutral:  'neutral_support',
  }),

  // ── Strategies that support journaling suggestions ────────────
  // Journaling is appropriate for reflective, processing-oriented states.
  JOURNALING_STRATEGIES: Object.freeze([
    'empathetic_support',
    'neutral_support',
  ]),

  // ── Strategies that support breathing suggestions ─────────────
  // Breathing is appropriate for calming / grounding states.
  BREATHING_STRATEGIES: Object.freeze([
    'calming_support',
    'de_escalation',
  ]),

  // ── Fallback strategy ──────────────────────────────────────────
  FALLBACK_STRATEGY: 'neutral_support',
});

export default RESPONSE;

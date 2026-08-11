/**
 * PURPOSE
 * -------
 * Emotion-module-scoped constants. Centralises all magic values used
 * across services, clients, validators, and error classes.
 *
 * NEVER
 * -----
 * - Be imported from outside the emotion module
 *   (use shared/constants for cross-module values)
 *
 * EXPORTS
 * -------
 * EMOTION — frozen constants object
 *
 * DEPENDS ON
 * ----------
 * none
 */

const EMOTION = Object.freeze({

  // ── V1 blueprint emotion labels ────────────────────────────────
  // These are the official application-level labels. FastAPI model
  // labels are normalised into this set by the service layer.
  SUPPORTED: Object.freeze([
    'happy',
    'sad',
    'angry',
    'fear',
    'anxiety',
    'neutral',
    'surprise',
  ]),

  // ── FastAPI → blueprint label normalization map ────────────────
  // Maps raw model output labels to official V1 application labels.
  // Extend this map as the model evolves.
  LABEL_NORMALIZATION: Object.freeze({
    joy:     'happy',
    sadness: 'sad',
    anger:   'angry',
  }),

  // ── Fallback when prediction is unusable ───────────────────────
  FALLBACK_EMOTION:    'neutral',
  FALLBACK_CONFIDENCE: 0.0,

  // ── Confidence constraints ─────────────────────────────────────
  MIN_CONFIDENCE:       0.0,
  MAX_CONFIDENCE:       1.0,
  CONFIDENCE_THRESHOLD: 0.3,  // below this → treat as uncertain

  // ── Input constraints ──────────────────────────────────────────
  TEXT_MIN_LENGTH: 1,
  TEXT_MAX_LENGTH: 2000,

  // ── HTTP client config (ms) ────────────────────────────────────
  REQUEST_TIMEOUT_MS: 8000,  // hard timeout for FastAPI call
  RETRY_ATTEMPTS:     2,     // retry transient failures this many times
  RETRY_DELAY_MS:     500,   // wait between retries

  // ── FastAPI route ──────────────────────────────────────────────
  AI_PREDICT_PATH: '/predict',

  // ── Display metadata per emotion ──────────────────────────────
  META: Object.freeze({
    happy:    { colour: '#FFD700', icon: '😊' },
    sad:      { colour: '#6699CC', icon: '😢' },
    angry:    { colour: '#CC3333', icon: '😠' },
    fear:     { colour: '#9966CC', icon: '😨' },
    anxiety:  { colour: '#FF9933', icon: '😰' },
    neutral:  { colour: '#AAAAAA', icon: '😐' },
    surprise: { colour: '#FF66CC', icon: '😲' },
  }),
});

export default EMOTION;

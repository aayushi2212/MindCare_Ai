/**
 * PURPOSE
 * -------
 * Provides the V1 blueprint emotion labels the Response Engine accepts.
 * Mirrors the normalised labels produced by Module 3 — Emotion Detection.
 *
 * This file exists so the validator and strategy layer share a single
 * source of truth WITHOUT importing from the emotion module, which
 * would create a cross-module dependency at the source level.
 *
 * NEVER
 * -----
 * - Import from the emotion module
 * - Import from outside the response module
 *
 * EXPORTS
 * -------
 * SUPPORTED_EMOTION_LABELS — string[]
 */

const SUPPORTED_EMOTION_LABELS = Object.freeze([
  'happy',
  'sad',
  'angry',
  'fear',
  'anxiety',
  'neutral',
  'surprise',
]);

export default SUPPORTED_EMOTION_LABELS;

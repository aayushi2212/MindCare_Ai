/**
 * PURPOSE
 * -------
 * Normalises the Module 3 emotion result into the internal emotion
 * format required by Module 5 — Response Engine.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Map Module 3's { emotion, confidence, secondaryEmotion } shape
 *   to Module 5's { label, confidence, secondaryEmotion } shape
 * - Preserve confidence without modification
 * - Preserve secondaryEmotion when present
 * - Strip UI-only metadata (colour, icon, isUncertain) that Module 5
 *   does not need
 *
 * NEVER
 * -----
 * - Re-run emotion detection or modify the emotion value
 * - Recalculate or round confidence
 * - Import from Module 3 (this is a pure data transformation)
 * - Contain strategy-selection or response-generation logic
 *
 * EXPORTS
 * -------
 * normalizeEmotionResult(emotionResult) → { label, confidence, secondaryEmotion }
 *
 * DEPENDS ON
 * ----------
 * none
 */

/**
 * Convert a Module 3 emotion result to the Module 5 internal format.
 *
 * Module 3 output shape:
 *   { emotion, confidence, secondaryEmotion, colour, icon, isUncertain }
 *
 * Module 5 internal shape:
 *   { label, confidence, secondaryEmotion }
 *
 * @param   {Object} emotionResult — raw result from emotionService.analyze()
 * @returns {{ label: string, confidence: number, secondaryEmotion: string|null }}
 */
export function normalizeEmotionResult(emotionResult) {
  return {
    label:            emotionResult.emotion,
    confidence:       emotionResult.confidence,
    secondaryEmotion: emotionResult.secondaryEmotion ?? null,
  };
}

export default { normalizeEmotionResult };

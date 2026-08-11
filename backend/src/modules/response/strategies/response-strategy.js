/**
 * PURPOSE
 * -------
 * Determines the appropriate response strategy based on the emotion
 * result, confidence level, safety state, and conversation context.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Map V1 blueprint emotion labels to response strategies
 * - Apply confidence-based fallback when emotion is uncertain
 * - Enforce safety bypass for high-risk safety states
 *
 * NEVER
 * -----
 * - Detect emotions or recalculate confidence
 * - Generate response text (that belongs in response-generator.js)
 * - Query the database
 * - Import from other feature modules
 *
 * EXPORTS
 * -------
 * selectStrategy(emotionResult, safetyResult) — returns strategy string
 *
 * DEPENDS ON
 * ----------
 * response.constants
 */

import RESPONSE from '../constants/response.constants.js';
import { UnsupportedResponseStrategyError } from '../errors/response.errors.js';

/**
 * Select the response strategy for the current turn.
 *
 * @param {Object} emotionResult
 * @param {string}  emotionResult.label      — V1 blueprint emotion label from Module 3
 * @param {number}  emotionResult.confidence — float [0, 1]
 *
 * @param {Object} safetyResult
 * @param {string}  safetyResult.status      — safety status string
 *
 * @returns {string} — one of RESPONSE.STRATEGY values
 */
export function selectStrategy(emotionResult, safetyResult) {
  // 1. Safety gate — bypass normal generation for high-risk states
  if (safetyResult?.status === RESPONSE.SAFETY_STATUS.HIGH_RISK) {
    return RESPONSE.STRATEGY.SAFETY_BYPASS;
  }

  // 2. Low-confidence fallback — treat emotion as uncertain
  if (emotionResult.confidence < RESPONSE.HIGH_CONFIDENCE_THRESHOLD) {
    return RESPONSE.STRATEGY.NEUTRAL_SUPPORT;
  }

  // 3. Map V1 blueprint emotion label to strategy
  const strategy = RESPONSE.EMOTION_STRATEGY_MAP[emotionResult.label];

  if (!strategy) {
    // Unknown label — fall back gracefully rather than hard-error
    return RESPONSE.FALLBACK_STRATEGY;
  }

  return strategy;
}

/**
 * Assert the strategy is a known value.
 * Throws UnsupportedResponseStrategyError for unrecognised strategies.
 *
 * @param {string} strategy
 */
export function assertStrategySupported(strategy) {
  const supported = Object.values(RESPONSE.STRATEGY);
  if (!supported.includes(strategy)) {
    throw new UnsupportedResponseStrategyError(strategy);
  }
}

/**
 * PURPOSE
 * -------
 * Runs deterministic safety checks on inbound user messages.
 * This is the FIRST gate in the chat pipeline — it runs BEFORE
 * emotion detection, context retrieval, and response generation.
 *
 * RESPONSIBILITIES
 * -------
 * - Check for crisis phrases using deterministic pattern matching
 * - Return a structured SafetyResult
 * - NEVER generate AI responses
 * - NEVER store messages
 * - NEVER call external services
 *
 * EXPORTS
 * -------
 * safetyService.checkMessage(text) → SafetyResult
 * SAFETY_STATUS (re-exported from constants)
 *
 * DEPENDS ON
 * -------
 * safety.constants, shared/logger
 */

import logger from '../../../shared/logger/logger.js';
import {
  SAFETY_STATUS,
  RISK_LEVEL,
  SAFETY_CATEGORY,
  SAFETY_ACTION,
  CRISIS_PATTERNS,
  CRISIS_RESPONSE_TEXT,
  SAFETY_RESOURCES,
} from '../constants/safety.constants.js';

// ── Flat pattern list derived from categorised patterns ───────────
// We match against each category to identify which fired.
const CATEGORY_ENTRIES = Object.entries(CRISIS_PATTERNS);

class SafetyService {
  /**
   * Check an inbound user message for crisis/high-risk content.
   * Uses deterministic phrase matching — no AI or probabilistic
   * classification is involved.
   *
   * @param   {string} text — raw user message text
   * @returns {SafetyResult}
   *
   * @typedef {Object} SafetyResult
   * @property {string}      status         — 'safe' | 'high_risk'
   * @property {boolean}     isHighRisk
   * @property {string}      riskLevel      — 'NONE' | 'HIGH'
   * @property {string|null} category       — matched category or null
   * @property {string}      action         — 'CONTINUE' | 'CRISIS_RESPONSE'
   * @property {string|null} crisisResponse — predefined text or null
   * @property {object|null} resources      — SAFETY_RESOURCES or null
   */
  checkMessage(text) {
    if (!text || typeof text !== 'string') {
      return this._safe();
    }

    // Test each category; stop at first match
    for (const [categoryKey, patterns] of CATEGORY_ENTRIES) {
      const matched = patterns.some((pattern) => pattern.test(text));

      if (matched) {
        logger.warn('Safety gate: high-risk message detected', {
          // Log event ONLY — never log message content or matched pattern
          category:  categoryKey,
          triggered: true,
        });

        return {
          status:        SAFETY_STATUS.HIGH_RISK,
          isHighRisk:    true,
          riskLevel:     RISK_LEVEL.HIGH,
          category:      SAFETY_CATEGORY[categoryKey] ?? SAFETY_CATEGORY.CRISIS,
          action:        SAFETY_ACTION.CRISIS_RESPONSE,
          crisisResponse: CRISIS_RESPONSE_TEXT,
          resources:     SAFETY_RESOURCES,
        };
      }
    }

    return this._safe();
  }

  _safe() {
    return {
      status:        SAFETY_STATUS.SAFE,
      isHighRisk:    false,
      riskLevel:     RISK_LEVEL.NONE,
      category:      null,
      action:        SAFETY_ACTION.CONTINUE,
      crisisResponse: null,
      resources:     null,
    };
  }
}

export { SAFETY_STATUS };
export default new SafetyService();

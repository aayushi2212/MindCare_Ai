/**
 * PURPOSE
 * -------
 * Contains all business logic for emotion classification.
 * Acts as the single gateway between the rest of the application and
 * the FastAPI AI service — no other module calls FastAPI directly.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate and sanitise input text
 * - Call the FastAPI client
 * - Validate the raw prediction response (required fields, types)
 * - Normalise emotion labels (lowercase, trim, blueprint mapping)
 * - Assert the emotion is in the V1 supported set
 * - Clamp confidence to [0, 1]
 * - Enrich the result with display metadata
 * - Surface application-level errors; never expose raw model internals
 *
 * NEVER
 * -----
 * - Handle HTTP request/response (controller's job)
 * - Know which HTTP library the client uses
 * - Manage conversations, generate AI text, or detect crises
 *
 * EXPORTS
 * -------
 * emotionService — singleton instance
 *
 * DEPENDS ON
 * ----------
 * fastapi.client, emotion-mapper, emotion.constants, emotion.errors, shared/logger
 */

import fastapiClient  from '../clients/fastapi.client.js';
import { mapEmotion } from './emotion-mapper.js';
import EMOTION        from '../constants/emotion.constants.js';
import {
  EmptyInputError,
  UnsupportedEmotionError,
  InvalidConfidenceError,
  MalformedPredictionError,
} from '../errors/emotion.errors.js';
import logger from '../../../shared/logger/logger.js';

class EmotionService {

  /**
   * Analyse the emotional content of a text string.
   * This is the primary public method consumed by all other modules.
   *
   * @param   {string} rawText — text from the user or another module
   * @returns {EmotionResult}
   *
   * @typedef {Object} EmotionResult
   * @property {string}  emotion          — normalised V1 blueprint emotion label
   * @property {number}  confidence       — clamped float [0, 1]
   * @property {string|null} secondaryEmotion — optional secondary V1 label
   * @property {string}  colour           — hex display colour
   * @property {string}  icon             — emoji icon
   * @property {boolean} isUncertain      — true if confidence < threshold
   */
  async analyze(rawText) {
    // 1. Validate & sanitise input
    const text = this._sanitize(rawText);

    logger.info('Emotion analysis requested', { textLength: text.length });

    // 2. Call FastAPI via the client (client handles retry/timeout)
    const raw = await fastapiClient.predict(text);

    // 3. Validate the raw response structure
    this._validateRawPrediction(raw);

    // 4. Normalise emotion label: lowercase → trim → apply blueprint mapping
    const emotion = this._normalizeLabel(raw.emotion);

    // 5. Assert the normalised label is in our V1 supported set
    if (!EMOTION.SUPPORTED.includes(emotion)) {
      throw new UnsupportedEmotionError(emotion);
    }

    // 6. Clamp confidence to [0, 1]
    const confidence = this._clampConfidence(raw.confidence);

    // 7. Normalise secondary emotion (optional field)
    const secondaryEmotion = this._normalizeSecondary(raw.secondaryEmotion);

    // 8. Enrich with display metadata
    const meta = mapEmotion(emotion);

    const result = {
      emotion,
      confidence,
      secondaryEmotion,
      colour:      meta.colour,
      icon:        meta.icon,
      isUncertain: confidence < EMOTION.CONFIDENCE_THRESHOLD,
    };

    logger.info('Emotion analysis complete', {
      emotion,
      confidence,
      secondaryEmotion,
      isUncertain: result.isUncertain,
    });

    return result;
  }

  // ── Private helpers ────────────────────────────────────────────

  /**
   * Sanitise input: trim whitespace, enforce length bounds.
   * @throws {EmptyInputError | ValidationError}
   */
  _sanitize(rawText) {
    if (typeof rawText !== 'string') {
      throw new EmptyInputError();
    }

    const text = rawText.trim();

    if (text.length < EMOTION.TEXT_MIN_LENGTH) {
      throw new EmptyInputError();
    }

    if (text.length > EMOTION.TEXT_MAX_LENGTH) {
      // Truncate rather than reject — keeps the service resilient
      logger.warn('Input text truncated to max length', {
        original: rawText.length,
        max:      EMOTION.TEXT_MAX_LENGTH,
      });
      return text.slice(0, EMOTION.TEXT_MAX_LENGTH);
    }

    return text;
  }

  /**
   * Assert that the FastAPI response has the required fields and types.
   * @throws {MalformedPredictionError | InvalidConfidenceError}
   */
  _validateRawPrediction(raw) {
    if (!raw.emotion || typeof raw.emotion !== 'string') {
      throw new MalformedPredictionError(
        'Prediction response is missing the required "emotion" field'
      );
    }

    if (typeof raw.confidence !== 'number') {
      throw new MalformedPredictionError(
        'Prediction response is missing a numeric "confidence" field'
      );
    }

    if (raw.confidence < EMOTION.MIN_CONFIDENCE - 0.01 ||
        raw.confidence > EMOTION.MAX_CONFIDENCE + 0.01) {
      // Outside a small tolerance — genuinely invalid
      throw new InvalidConfidenceError(raw.confidence);
    }
  }

  /**
   * Normalise a raw emotion label from FastAPI to the V1 blueprint label.
   * Steps: lowercase → trim → apply LABEL_NORMALIZATION map.
   *
   * @param   {string} raw — raw label string from FastAPI
   * @returns {string}     — V1 blueprint label
   */
  _normalizeLabel(raw) {
    const lower = raw.trim().toLowerCase();
    return EMOTION.LABEL_NORMALIZATION[lower] ?? lower;
  }

  /**
   * Clamp a confidence value to [MIN_CONFIDENCE, MAX_CONFIDENCE].
   */
  _clampConfidence(value) {
    return Math.min(Math.max(value, EMOTION.MIN_CONFIDENCE), EMOTION.MAX_CONFIDENCE);
  }

  /**
   * Normalise the optional secondary emotion field.
   * Returns null if absent, invalid, or not in V1 supported set.
   */
  _normalizeSecondary(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const label = this._normalizeLabel(raw);
    return EMOTION.SUPPORTED.includes(label) ? label : null;
  }
}

export default new EmotionService();

/**
 * PURPOSE
 * -------
 * Coordinates the Response Engine pipeline:
 *   validate input → check safety → select strategy → generate → validate output
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate normalised input from the controller
 * - Enforce safety bypass when a high-risk safety state is supplied
 * - Select the appropriate response strategy (via strategy layer)
 * - Call the response generator (via generator layer)
 * - Provide a Module 3 → Module 5 normalisation boundary via
 *   generateResponseFromEmotionResult()
 * - Return a standardised result
 *
 * NEVER
 * -----
 * - Access MongoDB directly
 * - Call FastAPI or any emotion service
 * - Retrieve conversation messages or build context
 * - Contain Express request/response logic
 * - Implement crisis detection
 *
 * EXPORTS
 * -------
 * responseService — singleton instance
 *
 * DEPENDS ON
 * ----------
 * response-strategy, response-generator, emotion-adapter,
 * response.constants, response.errors, shared/logger
 */

import { selectStrategy, assertStrategySupported } from '../strategies/response-strategy.js';
import { generateResponse }                        from '../strategies/response-generator.js';
import { normalizeEmotionResult }                  from './emotion-adapter.js';
import RESPONSE                                    from '../constants/response.constants.js';
import {
  InvalidResponseInputError,
  UnsafeResponseGenerationError,
} from '../errors/response.errors.js';
import logger from '../../../shared/logger/logger.js';

class ResponseService {

  /**
   * Execute the full response pipeline.
   * Accepts the Module 5 internal emotion format: { label, confidence }.
   *
   * @param {Object} input
   * @param {string}  input.userMessage
   * @param {Object}  input.emotion  — { label, confidence, secondaryEmotion? }
   * @param {Object}  input.context  — { recentMessages, messageCount?, lastInteraction? }
   * @param {Object}  input.safety   — { status }
   *
   * @returns {{ message: string, strategy: string, metadata: Object }}
   */
  async generateResponse(input) {
    this._validateInput(input);

    const { userMessage, emotion, context, safety } = input;
    const safetyResult = safety ?? { status: RESPONSE.SAFETY_STATUS.NOT_EVALUATED };

    logger.info('Response pipeline started', {
      emotionLabel:    emotion.label,
      confidence:      emotion.confidence,
      safetyStatus:    safetyResult.status,
      contextMessages: context?.recentMessages?.length ?? 0,
    });

    const strategy = selectStrategy(emotion, safetyResult);
    assertStrategySupported(strategy);

    if (strategy === RESPONSE.STRATEGY.SAFETY_BYPASS) {
      logger.warn('Response generation bypassed — high-risk safety status', {
        safetyStatus: safetyResult.status,
      });
      throw new UnsafeResponseGenerationError();
    }

    const result = generateResponse(
      { userMessage, emotion, context, safety: safetyResult },
      strategy
    );

    logger.info('Response pipeline completed', {
      strategy:       result.strategy,
      emotionLabel:   emotion.label,
      contextualised: result.metadata?.contextualised ?? false,
    });

    return result;
  }

  /**
   * Convenience entry point for programmatic callers that have a raw
   * Module 3 emotion result rather than the Module 5 internal format.
   *
   * Normalises:
   *   { emotion, confidence, secondaryEmotion, colour, icon, isUncertain }
   * to:
   *   { label, confidence, secondaryEmotion }
   *
   * then delegates to generateResponse().
   *
   * @param {Object} input
   * @param {string}  input.userMessage
   * @param {Object}  input.emotionResult — raw Module 3 output
   * @param {Object}  input.context
   * @param {Object}  input.safety
   */
  async generateResponseFromEmotionResult(input) {
    if (!input?.emotionResult || typeof input.emotionResult !== 'object') {
      throw new InvalidResponseInputError('emotionResult is required and must be an object');
    }

    const normalizedEmotion = normalizeEmotionResult(input.emotionResult);

    return this.generateResponse({
      userMessage: input.userMessage,
      emotion:     normalizedEmotion,
      context:     input.context,
      safety:      input.safety,
    });
  }

  // ── Private helpers ────────────────────────────────────────────

  _validateInput(input) {
    if (!input || typeof input !== 'object') {
      throw new InvalidResponseInputError('Input must be a valid object');
    }

    const { userMessage, emotion } = input;

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      throw new InvalidResponseInputError('userMessage is required and must be a non-empty string');
    }

    if (userMessage.length > RESPONSE.USER_MESSAGE_MAX_LENGTH) {
      throw new InvalidResponseInputError(
        `userMessage cannot exceed ${RESPONSE.USER_MESSAGE_MAX_LENGTH} characters`
      );
    }

    if (!emotion || typeof emotion !== 'object') {
      throw new InvalidResponseInputError('emotion is required and must be an object');
    }

    if (!emotion.label || typeof emotion.label !== 'string') {
      throw new InvalidResponseInputError('emotion.label is required');
    }

    if (typeof emotion.confidence !== 'number' ||
        emotion.confidence < 0 ||
        emotion.confidence > 1) {
      throw new InvalidResponseInputError(
        'emotion.confidence must be a number between 0 and 1'
      );
    }

    if (input.context !== undefined && input.context !== null) {
      if (typeof input.context !== 'object') {
        throw new InvalidResponseInputError('context must be an object');
      }
      if (input.context.recentMessages !== undefined &&
          !Array.isArray(input.context.recentMessages)) {
        throw new InvalidResponseInputError('context.recentMessages must be an array');
      }
    }

    if (input.safety !== undefined && input.safety !== null) {
      if (typeof input.safety !== 'object') {
        throw new InvalidResponseInputError('safety must be an object');
      }
    }
  }
}

export default new ResponseService();

/**
 * PURPOSE
 * -------
 * Dedicated HTTP client for all communication with the Python FastAPI
 * emotion analysis service. This is the only file in the backend that
 * knows the FastAPI host, port, and endpoint contract.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Build and send POST requests to FastAPI /predict
 * - Apply request timeouts
 * - Retry transient failures (network errors, 5xx responses)
 * - Parse and return raw FastAPI responses
 * - Convert network/HTTP errors into application-level errors
 *
 * NEVER
 * -----
 * - Contain business logic (label normalisation, confidence clamping)
 * - Validate business rules (supported emotions, threshold checks)
 * - Be called directly from controllers — always go through the service
 *
 * EXPORTS
 * -------
 * fastapiClient — singleton with predict(text) method
 *
 * DEPENDS ON
 * ----------
 * node-fetch (native fetch in Node 18+), config/environment,
 * emotion.constants, emotion.errors
 */

import env    from '../../../config/environment/index.js';
import EMOTION from '../constants/emotion.constants.js';
import {
  AIServiceUnavailableError,
  AIServiceTimeoutError,
  MalformedPredictionError,
} from '../errors/emotion.errors.js';
import logger from '../../../shared/logger/logger.js';

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Pause execution for `ms` milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Return true for errors that are worth retrying
 * (network failures, 429, 502, 503, 504).
 */
const isTransient = (err) => {
  if (err instanceof AIServiceUnavailableError) return true;
  if (err instanceof AIServiceTimeoutError)     return true;
  return false;
};

// ── Client class ───────────────────────────────────────────────────

class FastAPIClient {
  constructor() {
    this._baseUrl = (env.AI_SERVICE_URL ?? 'http://localhost:8000').replace(/\/$/, '');
  }

  /**
   * Send text to the FastAPI /predict endpoint.
   * Retries up to EMOTION.RETRY_ATTEMPTS times on transient failures.
   *
   * @param   {string} text — pre-sanitised input text
   * @returns {Object}        raw FastAPI response body
   * @throws  {AIServiceUnavailableError | AIServiceTimeoutError | MalformedPredictionError}
   */
  async predict(text) {
    const url     = `${this._baseUrl}${EMOTION.AI_PREDICT_PATH}`;
    const payload = JSON.stringify({ text });
    let   lastError;

    for (let attempt = 1; attempt <= EMOTION.RETRY_ATTEMPTS + 1; attempt++) {
      try {
        logger.debug('FastAPI predict request', { url, attempt });

        const response = await this._fetchWithTimeout(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    payload,
        }, EMOTION.REQUEST_TIMEOUT_MS);

        return await this._parseResponse(response);

      } catch (err) {
        lastError = err;

        if (isTransient(err) && attempt <= EMOTION.RETRY_ATTEMPTS) {
          logger.warn('FastAPI transient failure — retrying', {
            attempt,
            maxAttempts: EMOTION.RETRY_ATTEMPTS + 1,
            error: err.message,
          });
          await sleep(EMOTION.RETRY_DELAY_MS * attempt); // exponential-ish back-off
          continue;
        }

        // Non-retryable or retries exhausted — rethrow
        throw err;
      }
    }

    throw lastError;
  }

  // ── Private helpers ──────────────────────────────────────────────

  /**
   * Wraps the native fetch with an AbortController timeout.
   */
  async _fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new AIServiceTimeoutError();
      }
      // ECONNREFUSED, ENOTFOUND, etc.
      logger.error('FastAPI connection error', { message: err.message });
      throw new AIServiceUnavailableError(
        'Could not connect to the emotion analysis service'
      );
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Parse and minimally validate the HTTP response from FastAPI.
   * Structural validation (emotion labels, confidence range) is done
   * in the service layer — this method only checks for HTTP-level issues.
   */
  async _parseResponse(response) {
    // FastAPI returned a server error
    if (response.status >= 500) {
      logger.error('FastAPI server error', { status: response.status });
      throw new AIServiceUnavailableError(
        `Emotion service returned HTTP ${response.status}`
      );
    }

    // FastAPI returned a client error (bad request from our side)
    if (response.status >= 400) {
      logger.warn('FastAPI client error', { status: response.status });
      throw new MalformedPredictionError(
        `Emotion service rejected the request (HTTP ${response.status})`
      );
    }

    let body;
    try {
      body = await response.json();
    } catch {
      throw new MalformedPredictionError(
        'Emotion service returned a non-JSON response'
      );
    }

    if (!body || typeof body !== 'object') {
      throw new MalformedPredictionError(
        'Emotion service returned an empty or non-object response'
      );
    }

    logger.debug('FastAPI predict response', { status: response.status, emotion: body.emotion });
    return body;
  }
}

export default new FastAPIClient();

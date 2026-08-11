/**
 * PURPOSE
 * -------
 * Emotion-module-specific error subclasses.
 * All errors integrate with the centralized error handler via AppError.
 *
 * NEVER
 * -----
 * - Be imported from outside the emotion module
 * - Expose raw model or HTTP errors to callers
 *
 * DEPENDS ON
 * ----------
 * shared/errors/app-error.js, shared/errors/http-errors.js
 */

import { AppError }      from '../../../shared/errors/app-error.js';
import { ValidationError } from '../../../shared/errors/http-errors.js';

// ── 503 — AI service is down or unreachable ────────────────────────
export class AIServiceUnavailableError extends AppError {
  constructor(message = 'The emotion analysis service is currently unavailable') {
    super(message, 503);
    this.name = 'AIServiceUnavailableError';
  }
}

// ── 504 — AI service did not respond in time ──────────────────────
export class AIServiceTimeoutError extends AppError {
  constructor() {
    super('The emotion analysis service timed out. Please try again.', 504);
    this.name = 'AIServiceTimeoutError';
  }
}

// ── 502 — Response from FastAPI was malformed or missing fields ───
export class MalformedPredictionError extends AppError {
  constructor(message = 'Received an invalid response from the emotion analysis service') {
    super(message, 502);
    this.name = 'MalformedPredictionError';
  }
}

// ── 422 — FastAPI returned an emotion label we do not recognise ───
export class UnsupportedEmotionError extends AppError {
  constructor(emotion) {
    super(`Emotion label '${emotion}' is not supported by this application`, 422);
    this.name = 'UnsupportedEmotionError';
  }
}

// ── 422 — Confidence value is outside [0, 1] ──────────────────────
export class InvalidConfidenceError extends AppError {
  constructor(value) {
    super(`Received an invalid confidence value: ${value}. Expected a number between 0 and 1.`, 422);
    this.name = 'InvalidConfidenceError';
  }
}

// ── 400 — Input text was empty or missing ─────────────────────────
export class EmptyInputError extends ValidationError {
  constructor() {
    super('Text input cannot be empty');
    this.name = 'EmptyInputError';
  }
}

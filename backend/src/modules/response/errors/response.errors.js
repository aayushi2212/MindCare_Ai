/**
 * PURPOSE
 * -------
 * Response-module-specific error subclasses.
 * All errors integrate with the centralized error handler via AppError.
 *
 * NEVER
 * -----
 * - Be imported from outside the response module
 * - Expose internal implementation details to the frontend
 *
 * DEPENDS ON
 * ----------
 * shared/errors/app-error.js, shared/errors/http-errors.js
 */

import { AppError }       from '../../../shared/errors/app-error.js';
import { ValidationError } from '../../../shared/errors/http-errors.js';

// ── 400 — Malformed or missing required input fields ──────────────
export class InvalidResponseInputError extends ValidationError {
  constructor(message = 'Invalid response engine input') {
    super(message);
    this.name = 'InvalidResponseInputError';
  }
}

// ── 422 — Strategy resolved to an unknown or unsupported value ────
export class UnsupportedResponseStrategyError extends AppError {
  constructor(strategy) {
    super(`Response strategy '${strategy}' is not supported`, 422);
    this.name = 'UnsupportedResponseStrategyError';
  }
}

// ── 500 — Generator failed to produce a response ──────────────────
export class ResponseGenerationError extends AppError {
  constructor(message = 'Failed to generate a response') {
    super(message, 500, false);
    this.name = 'ResponseGenerationError';
  }
}

// ── 500 — Generator returned a response that failed validation ────
export class InvalidGeneratedResponseError extends AppError {
  constructor(message = 'Generated response did not pass validation') {
    super(message, 500, false);
    this.name = 'InvalidGeneratedResponseError';
  }
}

// ── 503 — High-risk safety status blocks normal generation ────────
export class UnsafeResponseGenerationError extends AppError {
  constructor() {
    super('Response generation bypassed: high-risk safety status detected', 503);
    this.name = 'UnsafeResponseGenerationError';
  }
}

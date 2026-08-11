/**
 * PURPOSE
 * -------
 * Context-module-specific error subclasses.
 * All errors integrate with the centralized error handler via AppError.
 *
 * NEVER
 * -----
 * - Be imported from outside the context module
 *
 * DEPENDS ON
 * ----------
 * shared/errors/app-error.js, shared/errors/http-errors.js
 */

import { AppError }                         from '../../../shared/errors/app-error.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../shared/errors/http-errors.js';

// ── 404 — Requested context could not be assembled ────────────────
export class ContextNotFoundError extends NotFoundError {
  constructor() {
    super('No context found for this conversation');
    this.name = 'ContextNotFoundError';
  }
}

// ── 404 — Conversation does not exist or is inaccessible ──────────
export class ConversationNotFoundError extends NotFoundError {
  constructor() {
    super('Conversation not found');
    this.name = 'ConversationNotFoundError';
  }
}

// ── 403 — Requesting user does not own the conversation ───────────
export class UnauthorizedConversationAccessError extends ForbiddenError {
  constructor() {
    super('You do not have access to this conversation');
    this.name = 'UnauthorizedConversationAccessError';
  }
}

// ── 400 — Limit parameter is out of the allowed range ─────────────
export class InvalidContextLimitError extends ValidationError {
  constructor(min, max) {
    super(`Context limit must be between ${min} and ${max}`);
    this.name = 'InvalidContextLimitError';
  }
}

// ── 400 — conversationId is not a valid ObjectId ──────────────────
export class InvalidConversationIdError extends ValidationError {
  constructor() {
    super('Invalid conversation ID — must be a 24-character hex string');
    this.name = 'InvalidConversationIdError';
  }
}

/**
 * PURPOSE
 * -------
 * Chat-module-specific error subclasses.
 *
 * NEVER
 * -----
 * - Be imported from outside the chat module
 *   (use shared/errors/http-errors.js for generic errors in other modules)
 *
 * DEPENDS ON
 * ----------
 * shared/errors/http-errors.js
 */

import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../shared/errors/http-errors.js';

export class ConversationNotFoundError extends NotFoundError {
  constructor() {
    super('Conversation not found');
    this.name = 'ConversationNotFoundError';
  }
}

export class MessageNotFoundError extends NotFoundError {
  constructor() {
    super('Message not found');
    this.name = 'MessageNotFoundError';
  }
}

export class ConversationAccessDeniedError extends ForbiddenError {
  constructor() {
    super('You do not have access to this conversation');
    this.name = 'ConversationAccessDeniedError';
  }
}

export class EmptyMessageError extends ValidationError {
  constructor() {
    super('Message content cannot be empty');
    this.name = 'EmptyMessageError';
  }
}

export class InvalidConversationIdError extends ValidationError {
  constructor() {
    super('Invalid conversation ID');
    this.name = 'InvalidConversationIdError';
  }
}

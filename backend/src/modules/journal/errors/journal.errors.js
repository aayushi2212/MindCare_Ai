/**
 * PURPOSE
 * -------
 * Domain-specific error classes for the Journal module.
 *
 * DEPENDS ON
 * ----------
 * shared/errors/http-errors.js
 */

import { NotFoundError, ForbiddenError } from '../../../shared/errors/http-errors.js';

export class JournalEntryNotFoundError extends NotFoundError {
  constructor(message = 'Journal entry not found') {
    super(message);
  }
}

export class JournalAccessDeniedError extends ForbiddenError {
  constructor(message = 'You do not have access to this journal entry') {
    super(message);
  }
}

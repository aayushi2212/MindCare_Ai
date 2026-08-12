/**
 * PURPOSE
 * -------
 * Express router for all /api/v1/journal endpoints.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Mount auth middleware on every route
 * - Mount Joi validation middleware
 * - Delegate to the appropriate controller function
 *
 * NEVER
 * -----
 * - Contain business logic
 * - Import repositories or models
 *
 * EXPORTS
 * -------
 * journalRouter (default)
 *
 * DEPENDS ON
 * ----------
 * express, auth.middleware, journal.controller, journal.validator
 */

import { Router }       from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import {
  createEntry,
  listEntries,
  getEntry,
  updateEntry,
  deleteEntry,
} from '../controllers/journal.controller.js';
import {
  validateCreateEntry,
  validateUpdateEntry,
  validateListQuery,
  validateEntryId,
} from '../validators/journal.validator.js';

const journalRouter = Router();

// All journal routes are protected — authentication required for every endpoint
journalRouter.use(authenticate);

// POST   /api/v1/journal        — create a new journal entry
journalRouter.post('/', validateCreateEntry, createEntry);

// GET    /api/v1/journal        — list own journal entries (paginated)
journalRouter.get('/', validateListQuery, listEntries);

// GET    /api/v1/journal/:id    — get a single owned journal entry
journalRouter.get('/:id', validateEntryId, getEntry);

// PATCH  /api/v1/journal/:id    — update an owned journal entry
journalRouter.patch('/:id', validateEntryId, validateUpdateEntry, updateEntry);

// DELETE /api/v1/journal/:id    — delete an owned journal entry
journalRouter.delete('/:id', validateEntryId, deleteEntry);

export default journalRouter;

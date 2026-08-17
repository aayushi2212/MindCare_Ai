/**
 * PURPOSE
 * -------
 * Thin HTTP layer for all journal endpoints.
 * Receives requests, delegates to journalService, returns standardised responses.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Extract validated inputs from req
 * - Call the appropriate journalService method
 * - Return a standardised JSON response
 *
 * NEVER
 * -----
 * - Contain business logic (ownership, validation)
 * - Query the database directly
 * - Import models or repositories
 *
 * EXPORTS
 * -------
 * createEntry, listEntries, getEntry, updateEntry, deleteEntry
 *
 * DEPENDS ON
 * ----------
 * journal.service, shared/utils/async-handler, shared/response/response.helper
 */

import journalService from '../services/journal.service.js';
import asyncHandler   from '../../../shared/utils/async-handler.js';
import { success, created, noContent, paginated } from '../../../shared/response/response.helper.js';

// ── POST /journal ────────────────────────────────────────────────
export const createEntry = asyncHandler(async (req, res) => {
  const entry = await journalService.createEntry(req.user.userId, req.body);
  created(res, { entry }, 'Journal entry created successfully');
});

// ── GET /journal ─────────────────────────────────────────────────
export const listEntries = asyncHandler(async (req, res) => {
  // Use req.validatedQuery (set by validateListQuery middleware) with fallback
  const result = await journalService.listEntries(req.user.userId, req.validatedQuery || req.query);
  paginated(res, result.entries, result.pagination, 'Journal entries retrieved');
});

// ── GET /journal/:id ─────────────────────────────────────────────
export const getEntry = asyncHandler(async (req, res) => {
  const entry = await journalService.getEntry(req.user.userId, req.params.id);
  success(res, { entry });
});

// ── PATCH /journal/:id ───────────────────────────────────────────
export const updateEntry = asyncHandler(async (req, res) => {
  const entry = await journalService.updateEntry(req.user.userId, req.params.id, req.body);
  success(res, { entry }, 'Journal entry updated successfully');
});

// ── DELETE /journal/:id ──────────────────────────────────────────
export const deleteEntry = asyncHandler(async (req, res) => {
  await journalService.deleteEntry(req.user.userId, req.params.id);
  noContent(res);
});

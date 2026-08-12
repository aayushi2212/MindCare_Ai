/**
 * PURPOSE
 * -------
 * Business logic for journal entry management.
 *
 * RESPONSIBILITIES
 * ----------------
 * - CRUD operations on journal entries
 * - Ownership enforcement (a user may only access their own entries)
 * - Pagination capping
 *
 * NEVER
 * -----
 * - Store data directly (delegate to journalRepository)
 * - Format HTTP responses
 * - Call Module 3 (emotion is chosen by the user, not detected)
 * - Generate AI content
 * - Perform analytics
 *
 * EXPORTS
 * -------
 * journalService singleton
 *
 * DEPENDS ON
 * ----------
 * journal.repository, journal.errors, journal.constants
 */

import journalRepository                                from '../repositories/journal.repository.js';
import { JournalEntryNotFoundError, JournalAccessDeniedError } from '../errors/journal.errors.js';
import JOURNAL                                          from '../constants/journal.constants.js';

class JournalService {
  // ── Create ──────────────────────────────────────────────────────

  /**
   * Create a new journal entry owned by the authenticated user.
   * @param {string} userId  — from JWT, never from req.body
   * @param {{ emotion, reflection, notes? }} dto
   * @returns {Promise<object>} Created entry
   */
  async createEntry(userId, dto) {
    const { emotion, reflection, notes } = dto;

    const entry = await journalRepository.create({
      userId,
      emotion,
      reflection,
      notes: notes ?? null,
    });

    return entry;
  }

  // ── List ─────────────────────────────────────────────────────────

  /**
   * Return paginated journal entries for the authenticated user (newest first).
   * @param {string} userId
   * @param {{ page?: number, limit?: number }} query
   */
  async listEntries(userId, query = {}) {
    const page  = Math.max(1, parseInt(query.page, 10)  || JOURNAL.DEFAULT_PAGE);
    const limit = Math.min(
      JOURNAL.MAX_PAGE_SIZE,
      Math.max(1, parseInt(query.limit, 10) || JOURNAL.DEFAULT_PAGE_SIZE)
    );

    const { docs, total } = await journalRepository.findByUserId(userId, { page, limit });

    return {
      entries: docs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Get single ───────────────────────────────────────────────────

  /**
   * Return a single journal entry if it belongs to the authenticated user.
   * Returns the same 404 whether the entry does not exist OR belongs to
   * another user (prevents existence disclosure).
   * @param {string} userId
   * @param {string} entryId
   */
  async getEntry(userId, entryId) {
    const entry = await journalRepository.findById(entryId);

    if (!entry) {
      throw new JournalEntryNotFoundError();
    }

    if (entry.userId.toString() !== userId) {
      // Do not reveal that another user's entry exists
      throw new JournalEntryNotFoundError();
    }

    return entry;
  }

  // ── Update ───────────────────────────────────────────────────────

  /**
   * Update allowed fields on an owned journal entry.
   * @param {string} userId
   * @param {string} entryId
   * @param {{ emotion?, reflection?, notes? }} dto
   */
  async updateEntry(userId, entryId, dto) {
    // Verify existence and ownership first
    const existing = await journalRepository.findById(entryId);

    if (!existing) {
      throw new JournalEntryNotFoundError();
    }

    if (existing.userId.toString() !== userId) {
      throw new JournalEntryNotFoundError(); // same as above — no existence disclosure
    }

    // Build safe update — only permit these fields
    const updates = {};
    if (dto.emotion    !== undefined) updates.emotion    = dto.emotion;
    if (dto.reflection !== undefined) updates.reflection = dto.reflection;
    if (dto.notes      !== undefined) updates.notes      = dto.notes;

    const updated = await journalRepository.update(entryId, updates);
    return updated;
  }

  // ── Delete ───────────────────────────────────────────────────────

  /**
   * Permanently delete an owned journal entry.
   * @param {string} userId
   * @param {string} entryId
   */
  async deleteEntry(userId, entryId) {
    const existing = await journalRepository.findById(entryId);

    if (!existing) {
      throw new JournalEntryNotFoundError();
    }

    if (existing.userId.toString() !== userId) {
      throw new JournalEntryNotFoundError(); // same pattern
    }

    await journalRepository.deleteById(entryId);
  }
}

// Singleton
const journalService = new JournalService();
export default journalService;

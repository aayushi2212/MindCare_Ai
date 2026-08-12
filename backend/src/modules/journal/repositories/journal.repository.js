/**
 * PURPOSE
 * -------
 * MongoDB / Mongoose data-access layer for JournalEntry documents.
 *
 * RESPONSIBILITIES
 * ----------------
 * - create, findByUserId, findById, update, deleteById
 *
 * NEVER
 * -----
 * - Enforce business rules (ownership, access control) — that belongs in the service
 * - Format HTTP responses
 *
 * EXPORTS
 * -------
 * journalRepository singleton
 *
 * DEPENDS ON
 * ----------
 * journal-entry.model.js
 */

import JournalEntry from '../models/journal-entry.model.js';

class JournalRepository {
  /**
   * Create a new journal entry.
   * @param {{ userId, emotion, reflection, notes }} data
   * @returns {Promise<JournalEntry>}
   */
  async create(data) {
    return JournalEntry.create(data);
  }

  /**
   * Find all entries belonging to a user, newest first, with pagination.
   * @param {string} userId
   * @param {{ page: number, limit: number }} opts
   * @returns {Promise<{ docs: JournalEntry[], total: number }>}
   */
  async findByUserId(userId, { page, limit }) {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      JournalEntry.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JournalEntry.countDocuments({ userId }),
    ]);

    return { docs, total };
  }

  /**
   * Find a single entry by its _id (any owner).
   * Ownership check is done in the service.
   * @param {string} id
   * @returns {Promise<JournalEntry|null>}
   */
  async findById(id) {
    return JournalEntry.findById(id).lean();
  }

  /**
   * Update allowed fields on an entry.
   * @param {string} id
   * @param {{ emotion?, reflection?, notes? }} updates
   * @returns {Promise<JournalEntry|null>}
   */
  async update(id, updates) {
    return JournalEntry.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Permanently delete a journal entry by id.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteById(id) {
    await JournalEntry.findByIdAndDelete(id);
  }
}

// Singleton
const journalRepository = new JournalRepository();
export default journalRepository;

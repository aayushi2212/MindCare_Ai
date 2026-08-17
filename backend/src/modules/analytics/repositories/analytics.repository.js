/**
 * PURPOSE
 * -------
 * MongoDB aggregation layer for analytics queries.
 * All queries are scoped to a single authenticated userId.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Aggregate journal data for mood trends, emotion frequency,
 *   weekly summaries, monthly summaries, and history.
 * - Never perform business logic (tie-breaking, period calculations).
 *
 * NEVER
 * -----
 * - Access any collection other than JournalEntry.
 * - Accept a userId from anywhere other than the service layer.
 * - Format HTTP responses.
 *
 * EXPORTS
 * -------
 * analyticsRepository singleton
 *
 * DEPENDS ON
 * ----------
 * journal-entry.model  (read-only access — Module 6 schema unchanged)
 */

import mongoose from 'mongoose';

// Read-only reference to the JournalEntry model registered by Module 6.
// We use mongoose.model() lazy lookup so Module 7 never imports Module 6
// internals directly — the model is already registered at boot time.
const getJournalModel = () => mongoose.model('JournalEntry');

class AnalyticsRepository {
  // ── Total entry count ─────────────────────────────────────────

  /**
   * Count of all journal entries for a user.
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async countEntries(userId) {
    const JournalEntry = getJournalModel();
    return JournalEntry.countDocuments({ userId });
  }

  // ── Emotion frequency ─────────────────────────────────────────

  /**
   * Count of each emotion label in the user's journal, across all time
   * or within an optional date range.
   * @param {string} userId
   * @param {{ startDate?: Date, endDate?: Date }} opts
   * @returns {Promise<Array<{ emotion: string, count: number }>>}
   */
  async emotionFrequency(userId, { startDate, endDate } = {}) {
    const JournalEntry = getJournalModel();

    const match = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate)   match.createdAt.$lte = endDate;
    }

    return JournalEntry.aggregate([
      { $match: match },
      { $group: { _id: '$emotion', count: { $sum: 1 } } },
      { $project: { _id: 0, emotion: '$_id', count: 1 } },
      { $sort: { count: -1, emotion: 1 } }, // stable: count desc then alpha
    ]);
  }

  // ── Mood trend ────────────────────────────────────────────────

  /**
   * Chronological list of { date, emotion } points for charting.
   * Dates are returned as ISO date strings (YYYY-MM-DD, UTC).
   * @param {string} userId
   * @param {{ startDate?: Date, endDate?: Date, limit?: number }} opts
   * @returns {Promise<Array<{ date: string, emotion: string }>>}
   */
  async moodTrend(userId, { startDate, endDate, limit = 90 } = {}) {
    const JournalEntry = getJournalModel();

    const match = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate)   match.createdAt.$lte = endDate;
    }

    return JournalEntry.aggregate([
      { $match: match },
      { $sort:  { createdAt: 1 } },
      { $limit: limit },
      {
        $project: {
          _id:     0,
          date:    { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          emotion: 1,
        },
      },
    ]);
  }

  // ── Period aggregation (week or month) ────────────────────────

  /**
   * Entries within a date range with full fields needed for summaries.
   * @param {string} userId
   * @param {Date}   startDate
   * @param {Date}   endDate
   * @returns {Promise<Array<{ emotion: string, createdAt: Date }>>}
   */
  async entriesInRange(userId, startDate, endDate) {
    const JournalEntry = getJournalModel();

    return JournalEntry.find(
      {
        userId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
      { emotion: 1, createdAt: 1, _id: 0 }
    ).lean();
  }

  // ── Journal history (paginated) ───────────────────────────────

  /**
   * Paginated journal entries for the authenticated user, newest first.
   * Returns only fields needed for the history view.
   * @param {string} userId
   * @param {{ page: number, limit: number }} opts
   * @returns {Promise<{ docs: object[], total: number }>}
   */
  async journalHistory(userId, { page, limit }) {
    const JournalEntry = getJournalModel();
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      JournalEntry.find(
        { userId },
        { emotion: 1, reflection: 1, notes: 1, createdAt: 1 }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JournalEntry.countDocuments({ userId }),
    ]);

    return { docs, total };
  }
}

const analyticsRepository = new AnalyticsRepository();
export default analyticsRepository;

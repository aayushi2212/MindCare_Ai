/**
 * PURPOSE
 * -------
 * Business logic for the Analytics Dashboard.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Calculate emotion frequency, mood trend, weekly/monthly summaries,
 *   overview, and journal history.
 * - Enforce user isolation: every method receives userId from the JWT,
 *   never from client-supplied parameters.
 * - Handle empty-data gracefully — never throw when a user has no entries.
 *
 * NEVER
 * -----
 * - Generate AI content, predictions, or psychological diagnoses.
 * - Produce mental-health scores or severity ratings.
 * - Access MongoDB directly (delegate to analyticsRepository).
 * - Format HTTP responses.
 * - Modify journal entries (Module 6 responsibility).
 *
 * EXPORTS
 * -------
 * analyticsService singleton
 *
 * DATE CONVENTIONS
 * ----------------
 * All timestamps are stored in UTC by Mongoose (Module 6).
 * Week and month boundaries are calculated in UTC to ensure consistency.
 * "Current week" = Monday 00:00:00 UTC → Sunday 23:59:59.999 UTC.
 * "Current month" = first day 00:00:00 UTC → last day 23:59:59.999 UTC.
 *
 * DEPENDS ON
 * ----------
 * analytics.repository, analytics.constants
 */

import analyticsRepository from '../repositories/analytics.repository.js';
import ANALYTICS           from '../constants/analytics.constants.js';

// ── Date helpers ──────────────────────────────────────────────────

/** Start of the current ISO week (Monday 00:00 UTC). */
const currentWeekStart = () => {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
  return monday;
};

/** End of a week starting on `weekStart` (Sunday 23:59:59.999 UTC). */
const weekEnd = (weekStart) =>
  new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

/** Start of the current month (day 1, 00:00 UTC). */
const currentMonthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

/** End of the current month (last day 23:59:59.999 UTC). */
const currentMonthEnd = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - 1);
};

// ── Shared helpers ────────────────────────────────────────────────

/**
 * Build a frequency map { emotion → count } from a list of { emotion, count } rows.
 * Ensures every V1 emotion appears with a default of 0.
 */
const buildFrequencyMap = (rows) => {
  const map = {};
  for (const e of ANALYTICS.EMOTIONS) map[e] = 0;
  for (const row of rows) map[row.emotion] = row.count;
  return map;
};

/**
 * Determine the most frequent emotion from a frequency map.
 * Tie-break: alphabetical order (deterministic).
 * Returns null when all counts are 0.
 */
const mostFrequent = (frequencyMap) => {
  const entries = Object.entries(frequencyMap).filter(([, c]) => c > 0);
  if (entries.length === 0) return null;
  entries.sort(([aLabel, aCount], [bLabel, bCount]) =>
    bCount !== aCount ? bCount - aCount : aLabel.localeCompare(bLabel)
  );
  return entries[0][0];
};

/**
 * Build a frequency map from an array of raw entry objects { emotion }.
 */
const frequencyMapFromEntries = (entries) => {
  const map = {};
  for (const e of ANALYTICS.EMOTIONS) map[e] = 0;
  for (const entry of entries) {
    if (map[entry.emotion] !== undefined) map[entry.emotion]++;
  }
  return map;
};

// ── Service class ─────────────────────────────────────────────────

class AnalyticsService {

  // ── Overview ───────────────────────────────────────────────────

  /**
   * Full dashboard overview for the authenticated user.
   * Composes all sub-calculations into one response object.
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getOverview(userId) {
    const [
      totalEntries,
      emotionRows,
      trendPoints,
      weekSummary,
      monthSummary,
    ] = await Promise.all([
      analyticsRepository.countEntries(userId),
      analyticsRepository.emotionFrequency(userId, {}),
      analyticsRepository.moodTrend(userId, { limit: ANALYTICS.MAX_TREND_POINTS }),
      this._buildWeeklySummary(userId),
      this._buildMonthlySummary(userId),
    ]);

    const emotionDistribution = buildFrequencyMap(emotionRows);
    const mostFrequentEmotion = mostFrequent(emotionDistribution);

    return {
      totalEntries,
      mostFrequentEmotion,
      emotionDistribution,
      moodTrend:     trendPoints,
      weeklySummary:  weekSummary,
      monthlySummary: monthSummary,
    };
  }

  // ── Mood trend ─────────────────────────────────────────────────

  /**
   * Chronological list of { date, emotion } points.
   * @param {string} userId
   * @param {{ startDate?: Date, endDate?: Date }} opts
   */
  async getMoodTrend(userId, { startDate, endDate } = {}) {
    const points = await analyticsRepository.moodTrend(userId, {
      startDate,
      endDate,
      limit: ANALYTICS.MAX_TREND_POINTS,
    });
    return points; // already { date: 'YYYY-MM-DD', emotion: string }[]
  }

  // ── Emotion frequency ──────────────────────────────────────────

  /**
   * Frequency count for each V1 emotion, across all time or a date range.
   * @param {string} userId
   * @param {{ startDate?: Date, endDate?: Date }} opts
   */
  async getEmotionFrequency(userId, { startDate, endDate } = {}) {
    const rows = await analyticsRepository.emotionFrequency(userId, { startDate, endDate });
    const distribution  = buildFrequencyMap(rows);
    const mostFrequentEmotion = mostFrequent(distribution);

    return {
      emotionDistribution: distribution,
      mostFrequentEmotion,
    };
  }

  // ── Weekly summary ─────────────────────────────────────────────

  /**
   * Descriptive statistics for the current ISO week.
   * @param {string} userId
   */
  async getWeeklySummary(userId) {
    return this._buildWeeklySummary(userId);
  }

  /** @private */
  async _buildWeeklySummary(userId) {
    const startDate = currentWeekStart();
    const endDate   = weekEnd(startDate);
    const entries   = await analyticsRepository.entriesInRange(userId, startDate, endDate);

    const emotionFrequency    = frequencyMapFromEntries(entries);
    const mostFrequentEmotion = mostFrequent(emotionFrequency);

    return {
      period:               'weekly',
      startDate:            startDate.toISOString().slice(0, 10),
      endDate:              endDate.toISOString().slice(0, 10),
      entryCount:           entries.length,
      mostFrequentEmotion,
      emotionFrequency,
    };
  }

  // ── Monthly summary ────────────────────────────────────────────

  /**
   * Descriptive statistics for the current calendar month (UTC).
   * @param {string} userId
   */
  async getMonthlySummary(userId) {
    return this._buildMonthlySummary(userId);
  }

  /** @private */
  async _buildMonthlySummary(userId) {
    const startDate = currentMonthStart();
    const endDate   = currentMonthEnd();
    const now       = new Date();
    const entries   = await analyticsRepository.entriesInRange(userId, startDate, endDate);

    const emotionFrequency    = frequencyMapFromEntries(entries);
    const mostFrequentEmotion = mostFrequent(emotionFrequency);

    return {
      period:               'monthly',
      month:                `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`,
      startDate:            startDate.toISOString().slice(0, 10),
      endDate:              endDate.toISOString().slice(0, 10),
      entryCount:           entries.length,
      mostFrequentEmotion,
      emotionFrequency,
    };
  }

  // ── Journal history ────────────────────────────────────────────

  /**
   * Paginated journal history for the dashboard.
   * Read-only; does not duplicate Module 6 CRUD.
   * @param {string} userId
   * @param {{ page?: number, limit?: number }} query
   */
  async getJournalHistory(userId, query = {}) {
    const page  = Math.max(1, parseInt(query.page, 10)  || ANALYTICS.DEFAULT_PAGE);
    const limit = Math.min(
      ANALYTICS.MAX_PAGE_SIZE,
      Math.max(1, parseInt(query.limit, 10) || ANALYTICS.DEFAULT_PAGE_SIZE)
    );

    const { docs, total } = await analyticsRepository.journalHistory(userId, { page, limit });

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
}

const analyticsService = new AnalyticsService();
export default analyticsService;

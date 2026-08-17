/**
 * PURPOSE
 * -------
 * Thin HTTP layer for analytics endpoints.
 * Receives requests, delegates to analyticsService, returns standardised responses.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Extract validated inputs from req.validatedQuery (set by validator middleware).
 * - Call the appropriate analyticsService method.
 * - Return a standardised JSON response.
 *
 * NEVER
 * -----
 * - Contain business logic or aggregation calculations.
 * - Query the database directly.
 * - Accept userId from req.body or req.query.
 *
 * EXPORTS
 * -------
 * getOverview, getMoodTrend, getEmotionFrequency,
 * getWeeklySummary, getMonthlySummary, getJournalHistory
 *
 * DEPENDS ON
 * ----------
 * analytics.service, shared/utils/async-handler, shared/response/response.helper
 */

import analyticsService          from '../services/analytics.service.js';
import asyncHandler              from '../../../shared/utils/async-handler.js';
import { success, paginated }    from '../../../shared/response/response.helper.js';

// ── GET /analytics/overview ───────────────────────────────────────
export const getOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOverview(req.user.userId);
  success(res, data, 200, 'Dashboard overview retrieved');
});

// ── GET /analytics/mood-trend ─────────────────────────────────────
export const getMoodTrend = asyncHandler(async (req, res) => {
  // Use req.validatedQuery (set by validateDateRangeQuery middleware)
  // Falls back to raw req.query when no validator is mounted (e.g. no date params)
  const { startDate, endDate } = req.validatedQuery || req.query;
  const trend = await analyticsService.getMoodTrend(req.user.userId, { startDate, endDate });
  success(res, { moodTrend: trend }, 200, 'Mood trend retrieved');
});

// ── GET /analytics/emotions ───────────────────────────────────────
export const getEmotionFrequency = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.validatedQuery || req.query;
  const data = await analyticsService.getEmotionFrequency(req.user.userId, { startDate, endDate });
  success(res, data, 200, 'Emotion frequency retrieved');
});

// ── GET /analytics/weekly ─────────────────────────────────────────
export const getWeeklySummary = asyncHandler(async (req, res) => {
  const data = await analyticsService.getWeeklySummary(req.user.userId);
  success(res, data, 200, 'Weekly summary retrieved');
});

// ── GET /analytics/monthly ────────────────────────────────────────
export const getMonthlySummary = asyncHandler(async (req, res) => {
  const data = await analyticsService.getMonthlySummary(req.user.userId);
  success(res, data, 200, 'Monthly summary retrieved');
});

// ── GET /analytics/journal-history ───────────────────────────────
export const getJournalHistory = asyncHandler(async (req, res) => {
  const query  = req.validatedQuery || req.query;
  const result = await analyticsService.getJournalHistory(req.user.userId, query);
  paginated(res, result.entries, result.pagination, 'Journal history retrieved');
});

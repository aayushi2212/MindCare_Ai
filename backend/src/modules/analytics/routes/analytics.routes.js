/**
 * PURPOSE
 * -------
 * Express router for all /api/v1/analytics endpoints.
 *
 * All routes are protected — authentication required on every endpoint.
 * The userId is derived from the JWT inside analyticsService; it is
 * never accepted from query params or request body.
 *
 * EXPORTS
 * -------
 * analyticsRouter (default)
 *
 * DEPENDS ON
 * ----------
 * express, auth.middleware, analytics.controller, analytics.validator
 */

import { Router }       from 'express';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';
import {
  getOverview,
  getMoodTrend,
  getEmotionFrequency,
  getWeeklySummary,
  getMonthlySummary,
  getJournalHistory,
} from '../controllers/analytics.controller.js';
import {
  validateDateRangeQuery,
  validatePaginationQuery,
} from '../validators/analytics.validator.js';

const analyticsRouter = Router();

// Protect every analytics route
analyticsRouter.use(authenticate);

// GET /api/v1/analytics/overview           — full dashboard summary
analyticsRouter.get('/overview', getOverview);

// GET /api/v1/analytics/mood-trend         — chronological emotion points
// Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD  (both or neither)
analyticsRouter.get('/mood-trend', validateDateRangeQuery, getMoodTrend);

// GET /api/v1/analytics/emotions           — per-emotion counts
// Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD  (both or neither)
analyticsRouter.get('/emotions', validateDateRangeQuery, getEmotionFrequency);

// GET /api/v1/analytics/weekly             — current week stats
analyticsRouter.get('/weekly', getWeeklySummary);

// GET /api/v1/analytics/monthly            — current month stats
analyticsRouter.get('/monthly', getMonthlySummary);

// GET /api/v1/analytics/journal-history    — paginated history view
// Query: ?page=1&limit=20
analyticsRouter.get('/journal-history', validatePaginationQuery, getJournalHistory);

export default analyticsRouter;

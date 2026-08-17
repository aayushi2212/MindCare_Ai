/**
 * PURPOSE
 * -------
 * API-level integration tests for /api/v1/analytics endpoints.
 *
 * Uses Supertest against real app.js with analyticsService mocked.
 * No real MongoDB connection required.
 *
 * COVERS
 * ------
 * Authentication:
 *   - All 6 endpoints return 401 without token
 *
 * GET /api/v1/analytics/overview:
 *   - Returns 200 with correct shape
 *   - Returns empty-safe response when no entries
 *
 * GET /api/v1/analytics/mood-trend:
 *   - Returns 200 with moodTrend array
 *   - Valid date range accepted
 *   - startDate without endDate → 400
 *   - Invalid date → 400
 *   - startDate > endDate → 400
 *
 * GET /api/v1/analytics/emotions:
 *   - Returns 200 with emotionDistribution
 *   - Invalid date range → 400
 *
 * GET /api/v1/analytics/weekly:
 *   - Returns 200 with weekly summary shape
 *
 * GET /api/v1/analytics/monthly:
 *   - Returns 200 with monthly summary shape
 *
 * GET /api/v1/analytics/journal-history:
 *   - Returns 200 with paginated data
 *   - Invalid page → 400
 *   - Negative limit → 400
 *
 * User isolation:
 *   - Service is called with userId from JWT (not from query)
 *
 * DEPENDS ON
 * ----------
 * supertest, jest, app.js, analytics.service (mocked), jwt utils
 */

// ── Env vars BEFORE any project import ───────────────────────────
process.env.MONGO_URI          = 'mongodb://localhost:27017/mindcare-test';
process.env.JWT_SECRET         = 'test-jwt-secret-for-analytics-api';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-analytics-api';
process.env.NODE_ENV           = 'test';

import { jest } from '@jest/globals';
import request  from 'supertest';

// ── Mock analyticsService BEFORE app.js is imported ──────────────

jest.unstable_mockModule('../services/analytics.service.js', () => ({
  default: {
    getOverview:          jest.fn(),
    getMoodTrend:         jest.fn(),
    getEmotionFrequency:  jest.fn(),
    getWeeklySummary:     jest.fn(),
    getMonthlySummary:    jest.fn(),
    getJournalHistory:    jest.fn(),
  },
}));

const { default: app }              = await import('../../../app.js');
const { signAccessToken }           = await import('../../../shared/utils/jwt.js');
const { default: analyticsService } = await import('../services/analytics.service.js');

// ── Helpers ───────────────────────────────────────────────────────

const USER_A_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const makeToken = (userId = USER_A_ID) =>
  signAccessToken({ userId, email: `user@mindcare.ai` });

const EMPTY_FREQ = {
  happy: 0, sad: 0, angry: 0, fear: 0, anxiety: 0, neutral: 0, surprise: 0,
};

const makeOverview = (overrides = {}) => ({
  totalEntries:        0,
  mostFrequentEmotion: null,
  emotionDistribution: EMPTY_FREQ,
  moodTrend:           [],
  weeklySummary: {
    period: 'weekly', startDate: '2026-08-11', endDate: '2026-08-17',
    entryCount: 0, mostFrequentEmotion: null, emotionFrequency: EMPTY_FREQ,
  },
  monthlySummary: {
    period: 'monthly', month: '2026-08', startDate: '2026-08-01', endDate: '2026-08-31',
    entryCount: 0, mostFrequentEmotion: null, emotionFrequency: EMPTY_FREQ,
  },
  ...overrides,
});

// ── Authentication tests ──────────────────────────────────────────

describe('Analytics API — authentication (all endpoints return 401 without token)', () => {
  beforeEach(() => jest.clearAllMocks());

  const endpoints = [
    ['GET', '/api/v1/analytics/overview'],
    ['GET', '/api/v1/analytics/mood-trend'],
    ['GET', '/api/v1/analytics/emotions'],
    ['GET', '/api/v1/analytics/weekly'],
    ['GET', '/api/v1/analytics/monthly'],
    ['GET', '/api/v1/analytics/journal-history'],
  ];

  for (const [method, path] of endpoints) {
    it(`${method} ${path} → 401`, async () => {
      const res = await request(app)[method.toLowerCase()](path);
      expect(res.status).toBe(401);
    });
  }
});

// ── GET /api/v1/analytics/overview ───────────────────────────────

describe('GET /api/v1/analytics/overview', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with correct shape', async () => {
    analyticsService.getOverview.mockResolvedValue(makeOverview({ totalEntries: 5 }));

    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalEntries');
    expect(res.body.data).toHaveProperty('emotionDistribution');
    expect(res.body.data).toHaveProperty('moodTrend');
    expect(res.body.data).toHaveProperty('weeklySummary');
    expect(res.body.data).toHaveProperty('monthlySummary');
  });

  it('returns safe empty-state overview', async () => {
    analyticsService.getOverview.mockResolvedValue(makeOverview());

    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalEntries).toBe(0);
    expect(res.body.data.mostFrequentEmotion).toBeNull();
    expect(res.body.data.moodTrend).toEqual([]);
  });

  it('calls getOverview with userId from JWT', async () => {
    analyticsService.getOverview.mockResolvedValue(makeOverview());

    await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${makeToken(USER_A_ID)}`);

    expect(analyticsService.getOverview).toHaveBeenCalledWith(USER_A_ID);
  });

  it('does not expose internal error details', async () => {
    analyticsService.getOverview.mockRejectedValue(new Error('DB failure'));

    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(500);
    expect(res.body.stack).toBeUndefined();
    expect(res.body.message).not.toContain('DB failure');
  });
});

// ── GET /api/v1/analytics/mood-trend ─────────────────────────────

describe('GET /api/v1/analytics/mood-trend', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with moodTrend array', async () => {
    analyticsService.getMoodTrend.mockResolvedValue([
      { date: '2026-08-01', emotion: 'happy' },
    ]);

    const res = await request(app)
      .get('/api/v1/analytics/mood-trend')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.moodTrend).toHaveLength(1);
    expect(res.body.data.moodTrend[0]).toMatchObject({ date: '2026-08-01', emotion: 'happy' });
  });

  it('accepts valid date range', async () => {
    analyticsService.getMoodTrend.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/v1/analytics/mood-trend?startDate=2026-08-01&endDate=2026-08-31')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(analyticsService.getMoodTrend).toHaveBeenCalledWith(
      USER_A_ID,
      expect.objectContaining({ startDate: expect.any(Date), endDate: expect.any(Date) })
    );
  });

  it('rejects startDate without endDate → 400', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/mood-trend?startDate=2026-08-01')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });

  it('rejects invalid ISO date → 400', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/mood-trend?startDate=not-a-date&endDate=also-wrong')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });

  it('rejects startDate > endDate → 400', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/mood-trend?startDate=2026-08-31&endDate=2026-08-01')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });

  it('returns empty array for user with no entries', async () => {
    analyticsService.getMoodTrend.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/v1/analytics/mood-trend')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.moodTrend).toEqual([]);
  });
});

// ── GET /api/v1/analytics/emotions ───────────────────────────────

describe('GET /api/v1/analytics/emotions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with emotionDistribution', async () => {
    analyticsService.getEmotionFrequency.mockResolvedValue({
      emotionDistribution: { ...EMPTY_FREQ, anxiety: 5 },
      mostFrequentEmotion: 'anxiety',
    });

    const res = await request(app)
      .get('/api/v1/analytics/emotions')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.emotionDistribution.anxiety).toBe(5);
    expect(res.body.data.mostFrequentEmotion).toBe('anxiety');
  });

  it('rejects invalid date range → 400', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/emotions?startDate=bad')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });

  it('calls service with userId from JWT, not from query', async () => {
    analyticsService.getEmotionFrequency.mockResolvedValue({
      emotionDistribution: EMPTY_FREQ,
      mostFrequentEmotion: null,
    });

    await request(app)
      .get('/api/v1/analytics/emotions?userId=hacked-user')
      .set('Authorization', `Bearer ${makeToken(USER_A_ID)}`);

    expect(analyticsService.getEmotionFrequency).toHaveBeenCalledWith(
      USER_A_ID, expect.any(Object)
    );
  });
});

// ── GET /api/v1/analytics/weekly ─────────────────────────────────

describe('GET /api/v1/analytics/weekly', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with correct weekly shape', async () => {
    analyticsService.getWeeklySummary.mockResolvedValue({
      period:               'weekly',
      startDate:            '2026-08-11',
      endDate:              '2026-08-17',
      entryCount:           3,
      mostFrequentEmotion:  'anxiety',
      emotionFrequency:     { ...EMPTY_FREQ, anxiety: 3 },
    });

    const res = await request(app)
      .get('/api/v1/analytics/weekly')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe('weekly');
    expect(res.body.data.entryCount).toBe(3);
    expect(res.body.data.mostFrequentEmotion).toBe('anxiety');
  });

  it('returns 200 with zero entries', async () => {
    analyticsService.getWeeklySummary.mockResolvedValue({
      period: 'weekly', startDate: '2026-08-11', endDate: '2026-08-17',
      entryCount: 0, mostFrequentEmotion: null, emotionFrequency: EMPTY_FREQ,
    });

    const res = await request(app)
      .get('/api/v1/analytics/weekly')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.entryCount).toBe(0);
  });
});

// ── GET /api/v1/analytics/monthly ────────────────────────────────

describe('GET /api/v1/analytics/monthly', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with correct monthly shape', async () => {
    analyticsService.getMonthlySummary.mockResolvedValue({
      period: 'monthly', month: '2026-08',
      startDate: '2026-08-01', endDate: '2026-08-31',
      entryCount: 10, mostFrequentEmotion: 'happy',
      emotionFrequency: { ...EMPTY_FREQ, happy: 10 },
    });

    const res = await request(app)
      .get('/api/v1/analytics/monthly')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe('monthly');
    expect(res.body.data.month).toBe('2026-08');
    expect(res.body.data.entryCount).toBe(10);
  });
});

// ── GET /api/v1/analytics/journal-history ────────────────────────

describe('GET /api/v1/analytics/journal-history', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated journal history', async () => {
    analyticsService.getJournalHistory.mockResolvedValue({
      entries: [
        { emotion: 'anxiety', reflection: 'Test.', createdAt: new Date() },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const res = await request(app)
      .get('/api/v1/analytics/journal-history')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it('rejects page=0 → 400', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/journal-history?page=0')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });

  it('rejects limit exceeding MAX_PAGE_SIZE via validator', async () => {
    analyticsService.getJournalHistory.mockResolvedValue({ entries: [], pagination: {} });

    // The validator coerces over-limit to MAX; service caps further.
    // So this should still succeed (not 400) because max is a cap not a rejection.
    const res = await request(app)
      .get('/api/v1/analytics/journal-history?limit=500')
      .set('Authorization', `Bearer ${makeToken()}`);

    // Joi max(100) rejects > 100
    expect(res.status).toBe(400);
  });

  it('calls service with userId from JWT', async () => {
    analyticsService.getJournalHistory.mockResolvedValue({
      entries: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    await request(app)
      .get('/api/v1/analytics/journal-history')
      .set('Authorization', `Bearer ${makeToken(USER_B_ID)}`);

    expect(analyticsService.getJournalHistory).toHaveBeenCalledWith(
      USER_B_ID, expect.any(Object)
    );
  });

  it('returns empty history without error', async () => {
    analyticsService.getJournalHistory.mockResolvedValue({
      entries: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    const res = await request(app)
      .get('/api/v1/analytics/journal-history')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ── User isolation ────────────────────────────────────────────────

describe('Analytics API — user isolation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('USER_A and USER_B get separate service calls on overview', async () => {
    analyticsService.getOverview.mockResolvedValue(makeOverview());

    await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${makeToken(USER_A_ID)}`);

    await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${makeToken(USER_B_ID)}`);

    expect(analyticsService.getOverview).toHaveBeenNthCalledWith(1, USER_A_ID);
    expect(analyticsService.getOverview).toHaveBeenNthCalledWith(2, USER_B_ID);
  });

  it('userId query param is stripped and ignored', async () => {
    analyticsService.getOverview.mockResolvedValue(makeOverview());

    await request(app)
      .get(`/api/v1/analytics/overview?userId=${USER_B_ID}`)
      .set('Authorization', `Bearer ${makeToken(USER_A_ID)}`);

    // Must use USER_A_ID from JWT, not USER_B_ID from query
    expect(analyticsService.getOverview).toHaveBeenCalledWith(USER_A_ID);
  });
});

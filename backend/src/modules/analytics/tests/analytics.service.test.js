/**
 * PURPOSE
 * -------
 * Unit tests for AnalyticsService — business logic, user isolation,
 * period calculations, frequency counts, and empty-data handling.
 *
 * Strategy: mock analyticsRepository, assert service behaviour.
 *
 * DEPENDS ON
 * ----------
 * jest (@jest/globals), analytics.service, analytics.repository (mocked)
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../repositories/analytics.repository.js', () => ({
  default: {
    countEntries:    jest.fn(),
    emotionFrequency: jest.fn(),
    moodTrend:       jest.fn(),
    entriesInRange:  jest.fn(),
    journalHistory:  jest.fn(),
  },
}));

const { default: analyticsService }    = await import('../services/analytics.service.js');
const { default: analyticsRepository } = await import('../repositories/analytics.repository.js');
const { default: ANALYTICS }           = await import('../constants/analytics.constants.js');

// ── Fixtures ───────────────────────────────────────────────────────

const USER_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const allZero = () => {
  const m = {};
  for (const e of ANALYTICS.EMOTIONS) m[e] = 0;
  return m;
};

const makeEntry = (emotion = 'anxiety', daysAgo = 0) => ({
  emotion,
  createdAt: new Date(Date.now() - daysAgo * 86400000),
});

// ── getOverview ────────────────────────────────────────────────────

describe('AnalyticsService — getOverview', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns correct overview when user has entries', async () => {
    analyticsRepository.countEntries.mockResolvedValue(3);
    analyticsRepository.emotionFrequency.mockResolvedValue([
      { emotion: 'anxiety', count: 2 },
      { emotion: 'happy',   count: 1 },
    ]);
    analyticsRepository.moodTrend.mockResolvedValue([
      { date: '2026-08-01', emotion: 'anxiety' },
    ]);
    analyticsRepository.entriesInRange.mockResolvedValue([
      makeEntry('anxiety'),
      makeEntry('anxiety'),
      makeEntry('happy'),
    ]);

    const result = await analyticsService.getOverview(USER_A);

    expect(result.totalEntries).toBe(3);
    expect(result.mostFrequentEmotion).toBe('anxiety');
    expect(result.emotionDistribution.anxiety).toBe(2);
    expect(result.emotionDistribution.happy).toBe(1);
    expect(result.emotionDistribution.sad).toBe(0); // all emotions present
    expect(result.moodTrend).toHaveLength(1);
    expect(result.weeklySummary).toBeDefined();
    expect(result.monthlySummary).toBeDefined();
  });

  it('returns safe empty overview for user with no entries', async () => {
    analyticsRepository.countEntries.mockResolvedValue(0);
    analyticsRepository.emotionFrequency.mockResolvedValue([]);
    analyticsRepository.moodTrend.mockResolvedValue([]);
    analyticsRepository.entriesInRange.mockResolvedValue([]);

    const result = await analyticsService.getOverview(USER_A);

    expect(result.totalEntries).toBe(0);
    expect(result.mostFrequentEmotion).toBeNull();
    expect(result.moodTrend).toEqual([]);
    expect(result.weeklySummary.entryCount).toBe(0);
    expect(result.monthlySummary.entryCount).toBe(0);
  });

  it('passes userId correctly to all repository calls', async () => {
    analyticsRepository.countEntries.mockResolvedValue(0);
    analyticsRepository.emotionFrequency.mockResolvedValue([]);
    analyticsRepository.moodTrend.mockResolvedValue([]);
    analyticsRepository.entriesInRange.mockResolvedValue([]);

    await analyticsService.getOverview(USER_A);

    expect(analyticsRepository.countEntries).toHaveBeenCalledWith(USER_A);
    expect(analyticsRepository.emotionFrequency).toHaveBeenCalledWith(USER_A, expect.any(Object));
    expect(analyticsRepository.moodTrend).toHaveBeenCalledWith(USER_A, expect.any(Object));
  });
});

// ── getMoodTrend ───────────────────────────────────────────────────

describe('AnalyticsService — getMoodTrend', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns chronological trend points', async () => {
    const points = [
      { date: '2026-08-01', emotion: 'happy' },
      { date: '2026-08-02', emotion: 'anxiety' },
      { date: '2026-08-03', emotion: 'sad' },
    ];
    analyticsRepository.moodTrend.mockResolvedValue(points);

    const result = await analyticsService.getMoodTrend(USER_A, {});

    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2026-08-01');
    expect(result[2].date).toBe('2026-08-03');
  });

  it('returns empty array when no entries', async () => {
    analyticsRepository.moodTrend.mockResolvedValue([]);
    const result = await analyticsService.getMoodTrend(USER_A, {});
    expect(result).toEqual([]);
  });

  it('passes date range to repository', async () => {
    analyticsRepository.moodTrend.mockResolvedValue([]);
    const startDate = new Date('2026-07-01');
    const endDate   = new Date('2026-07-31');

    await analyticsService.getMoodTrend(USER_A, { startDate, endDate });

    expect(analyticsRepository.moodTrend).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ startDate, endDate })
    );
  });

  it('only uses USER_A records — repository called with USER_A id', async () => {
    analyticsRepository.moodTrend.mockResolvedValue([]);
    await analyticsService.getMoodTrend(USER_B, {});
    expect(analyticsRepository.moodTrend).toHaveBeenCalledWith(USER_B, expect.any(Object));
    expect(analyticsRepository.moodTrend).not.toHaveBeenCalledWith(USER_A, expect.any(Object));
  });
});

// ── getEmotionFrequency ────────────────────────────────────────────

describe('AnalyticsService — getEmotionFrequency', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns frequency map with all V1 emotions', async () => {
    analyticsRepository.emotionFrequency.mockResolvedValue([
      { emotion: 'anxiety', count: 5 },
      { emotion: 'happy',   count: 3 },
    ]);

    const result = await analyticsService.getEmotionFrequency(USER_A, {});

    for (const e of ANALYTICS.EMOTIONS) {
      expect(result.emotionDistribution).toHaveProperty(e);
    }
    expect(result.emotionDistribution.anxiety).toBe(5);
    expect(result.emotionDistribution.happy).toBe(3);
    expect(result.emotionDistribution.sad).toBe(0);
    expect(result.mostFrequentEmotion).toBe('anxiety');
  });

  it('returns null mostFrequentEmotion when no entries', async () => {
    analyticsRepository.emotionFrequency.mockResolvedValue([]);
    const result = await analyticsService.getEmotionFrequency(USER_A, {});
    expect(result.mostFrequentEmotion).toBeNull();
    expect(result.emotionDistribution.anxiety).toBe(0);
  });

  it('handles tie-breaking alphabetically', async () => {
    analyticsRepository.emotionFrequency.mockResolvedValue([
      { emotion: 'sad',   count: 3 },
      { emotion: 'angry', count: 3 },
    ]);

    const result = await analyticsService.getEmotionFrequency(USER_A, {});
    // 'angry' < 'sad' alphabetically → angry wins the tie
    expect(result.mostFrequentEmotion).toBe('angry');
  });

  it('passes date range to repository', async () => {
    analyticsRepository.emotionFrequency.mockResolvedValue([]);
    const startDate = new Date('2026-08-01');
    const endDate   = new Date('2026-08-31');

    await analyticsService.getEmotionFrequency(USER_A, { startDate, endDate });

    expect(analyticsRepository.emotionFrequency).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ startDate, endDate })
    );
  });
});

// ── getWeeklySummary ───────────────────────────────────────────────

describe('AnalyticsService — getWeeklySummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns correct weekly summary', async () => {
    analyticsRepository.entriesInRange.mockResolvedValue([
      makeEntry('anxiety'),
      makeEntry('anxiety'),
      makeEntry('happy'),
    ]);

    const result = await analyticsService.getWeeklySummary(USER_A);

    expect(result.period).toBe('weekly');
    expect(result.entryCount).toBe(3);
    expect(result.mostFrequentEmotion).toBe('anxiety');
    expect(result.emotionFrequency.anxiety).toBe(2);
    expect(result.emotionFrequency.happy).toBe(1);
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns zero-entry weekly summary when no entries', async () => {
    analyticsRepository.entriesInRange.mockResolvedValue([]);
    const result = await analyticsService.getWeeklySummary(USER_A);
    expect(result.entryCount).toBe(0);
    expect(result.mostFrequentEmotion).toBeNull();
  });

  it('passes userId to repository', async () => {
    analyticsRepository.entriesInRange.mockResolvedValue([]);
    await analyticsService.getWeeklySummary(USER_A);
    expect(analyticsRepository.entriesInRange).toHaveBeenCalledWith(
      USER_A, expect.any(Date), expect.any(Date)
    );
  });

  it('startDate is a Monday', async () => {
    analyticsRepository.entriesInRange.mockResolvedValue([]);
    await analyticsService.getWeeklySummary(USER_A);
    const callArgs = analyticsRepository.entriesInRange.mock.calls[0];
    const startDate = callArgs[1];
    // Monday = day 1 in UTC
    expect(startDate.getUTCDay()).toBe(1);
  });
});

// ── getMonthlySummary ──────────────────────────────────────────────

describe('AnalyticsService — getMonthlySummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns correct monthly summary', async () => {
    analyticsRepository.entriesInRange.mockResolvedValue([
      makeEntry('happy'),
      makeEntry('happy'),
      makeEntry('sad'),
      makeEntry('neutral'),
    ]);

    const result = await analyticsService.getMonthlySummary(USER_A);

    expect(result.period).toBe('monthly');
    expect(result.entryCount).toBe(4);
    expect(result.mostFrequentEmotion).toBe('happy');
    expect(result.month).toMatch(/^\d{4}-\d{2}$/);
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-01$/); // starts on day 1
  });

  it('returns zero-entry monthly summary when no entries', async () => {
    analyticsRepository.entriesInRange.mockResolvedValue([]);
    const result = await analyticsService.getMonthlySummary(USER_A);
    expect(result.entryCount).toBe(0);
    expect(result.mostFrequentEmotion).toBeNull();
  });

  it('startDate is day 1 of the month', async () => {
    analyticsRepository.entriesInRange.mockResolvedValue([]);
    await analyticsService.getMonthlySummary(USER_A);
    const callArgs = analyticsRepository.entriesInRange.mock.calls[0];
    const startDate = callArgs[1];
    expect(startDate.getUTCDate()).toBe(1);
    expect(startDate.getUTCHours()).toBe(0);
  });

  it('handles single entry in month', async () => {
    analyticsRepository.entriesInRange.mockResolvedValue([makeEntry('fear')]);
    const result = await analyticsService.getMonthlySummary(USER_A);
    expect(result.entryCount).toBe(1);
    expect(result.mostFrequentEmotion).toBe('fear');
  });
});

// ── getJournalHistory ──────────────────────────────────────────────

describe('AnalyticsService — getJournalHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated history for authenticated user', async () => {
    const docs = [
      { _id: 'a1', emotion: 'anxiety', reflection: 'Nervous day.', createdAt: new Date() },
      { _id: 'a2', emotion: 'happy',   reflection: 'Good news!',   createdAt: new Date() },
    ];
    analyticsRepository.journalHistory.mockResolvedValue({ docs, total: 2 });

    const result = await analyticsService.getJournalHistory(USER_A, { page: 1, limit: 20 });

    expect(result.entries).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(1);

    expect(analyticsRepository.journalHistory).toHaveBeenCalledWith(
      USER_A, expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it('caps limit at MAX_PAGE_SIZE', async () => {
    analyticsRepository.journalHistory.mockResolvedValue({ docs: [], total: 0 });

    await analyticsService.getJournalHistory(USER_A, { limit: 99999 });

    expect(analyticsRepository.journalHistory).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ limit: ANALYTICS.MAX_PAGE_SIZE })
    );
  });

  it('uses defaults when no query provided', async () => {
    analyticsRepository.journalHistory.mockResolvedValue({ docs: [], total: 0 });

    await analyticsService.getJournalHistory(USER_A, {});

    expect(analyticsRepository.journalHistory).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({
        page:  ANALYTICS.DEFAULT_PAGE,
        limit: ANALYTICS.DEFAULT_PAGE_SIZE,
      })
    );
  });

  it('returns empty history gracefully', async () => {
    analyticsRepository.journalHistory.mockResolvedValue({ docs: [], total: 0 });

    const result = await analyticsService.getJournalHistory(USER_A, {});

    expect(result.entries).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it('user isolation — repository receives USER_B id when USER_B requests', async () => {
    analyticsRepository.journalHistory.mockResolvedValue({ docs: [], total: 0 });

    await analyticsService.getJournalHistory(USER_B, {});

    expect(analyticsRepository.journalHistory).toHaveBeenCalledWith(USER_B, expect.any(Object));
    expect(analyticsRepository.journalHistory).not.toHaveBeenCalledWith(USER_A, expect.any(Object));
  });
});

// ── Multiple emotions with equal frequency ─────────────────────────

describe('AnalyticsService — tie-breaking determinism', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the same winner across multiple calls with identical data', async () => {
    analyticsRepository.emotionFrequency.mockResolvedValue([
      { emotion: 'neutral', count: 4 },
      { emotion: 'fear',    count: 4 },
      { emotion: 'angry',   count: 4 },
    ]);

    const r1 = await analyticsService.getEmotionFrequency(USER_A, {});
    const r2 = await analyticsService.getEmotionFrequency(USER_A, {});

    expect(r1.mostFrequentEmotion).toBe(r2.mostFrequentEmotion);
    // 'angry' < 'fear' < 'neutral' alphabetically
    expect(r1.mostFrequentEmotion).toBe('angry');
  });
});

/**
 * PURPOSE
 * -------
 * API-level integration tests for /api/v1/journal endpoints.
 *
 * These tests exercise the full Express stack (router, auth middleware,
 * Joi validation, controller, service) using Supertest against the real app.js.
 * The MongoDB-dependent service layer is mocked so no real DB is needed.
 *
 * SETUP
 * -----
 * - Env vars are set before any module is imported
 * - journalService is mocked (service singleton)
 * - app.js is imported after mocking
 *
 * COVERS
 * ------
 * Authentication:
 *   - All 5 endpoints return 401 without a token
 *
 * POST /api/v1/journal:
 *   - Valid request → 201 with entry
 *   - Invalid emotion → 400
 *   - Empty reflection → 400
 *   - Notes too long → 400
 *
 * GET /api/v1/journal:
 *   - Returns only authenticated user's entries
 *   - Returns paginated result
 *
 * GET /api/v1/journal/:id:
 *   - Returns owned entry
 *   - Non-existent entry → 404
 *   - Invalid ObjectId → 400
 *
 * PATCH /api/v1/journal/:id:
 *   - Updates owned entry
 *   - Non-owner entry → 404
 *   - Invalid ObjectId → 400
 *
 * DELETE /api/v1/journal/:id:
 *   - Deletes owned entry → 204
 *   - Non-owner entry → 404
 *
 * DEPENDS ON
 * ----------
 * supertest, jest, app.js, journal.service (mocked), jwt utils
 */

// ── Env vars BEFORE any project import ───────────────────────────
process.env.MONGO_URI          = 'mongodb://localhost:27017/mindcare-test';
process.env.JWT_SECRET         = 'test-jwt-secret-for-api-tests';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-api-tests';
process.env.NODE_ENV           = 'test';

import { jest } from '@jest/globals';
import request  from 'supertest';

// ── Mock journalService BEFORE app.js is imported ────────────────

jest.unstable_mockModule('../services/journal.service.js', () => ({
  default: {
    createEntry: jest.fn(),
    listEntries: jest.fn(),
    getEntry:    jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
  },
}));

const { default: app }            = await import('../../../app.js');
const { signAccessToken }         = await import('../../../shared/utils/jwt.js');
const { default: journalService } = await import('../services/journal.service.js');
const {
  JournalEntryNotFoundError,
} = await import('../errors/journal.errors.js');

// ── Helpers ───────────────────────────────────────────────────────

const USER_A_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const ENTRY_ID  = 'cccccccccccccccccccccccc';

const makeToken = (userId = USER_A_ID) =>
  signAccessToken({ userId, email: `user-${userId}@mindcare.ai` });

const makeEntry = (overrides = {}) => ({
  _id:        ENTRY_ID,
  userId:     USER_A_ID,
  emotion:    'anxiety',
  reflection: 'I felt nervous about my interview today.',
  notes:      'Practice again tomorrow.',
  createdAt:  new Date().toISOString(),
  updatedAt:  new Date().toISOString(),
  ...overrides,
});

const ENDPOINT = '/api/v1/journal';

// ── Authentication tests ──────────────────────────────────────────

describe('Journal API — authentication (all endpoints return 401 without token)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POST /api/v1/journal → 401', async () => {
    const res = await request(app).post(ENDPOINT).send({});
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/journal → 401', async () => {
    const res = await request(app).get(ENDPOINT);
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/journal/:id → 401', async () => {
    const res = await request(app).get(`${ENDPOINT}/${ENTRY_ID}`);
    expect(res.status).toBe(401);
  });

  it('PATCH /api/v1/journal/:id → 401', async () => {
    const res = await request(app).patch(`${ENDPOINT}/${ENTRY_ID}`).send({});
    expect(res.status).toBe(401);
  });

  it('DELETE /api/v1/journal/:id → 401', async () => {
    const res = await request(app).delete(`${ENDPOINT}/${ENTRY_ID}`);
    expect(res.status).toBe(401);
  });
});

// ── POST /api/v1/journal ─────────────────────────────────────────

describe('POST /api/v1/journal — create journal entry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates an entry for a valid authenticated request → 201', async () => {
    const entry = makeEntry();
    journalService.createEntry.mockResolvedValue(entry);

    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        emotion:    'anxiety',
        reflection: 'I felt nervous about my interview today.',
        notes:      'Practice again tomorrow.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entry.emotion).toBe('anxiety');
    expect(res.body.data.entry.reflection).toBe('I felt nervous about my interview today.');
    expect(res.body.data.entry).toHaveProperty('createdAt');
    expect(res.body.data.entry).toHaveProperty('updatedAt');
  });

  it('creates an entry without notes → 201', async () => {
    const entry = makeEntry({ notes: null });
    journalService.createEntry.mockResolvedValue(entry);

    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        emotion:    'happy',
        reflection: 'Good day overall.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.entry.emotion).toBe('anxiety'); // mock returns makeEntry defaults
  });

  it('passes userId from JWT, not from req.body', async () => {
    const entry = makeEntry();
    journalService.createEntry.mockResolvedValue(entry);

    await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${makeToken(USER_A_ID)}`)
      .send({
        emotion:    'anxiety',
        reflection: 'Test reflection.',
        userId:     USER_B_ID, // should be ignored
      });

    expect(journalService.createEntry).toHaveBeenCalledWith(
      USER_A_ID,
      expect.not.objectContaining({ userId: expect.anything() })
    );
  });

  it('rejects invalid emotion → 400', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        emotion:    'excited123',
        reflection: 'A valid reflection.',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects empty reflection → 400', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        emotion:    'happy',
        reflection: '',
      });

    expect(res.status).toBe(400);
  });

  it('rejects missing reflection → 400', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ emotion: 'sad' });

    expect(res.status).toBe(400);
  });

  it('rejects notes exceeding max length → 400', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        emotion:    'sad',
        reflection: 'Valid reflection.',
        notes:      'x'.repeat(1001),
      });

    expect(res.status).toBe(400);
  });

  it('rejects null emotion → 400', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        emotion:    null,
        reflection: 'Valid reflection.',
      });

    expect(res.status).toBe(400);
  });
});

// ── GET /api/v1/journal ──────────────────────────────────────────

describe('GET /api/v1/journal — list entries', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns only the authenticated user\'s entries → 200', async () => {
    const entries = [makeEntry(), makeEntry({ _id: 'dddddddddddddddddddddddd' })];
    journalService.listEntries.mockResolvedValue({
      entries,
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });

    const res = await request(app)
      .get(ENDPOINT)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(2);

    // Service was called with USER_A's userId
    expect(journalService.listEntries).toHaveBeenCalledWith(USER_A_ID, expect.any(Object));
  });

  it('User A and User B get separate service calls', async () => {
    journalService.listEntries.mockResolvedValue({
      entries: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    await request(app).get(ENDPOINT).set('Authorization', `Bearer ${makeToken(USER_A_ID)}`);
    await request(app).get(ENDPOINT).set('Authorization', `Bearer ${makeToken(USER_B_ID)}`);

    expect(journalService.listEntries).toHaveBeenNthCalledWith(1, USER_A_ID, expect.any(Object));
    expect(journalService.listEntries).toHaveBeenNthCalledWith(2, USER_B_ID, expect.any(Object));
  });
});

// ── GET /api/v1/journal/:id ──────────────────────────────────────

describe('GET /api/v1/journal/:id — get single entry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns owned entry → 200', async () => {
    journalService.getEntry.mockResolvedValue(makeEntry());

    const res = await request(app)
      .get(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.entry._id).toBe(ENTRY_ID);
  });

  it('returns 404 for a non-existent entry', async () => {
    journalService.getEntry.mockRejectedValue(new JournalEntryNotFoundError());

    const res = await request(app)
      .get(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed ObjectId', async () => {
    const res = await request(app)
      .get(`${ENDPOINT}/not-a-valid-id`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });

  it('does not expose another user\'s entry (service returns 404)', async () => {
    // The service itself returns 404 for non-owner — same as not found
    journalService.getEntry.mockRejectedValue(new JournalEntryNotFoundError());

    const res = await request(app)
      .get(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken(USER_B_ID)}`);

    expect(res.status).toBe(404);
    // Must not expose internal error details
    expect(res.body.stack).toBeUndefined();
  });
});

// ── PATCH /api/v1/journal/:id ────────────────────────────────────

describe('PATCH /api/v1/journal/:id — update entry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates an owned entry → 200', async () => {
    const updated = makeEntry({ emotion: 'happy', reflection: 'Better now.' });
    journalService.updateEntry.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ emotion: 'happy', reflection: 'Better now.' });

    expect(res.status).toBe(200);
    expect(res.body.data.entry.emotion).toBe('happy');
  });

  it('returns 404 when the service rejects due to non-ownership', async () => {
    journalService.updateEntry.mockRejectedValue(new JournalEntryNotFoundError());

    const res = await request(app)
      .patch(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken(USER_B_ID)}`)
      .send({ emotion: 'sad' });

    expect(res.status).toBe(404);
  });

  it('rejects invalid emotion on update → 400', async () => {
    const res = await request(app)
      .patch(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ emotion: 'flying' });

    expect(res.status).toBe(400);
  });

  it('rejects empty body → 400', async () => {
    const res = await request(app)
      .patch(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 for a malformed ObjectId', async () => {
    const res = await request(app)
      .patch(`${ENDPOINT}/bad-id`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ emotion: 'sad' });

    expect(res.status).toBe(400);
  });

  it('cannot change userId via body (field is stripped by validator)', async () => {
    const updated = makeEntry();
    journalService.updateEntry.mockResolvedValue(updated);

    await request(app)
      .patch(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ emotion: 'sad', userId: USER_B_ID });

    // Service called with dto that does NOT contain userId
    expect(journalService.updateEntry).toHaveBeenCalledWith(
      USER_A_ID,
      ENTRY_ID,
      expect.not.objectContaining({ userId: expect.anything() })
    );
  });
});

// ── DELETE /api/v1/journal/:id ───────────────────────────────────

describe('DELETE /api/v1/journal/:id — delete entry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes an owned entry → 204', async () => {
    journalService.deleteEntry.mockResolvedValue(undefined);

    const res = await request(app)
      .delete(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(204);
  });

  it('returns 404 when the service rejects due to non-ownership', async () => {
    journalService.deleteEntry.mockRejectedValue(new JournalEntryNotFoundError());

    const res = await request(app)
      .delete(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken(USER_B_ID)}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed ObjectId', async () => {
    const res = await request(app)
      .delete(`${ENDPOINT}/bad-id`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });

  it('does not expose internal errors in the response body', async () => {
    journalService.deleteEntry.mockRejectedValue(new JournalEntryNotFoundError());

    const res = await request(app)
      .delete(`${ENDPOINT}/${ENTRY_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.body.stack).toBeUndefined();
  });
});

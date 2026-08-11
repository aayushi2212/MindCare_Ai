/**
 * PURPOSE
 * -------
 * API-level integration tests for POST /api/v1/response/generate.
 *
 * These tests exercise the full Express stack — router mount, auth
 * middleware, Joi validation, controller, service, and generator —
 * using Supertest against the real app.js instance.
 *
 * No service methods are called directly; every assertion goes through
 * the actual HTTP layer.
 *
 * SETUP
 * -----
 * Environment variables are set before any module is imported so that
 * config/environment/index.js does not throw for missing required vars.
 * The app does NOT connect to MongoDB for these tests (server.js is
 * never imported). The response engine has no DB dependency, so this
 * is safe.
 *
 * COVERS
 * ------
 * - Missing auth token → 401
 * - Invalid auth token → 401
 * - Valid authenticated request → 200 with response contract
 * - Empty userMessage → 400
 * - confidence > 1 → 400
 * - confidence < 0 → 400
 * - Unsupported emotion label → 400
 * - high_risk safety → 503 (UnsafeResponseGenerationError)
 * - anxiety + 0.92 confidence → calming_support strategy
 *
 * DEPENDS ON
 * ----------
 * supertest, app.js, jwt utils, response.constants
 */

// ── Set required env vars BEFORE any project import ───────────────
process.env.MONGO_URI           = 'mongodb://localhost:27017/mindcare-test';
process.env.JWT_SECRET          = 'test-jwt-secret-for-integration-tests';
process.env.JWT_REFRESH_SECRET  = 'test-refresh-secret-for-integration-tests';
process.env.NODE_ENV            = 'test';

import { jest } from '@jest/globals';
import request  from 'supertest';

const { default: app }               = await import('../../../app.js');
const { signAccessToken }            = await import('../../../shared/utils/jwt.js');
const { default: RESPONSE }          = await import('../constants/response.constants.js');

// ── Helpers ────────────────────────────────────────────────────────

/** Generate a valid JWT for a synthetic test user. */
const makeToken = () =>
  signAccessToken({ userId: 'test-user-id-000000000001', email: 'test@mindcare.ai' });

/** Baseline valid request body. */
const validBody = (overrides = {}) => ({
  userMessage: 'I am feeling anxious about my interview tomorrow.',
  emotion: {
    label:      'anxiety',
    confidence: 0.92,
  },
  context: {
    recentMessages: [],
    messageCount:   0,
    lastInteraction: null,
  },
  safety: {
    status: 'safe',
  },
  ...overrides,
});

const ENDPOINT = '/api/v1/response/generate';

// ── Authentication tests ───────────────────────────────────────────

describe('POST /api/v1/response/generate — authentication', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send(validBody());

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeTruthy();
  });

  it('returns 401 when Authorization header contains an invalid token', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', 'Bearer invalid-token-string')
      .send(validBody());

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when Authorization header is malformed (no Bearer prefix)', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', makeToken())   // missing "Bearer " prefix
      .send(validBody());

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ── Successful authenticated request ──────────────────────────────

describe('POST /api/v1/response/generate — successful request', () => {
  it('returns 200 with a valid response contract for a safe anxiety request', async () => {
    const token = makeToken();
    const res   = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(validBody());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeTruthy();

    // data contract
    const data = res.body.data;
    expect(data).toBeDefined();
    expect(typeof data.message).toBe('string');
    expect(data.message.length).toBeGreaterThan(0);
    expect(typeof data.strategy).toBe('string');
    expect(data.metadata).toBeDefined();
    expect(data.metadata.emotion).toBe('anxiety');
    expect(data.metadata.confidence).toBe(0.92);
  });

  it('does not expose stack traces in the response body', async () => {
    const token = makeToken();
    const res   = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(validBody());

    // In test mode NODE_ENV=test; the error middleware only exposes
    // stack in development. We set NODE_ENV=test so stacks should be absent.
    expect(res.body).not.toHaveProperty('stack');
  });
});

// ── Validation tests ──────────────────────────────────────────────

describe('POST /api/v1/response/generate — validation', () => {
  let token;
  beforeAll(() => { token = makeToken(); });

  it('returns 400 when userMessage is empty', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(validBody({ userMessage: '' }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeTruthy();
  });

  it('returns 400 when userMessage is missing', async () => {
    const body = validBody();
    delete body.userMessage;

    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when confidence exceeds 1', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(validBody({ emotion: { label: 'anxiety', confidence: 1.5 } }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when confidence is negative', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(validBody({ emotion: { label: 'anxiety', confidence: -0.1 } }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an unsupported emotion label', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(validBody({ emotion: { label: 'unknown_emotion', confidence: 0.90 } }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when emotion object is missing entirely', async () => {
    const body = validBody();
    delete body.emotion;

    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ── High-risk safety bypass ───────────────────────────────────────

describe('POST /api/v1/response/generate — high_risk safety', () => {
  it('blocks normal response generation and returns 503 for high_risk safety status', async () => {
    const token = makeToken();
    const res   = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(validBody({
        userMessage: 'test high risk message',
        emotion:     { label: 'sad', confidence: 0.90 },
        safety:      { status: 'high_risk' },
      }));

    // UnsafeResponseGenerationError has statusCode 503
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeTruthy();
    // Must NOT contain a normal response
    expect(res.body.data).toBeUndefined();
  });
});

// ── Complete Module 5 flow: anxiety → calming_support ────────────

describe('POST /api/v1/response/generate — complete pipeline (anxiety)', () => {
  it('routes anxiety + 0.92 confidence to calming_support strategy', async () => {
    const token = makeToken();
    const res   = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userMessage: 'I am feeling anxious about my interview tomorrow.',
        emotion: {
          label:      'anxiety',
          confidence: 0.92,
        },
        context: {
          recentMessages: [],
          messageCount:   0,
          lastInteraction: null,
        },
        safety: {
          status: 'safe',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.strategy).toBe(RESPONSE.STRATEGY.CALMING_SUPPORT);
    expect(typeof data.message).toBe('string');
    expect(data.message.length).toBeGreaterThan(0);
    expect(data.metadata.emotion).toBe('anxiety');
    expect(data.metadata.confidence).toBe(0.92);
    expect(typeof data.metadata.contextualised).toBe('boolean');
  });

  it('returns a breathing suggestion in metadata for calming_support', async () => {
    const token = makeToken();
    const res   = await request(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(validBody());

    expect(res.status).toBe(200);
    expect(res.body.data.metadata.breathingSuggested).toBe(true);
    expect(res.body.data.metadata.journalingSuggested).toBe(false);
  });
});

/**
 * PURPOSE
 * -------
 * Unit tests for the validateSendAndProcess middleware.
 *
 * Verifies that invalid messages are rejected BEFORE they reach
 * SafetyService or the MessagePipeline.
 *
 * COVERS
 * ------
 * A. INPUT VALIDATION (Part 6A)
 *    - Missing content → 400
 *    - Empty string content → 400
 *    - Whitespace-only content → 400
 *    - Non-string content type → 400
 *    - Oversized content (> MESSAGE_MAX_LENGTH) → 400
 *    - Valid content → passes through
 *    - Unknown fields stripped (injection guard)
 *
 * DEPENDS ON
 * ----------
 * validateSendAndProcess (chat.validator), chat.constants
 */

import { jest } from '@jest/globals';

const { validateSendAndProcess } = await import('../validators/chat.validator.js');
const { default: CHAT }          = await import('../constants/chat.constants.js');

// ── Helper: run middleware and capture result ──────────────────────

function runValidator(body) {
  return new Promise((resolve) => {
    const req  = { body };
    const res  = {};
    const next = (err) => resolve({ err, req });
    validateSendAndProcess(req, res, next);
  });
}

// ── Tests ──────────────────────────────────────────────────────────

describe('validateSendAndProcess — rejects invalid input', () => {
  it('rejects missing content', async () => {
    const { err } = await runValidator({});
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(400);
  });

  it('rejects empty string content', async () => {
    const { err } = await runValidator({ content: '' });
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(400);
  });

  it('rejects whitespace-only content', async () => {
    const { err } = await runValidator({ content: '   ' });
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(400);
  });

  it('rejects whitespace-only content (tabs and newlines)', async () => {
    const { err } = await runValidator({ content: '\t\n  \r\n' });
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(400);
  });

  it('rejects non-string content (number)', async () => {
    const { err } = await runValidator({ content: 42 });
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(400);
  });

  it('rejects non-string content (object)', async () => {
    const { err } = await runValidator({ content: { text: 'hello' } });
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(400);
  });

  it('rejects non-string content (array)', async () => {
    const { err } = await runValidator({ content: ['hello'] });
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(400);
  });

  it('rejects content exceeding MESSAGE_MAX_LENGTH', async () => {
    const oversized = 'a'.repeat(CHAT.MESSAGE_MAX_LENGTH + 1);
    const { err } = await runValidator({ content: oversized });
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(400);
  });

  it('rejects null content', async () => {
    const { err } = await runValidator({ content: null });
    expect(err).toBeDefined();
    expect(err.statusCode ?? err.status).toBe(400);
  });
});

describe('validateSendAndProcess — accepts valid input', () => {
  it('accepts a normal message', async () => {
    const { err, req } = await runValidator({ content: 'I am stressed about my exams' });
    expect(err).toBeUndefined();
    expect(req.body.content).toBe('I am stressed about my exams');
  });

  it('trims leading/trailing whitespace from valid content', async () => {
    const { err, req } = await runValidator({ content: '  hello world  ' });
    expect(err).toBeUndefined();
    expect(req.body.content).toBe('hello world');
  });

  it('accepts content at maximum length', async () => {
    const maxContent = 'a'.repeat(CHAT.MESSAGE_MAX_LENGTH);
    const { err } = await runValidator({ content: maxContent });
    expect(err).toBeUndefined();
  });

  it('strips unknown fields (injection guard)', async () => {
    const { err, req } = await runValidator({
      content: 'hello',
      sender:  'user',           // not part of /send contract
      metadata: { evil: true }, // not part of /send contract
    });
    expect(err).toBeUndefined();
    expect(req.body).not.toHaveProperty('sender');
    expect(req.body).not.toHaveProperty('metadata');
    expect(req.body.content).toBe('hello');
  });
});

describe('validateSendAndProcess — safety guard', () => {
  it('does not expose safety logic in validation error messages', async () => {
    const { err } = await runValidator({ content: '' });
    expect(err).toBeDefined();
    // Error message must not hint at safety keywords, patterns, or detection logic
    const msg = err.message ?? '';
    expect(msg).not.toMatch(/safety|crisis|pattern|keyword|detect/i);
  });
});

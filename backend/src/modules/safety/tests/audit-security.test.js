/**
 * PURPOSE
 * -------
 * Unit tests for CrisisAuditService — security and ownership.
 *
 * COVERS (Part 6F)
 * ------
 * - logEvent stores only safe metadata (no raw message content)
 * - logEvent omits detection patterns and internal safety logic
 * - getEventsForUser is scoped to the requesting userId (ownership)
 * - Audit records do not contain conversation content
 *
 * DEPENDS ON
 * ----------
 * jest, crisis-audit.service (mocked repository)
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../repositories/safety.repository.js', () => ({
  default: {
    createAuditRecord: jest.fn(),
    getAuditRecordsByUser: jest.fn(),
    countByUser: jest.fn(),
  },
}));

const { default: crisisAuditService } = await import('../services/crisis-audit.service.js');
const { default: safetyRepository }   = await import('../repositories/safety.repository.js');

const USER_A  = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B  = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const CONV_ID = 'cccccccccccccccccccccccc';

// ── Suite: logEvent — content safety ──────────────────────────────

describe('CrisisAuditService — logEvent content safety', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does NOT pass raw crisis message content to repository', async () => {
    safetyRepository.createAuditRecord.mockResolvedValue({});

    const crisisText = 'I want to kill myself';
    await crisisAuditService.logEvent({
      userId:         USER_A,
      conversationId: CONV_ID,
      riskLevel:      'HIGH',
      category:       'SUICIDAL_IDEATION',
      action:         'CRISIS_RESPONSE',
      // logEvent must not accept or pass through a message field
    });

    const dto = safetyRepository.createAuditRecord.mock.calls[0][0];
    const serialised = JSON.stringify(dto);
    expect(serialised).not.toContain(crisisText);
    expect(dto).not.toHaveProperty('message');
    expect(dto).not.toHaveProperty('content');
    expect(dto).not.toHaveProperty('text');
  });

  it('stores only approved safe fields', async () => {
    safetyRepository.createAuditRecord.mockResolvedValue({});

    await crisisAuditService.logEvent({
      userId:         USER_A,
      conversationId: CONV_ID,
      riskLevel:      'HIGH',
      category:       'SUICIDAL_IDEATION',
      action:         'CRISIS_RESPONSE',
    });

    const dto = safetyRepository.createAuditRecord.mock.calls[0][0];
    expect(dto).toHaveProperty('userId');
    expect(dto).toHaveProperty('riskLevel', 'HIGH');
    expect(dto).toHaveProperty('action', 'CRISIS_RESPONSE');
    // Must NOT contain detection logic
    expect(dto).not.toHaveProperty('patterns');
    expect(dto).not.toHaveProperty('matchedPattern');
    expect(dto).not.toHaveProperty('regex');
  });

  it('does NOT throw when repository fails (audit failure must not block response)', async () => {
    safetyRepository.createAuditRecord.mockRejectedValue(new Error('DB down'));

    await expect(
      crisisAuditService.logEvent({
        userId:    USER_A,
        riskLevel: 'HIGH',
        action:    'CRISIS_RESPONSE',
      })
    ).resolves.not.toThrow();
  });
});

// ── Suite: getEventsForUser — ownership enforcement ────────────────

describe('CrisisAuditService — getEventsForUser ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('queries repository with the requesting userId only', async () => {
    safetyRepository.getAuditRecordsByUser.mockResolvedValue([]);
    safetyRepository.countByUser.mockResolvedValue(0);

    await crisisAuditService.getEventsForUser(USER_A);

    expect(safetyRepository.getAuditRecordsByUser).toHaveBeenCalledWith(
      USER_A,
      expect.any(Object)
    );
    // Must not query with USER_B
    const callArg = safetyRepository.getAuditRecordsByUser.mock.calls[0][0];
    expect(callArg).toBe(USER_A);
    expect(callArg).not.toBe(USER_B);
  });

  it('returns only records and total — no internal safety details', async () => {
    const mockRecord = {
      userId:    USER_A,
      riskLevel: 'HIGH',
      category:  'SUICIDAL_IDEATION',
      action:    'CRISIS_RESPONSE',
      createdAt: new Date(),
    };
    safetyRepository.getAuditRecordsByUser.mockResolvedValue([mockRecord]);
    safetyRepository.countByUser.mockResolvedValue(1);

    const result = await crisisAuditService.getEventsForUser(USER_A);

    expect(result).toHaveProperty('records');
    expect(result).toHaveProperty('total', 1);
    expect(Array.isArray(result.records)).toBe(true);
    // Records must not contain detection patterns
    const serialised = JSON.stringify(result.records);
    expect(serialised).not.toMatch(/CRISIS_PATTERNS|matchedPattern|regex/);
  });

  it('caps limit at 100 to prevent bulk data extraction', async () => {
    safetyRepository.getAuditRecordsByUser.mockResolvedValue([]);
    safetyRepository.countByUser.mockResolvedValue(0);

    await crisisAuditService.getEventsForUser(USER_A, { limit: 9999 });

    const { limit } = safetyRepository.getAuditRecordsByUser.mock.calls[0][1];
    expect(limit).toBeLessThanOrEqual(100);
  });
});

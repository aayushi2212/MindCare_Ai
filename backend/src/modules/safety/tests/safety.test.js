/**
 * PURPOSE
 * -------
 * Unit tests for the Safety Service.
 *
 * COVERS
 * ------
 * - High-risk keyword detection across all pattern categories
 * - Safe message pass-through (no false positives)
 * - SafetyResult structure (riskLevel, category, action, resources)
 * - Crisis response content requirements
 * - False-positive guard: emotional language alone must NOT trigger crisis
 * - Null / non-string inputs handled safely
 */

const { default: safetyService } = await import('../services/safety.service.js');

// ── High-risk message examples ─────────────────────────────────────
const HIGH_RISK_MESSAGES = [
  // Suicidal ideation category
  'I want to kill myself',
  "I'm going to end my life",
  'I want to commit suicide',
  'I am suicidal',
  'I want to take my own life',
  'I want to die',
  'I have no reason to live',
  "I can't go on anymore",
  'I am ready to die',
  // Self-harm category
  "I've been self-harming",
  "I'm thinking of an overdose",
  'I want to hurt myself',
  'I cut myself last night',
  // Severe crisis
  'life is not worth living',
  'there is no point in living',
];

// ── Safe messages — must NOT trigger crisis detection ───────────────
const SAFE_MESSAGES = [
  'I feel sad today',
  "I'm a bit anxious about my exam",
  'Today was really hard at work',
  "I'm feeling happy",
  'I had a great day',
  'My life is going well',
  'I am scared of failing my exam',       // fear without self-harm context
  'My friend died last year',              // grief — not an active crisis statement
  'I am so tired all the time',
  'I feel hopeless about my career',      // hopeless ≠ suicidal
  'I sometimes feel like giving up on my project',  // project, not life
  '',
  null,
  undefined,
  123,
];

// ── Tests ──────────────────────────────────────────────────────────

describe('SafetyService — high-risk detection', () => {
  it.each(HIGH_RISK_MESSAGES)('detects high-risk message: "%s"', (text) => {
    const result = safetyService.checkMessage(text);
    expect(result.isHighRisk).toBe(true);
    expect(result.status).toBe('high_risk');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.action).toBe('CRISIS_RESPONSE');
    expect(result.category).not.toBeNull();
    expect(result.crisisResponse).toBeTruthy();
    expect(typeof result.crisisResponse).toBe('string');
    expect(result.crisisResponse.length).toBeGreaterThan(20);
    expect(result.resources).not.toBeNull();
  });
});

describe('SafetyService — safe messages (no false positives)', () => {
  it.each(SAFE_MESSAGES)('passes through safe message: %p', (text) => {
    const result = safetyService.checkMessage(text);
    expect(result.isHighRisk).toBe(false);
    expect(result.status).toBe('safe');
    expect(result.riskLevel).toBe('NONE');
    expect(result.action).toBe('CONTINUE');
    expect(result.category).toBeNull();
    expect(result.crisisResponse).toBeNull();
    expect(result.resources).toBeNull();
  });
});

describe('SafetyService — result structure', () => {
  it('always returns all required fields', () => {
    const safe  = safetyService.checkMessage('I feel okay');
    const risky = safetyService.checkMessage('I want to end my life');

    for (const result of [safe, risky]) {
      expect(result).toHaveProperty('isHighRisk');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('crisisResponse');
      expect(result).toHaveProperty('resources');
    }
  });

  it('crisis response mentions professional support or helpline', () => {
    const result = safetyService.checkMessage('I want to commit suicide');
    expect(result.crisisResponse).toMatch(/helpline|counsell|support|crisis/i);
  });

  it('resources include immediate and professional entries', () => {
    const result = safetyService.checkMessage('I want to kill myself');
    expect(Array.isArray(result.resources.immediate)).toBe(true);
    expect(result.resources.immediate.length).toBeGreaterThan(0);
    expect(Array.isArray(result.resources.professional)).toBe(true);
  });

  it('resources are absent (null) for safe messages', () => {
    const result = safetyService.checkMessage('I feel a bit down');
    expect(result.resources).toBeNull();
  });
});

describe('SafetyService — crisis response quality', () => {
  it('does not diagnose or prescribe', () => {
    const { crisisResponse } = safetyService.checkMessage('I want to die');
    // Should not contain diagnostic or medical language
    expect(crisisResponse).not.toMatch(/you have|diagnosed|medication|prescribe/i);
  });

  it('encourages reaching out without judgment', () => {
    const { crisisResponse } = safetyService.checkMessage('I want to hurt myself');
    expect(crisisResponse).toMatch(/reach out|contact|connect|care|support/i);
  });
});

/**
 * PURPOSE
 * -------
 * Unit tests for the Safety Service.
 *
 * COVERS
 * ------
 * - High-risk keyword detection across all pattern categories
 * - Safe message pass-through (no false positives)
 * - False-positive guard: contextual/educational statements must NOT trigger
 * - SafetyResult structure (riskLevel, category, action, resources)
 * - Crisis response content requirements
 * - Null / non-string inputs handled safely
 */

const { default: safetyService } = await import('../services/safety.service.js');

// ── High-risk message examples ──────────────────────────────────────
const HIGH_RISK_MESSAGES = [
  // Suicidal ideation — first-person intent
  'I want to kill myself',
  "I'm going to end my life",
  'I want to commit suicide',
  'I am suicidal',
  'I feel suicidal',
  'I have suicidal thoughts',
  'I want to take my own life',
  'I want to die',
  'I have no reason to live',
  "I can't go on anymore",
  'I am ready to die',
  'my suicide attempt last year',
  // Self-harm — first-person
  "I've been self-harming",
  "I'm thinking of an overdose",
  'I want to overdose',
  'I took an overdose',
  'I want to hurt myself',
  'I cut myself last night',
  // Severe crisis
  'life is not worth living',
  'there is no point in living',
  // First-person "don't want to live anymore" — explicit in Blueprint §8
  "I don't want to live anymore",
  "I do not want to live anymore",
  "I don't want to be alive",
];

// ── Safe messages — must NOT trigger crisis detection ───────────────
const SAFE_MESSAGES = [
  // Generic emotional language without self-harm context
  'I feel sad today',
  "I'm a bit anxious about my exam",
  'Today was really hard at work',
  "I'm feeling happy",
  'I had a great day',
  'My life is going well',
  'I am scared of failing my exam',
  'I am so tired all the time',
  'I feel hopeless about my career',
  'I sometimes feel like giving up on my project',
  // Grief (third-party death, not active crisis)
  'My friend died last year',
  // Explicitly educational / contextual — must NOT trigger
  'I read an article about suicide prevention',
  'My assignment is about suicide awareness',
  'suicide prevention is important',
  'I am studying overdose prevention',
  'Someone overdosed at a party last week',
  'The doctor warned about an accidental overdose',
  // Invalid / empty inputs
  '',
  null,
  undefined,
  123,
];

// ── Tests: High-risk detection ─────────────────────────────────────

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

// ── Tests: Safe messages (false-positive guard) ────────────────────

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

// ── Tests: Contextual false-positive cases (explicit) ─────────────
// These are the cases the Blueprint specifically calls out.

describe('SafetyService — contextual false-positive protection', () => {
  it('does NOT trigger for "My friend died last year"', () => {
    const result = safetyService.checkMessage('My friend died last year');
    expect(result.isHighRisk).toBe(false);
  });

  it('does NOT trigger for "I read about suicide prevention"', () => {
    const result = safetyService.checkMessage('I read an article about suicide prevention');
    expect(result.isHighRisk).toBe(false);
  });

  it('does NOT trigger for "My assignment is about suicide awareness"', () => {
    const result = safetyService.checkMessage('My assignment is about suicide awareness');
    expect(result.isHighRisk).toBe(false);
  });

  it('does NOT trigger for "I am scared of failing my exam"', () => {
    const result = safetyService.checkMessage('I am scared of failing my exam');
    expect(result.isHighRisk).toBe(false);
  });

  it('does NOT trigger for "I feel hopeless about my career"', () => {
    const result = safetyService.checkMessage('I feel hopeless about my career');
    expect(result.isHighRisk).toBe(false);
  });

  it('does NOT trigger for third-party overdose mention', () => {
    const result = safetyService.checkMessage('Someone overdosed at a party last week');
    expect(result.isHighRisk).toBe(false);
  });

  it('does NOT trigger for educational overdose context', () => {
    const result = safetyService.checkMessage('I am studying overdose prevention');
    expect(result.isHighRisk).toBe(false);
  });

  it('DOES still trigger for "I want to commit suicide"', () => {
    const result = safetyService.checkMessage('I want to commit suicide');
    expect(result.isHighRisk).toBe(true);
  });

  it('DOES still trigger for "I am suicidal"', () => {
    const result = safetyService.checkMessage('I am suicidal');
    expect(result.isHighRisk).toBe(true);
  });

  it('DOES still trigger for "I want to overdose"', () => {
    const result = safetyService.checkMessage('I want to overdose');
    expect(result.isHighRisk).toBe(true);
  });

  it('DOES trigger for "I don\'t want to live anymore"', () => {
    const result = safetyService.checkMessage("I don't want to live anymore");
    expect(result.isHighRisk).toBe(true);
  });

  it('DOES trigger for "I don\'t want to be alive"', () => {
    const result = safetyService.checkMessage("I don't want to be alive");
    expect(result.isHighRisk).toBe(true);
  });

  it('does NOT trigger for "I don\'t want to live far from home" (housing context)', () => {
    const result = safetyService.checkMessage("I don't want to live far from home");
    expect(result.isHighRisk).toBe(false);
  });

  it('does NOT trigger for "He doesn\'t want to live in that city" (third-party)', () => {
    const result = safetyService.checkMessage("He doesn't want to live in that city");
    expect(result.isHighRisk).toBe(false);
  });
});

// ── Tests: SafetyResult structure ─────────────────────────────────

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
    expect(result.resources.professional.length).toBeGreaterThan(0);
  });

  it('resources include international entry', () => {
    const result = safetyService.checkMessage('I want to kill myself');
    expect(Array.isArray(result.resources.international)).toBe(true);
    expect(result.resources.international.length).toBeGreaterThan(0);
  });

  it('resources include trusted_person guidance', () => {
    const result = safetyService.checkMessage('I want to kill myself');
    expect(typeof result.resources.trusted_person).toBe('string');
    expect(result.resources.trusted_person.length).toBeGreaterThan(10);
  });

  it('resources are absent (null) for safe messages', () => {
    const result = safetyService.checkMessage('I feel a bit down');
    expect(result.resources).toBeNull();
  });
});

// ── Tests: Crisis response quality ────────────────────────────────

describe('SafetyService — crisis response quality', () => {
  it('does not diagnose or prescribe', () => {
    const { crisisResponse } = safetyService.checkMessage('I want to die');
    expect(crisisResponse).not.toMatch(/you have|diagnosed|medication|prescribe/i);
  });

  it('encourages reaching out without judgment', () => {
    const { crisisResponse } = safetyService.checkMessage('I want to hurt myself');
    expect(crisisResponse).toMatch(/reach out|contact|connect|care|support/i);
  });
});

// ── Tests: Resource integrity ──────────────────────────────────────
// Ensure no 24/7 claim for services that are not 24/7.

describe('SafetyService — resource integrity', () => {
  it('iCall description does not claim 24/7 availability', () => {
    const result = safetyService.checkMessage('I want to kill myself');
    const iCall = result.resources.immediate.find(r => r.name === 'iCall');
    expect(iCall).toBeDefined();
    expect(iCall.description).not.toMatch(/24\/7/i);
  });

  it('Vandrevala Foundation is listed in professional resources', () => {
    const result = safetyService.checkMessage('I want to kill myself');
    const vf = result.resources.professional.find(r => r.name === 'Vandrevala Foundation');
    expect(vf).toBeDefined();
    expect(vf.number).toBeTruthy();
  });

  it('resources do not expose detection patterns or keywords', () => {
    const result = safetyService.checkMessage('I want to kill myself');
    const serialised = JSON.stringify(result.resources);
    // Resources must not contain regex source text or pattern fragments
    expect(serialised).not.toMatch(/\\bsuicid|\\bkill|CRISIS_PATTERNS/);
  });
});

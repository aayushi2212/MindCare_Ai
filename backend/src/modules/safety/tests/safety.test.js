/**
 * PURPOSE
 * -------
 * Unit tests for the Safety Service.
 *
 * COVERS
 * ------
 * - High-risk keyword detection
 * - Safe message pass-through
 * - Result structure
 * - Crisis response content
 */

const { default: safetyService } = await import('../services/safety.service.js');

describe('SafetyService — checkMessage', () => {

  describe('high-risk detection', () => {
    const HIGH_RISK = [
      'I want to kill myself',
      'I\'m going to end my life',
      'I want to commit suicide',
      'I\'ve been self-harming',
      'I\'m thinking of an overdose',
      'I have no reason to live',
      'I can\'t go on anymore',
      'I want to hurt myself',
    ];

    it.each(HIGH_RISK)('detects high-risk message: "%s"', (text) => {
      const result = safetyService.checkMessage(text);
      expect(result.isHighRisk).toBe(true);
      expect(result.status).toBe('high_risk');
      expect(result.crisisResponse).toBeTruthy();
      expect(typeof result.crisisResponse).toBe('string');
      expect(result.crisisResponse.length).toBeGreaterThan(20);
    });
  });

  describe('safe messages', () => {
    const SAFE = [
      'I feel sad today',
      'I\'m a bit anxious about my exam',
      'Today was really hard at work',
      'I\'m feeling happy',
      'I had a great day',
      'My life is going well',
      '',
      null,
      undefined,
      123,
    ];

    it.each(SAFE)('passes through safe message: %p', (text) => {
      const result = safetyService.checkMessage(text);
      expect(result.isHighRisk).toBe(false);
      expect(result.status).toBe('safe');
      expect(result.crisisResponse).toBeNull();
    });
  });

  describe('result structure', () => {
    it('always returns isHighRisk, status, and crisisResponse', () => {
      const safe   = safetyService.checkMessage('I feel okay');
      const risky  = safetyService.checkMessage('I want to end my life');

      expect(safe).toHaveProperty('isHighRisk');
      expect(safe).toHaveProperty('status');
      expect(safe).toHaveProperty('crisisResponse');

      expect(risky).toHaveProperty('isHighRisk');
      expect(risky).toHaveProperty('status');
      expect(risky).toHaveProperty('crisisResponse');
    });

    it('crisis response mentions professional support', () => {
      const result = safetyService.checkMessage('I want to commit suicide');
      expect(result.crisisResponse).toMatch(/helpline|counsell|support|crisis/i);
    });
  });
});

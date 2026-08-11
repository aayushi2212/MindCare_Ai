/**
 * PURPOSE
 * -------
 * Unit and integration tests for the Response Engine (Module 5).
 *
 * COVERS
 * ------
 * Strategy selection:
 *   - V1 blueprint emotion labels → correct strategies
 *   - low-confidence → neutral_support fallback
 *   - high_risk safety → safety_bypass
 *
 * Context:
 *   - context available (contextualised response)
 *   - empty context
 *   - multiple prior messages
 *
 * Safety:
 *   - safe status → normal response
 *   - high_risk status → UnsafeResponseGenerationError
 *   - missing/not_evaluated → normal response
 *
 * Journaling suggestions:
 *   - included for empathetic_support and neutral_support strategies
 *   - not included for calming_support, de_escalation, etc.
 *
 * Breathing suggestions:
 *   - included for calming_support and de_escalation strategies
 *   - not included for empathetic_support, etc.
 *
 * Validation:
 *   - empty message, too long, invalid emotion, invalid confidence
 *
 * DEPENDS ON
 * ----------
 * jest, response.service, response-strategy, response-generator, response.constants
 */

import { jest } from '@jest/globals';

const { default: responseService }    = await import('../services/response.service.js');
const { selectStrategy }              = await import('../strategies/response-strategy.js');
const { generateResponse }            = await import('../strategies/response-generator.js');
const { default: RESPONSE }           = await import('../constants/response.constants.js');

const {
  InvalidResponseInputError,
  UnsupportedResponseStrategyError,
  ResponseGenerationError,
  InvalidGeneratedResponseError,
  UnsafeResponseGenerationError,
} = await import('../errors/response.errors.js');

// ── Fixtures ───────────────────────────────────────────────────────

const makeEmotion = (label = 'sad', confidence = 0.9, extra = {}) => ({
  label,
  confidence,
  ...extra,
});

const makeContext = (messages = []) => ({
  recentMessages:  messages,
  messageCount:    messages.length,
  lastInteraction: messages.length ? new Date().toISOString() : null,
});

const makeSafety = (status = RESPONSE.SAFETY_STATUS.NOT_EVALUATED) => ({ status });

const makeInput = (overrides = {}) => ({
  userMessage: 'I am feeling really down today.',
  emotion:     makeEmotion(),
  context:     makeContext(),
  safety:      makeSafety(),
  ...overrides,
});

// ── Strategy selection — V1 blueprint labels ────────────────────────

describe('selectStrategy — V1 blueprint emotion-to-strategy mapping', () => {
  const highConf   = 0.9;
  const safeResult = makeSafety(RESPONSE.SAFETY_STATUS.SAFE);

  it.each([
    ['sad',      'empathetic_support'],
    ['anxiety',  'calming_support'],
    ['fear',     'calming_support'],
    ['angry',    'de_escalation'],
    ['happy',    'positive_engagement'],
    ['surprise', 'curious_engagement'],
    ['neutral',  'neutral_support'],
  ])('V1 emotion "%s" → strategy "%s"', (label, expectedStrategy) => {
    const strategy = selectStrategy({ label, confidence: highConf }, safeResult);
    expect(strategy).toBe(expectedStrategy);
  });
});

describe('selectStrategy — confidence fallback', () => {
  it('returns neutral_support when confidence is below threshold', () => {
    const strategy = selectStrategy(
      { label: 'sad', confidence: 0.1 },
      makeSafety(RESPONSE.SAFETY_STATUS.SAFE)
    );
    expect(strategy).toBe(RESPONSE.STRATEGY.NEUTRAL_SUPPORT);
  });

  it('returns neutral_support when confidence equals 0', () => {
    const strategy = selectStrategy(
      { label: 'angry', confidence: 0 },
      makeSafety(RESPONSE.SAFETY_STATUS.SAFE)
    );
    expect(strategy).toBe(RESPONSE.STRATEGY.NEUTRAL_SUPPORT);
  });

  it('uses emotion strategy when confidence is exactly at threshold', () => {
    const strategy = selectStrategy(
      { label: 'happy', confidence: RESPONSE.HIGH_CONFIDENCE_THRESHOLD },
      makeSafety(RESPONSE.SAFETY_STATUS.SAFE)
    );
    expect(strategy).toBe(RESPONSE.STRATEGY.POSITIVE_ENGAGEMENT);
  });
});

describe('selectStrategy — safety bypass', () => {
  it('returns safety_bypass for high_risk safety status regardless of emotion', () => {
    const strategy = selectStrategy(
      { label: 'happy', confidence: 0.99 },
      makeSafety(RESPONSE.SAFETY_STATUS.HIGH_RISK)
    );
    expect(strategy).toBe(RESPONSE.STRATEGY.SAFETY_BYPASS);
  });

  it('returns safety_bypass for high_risk even with low confidence', () => {
    const strategy = selectStrategy(
      { label: 'neutral', confidence: 0.1 },
      makeSafety(RESPONSE.SAFETY_STATUS.HIGH_RISK)
    );
    expect(strategy).toBe(RESPONSE.STRATEGY.SAFETY_BYPASS);
  });
});

// ── Response generator ─────────────────────────────────────────────

describe('generateResponse — successful generation', () => {
  it('returns message, strategy, and metadata', () => {
    const result = generateResponse(
      makeInput({ userMessage: 'I feel sad', emotion: makeEmotion('sad', 0.9) }),
      RESPONSE.STRATEGY.EMPATHETIC_SUPPORT
    );
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('strategy', RESPONSE.STRATEGY.EMPATHETIC_SUPPORT);
    expect(result).toHaveProperty('metadata.emotion', 'sad');
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThanOrEqual(RESPONSE.MIN_RESPONSE_LENGTH);
  });

  it('incorporates context when prior messages exist', () => {
    const input = makeInput({
      userMessage: 'I failed the interview.',
      emotion:     makeEmotion('sad', 0.92),
      context:     makeContext([
        { role: 'user',      content: 'I have an interview tomorrow.' },
        { role: 'assistant', content: 'Good luck — you have prepared well.' },
      ]),
    });
    const result = generateResponse(input, RESPONSE.STRATEGY.EMPATHETIC_SUPPORT);
    expect(result.metadata.contextualised).toBe(true);
  });

  it('sets contextualised=false when context is empty', () => {
    const result = generateResponse(
      makeInput({ context: makeContext([]) }),
      RESPONSE.STRATEGY.EMPATHETIC_SUPPORT
    );
    expect(result.metadata.contextualised).toBe(false);
  });

  it.each([
    [RESPONSE.STRATEGY.EMPATHETIC_SUPPORT],
    [RESPONSE.STRATEGY.CALMING_SUPPORT],
    [RESPONSE.STRATEGY.DE_ESCALATION],
    [RESPONSE.STRATEGY.POSITIVE_ENGAGEMENT],
    [RESPONSE.STRATEGY.CURIOUS_ENGAGEMENT],
    [RESPONSE.STRATEGY.NEUTRAL_SUPPORT],
  ])('generates a valid response for strategy "%s"', (strategy) => {
    const result = generateResponse(makeInput(), strategy);
    expect(result.message.length).toBeGreaterThanOrEqual(RESPONSE.MIN_RESPONSE_LENGTH);
    expect(result.message.length).toBeLessThanOrEqual(RESPONSE.MAX_RESPONSE_LENGTH);
    expect(result.strategy).toBe(strategy);
  });
});

describe('generateResponse — journaling suggestions', () => {
  it('includes a journaling suggestion for empathetic_support strategy', () => {
    const result = generateResponse(
      makeInput({ emotion: makeEmotion('sad', 0.9) }),
      RESPONSE.STRATEGY.EMPATHETIC_SUPPORT
    );
    expect(result.metadata.journalingSuggested).toBe(true);
    // Message should contain journaling-related text
    expect(result.message.toLowerCase()).toMatch(/journal|writing|write|paper/);
  });

  it('includes a journaling suggestion for neutral_support strategy', () => {
    const result = generateResponse(
      makeInput({ emotion: makeEmotion('neutral', 0.8) }),
      RESPONSE.STRATEGY.NEUTRAL_SUPPORT
    );
    expect(result.metadata.journalingSuggested).toBe(true);
  });

  it('does not include a journaling suggestion for calming_support strategy', () => {
    const result = generateResponse(
      makeInput({ emotion: makeEmotion('anxiety', 0.9) }),
      RESPONSE.STRATEGY.CALMING_SUPPORT
    );
    expect(result.metadata.journalingSuggested).toBe(false);
  });

  it('does not include a journaling suggestion for positive_engagement strategy', () => {
    const result = generateResponse(
      makeInput({ emotion: makeEmotion('happy', 0.9) }),
      RESPONSE.STRATEGY.POSITIVE_ENGAGEMENT
    );
    expect(result.metadata.journalingSuggested).toBe(false);
  });
});

describe('generateResponse — breathing suggestions', () => {
  it('includes a breathing suggestion for calming_support strategy', () => {
    const result = generateResponse(
      makeInput({ emotion: makeEmotion('anxiety', 0.9) }),
      RESPONSE.STRATEGY.CALMING_SUPPORT
    );
    expect(result.metadata.breathingSuggested).toBe(true);
    expect(result.message.toLowerCase()).toMatch(/breath/);
  });

  it('includes a breathing suggestion for de_escalation strategy', () => {
    const result = generateResponse(
      makeInput({ emotion: makeEmotion('angry', 0.9) }),
      RESPONSE.STRATEGY.DE_ESCALATION
    );
    expect(result.metadata.breathingSuggested).toBe(true);
  });

  it('does not include a breathing suggestion for empathetic_support strategy', () => {
    const result = generateResponse(
      makeInput({ emotion: makeEmotion('sad', 0.9) }),
      RESPONSE.STRATEGY.EMPATHETIC_SUPPORT
    );
    expect(result.metadata.breathingSuggested).toBe(false);
  });

  it('does not include a breathing suggestion for positive_engagement strategy', () => {
    const result = generateResponse(
      makeInput({ emotion: makeEmotion('happy', 0.9) }),
      RESPONSE.STRATEGY.POSITIVE_ENGAGEMENT
    );
    expect(result.metadata.breathingSuggested).toBe(false);
  });
});

describe('generateResponse — failure cases', () => {
  it('throws ResponseGenerationError for unknown strategy', () => {
    expect(() =>
      generateResponse(makeInput(), 'completely_unknown_strategy')
    ).toThrow(ResponseGenerationError);
  });
});

// ── ResponseService — full pipeline ───────────────────────────────

describe('ResponseService.generateResponse — strategy selection', () => {
  it.each([
    ['sad',      0.9,  RESPONSE.STRATEGY.EMPATHETIC_SUPPORT],
    ['anxiety',  0.8,  RESPONSE.STRATEGY.CALMING_SUPPORT],
    ['fear',     0.7,  RESPONSE.STRATEGY.CALMING_SUPPORT],
    ['angry',    0.85, RESPONSE.STRATEGY.DE_ESCALATION],
    ['happy',    0.95, RESPONSE.STRATEGY.POSITIVE_ENGAGEMENT],
    ['surprise', 0.6,  RESPONSE.STRATEGY.CURIOUS_ENGAGEMENT],
    ['neutral',  0.8,  RESPONSE.STRATEGY.NEUTRAL_SUPPORT],
  ])('V1 emotion "%s" results in strategy "%s"', async (label, confidence, expectedStrategy) => {
    const result = await responseService.generateResponse(
      makeInput({ emotion: makeEmotion(label, confidence) })
    );
    expect(result.strategy).toBe(expectedStrategy);
  });

  it('uses neutral_support for low-confidence emotion', async () => {
    const result = await responseService.generateResponse(
      makeInput({ emotion: makeEmotion('sad', 0.2) })
    );
    expect(result.strategy).toBe(RESPONSE.STRATEGY.NEUTRAL_SUPPORT);
  });
});

describe('ResponseService.generateResponse — context', () => {
  it('handles empty context gracefully', async () => {
    const result = await responseService.generateResponse(
      makeInput({ context: makeContext([]) })
    );
    expect(result.metadata.contextualised).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('incorporates prior context when messages exist', async () => {
    const result = await responseService.generateResponse(
      makeInput({
        context: makeContext([
          { role: 'user',      content: 'I have an interview tomorrow.' },
          { role: 'assistant', content: 'You will do great.' },
        ]),
      })
    );
    expect(result.metadata.contextualised).toBe(true);
  });

  it('handles null context without error', async () => {
    const result = await responseService.generateResponse(makeInput({ context: null }));
    expect(result.message).toBeTruthy();
  });
});

describe('ResponseService.generateResponse — safety', () => {
  it('generates a normal response when safety status is safe', async () => {
    const result = await responseService.generateResponse(
      makeInput({ safety: makeSafety(RESPONSE.SAFETY_STATUS.SAFE) })
    );
    expect(result.message).toBeTruthy();
    expect(result.strategy).not.toBe(RESPONSE.STRATEGY.SAFETY_BYPASS);
  });

  it('generates a normal response when safety status is not_evaluated', async () => {
    const result = await responseService.generateResponse(
      makeInput({ safety: makeSafety(RESPONSE.SAFETY_STATUS.NOT_EVALUATED) })
    );
    expect(result.message).toBeTruthy();
  });

  it('throws UnsafeResponseGenerationError when safety is high_risk', async () => {
    await expect(
      responseService.generateResponse(
        makeInput({ safety: makeSafety(RESPONSE.SAFETY_STATUS.HIGH_RISK) })
      )
    ).rejects.toThrow(UnsafeResponseGenerationError);
  });

  it('uses default safety when safety is not supplied', async () => {
    const input = makeInput();
    delete input.safety;
    const result = await responseService.generateResponse(input);
    expect(result.message).toBeTruthy();
  });
});

describe('ResponseService.generateResponse — validation', () => {
  it('throws InvalidResponseInputError when userMessage is empty', async () => {
    await expect(
      responseService.generateResponse(makeInput({ userMessage: '' }))
    ).rejects.toThrow(InvalidResponseInputError);
  });

  it('throws InvalidResponseInputError when userMessage is missing', async () => {
    const input = makeInput();
    delete input.userMessage;
    await expect(responseService.generateResponse(input)).rejects.toThrow(InvalidResponseInputError);
  });

  it('throws InvalidResponseInputError when userMessage exceeds max length', async () => {
    await expect(
      responseService.generateResponse(
        makeInput({ userMessage: 'a'.repeat(RESPONSE.USER_MESSAGE_MAX_LENGTH + 1) })
      )
    ).rejects.toThrow(InvalidResponseInputError);
  });

  it('throws InvalidResponseInputError when emotion is missing', async () => {
    const input = makeInput();
    delete input.emotion;
    await expect(responseService.generateResponse(input)).rejects.toThrow(InvalidResponseInputError);
  });

  it('throws InvalidResponseInputError when confidence is out of range', async () => {
    await expect(
      responseService.generateResponse(makeInput({ emotion: makeEmotion('sad', 1.5) }))
    ).rejects.toThrow(InvalidResponseInputError);
  });

  it('throws InvalidResponseInputError when input itself is null', async () => {
    await expect(responseService.generateResponse(null)).rejects.toThrow(InvalidResponseInputError);
  });
});

describe('ResponseService.generateResponse — response structure', () => {
  it('always returns message, strategy, and metadata', async () => {
    const result = await responseService.generateResponse(makeInput());
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('strategy');
    expect(result).toHaveProperty('metadata');
    expect(result).toHaveProperty('metadata.emotion');
    expect(result).toHaveProperty('metadata.confidence');
    expect(result).toHaveProperty('metadata.contextualised');
    expect(result).toHaveProperty('metadata.journalingSuggested');
    expect(result).toHaveProperty('metadata.breathingSuggested');
  });

  it('response message is within allowed length bounds', async () => {
    const result = await responseService.generateResponse(makeInput());
    expect(result.message.length).toBeGreaterThanOrEqual(RESPONSE.MIN_RESPONSE_LENGTH);
    expect(result.message.length).toBeLessThanOrEqual(RESPONSE.MAX_RESPONSE_LENGTH);
  });
});

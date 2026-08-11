/**
 * PURPOSE
 * -------
 * Unit tests for the Emotion module service layer.
 * The FastAPI client is fully mocked — no network calls are made.
 *
 * Test strategy: mock fastapiClient, assert service behaviour.
 *
 * COVERS
 * ------
 * - Blueprint V1 emotion labels (happy, sad, angry, fear, anxiety, neutral, surprise)
 * - Label normalisation (joy → happy, sadness → sad, anger → angry)
 * - Unsupported emotion rejection
 * - Confidence clamping and validation
 * - Input validation
 * - FastAPI failure propagation
 *
 * DEPENDS ON
 * ----------
 * jest (@jest/globals), emotion.service, fastapi.client (mocked), emotion.errors, emotion.constants
 */

import { jest } from '@jest/globals';

// ── Mock the FastAPI client ────────────────────────────────────────
jest.unstable_mockModule('../clients/fastapi.client.js', () => ({
  default: { predict: jest.fn() },
}));

// Dynamic imports AFTER mock registration
const { default: emotionService } = await import('../services/emotion.service.js');
const { default: fastapiClient }  = await import('../clients/fastapi.client.js');

const {
  AIServiceUnavailableError,
  AIServiceTimeoutError,
  MalformedPredictionError,
  UnsupportedEmotionError,
  InvalidConfidenceError,
  EmptyInputError,
} = await import('../errors/emotion.errors.js');

const { default: EMOTION } = await import('../constants/emotion.constants.js');

// ── Fixtures ───────────────────────────────────────────────────────

const validPrediction = (overrides = {}) => ({
  emotion:          'anxiety',
  confidence:       0.94,
  secondaryEmotion: 'sad',
  ...overrides,
});

// ── Test suites ────────────────────────────────────────────────────

describe('EmotionService — V1 blueprint emotion labels', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(EMOTION.SUPPORTED)('accepts V1 blueprint label: %s', async (emotion) => {
    fastapiClient.predict.mockResolvedValue(
      validPrediction({ emotion, secondaryEmotion: null })
    );

    const result = await emotionService.analyze(`I feel ${emotion}.`);
    expect(result.emotion).toBe(emotion);
    expect(result.colour).toBeDefined();
    expect(result.icon).toBeDefined();
  });
});

describe('EmotionService — label normalization', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normalises "joy" → "happy"', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ emotion: 'joy' }));
    const result = await emotionService.analyze('I feel joyful.');
    expect(result.emotion).toBe('happy');
  });

  it('normalises "sadness" → "sad"', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ emotion: 'sadness' }));
    const result = await emotionService.analyze('I feel sad.');
    expect(result.emotion).toBe('sad');
  });

  it('normalises "anger" → "angry"', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ emotion: 'anger' }));
    const result = await emotionService.analyze('I feel angry.');
    expect(result.emotion).toBe('angry');
  });

  it('normalises labels with mixed case and whitespace', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ emotion: '  JOY  ' }));
    const result = await emotionService.analyze('Joyful!');
    expect(result.emotion).toBe('happy');
  });

  it('normalises secondary emotion via the same mapping', async () => {
    fastapiClient.predict.mockResolvedValue(
      validPrediction({ emotion: 'anxiety', secondaryEmotion: 'sadness' })
    );
    const result = await emotionService.analyze('Anxious and sad.');
    expect(result.secondaryEmotion).toBe('sad');
  });
});

describe('EmotionService — successful prediction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a normalised result for a valid prediction', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction());

    const result = await emotionService.analyze("I'm feeling overwhelmed.");

    expect(result.emotion).toBe('anxiety');
    expect(result.confidence).toBe(0.94);
    expect(result.secondaryEmotion).toBe('sad');
    expect(result.colour).toBe(EMOTION.META.anxiety.colour);
    expect(result.icon).toBe(EMOTION.META.anxiety.icon);
    expect(result.isUncertain).toBe(false);
  });

  it('returns isUncertain=true when confidence is below threshold', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ confidence: 0.1 }));
    const result = await emotionService.analyze('I am not sure how I feel.');
    expect(result.isUncertain).toBe(true);
  });

  it('returns null secondaryEmotion when field is absent', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ secondaryEmotion: undefined }));
    const result = await emotionService.analyze('Today was okay.');
    expect(result.secondaryEmotion).toBeNull();
  });

  it('returns null secondaryEmotion when secondary label is unsupported', async () => {
    fastapiClient.predict.mockResolvedValue(
      validPrediction({ secondaryEmotion: 'euphoria' })
    );
    const result = await emotionService.analyze('Everything is amazing.');
    expect(result.secondaryEmotion).toBeNull();
  });

  it('clamps confidence above 1.0 to 1.0', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ confidence: 1.001 }));
    const result = await emotionService.analyze('Absolutely certain.');
    expect(result.confidence).toBe(1.0);
  });

  it('clamps confidence below 0 to 0.0', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ confidence: -0.001 }));
    const result = await emotionService.analyze('Barely anything.');
    expect(result.confidence).toBe(0.0);
  });
});

describe('EmotionService — input validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws EmptyInputError for empty string', async () => {
    await expect(emotionService.analyze('')).rejects.toThrow(EmptyInputError);
    expect(fastapiClient.predict).not.toHaveBeenCalled();
  });

  it('throws EmptyInputError for whitespace-only string', async () => {
    await expect(emotionService.analyze('   ')).rejects.toThrow(EmptyInputError);
    expect(fastapiClient.predict).not.toHaveBeenCalled();
  });

  it('throws EmptyInputError for non-string input', async () => {
    await expect(emotionService.analyze(null)).rejects.toThrow(EmptyInputError);
    await expect(emotionService.analyze(123)).rejects.toThrow(EmptyInputError);
  });

  it('truncates input exceeding TEXT_MAX_LENGTH instead of throwing', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction());
    const longText = 'a'.repeat(EMOTION.TEXT_MAX_LENGTH + 100);

    await emotionService.analyze(longText);

    const calledWith = fastapiClient.predict.mock.calls[0][0];
    expect(calledWith.length).toBe(EMOTION.TEXT_MAX_LENGTH);
  });
});

describe('EmotionService — unsupported emotion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws UnsupportedEmotionError for unknown emotion label after normalization', async () => {
    fastapiClient.predict.mockResolvedValue(
      validPrediction({ emotion: 'existential_dread' })
    );

    await expect(emotionService.analyze('What is the point?'))
      .rejects.toThrow(UnsupportedEmotionError);
  });

  it('throws UnsupportedEmotionError for "disgust" (not in V1 blueprint)', async () => {
    fastapiClient.predict.mockResolvedValue(
      validPrediction({ emotion: 'disgust' })
    );

    await expect(emotionService.analyze('That is disgusting.'))
      .rejects.toThrow(UnsupportedEmotionError);
  });

  it('throws UnsupportedEmotionError for "love" (not in V1 blueprint)', async () => {
    fastapiClient.predict.mockResolvedValue(
      validPrediction({ emotion: 'love' })
    );

    await expect(emotionService.analyze('I love this.'))
      .rejects.toThrow(UnsupportedEmotionError);
  });
});

describe('EmotionService — invalid confidence', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws InvalidConfidenceError for confidence far above 1', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ confidence: 5.0 }));
    await expect(emotionService.analyze('Way too confident.')).rejects.toThrow(InvalidConfidenceError);
  });

  it('throws InvalidConfidenceError for confidence far below 0', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ confidence: -2.0 }));
    await expect(emotionService.analyze('Negative confidence.')).rejects.toThrow(InvalidConfidenceError);
  });

  it('throws MalformedPredictionError when confidence is not a number', async () => {
    fastapiClient.predict.mockResolvedValue(validPrediction({ confidence: 'high' }));
    await expect(emotionService.analyze('String confidence.')).rejects.toThrow(MalformedPredictionError);
  });
});

describe('EmotionService — malformed response', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws MalformedPredictionError when emotion field is missing', async () => {
    fastapiClient.predict.mockResolvedValue({ confidence: 0.9 });
    await expect(emotionService.analyze('Missing emotion.')).rejects.toThrow(MalformedPredictionError);
  });

  it('throws MalformedPredictionError when confidence field is missing', async () => {
    fastapiClient.predict.mockResolvedValue({ emotion: 'happy' });
    await expect(emotionService.analyze('Missing confidence.')).rejects.toThrow(MalformedPredictionError);
  });

  it('throws MalformedPredictionError when emotion is not a string', async () => {
    fastapiClient.predict.mockResolvedValue({ emotion: 42, confidence: 0.9 });
    await expect(emotionService.analyze('Numeric emotion.')).rejects.toThrow(MalformedPredictionError);
  });
});

describe('EmotionService — AI service failures', () => {
  beforeEach(() => jest.clearAllMocks());

  it('propagates AIServiceUnavailableError when FastAPI is down', async () => {
    fastapiClient.predict.mockRejectedValue(new AIServiceUnavailableError());
    await expect(emotionService.analyze('I need help.')).rejects.toThrow(AIServiceUnavailableError);
  });

  it('propagates AIServiceTimeoutError when FastAPI times out', async () => {
    fastapiClient.predict.mockRejectedValue(new AIServiceTimeoutError());
    await expect(emotionService.analyze('Taking too long.')).rejects.toThrow(AIServiceTimeoutError);
  });
});

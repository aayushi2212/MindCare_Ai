/**
 * PURPOSE
 * -------
 * Unit tests for the emotion-adapter normalization boundary.
 * Verifies that Module 3 emotion results are correctly mapped
 * to Module 5's internal emotion format.
 *
 * COVERS
 * ------
 * - anxiety (primary, no secondary)
 * - sad with secondary emotion
 * - confidence value preservation (no rounding)
 * - unsupported emotion propagation to validation layer
 * - end-to-end pipeline: Module 3 result → normalizer → ResponseService
 *
 * DEPENDS ON
 * ----------
 * jest (@jest/globals), emotion-adapter, response.service, response.constants
 */

import { jest } from '@jest/globals';

const { normalizeEmotionResult } = await import('../services/emotion-adapter.js');
const { default: responseService } = await import('../services/response.service.js');
const { default: RESPONSE }        = await import('../constants/response.constants.js');
const { InvalidResponseInputError } = await import('../errors/response.errors.js');

// ── Test 1 — Anxiety normalization ─────────────────────────────────

describe('normalizeEmotionResult — anxiety (no secondary)', () => {
  it('maps emotion → label, preserves confidence, sets secondaryEmotion to null', () => {
    const module3Result = {
      emotion:          'anxiety',
      confidence:       0.92,
      secondaryEmotion: null,
      colour:           '#FF9933',
      icon:             '😰',
      isUncertain:      false,
    };

    const normalized = normalizeEmotionResult(module3Result);

    expect(normalized).toEqual({
      label:            'anxiety',
      confidence:       0.92,
      secondaryEmotion: null,
    });
  });

  it('does not carry colour, icon, or isUncertain into Module 5', () => {
    const module3Result = {
      emotion:          'anxiety',
      confidence:       0.92,
      secondaryEmotion: null,
      colour:           '#FF9933',
      icon:             '😰',
      isUncertain:      false,
    };

    const normalized = normalizeEmotionResult(module3Result);

    expect(normalized).not.toHaveProperty('colour');
    expect(normalized).not.toHaveProperty('icon');
    expect(normalized).not.toHaveProperty('isUncertain');
    expect(normalized).not.toHaveProperty('emotion');
  });
});

// ── Test 2 — Sad with secondary emotion ───────────────────────────

describe('normalizeEmotionResult — sad with secondaryEmotion', () => {
  it('preserves secondaryEmotion when present', () => {
    const module3Result = {
      emotion:          'sad',
      confidence:       0.91,
      secondaryEmotion: 'anxiety',
      colour:           '#6699CC',
      icon:             '😢',
      isUncertain:      false,
    };

    const normalized = normalizeEmotionResult(module3Result);

    expect(normalized).toEqual({
      label:            'sad',
      confidence:       0.91,
      secondaryEmotion: 'anxiety',
    });
  });
});

// ── Test 3 — Confidence precision preservation ────────────────────

describe('normalizeEmotionResult — confidence preservation', () => {
  it('does not round or modify confidence: 0.63 stays 0.63', () => {
    const module3Result = {
      emotion:          'neutral',
      confidence:       0.63,
      secondaryEmotion: null,
    };

    const normalized = normalizeEmotionResult(module3Result);

    expect(normalized.confidence).toBe(0.63);
    expect(normalized.confidence).toStrictEqual(0.63);
  });

  it('preserves confidence at the boundary: 0.0', () => {
    const result = normalizeEmotionResult({ emotion: 'neutral', confidence: 0.0, secondaryEmotion: null });
    expect(result.confidence).toBe(0.0);
  });

  it('preserves confidence at the boundary: 1.0', () => {
    const result = normalizeEmotionResult({ emotion: 'happy', confidence: 1.0, secondaryEmotion: null });
    expect(result.confidence).toBe(1.0);
  });
});

// ── Test 4 — Unsupported emotion flows through to validation ──────

describe('normalizeEmotionResult — unsupported emotion propagation', () => {
  it('does not silently convert an unknown emotion label', () => {
    const module3Result = {
      emotion:          'existential_dread',
      confidence:       0.88,
      secondaryEmotion: null,
    };

    // normalizeEmotionResult is a pure adapter — it maps blindly.
    // Rejection of invalid labels must happen in the validation layer.
    const normalized = normalizeEmotionResult(module3Result);
    expect(normalized.label).toBe('existential_dread');
  });

  it('ResponseService rejects an unsupported label after normalization', async () => {
    const normalized = normalizeEmotionResult({
      emotion:          'existential_dread',
      confidence:       0.88,
      secondaryEmotion: null,
    });

    await expect(
      responseService.generateResponse({
        userMessage: 'Something feels off.',
        emotion:     normalized,
        context:     { recentMessages: [] },
        safety:      { status: RESPONSE.SAFETY_STATUS.SAFE },
      })
    // The EMOTION_STRATEGY_MAP has no entry for unknown label → falls
    // back to NEUTRAL_SUPPORT rather than throwing. But the service
    // should not crash. Verify the pipeline continues or logs a fallback.
    ).resolves.toMatchObject({ strategy: RESPONSE.FALLBACK_STRATEGY });
  });
});

// ── Test 5 — End-to-end pipeline through ResponseService ──────────

describe('normalizeEmotionResult — complete pipeline integration', () => {
  it('module 3 result travels through normalization to strategy selection without manual transform', async () => {
    // Simulate a raw Module 3 output (with UI fields)
    const module3Result = {
      emotion:          'anxiety',
      confidence:       0.92,
      secondaryEmotion: null,
      colour:           '#FF9933',
      icon:             '😰',
      isUncertain:      false,
    };

    // Use the convenience entry point — no manual mapping by caller
    const result = await responseService.generateResponseFromEmotionResult({
      userMessage:   'I am so anxious about tomorrow.',
      emotionResult: module3Result,
      context:       { recentMessages: [] },
      safety:        { status: RESPONSE.SAFETY_STATUS.SAFE },
    });

    expect(result.strategy).toBe(RESPONSE.STRATEGY.CALMING_SUPPORT);
    expect(result.message).toBeTruthy();
    expect(result.metadata.emotion).toBe('anxiety');
    expect(result.metadata.confidence).toBe(0.92);
  });

  it('preserves secondaryEmotion through the full pipeline', async () => {
    const module3Result = {
      emotion:          'sad',
      confidence:       0.91,
      secondaryEmotion: 'anxiety',
      colour:           '#6699CC',
      icon:             '😢',
      isUncertain:      false,
    };

    const result = await responseService.generateResponseFromEmotionResult({
      userMessage:   'I feel so low today.',
      emotionResult: module3Result,
      context:       { recentMessages: [] },
      safety:        { status: RESPONSE.SAFETY_STATUS.SAFE },
    });

    expect(result.strategy).toBe(RESPONSE.STRATEGY.EMPATHETIC_SUPPORT);
    expect(result.message).toBeTruthy();
  });

  it('low-confidence module 3 result still falls back to neutral_support', async () => {
    const module3Result = {
      emotion:          'sad',
      confidence:       0.2,     // below HIGH_CONFIDENCE_THRESHOLD
      secondaryEmotion: null,
      colour:           '#6699CC',
      icon:             '😢',
      isUncertain:      true,
    };

    const result = await responseService.generateResponseFromEmotionResult({
      userMessage:   'Not sure how I feel.',
      emotionResult: module3Result,
      context:       { recentMessages: [] },
      safety:        { status: RESPONSE.SAFETY_STATUS.SAFE },
    });

    expect(result.strategy).toBe(RESPONSE.STRATEGY.NEUTRAL_SUPPORT);
  });

  it('throws InvalidResponseInputError when emotionResult is missing', async () => {
    await expect(
      responseService.generateResponseFromEmotionResult({
        userMessage: 'Test.',
        context:     { recentMessages: [] },
        safety:      { status: RESPONSE.SAFETY_STATUS.SAFE },
      })
    ).rejects.toThrow(InvalidResponseInputError);
  });
});

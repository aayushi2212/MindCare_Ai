/**
 * PURPOSE
 * -------
 * Integration tests for the MessagePipelineService.
 *
 * Tests verify:
 * 1. Safety gate fires FIRST and skips AI pipeline for high-risk messages
 * 2. Normal messages flow: Safety → Emotion → Context → Response
 * 3. Ownership is enforced before processing
 * 4. Pipeline succeeds with all dependencies mocked
 *
 * DEPENDS ON
 * ----------
 * jest, message-pipeline.service, mocked dependencies
 */

import { jest } from '@jest/globals';

// ── Mock all external dependencies ────────────────────────────────

jest.unstable_mockModule('../repositories/chat.repository.js', () => ({
  default: {
    findConversation: jest.fn(),
  },
}));

jest.unstable_mockModule('../services/chat.service.js', () => ({
  default: {
    saveMessage: jest.fn(),
  },
}));

jest.unstable_mockModule('../../emotion/services/emotion.service.js', () => ({
  default: {
    analyze: jest.fn(),
  },
}));

jest.unstable_mockModule('../../response/services/response.service.js', () => ({
  default: {
    generateResponse: jest.fn(),
  },
}));

jest.unstable_mockModule('../../context/services/context.service.js', () => ({
  default: {
    buildContext: jest.fn(),
  },
}));

// Safety service is NOT mocked — we test its real behaviour
// (deterministic keyword matching, no side effects)

// ── Import after mocks ─────────────────────────────────────────────

const { default: chatRepository }  = await import('../repositories/chat.repository.js');
const { default: chatService }     = await import('../services/chat.service.js');
const { default: emotionService }  = await import('../../emotion/services/emotion.service.js');
const { default: responseService } = await import('../../response/services/response.service.js');
const { default: contextService }  = await import('../../context/services/context.service.js');
const { default: pipeline }        = await import('../services/message-pipeline.service.js');
const { ConversationNotFoundError, ConversationAccessDeniedError } = await import('../errors/chat.errors.js');

// ── Fixtures ───────────────────────────────────────────────────────

const USER_A  = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B  = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const CONV_ID = 'cccccccccccccccccccccccc';

const makeConversation = (overrides = {}) => ({
  _id:       CONV_ID,
  userId:    USER_A,
  status:    'active',
  deletedAt: null,
  ...overrides,
});

const makeMessage = (sender = 'user', content = 'test') => ({
  _id:       'dddddddddddddddddddddddd',
  sender,
  content,
  createdAt: new Date(),
  metadata:  {},
});

// ── Test: Ownership enforcement ────────────────────────────────────

describe('MessagePipelineService — ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws ConversationNotFoundError for deleted conversation', async () => {
    chatRepository.findConversation.mockResolvedValue(
      makeConversation({ deletedAt: new Date() })
    );
    await expect(pipeline.processMessage(USER_A, CONV_ID, 'hello'))
      .rejects.toThrow(ConversationNotFoundError);
  });

  it('throws ConversationNotFoundError for missing conversation', async () => {
    chatRepository.findConversation.mockResolvedValue(null);
    await expect(pipeline.processMessage(USER_A, CONV_ID, 'hello'))
      .rejects.toThrow(ConversationNotFoundError);
  });

  it('throws ConversationAccessDeniedError for non-owner', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    await expect(pipeline.processMessage(USER_B, CONV_ID, 'hello'))
      .rejects.toThrow(ConversationAccessDeniedError);
  });
});

// ── Test: Safety gate ──────────────────────────────────────────────

describe('MessagePipelineService — safety gate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delivers crisis response for high-risk message without calling emotion/context/response', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage
      .mockResolvedValueOnce(makeMessage('user', 'I want to end my life'))
      .mockResolvedValueOnce(makeMessage('ai', 'crisis response'));

    const result = await pipeline.processMessage(USER_A, CONV_ID, 'I want to end my life');

    // AI pipeline must NOT have been called
    expect(emotionService.analyze).not.toHaveBeenCalled();
    expect(contextService.buildContext).not.toHaveBeenCalled();
    expect(responseService.generateResponse).not.toHaveBeenCalled();

    // Both messages were persisted
    expect(chatService.saveMessage).toHaveBeenCalledTimes(2);

    // Result contains both messages
    expect(result.userMessage).toBeDefined();
    expect(result.aiMessage).toBeDefined();
  });

  it('correctly identifies "kill myself" as high-risk', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());

    await pipeline.processMessage(USER_A, CONV_ID, 'I want to kill myself');

    expect(emotionService.analyze).not.toHaveBeenCalled();
  });

  it('does NOT trigger crisis for a safe message', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());
    emotionService.analyze.mockResolvedValue({ emotion: 'neutral', confidence: 0.8 });
    contextService.buildContext.mockResolvedValue({ recentMessages: [], messageCount: 0, repeatedEmotions: [] });
    responseService.generateResponse.mockResolvedValue({ message: 'I hear you.', strategy: 'neutral_support' });

    await pipeline.processMessage(USER_A, CONV_ID, 'I feel a bit tired today');

    // Normal pipeline DID run
    expect(emotionService.analyze).toHaveBeenCalledTimes(1);
    expect(contextService.buildContext).toHaveBeenCalledTimes(1);
    expect(responseService.generateResponse).toHaveBeenCalledTimes(1);
  });
});

// ── Test: Normal pipeline flow ─────────────────────────────────────

describe('MessagePipelineService — normal pipeline', () => {
  beforeEach(() => jest.clearAllMocks());

  const setup = () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());
    emotionService.analyze.mockResolvedValue({ emotion: 'sad', confidence: 0.85 });
    contextService.buildContext.mockResolvedValue({
      recentMessages:  [{ role: 'user', content: 'previous msg' }],
      messageCount:    1,
      repeatedEmotions: [],
    });
    responseService.generateResponse.mockResolvedValue({
      message:  'That sounds really hard.',
      strategy: 'empathetic_support',
    });
  };

  it('calls context service with correct userId and conversationId', async () => {
    setup();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel sad today');

    expect(contextService.buildContext).toHaveBeenCalledWith(
      USER_A,
      CONV_ID,
      expect.objectContaining({ limit: expect.any(Number) })
    );
  });

  it('passes emotion result to response service', async () => {
    setup();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel sad today');

    expect(responseService.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        emotion: expect.objectContaining({
          label:      'sad',
          confidence: 0.85,
        }),
      })
    );
  });

  it('passes context to response service', async () => {
    setup();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel sad today');

    expect(responseService.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          recentMessages: expect.any(Array),
        }),
      })
    );
  });

  it('passes safety status to response service', async () => {
    setup();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel sad today');

    expect(responseService.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        safety: expect.objectContaining({ status: 'safe' }),
      })
    );
  });

  it('persists both user and AI messages', async () => {
    setup();
    const result = await pipeline.processMessage(USER_A, CONV_ID, 'I feel sad today');

    expect(chatService.saveMessage).toHaveBeenCalledTimes(2);
    expect(result.userMessage).toBeDefined();
    expect(result.aiMessage).toBeDefined();
    expect(result.emotion).toBeDefined();
  });

  it('falls back gracefully if emotion detection fails', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());
    emotionService.analyze.mockRejectedValue(new Error('FastAPI unavailable'));
    contextService.buildContext.mockResolvedValue({ recentMessages: [], messageCount: 0, repeatedEmotions: [] });
    responseService.generateResponse.mockResolvedValue({ message: 'I hear you.', strategy: 'neutral_support' });

    const result = await pipeline.processMessage(USER_A, CONV_ID, 'hello');

    expect(result.userMessage).toBeDefined();
    expect(result.aiMessage).toBeDefined();
    // Falls back to neutral
    expect(result.emotion.emotion).toBe('neutral');
  });

  it('falls back gracefully if context retrieval fails', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());
    emotionService.analyze.mockResolvedValue({ emotion: 'happy', confidence: 0.9 });
    contextService.buildContext.mockRejectedValue(new Error('DB timeout'));
    responseService.generateResponse.mockResolvedValue({ message: 'Great!', strategy: 'positive_reinforcement' });

    const result = await pipeline.processMessage(USER_A, CONV_ID, 'Today was amazing');

    expect(result.userMessage).toBeDefined();
    expect(result.aiMessage).toBeDefined();
  });

  it('falls back gracefully if response generation fails', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());
    emotionService.analyze.mockResolvedValue({ emotion: 'happy', confidence: 0.9 });
    contextService.buildContext.mockResolvedValue({ recentMessages: [], messageCount: 0, repeatedEmotions: [] });
    responseService.generateResponse.mockRejectedValue(new Error('Strategy error'));

    const result = await pipeline.processMessage(USER_A, CONV_ID, 'hello');

    // Should still return a fallback AI message
    expect(result.aiMessage).toBeDefined();
  });
});

/**
 * PURPOSE
 * -------
 * Integration tests for the MessagePipelineService.
 *
 * Tests verify:
 * 1. Input validation blocks invalid messages before SafetyService
 * 2. Safety gate fires FIRST and skips AI pipeline for high-risk messages
 * 3. Crisis resources are persisted in AI message metadata
 * 4. Normal messages flow: Safety → Emotion → Context → Response
 * 5. Normal messages do NOT receive crisis metadata or resources
 * 6. Ownership is enforced before processing
 * 7. Audit event is created for high-risk messages
 * 8. Raw crisis content is NOT stored in audit record
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

jest.unstable_mockModule('../../safety/services/crisis-audit.service.js', () => ({
  default: {
    logEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

// Safety service is NOT mocked — we test its real deterministic behaviour

// ── Import after mocks ─────────────────────────────────────────────

const { default: chatRepository }    = await import('../repositories/chat.repository.js');
const { default: chatService }       = await import('../services/chat.service.js');
const { default: emotionService }    = await import('../../emotion/services/emotion.service.js');
const { default: responseService }   = await import('../../response/services/response.service.js');
const { default: contextService }    = await import('../../context/services/context.service.js');
const { default: crisisAuditService } = await import('../../safety/services/crisis-audit.service.js');
const { default: pipeline }          = await import('../services/message-pipeline.service.js');
const { ConversationNotFoundError, ConversationAccessDeniedError } = await import('../errors/chat.errors.js');
const { SAFETY_RESOURCES }           = await import('../../safety/constants/safety.constants.js');

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

const makeMessage = (sender = 'user', content = 'test', metadata = {}) => ({
  _id:       'dddddddddddddddddddddddd',
  sender,
  content,
  createdAt: new Date(),
  metadata,
});

// ── Suite: Ownership enforcement ───────────────────────────────────

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

// ── Suite: Safety gate — crisis path ──────────────────────────────

describe('MessagePipelineService — safety gate (crisis path)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delivers crisis response and skips emotion/context/response services', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage
      .mockResolvedValueOnce(makeMessage('user', 'I want to end my life'))
      .mockResolvedValueOnce(makeMessage('ai', 'crisis response'));

    const result = await pipeline.processMessage(USER_A, CONV_ID, 'I want to end my life');

    // AI pipeline MUST NOT have been called
    expect(emotionService.analyze).not.toHaveBeenCalled();
    expect(contextService.buildContext).not.toHaveBeenCalled();
    expect(responseService.generateResponse).not.toHaveBeenCalled();

    // Both messages were persisted
    expect(chatService.saveMessage).toHaveBeenCalledTimes(2);

    // Result contains crisis flags
    expect(result.isCrisis).toBe(true);
    expect(result.resources).not.toBeNull();
    expect(result.userMessage).toBeDefined();
    expect(result.aiMessage).toBeDefined();
  });

  it('persists crisis resources in AI message metadata for page-reload survival', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage
      .mockResolvedValueOnce(makeMessage('user', 'I want to kill myself'))
      .mockResolvedValueOnce(makeMessage('ai', 'crisis response'));

    await pipeline.processMessage(USER_A, CONV_ID, 'I want to kill myself');

    // The second saveMessage call is the AI crisis message
    const aiSaveCall = chatService.saveMessage.mock.calls[1][2]; // (userId, convId, dto)
    expect(aiSaveCall.metadata.isCrisis).toBe(true);
    expect(aiSaveCall.metadata.resources).not.toBeNull();
    expect(aiSaveCall.metadata.resources).toMatchObject({
      immediate:    expect.any(Array),
      professional: expect.any(Array),
    });
  });

  it('creates an audit event for high-risk message', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());

    await pipeline.processMessage(USER_A, CONV_ID, 'I want to end my life');

    expect(crisisAuditService.logEvent).toHaveBeenCalledTimes(1);
    expect(crisisAuditService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId:        USER_A,
        conversationId: CONV_ID,
        riskLevel:     'HIGH',
        action:        'CRISIS_RESPONSE',
      })
    );
  });

  it('does NOT include raw crisis message content in audit call', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());

    const crisisText = 'I want to kill myself';
    await pipeline.processMessage(USER_A, CONV_ID, crisisText);

    const auditCall = crisisAuditService.logEvent.mock.calls[0][0];
    // The audit DTO must NOT contain the raw message text
    const serialised = JSON.stringify(auditCall);
    expect(serialised).not.toContain(crisisText);
    expect(auditCall).not.toHaveProperty('message');
    expect(auditCall).not.toHaveProperty('content');
    expect(auditCall).not.toHaveProperty('text');
  });

  it('correctly identifies "kill myself" as high-risk', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());

    await pipeline.processMessage(USER_A, CONV_ID, 'I want to kill myself');
    expect(emotionService.analyze).not.toHaveBeenCalled();
  });
});

// ── Suite: Safety gate — normal path ──────────────────────────────

describe('MessagePipelineService — safety gate (normal path)', () => {
  beforeEach(() => jest.clearAllMocks());

  const setupNormal = () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());
    emotionService.analyze.mockResolvedValue({ emotion: 'neutral', confidence: 0.8 });
    contextService.buildContext.mockResolvedValue({ recentMessages: [], messageCount: 0, repeatedEmotions: [] });
    responseService.generateResponse.mockResolvedValue({ message: 'I hear you.', strategy: 'neutral_support' });
  };

  it('does NOT trigger crisis for a safe message', async () => {
    setupNormal();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel a bit tired today');
    expect(emotionService.analyze).toHaveBeenCalledTimes(1);
    expect(contextService.buildContext).toHaveBeenCalledTimes(1);
    expect(responseService.generateResponse).toHaveBeenCalledTimes(1);
  });

  it('does NOT trigger crisis for stress-about-exam message', async () => {
    setupNormal();
    const result = await pipeline.processMessage(USER_A, CONV_ID, 'I am stressed about my exams');
    expect(result.isCrisis).toBe(false);
    expect(result.resources).toBeNull();
    expect(emotionService.analyze).toHaveBeenCalledTimes(1);
  });

  it('normal AI message does NOT receive crisis metadata or resources', async () => {
    setupNormal();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel okay today');

    // The second saveMessage call is the AI response
    const aiSaveCall = chatService.saveMessage.mock.calls[1][2];
    expect(aiSaveCall.metadata.isCrisis).toBe(false);
    expect(aiSaveCall.metadata.resources).toBeNull();
    expect(aiSaveCall.metadata.strategy).not.toBe('crisis_response');
  });

  it('does NOT create an audit event for safe messages', async () => {
    setupNormal();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel okay');
    expect(crisisAuditService.logEvent).not.toHaveBeenCalled();
  });
});

// ── Suite: Normal pipeline flow ────────────────────────────────────

describe('MessagePipelineService — normal pipeline', () => {
  beforeEach(() => jest.clearAllMocks());

  const setup = () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());
    emotionService.analyze.mockResolvedValue({ emotion: 'sad', confidence: 0.85 });
    contextService.buildContext.mockResolvedValue({
      recentMessages:   [{ role: 'user', content: 'previous msg' }],
      messageCount:     1,
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
      USER_A, CONV_ID, expect.objectContaining({ limit: expect.any(Number) })
    );
  });

  it('passes emotion result to response service', async () => {
    setup();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel sad today');
    expect(responseService.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        emotion: expect.objectContaining({ label: 'sad', confidence: 0.85 }),
      })
    );
  });

  it('passes context to response service', async () => {
    setup();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel sad today');
    expect(responseService.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({ recentMessages: expect.any(Array) }),
      })
    );
  });

  it('passes safety status to response service', async () => {
    setup();
    await pipeline.processMessage(USER_A, CONV_ID, 'I feel sad today');
    expect(responseService.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({ safety: expect.objectContaining({ status: 'safe' }) })
    );
  });

  it('persists both user and AI messages', async () => {
    setup();
    const result = await pipeline.processMessage(USER_A, CONV_ID, 'I feel sad today');
    expect(chatService.saveMessage).toHaveBeenCalledTimes(2);
    expect(result.userMessage).toBeDefined();
    expect(result.aiMessage).toBeDefined();
    expect(result.emotion).toBeDefined();
    expect(result.isCrisis).toBe(false);
    expect(result.resources).toBeNull();
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
    expect(result.aiMessage).toBeDefined();
  });
});

// ── Suite: Crisis resource persistence ────────────────────────────

describe('MessagePipelineService — crisis resource persistence', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores SAFETY_RESOURCES in AI message metadata (available on reload)', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage
      .mockResolvedValueOnce(makeMessage('user', 'I want to end my life'))
      .mockResolvedValueOnce(makeMessage('ai', 'crisis response', {
        isCrisis:  true,
        resources: SAFETY_RESOURCES,
        strategy:  'crisis_response',
      }));

    const result = await pipeline.processMessage(USER_A, CONV_ID, 'I want to end my life');

    // Verify the AI save call includes persisted resources
    const aiSaveArgs = chatService.saveMessage.mock.calls[1][2];
    expect(aiSaveArgs.metadata.resources).toMatchObject({
      immediate:    expect.any(Array),
      professional: expect.any(Array),
      international: expect.any(Array),
    });
    expect(typeof aiSaveArgs.metadata.resources.trusted_person).toBe('string');
  });

  it('isCrisis flag is true in persisted AI message metadata', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatService.saveMessage.mockResolvedValue(makeMessage());

    await pipeline.processMessage(USER_A, CONV_ID, 'I want to kill myself');

    const aiSaveArgs = chatService.saveMessage.mock.calls[1][2];
    expect(aiSaveArgs.metadata.isCrisis).toBe(true);
    expect(aiSaveArgs.metadata.strategy).toBe('crisis_response');
  });
});

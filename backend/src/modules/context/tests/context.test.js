/**
 * PURPOSE
 * -------
 * Unit tests for the Context module service layer.
 * contextRepository is fully mocked — no database calls are made.
 *
 * COVERS
 * ------
 * - Successful context retrieval
 * - Empty conversation (no messages)
 * - Conversation ownership enforcement
 * - Soft-deleted conversation rejection
 * - Archived/deleted status rejection
 * - Empty message filtering
 * - Sender-type filtering (user-only, assistant-only)
 * - Chronological ordering
 * - MAX_CONTEXT_MESSAGES enforcement
 * - MAX_CONTEXT_CHARACTERS budget enforcement
 * - Invalid limit rejection
 * - Metadata inclusion
 * - Repeated emotion pattern extraction
 *
 * DEPENDS ON
 * ----------
 * jest (@jest/globals), context.service, context.repository (mocked),
 * context.errors, context.constants
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../repositories/context.repository.js', () => ({
  default: {
    findConversation:      jest.fn(),
    findRecentMessages:    jest.fn(),
    countMessages:         jest.fn(),
    findLatestInteraction: jest.fn(),
  },
}));

const { default: contextService }    = await import('../services/context.service.js');
const { default: contextRepository } = await import('../repositories/context.repository.js');

const {
  ConversationNotFoundError,
  UnauthorizedConversationAccessError,
  InvalidContextLimitError,
} = await import('../errors/context.errors.js');

const { default: CONTEXT } = await import('../constants/context.constants.js');

// ── Fixtures ───────────────────────────────────────────────────────
const USER_A  = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B  = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const CONV_ID = 'cccccccccccccccccccccccc';

const makeConversation = (overrides = {}) => ({
  _id:       CONV_ID,
  userId:    USER_A,
  title:     'Test Chat',
  status:    'active',
  archived:  false,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  lastEmotion: null,
  ...overrides,
});

const makeMessage = (n, sender = 'user', content = `Message ${n}`, overrides = {}) => ({
  _id:            `msg${n}${'0'.repeat(20 - String(n).length)}`,
  conversationId: CONV_ID,
  sender,
  content,
  deletedAt:      null,
  metadata:       {},
  createdAt:      new Date(`2026-01-01T10:${String(n).padStart(2, '0')}:00Z`),
  ...overrides,
});

const setupHappyPath = (messages = [], count = messages.length) => {
  contextRepository.findConversation.mockResolvedValue(makeConversation());
  contextRepository.findRecentMessages.mockResolvedValue([...messages].reverse());
  contextRepository.countMessages.mockResolvedValue(count);
  contextRepository.findLatestInteraction.mockResolvedValue(
    messages.length ? messages[messages.length - 1].createdAt : null
  );
};

// ── Tests ──────────────────────────────────────────────────────────

describe('ContextService — successful context retrieval', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a properly structured context object', async () => {
    const msgs = [makeMessage(1), makeMessage(2, 'ai', 'Hi there')];
    setupHappyPath(msgs, 2);

    const result = await contextService.buildContext(USER_A, CONV_ID);

    expect(result).toMatchObject({
      conversationId: CONV_ID,
      messageCount:   2,
    });
    expect(result.recentMessages).toHaveLength(2);
    expect(result.lastInteraction).toBeTruthy();
  });

  it('maps sender "user" → role "user"', async () => {
    setupHappyPath([makeMessage(1, 'user', 'Hello')]);
    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.recentMessages[0].role).toBe('user');
  });

  it('maps sender "ai" → role "assistant"', async () => {
    setupHappyPath([makeMessage(1, 'ai', 'How can I help?')]);
    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.recentMessages[0].role).toBe('assistant');
  });

  it('returns messages in chronological order (oldest first)', async () => {
    const msgs = [
      makeMessage(1, 'user', 'First'),
      makeMessage(2, 'ai',   'Second'),
      makeMessage(3, 'user', 'Third'),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.recentMessages[0].content).toBe('First');
    expect(result.recentMessages[2].content).toBe('Third');
  });

  it('does not include metadata by default', async () => {
    setupHappyPath([makeMessage(1)]);
    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.metadata).toBeUndefined();
  });

  it('includes metadata when includeMetadata=true', async () => {
    setupHappyPath([makeMessage(1)]);
    const result = await contextService.buildContext(USER_A, CONV_ID, { includeMetadata: true });
    expect(result.metadata).toBeDefined();
    expect(result.metadata.title).toBe('Test Chat');
    expect(result.metadata.status).toBe('active');
  });

  it('always includes repeatedEmotions field in the result', async () => {
    setupHappyPath([makeMessage(1)]);
    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result).toHaveProperty('repeatedEmotions');
    expect(Array.isArray(result.repeatedEmotions)).toBe(true);
  });
});

describe('ContextService — empty conversation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty recentMessages array for a conversation with no messages', async () => {
    setupHappyPath([], 0);
    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.recentMessages).toHaveLength(0);
    expect(result.messageCount).toBe(0);
    expect(result.lastInteraction).toBeNull();
    expect(result.repeatedEmotions).toHaveLength(0);
  });
});

describe('ContextService — repeated emotion patterns', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array when no messages have emotion metadata', async () => {
    const msgs = [makeMessage(1), makeMessage(2), makeMessage(3)];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.repeatedEmotions).toHaveLength(0);
  });

  it('identifies an emotion that appears 3 times as repeated', async () => {
    const msgs = [
      makeMessage(1, 'user', 'Msg 1', { metadata: { emotion: 'sad' } }),
      makeMessage(2, 'user', 'Msg 2', { metadata: { emotion: 'anxiety' } }),
      makeMessage(3, 'user', 'Msg 3', { metadata: { emotion: 'sad' } }),
      makeMessage(4, 'user', 'Msg 4', { metadata: { emotion: 'sad' } }),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID);
    const sadEntry = result.repeatedEmotions.find((e) => e.emotion === 'sad');
    expect(sadEntry).toBeDefined();
    expect(sadEntry.count).toBe(3);
  });

  it('does not include emotions that appear only once', async () => {
    const msgs = [
      makeMessage(1, 'user', 'Msg 1', { metadata: { emotion: 'happy' } }),
      makeMessage(2, 'user', 'Msg 2', { metadata: { emotion: 'sad' } }),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.repeatedEmotions).toHaveLength(0);
  });

  it('includes emotions that appear exactly 2 times (minimum threshold)', async () => {
    const msgs = [
      makeMessage(1, 'user', 'Msg 1', { metadata: { emotion: 'anxiety' } }),
      makeMessage(2, 'user', 'Msg 2', { metadata: { emotion: 'anxiety' } }),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.repeatedEmotions).toHaveLength(1);
    expect(result.repeatedEmotions[0]).toMatchObject({ emotion: 'anxiety', count: 2 });
  });

  it('returns repeated emotions sorted by count descending', async () => {
    const msgs = [
      makeMessage(1, 'user', 'M1', { metadata: { emotion: 'sad' } }),
      makeMessage(2, 'user', 'M2', { metadata: { emotion: 'anxiety' } }),
      makeMessage(3, 'user', 'M3', { metadata: { emotion: 'sad' } }),
      makeMessage(4, 'user', 'M4', { metadata: { emotion: 'anxiety' } }),
      makeMessage(5, 'user', 'M5', { metadata: { emotion: 'sad' } }),
      makeMessage(6, 'user', 'M6', { metadata: { emotion: 'anxiety' } }),
      makeMessage(7, 'user', 'M7', { metadata: { emotion: 'anxiety' } }),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.repeatedEmotions[0].emotion).toBe('anxiety'); // 4 times
    expect(result.repeatedEmotions[1].emotion).toBe('sad');     // 3 times
  });

  it('ignores messages with no emotion metadata', async () => {
    const msgs = [
      makeMessage(1, 'user', 'Msg 1'),                               // no metadata.emotion
      makeMessage(2, 'user', 'Msg 2', { metadata: { emotion: 'sad' } }),
      makeMessage(3, 'user', 'Msg 3', { metadata: { emotion: 'sad' } }),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.repeatedEmotions).toHaveLength(1);
    expect(result.repeatedEmotions[0]).toMatchObject({ emotion: 'sad', count: 2 });
  });
});

describe('ContextService — message filtering', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters out messages with empty content', async () => {
    const msgs = [
      makeMessage(1, 'user', 'Valid message'),
      makeMessage(2, 'user', '   '),
      makeMessage(3, 'ai',   ''),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.recentMessages).toHaveLength(1);
    expect(result.recentMessages[0].content).toBe('Valid message');
  });

  it('filters out soft-deleted messages (belt-and-suspenders)', async () => {
    const msgs = [
      makeMessage(1, 'user', 'Normal'),
      makeMessage(2, 'user', 'Deleted', { deletedAt: new Date() }),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID);
    expect(result.recentMessages).toHaveLength(1);
    expect(result.recentMessages[0].content).toBe('Normal');
  });

  it('excludes assistant messages when includeAssistantMessages=false', async () => {
    const msgs = [
      makeMessage(1, 'user', 'Hello'),
      makeMessage(2, 'ai',   'Hi!'),
      makeMessage(3, 'user', 'How are you?'),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID, {
      includeAssistantMessages: false,
    });
    expect(result.recentMessages.every((m) => m.role === 'user')).toBe(true);
    expect(result.recentMessages).toHaveLength(2);
  });

  it('excludes user messages when includeUserMessages=false', async () => {
    const msgs = [
      makeMessage(1, 'user', 'Hello'),
      makeMessage(2, 'ai',   'Hi!'),
      makeMessage(3, 'user', 'Question?'),
    ];
    setupHappyPath(msgs);

    const result = await contextService.buildContext(USER_A, CONV_ID, {
      includeUserMessages: false,
    });
    expect(result.recentMessages.every((m) => m.role === 'assistant')).toBe(true);
    expect(result.recentMessages).toHaveLength(1);
  });
});

describe('ContextService — context window limits', () => {
  beforeEach(() => jest.clearAllMocks());

  it('respects the limit parameter', async () => {
    const msgs = Array.from({ length: 15 }, (_, i) => makeMessage(i + 1));
    setupHappyPath(msgs, 15);

    const result = await contextService.buildContext(USER_A, CONV_ID, { limit: 5 });
    expect(result.recentMessages).toHaveLength(5);
  });

  it('returns all messages when count is below limit', async () => {
    const msgs = [makeMessage(1), makeMessage(2)];
    setupHappyPath(msgs, 2);

    const result = await contextService.buildContext(USER_A, CONV_ID, { limit: 10 });
    expect(result.recentMessages).toHaveLength(2);
  });

  it('drops oldest messages when character budget is exceeded', async () => {
    const longContent = 'x'.repeat(5000);
    const msgs = [
      makeMessage(1, 'user', longContent),
      makeMessage(2, 'user', longContent),
      makeMessage(3, 'user', longContent),
    ];
    setupHappyPath(msgs);

    const spy = jest.spyOn(contextService, '_applyCharacterBudget');
    const result = await contextService.buildContext(USER_A, CONV_ID, { limit: 20 });

    expect(spy).toHaveBeenCalled();
    expect(result.recentMessages.length).toBeLessThan(3);

    spy.mockRestore();
  });
});

describe('ContextService — ownership and access control', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws ConversationNotFoundError when conversation is null', async () => {
    contextRepository.findConversation.mockResolvedValue(null);
    await expect(contextService.buildContext(USER_A, CONV_ID)).rejects.toThrow(ConversationNotFoundError);
  });

  it('throws ConversationNotFoundError when conversation is soft-deleted', async () => {
    contextRepository.findConversation.mockResolvedValue(
      makeConversation({ deletedAt: new Date() })
    );
    await expect(contextService.buildContext(USER_A, CONV_ID)).rejects.toThrow(ConversationNotFoundError);
  });

  it('throws ConversationNotFoundError when conversation status is deleted', async () => {
    contextRepository.findConversation.mockResolvedValue(
      makeConversation({ status: 'deleted' })
    );
    await expect(contextService.buildContext(USER_A, CONV_ID)).rejects.toThrow(ConversationNotFoundError);
  });

  it('throws ConversationNotFoundError when conversation is archived', async () => {
    contextRepository.findConversation.mockResolvedValue(
      makeConversation({ status: 'archived' })
    );
    await expect(contextService.buildContext(USER_A, CONV_ID)).rejects.toThrow(ConversationNotFoundError);
  });

  it('throws UnauthorizedConversationAccessError when user does not own conversation', async () => {
    contextRepository.findConversation.mockResolvedValue(makeConversation());
    await expect(contextService.buildContext(USER_B, CONV_ID)).rejects.toThrow(UnauthorizedConversationAccessError);
  });
});

describe('ContextService — limit validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws InvalidContextLimitError for limit below minimum', async () => {
    await expect(contextService.buildContext(USER_A, CONV_ID, { limit: 0 }))
      .rejects.toThrow(InvalidContextLimitError);
  });

  it('throws InvalidContextLimitError for limit above maximum', async () => {
    await expect(contextService.buildContext(USER_A, CONV_ID, { limit: 999 }))
      .rejects.toThrow(InvalidContextLimitError);
  });

  it('throws InvalidContextLimitError for non-integer limit', async () => {
    await expect(contextService.buildContext(USER_A, CONV_ID, { limit: 3.5 }))
      .rejects.toThrow(InvalidContextLimitError);
  });

  it('accepts the minimum allowed limit', async () => {
    setupHappyPath([makeMessage(1)]);
    await expect(
      contextService.buildContext(USER_A, CONV_ID, { limit: CONTEXT.MIN_CONTEXT_MESSAGES })
    ).resolves.toBeDefined();
  });

  it('accepts the maximum allowed limit', async () => {
    setupHappyPath([makeMessage(1)]);
    await expect(
      contextService.buildContext(USER_A, CONV_ID, { limit: CONTEXT.MAX_CONTEXT_MESSAGES })
    ).resolves.toBeDefined();
  });
});

/**
 * PURPOSE
 * -------
 * Unit tests for the Chat module service layer.
 * Tests cover business logic, ownership enforcement,
 * pagination, and error handling.
 *
 * Test strategy: mock chatRepository, assert service behaviour.
 *
 * DEPENDS ON
 * ----------
 * jest (@jest/globals), chat.service, chat.repository (mocked), chat.errors
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../repositories/chat.repository.js', () => ({
  default: {
    createConversation:          jest.fn(),
    findConversation:            jest.fn(),
    findUserConversations:       jest.fn(),
    searchConversations:         jest.fn(),
    updateConversationMeta:      jest.fn(),
    renameConversation:          jest.fn(),
    softDeleteConversation:      jest.fn(),
    deleteConversation:          jest.fn(),
    saveMessage:                 jest.fn(),
    findMessages:                jest.fn(),
    deleteMessagesByConversation: jest.fn(),
  },
}));

const { default: chatService }    = await import('../services/chat.service.js');
const { default: chatRepository } = await import('../repositories/chat.repository.js');
const {
  ConversationNotFoundError,
  ConversationAccessDeniedError,
} = await import('../errors/chat.errors.js');
const { default: CHAT } = await import('../constants/chat.constants.js');

// ── Fixtures ───────────────────────────────────────────────────────
const USER_A  = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B  = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const CONV_ID = 'cccccccccccccccccccccccc';

const makeConversation = (overrides = {}) => ({
  _id:           CONV_ID,
  userId:        USER_A,
  title:         'Test Conversation',
  status:        CHAT.STATUS.ACTIVE,
  messageCount:  0,
  lastMessageAt: null,
  lastEmotion:   null,
  archived:      false,
  deletedAt:     null,
  createdAt:     new Date(),
  updatedAt:     new Date(),
  ...overrides,
});

const makeMessage = (overrides = {}) => ({
  _id:            'dddddddddddddddddddddddd',
  conversationId: CONV_ID,
  sender:         CHAT.SENDER.USER,
  content:        'Hello world',
  messageType:    CHAT.MESSAGE_TYPE.TEXT,
  metadata:       {},
  createdAt:      new Date(),
  ...overrides,
});

// ── Test suites ────────────────────────────────────────────────────

describe('ChatService — createConversation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a conversation with provided title', async () => {
    const conv = makeConversation({ title: 'My Session' });
    chatRepository.createConversation.mockResolvedValue(conv);

    const result = await chatService.createConversation(USER_A, { title: 'My Session' });

    expect(chatRepository.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_A, title: 'My Session', status: CHAT.STATUS.ACTIVE })
    );
    expect(result.title).toBe('My Session');
  });

  it('generates a default title when none is provided', async () => {
    const conv = makeConversation({ title: 'Conversation — Aug 3, 2026' });
    chatRepository.createConversation.mockResolvedValue(conv);

    await chatService.createConversation(USER_A, {});

    expect(chatRepository.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('Conversation') })
    );
  });
});

describe('ChatService — listConversations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated list with metadata', async () => {
    const convs = [makeConversation(), makeConversation({ _id: 'eeeeeeeeeeeeeeeeeeeeeeee' })];
    chatRepository.findUserConversations.mockResolvedValue({ docs: convs, total: 2 });

    const result = await chatService.listConversations(USER_A, { page: 1, limit: 20 });

    expect(result.conversations).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('caps limit at MAX_PAGE_SIZE', async () => {
    chatRepository.findUserConversations.mockResolvedValue({ docs: [], total: 0 });

    await chatService.listConversations(USER_A, { limit: 9999 });

    expect(chatRepository.findUserConversations).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ limit: CHAT.MAX_PAGE_SIZE })
    );
  });

  it('delegates to searchConversations when search param is present', async () => {
    chatRepository.searchConversations.mockResolvedValue({ docs: [], total: 0 });

    await chatService.listConversations(USER_A, { search: 'anxiety' });

    expect(chatRepository.searchConversations).toHaveBeenCalledWith(
      USER_A, 'anxiety', expect.any(Object)
    );
    expect(chatRepository.findUserConversations).not.toHaveBeenCalled();
  });
});

describe('ChatService — getConversation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns conversation for owner', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    const result = await chatService.getConversation(USER_A, CONV_ID);
    expect(result._id).toBe(CONV_ID);
  });

  it('throws ConversationNotFoundError when conversation is null', async () => {
    chatRepository.findConversation.mockResolvedValue(null);
    await expect(chatService.getConversation(USER_A, CONV_ID)).rejects.toThrow(ConversationNotFoundError);
  });

  it('throws ConversationNotFoundError when conversation is soft-deleted', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation({ deletedAt: new Date() }));
    await expect(chatService.getConversation(USER_A, CONV_ID)).rejects.toThrow(ConversationNotFoundError);
  });

  it('throws ConversationAccessDeniedError when user does not own conversation', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    await expect(chatService.getConversation(USER_B, CONV_ID)).rejects.toThrow(ConversationAccessDeniedError);
  });
});

describe('ChatService — saveMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('saves message and updates conversation meta', async () => {
    const conv = makeConversation();
    const msg  = makeMessage();

    chatRepository.findConversation.mockResolvedValue(conv);
    chatRepository.saveMessage.mockResolvedValue(msg);
    chatRepository.updateConversationMeta.mockResolvedValue({ ...conv, messageCount: 1 });

    const result = await chatService.saveMessage(USER_A, CONV_ID, {
      sender:  CHAT.SENDER.USER,
      content: 'Hello world',
    });

    expect(chatRepository.saveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: CONV_ID,
        sender:         CHAT.SENDER.USER,
        content:        'Hello world',
      })
    );
    expect(chatRepository.updateConversationMeta).toHaveBeenCalledWith(CONV_ID);
    expect(result.content).toBe('Hello world');
  });

  it('throws ConversationNotFoundError if conversation does not exist', async () => {
    chatRepository.findConversation.mockResolvedValue(null);
    await expect(chatService.saveMessage(USER_A, CONV_ID, {
      sender:  CHAT.SENDER.USER,
      content: 'test',
    })).rejects.toThrow(ConversationNotFoundError);
  });

  it('throws ConversationAccessDeniedError if user does not own conversation', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    await expect(chatService.saveMessage(USER_B, CONV_ID, {
      sender:  CHAT.SENDER.USER,
      content: 'test',
    })).rejects.toThrow(ConversationAccessDeniedError);
  });
});

describe('ChatService — renameConversation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renames conversation for owner', async () => {
    const conv    = makeConversation();
    const updated = makeConversation({ title: 'New Title' });

    chatRepository.findConversation.mockResolvedValue(conv);
    chatRepository.renameConversation.mockResolvedValue(updated);

    const result = await chatService.renameConversation(USER_A, CONV_ID, 'New Title');
    expect(result.title).toBe('New Title');
  });

  it('throws AccessDeniedError for non-owner', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    await expect(chatService.renameConversation(USER_B, CONV_ID, 'Hacked'))
      .rejects.toThrow(ConversationAccessDeniedError);
  });
});

describe('ChatService — softDeleteConversation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('soft-deletes conversation for owner', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatRepository.softDeleteConversation.mockResolvedValue(
      makeConversation({ status: CHAT.STATUS.DELETED, deletedAt: new Date() })
    );

    await expect(chatService.softDeleteConversation(USER_A, CONV_ID)).resolves.not.toThrow();
    expect(chatRepository.softDeleteConversation).toHaveBeenCalledWith(CONV_ID);
  });

  it('throws AccessDeniedError for non-owner', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    await expect(chatService.softDeleteConversation(USER_B, CONV_ID))
      .rejects.toThrow(ConversationAccessDeniedError);
  });
});

describe('ChatService — permanentDeleteConversation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes conversation and all messages', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatRepository.deleteMessagesByConversation.mockResolvedValue({ deletedCount: 5 });
    chatRepository.deleteConversation.mockResolvedValue(true);

    await chatService.permanentDeleteConversation(USER_A, CONV_ID);

    expect(chatRepository.deleteMessagesByConversation).toHaveBeenCalledWith(CONV_ID);
    expect(chatRepository.deleteConversation).toHaveBeenCalledWith(CONV_ID);
  });
});

describe('ChatService — getMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated messages for owner', async () => {
    const msgs = [makeMessage(), makeMessage({ _id: 'eeeeeeeeeeeeeeeeeeeeeeee' })];

    chatRepository.findConversation.mockResolvedValue(makeConversation());
    chatRepository.findMessages.mockResolvedValue({ docs: msgs, total: 2 });

    const result = await chatService.getMessages(USER_A, CONV_ID, { page: 1, limit: 20 });

    expect(result.messages).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it('throws AccessDeniedError for non-owner', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());
    await expect(chatService.getMessages(USER_B, CONV_ID, {}))
      .rejects.toThrow(ConversationAccessDeniedError);
  });
});

describe('ChatService — authorization edge cases', () => {
  beforeEach(() => jest.clearAllMocks());

  it('all mutating methods enforce ownership', async () => {
    chatRepository.findConversation.mockResolvedValue(makeConversation());

    const cases = [
      () => chatService.renameConversation(USER_B, CONV_ID, 'x'),
      () => chatService.softDeleteConversation(USER_B, CONV_ID),
      () => chatService.permanentDeleteConversation(USER_B, CONV_ID),
      () => chatService.saveMessage(USER_B, CONV_ID, { sender: 'user', content: 'hi' }),
      () => chatService.getMessages(USER_B, CONV_ID, {}),
    ];

    for (const fn of cases) {
      await expect(fn()).rejects.toThrow(ConversationAccessDeniedError);
    }
  });
});

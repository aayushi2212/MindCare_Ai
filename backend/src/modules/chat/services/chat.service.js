/**
 * PURPOSE
 * -------
 * Contains all business logic for conversation management.
 * Coordinates between the repository layer and enforces ownership rules.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Generate default conversation titles
 * - Validate that the requesting user owns the conversation
 * - Update message count and last-message timestamp after each message
 * - Coordinate repository calls for all CRUD operations
 * - Build pagination metadata for list responses
 *
 * NEVER
 * -----
 * - Handle HTTP request/response (controller's job)
 * - Query the database directly (repository's job)
 * - Detect emotions, call FastAPI, or generate AI responses
 * - Build prompts or call DistilBERT
 *
 * EXPORTS
 * -------
 * chatService — singleton instance
 *
 * DEPENDS ON
 * ----------
 * chat.repository, chat.errors, chat.constants, shared/logger
 */

import chatRepository from '../repositories/chat.repository.js';
import {
  ConversationNotFoundError,
  ConversationAccessDeniedError,
} from '../errors/chat.errors.js';
import CHAT   from '../constants/chat.constants.js';
import logger from '../../../shared/logger/logger.js';

class ChatService {

  // ── Conversation operations ────────────────────────────────────

  /**
   * Create a new conversation for the user.
   * Generates a default title if none is provided.
   */
  async createConversation(userId, dto = {}) {
    const title = dto.title?.trim() || this._generateDefaultTitle();

    const conversation = await chatRepository.createConversation({
      userId,
      title,
      status: CHAT.STATUS.ACTIVE,
    });

    logger.info('Conversation created', { conversationId: conversation._id, userId });
    return conversation;
  }

  /**
   * List all active conversations for the user with pagination and optional filters.
   */
  async listConversations(userId, query = {}) {
    const {
      page     = CHAT.DEFAULT_PAGE,
      limit    = Math.min(query.limit ?? CHAT.DEFAULT_PAGE_SIZE, CHAT.MAX_PAGE_SIZE),
      sort     = CHAT.SORT.NEWEST,
      archived,
      search,
    } = query;

    const safeLimit = Math.min(Number(limit) || CHAT.DEFAULT_PAGE_SIZE, CHAT.MAX_PAGE_SIZE);
    const safePage  = Math.max(Number(page)  || CHAT.DEFAULT_PAGE, 1);

    let result;
    if (search && search.trim()) {
      result = await chatRepository.searchConversations(userId, search.trim(), {
        page: safePage,
        limit: safeLimit,
      });
    } else {
      const archivedFilter = archived === 'true'  ? true
                           : archived === 'false' ? false
                           : undefined;

      result = await chatRepository.findUserConversations(userId, {
        page:     safePage,
        limit:    safeLimit,
        sort,
        archived: archivedFilter,
      });
    }

    return {
      conversations: result.docs,
      pagination:    this._buildPagination(result.total, safePage, safeLimit),
    };
  }

  /**
   * Return a single conversation, validating ownership.
   */
  async getConversation(userId, conversationId) {
    const conversation = await chatRepository.findConversation(conversationId);
    this._assertExists(conversation);
    this._assertOwnership(conversation, userId);
    return conversation;
  }

  /**
   * Rename a conversation's title, validating ownership.
   */
  async renameConversation(userId, conversationId, title) {
    const conversation = await chatRepository.findConversation(conversationId);
    this._assertExists(conversation);
    this._assertOwnership(conversation, userId);

    const updated = await chatRepository.renameConversation(conversationId, title.trim());
    logger.info('Conversation renamed', { conversationId, userId });
    return updated;
  }

  /**
   * Soft-delete a conversation, validating ownership.
   */
  async softDeleteConversation(userId, conversationId) {
    const conversation = await chatRepository.findConversation(conversationId);
    this._assertExists(conversation);
    this._assertOwnership(conversation, userId);

    const updated = await chatRepository.softDeleteConversation(conversationId);
    logger.info('Conversation soft-deleted', { conversationId, userId });
    return updated;
  }

  /**
   * Permanently delete a conversation and all its messages.
   */
  async permanentDeleteConversation(userId, conversationId) {
    const conversation = await chatRepository.findConversation(conversationId);
    this._assertExists(conversation);
    this._assertOwnership(conversation, userId);

    await chatRepository.deleteMessagesByConversation(conversationId);
    await chatRepository.deleteConversation(conversationId);

    logger.info('Conversation permanently deleted', { conversationId, userId });
  }

  // ── Message operations ─────────────────────────────────────────

  /**
   * Save a new message to a conversation.
   * Updates conversation metadata (messageCount, lastMessageAt) atomically.
   */
  async saveMessage(userId, conversationId, dto) {
    const conversation = await chatRepository.findConversation(conversationId);
    this._assertExists(conversation);
    this._assertOwnership(conversation, userId);

    const message = await chatRepository.saveMessage({
      conversationId,
      sender:      dto.sender,
      content:     dto.content.trim(),
      messageType: dto.messageType || CHAT.MESSAGE_TYPE.TEXT,
      metadata:    dto.metadata    || {},
    });

    // Update conversation metadata after message is saved
    await chatRepository.updateConversationMeta(conversationId);

    logger.info('Message saved', {
      messageId:      message._id,
      conversationId,
      userId,
      sender:         message.sender,
    });

    return message;
  }

  /**
   * Return paginated messages for a conversation, validating ownership.
   */
  async getMessages(userId, conversationId, query = {}) {
    const conversation = await chatRepository.findConversation(conversationId);
    this._assertExists(conversation);
    this._assertOwnership(conversation, userId);

    const safeLimit = Math.min(Number(query.limit) || CHAT.DEFAULT_PAGE_SIZE, CHAT.MAX_PAGE_SIZE);
    const safePage  = Math.max(Number(query.page)  || CHAT.DEFAULT_PAGE, 1);
    const sort      = query.sort || CHAT.SORT.OLDEST;

    const result = await chatRepository.findMessages(conversationId, {
      page:  safePage,
      limit: safeLimit,
      sort,
    });

    return {
      messages:   result.docs,
      pagination: this._buildPagination(result.total, safePage, safeLimit),
    };
  }

  // ── Private helpers ────────────────────────────────────────────

  /**
   * Generate a default conversation title with a timestamp.
   * e.g. "Conversation — Aug 3, 2026 at 4:30 PM"
   */
  _generateDefaultTitle() {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
      hour:  'numeric',
      minute: '2-digit',
    });
    return `${CHAT.DEFAULT_TITLE_PREFIX} — ${formatted}`;
  }

  /**
   * Build a standard pagination metadata object.
   */
  _buildPagination(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Throw ConversationNotFoundError if document is null or soft-deleted.
   */
  _assertExists(conversation) {
    if (!conversation || conversation.deletedAt !== null) {
      throw new ConversationNotFoundError();
    }
  }

  /**
   * Throw ConversationAccessDeniedError if user does not own the conversation.
   */
  _assertOwnership(conversation, userId) {
    if (String(conversation.userId) !== String(userId)) {
      throw new ConversationAccessDeniedError();
    }
  }
}

export default new ChatService();

/**
 * PURPOSE
 * -------
 * Abstracts all MongoDB queries needed by the chat module.
 * Operates across two collections: conversations and messages.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Create, find, update, and delete Conversation documents
 * - Create and find Message documents
 * - Handle pagination, sorting, and soft-delete filtering
 * - Expose searchConversations via text or title regex
 *
 * NEVER
 * -----
 * - Contain business logic (ownership validation, title generation)
 * - Query collections owned by other modules
 * - Throw module-specific errors (let the service layer do that)
 *
 * EXPORTS
 * -------
 * chatRepository — singleton instance of ChatRepository
 *
 * DEPENDS ON
 * ----------
 * chat/models/conversation.model, chat/models/message.model, chat.constants
 */

import Conversation from '../models/conversation.model.js';
import Message      from '../models/message.model.js';
import CHAT         from '../constants/chat.constants.js';

class ChatRepository {

  // ── Conversation queries ──────────────────────────────────────

  /**
   * Create a new conversation document.
   * @param {Object} dto - { userId, title, status }
   */
  createConversation(dto) {
    return Conversation.create(dto);
  }

  /**
   * Find a single conversation by ID.
   * Returns null if not found.
   */
  findConversation(conversationId) {
    return Conversation.findById(conversationId).lean();
  }

  /**
   * Find all non-deleted conversations for a user with pagination.
   *
   * @param {string}  userId
   * @param {Object}  opts
   * @param {number}  opts.page
   * @param {number}  opts.limit
   * @param {string}  opts.sort       - 'newest' | 'oldest'
   * @param {boolean} opts.archived   - filter by archived flag
   */
  async findUserConversations(userId, opts = {}) {
    const {
      page     = CHAT.DEFAULT_PAGE,
      limit    = CHAT.DEFAULT_PAGE_SIZE,
      sort     = CHAT.SORT.NEWEST,
      archived,
    } = opts;

    const filter = {
      userId,
      status:    { $ne: CHAT.STATUS.DELETED },
      deletedAt: null,
    };

    if (typeof archived === 'boolean') filter.archived = archived;

    const sortOrder = sort === CHAT.SORT.OLDEST
      ? { lastMessageAt: 1, createdAt: 1 }
      : { lastMessageAt: -1, createdAt: -1 };

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Conversation.find(filter).sort(sortOrder).skip(skip).limit(limit).lean(),
      Conversation.countDocuments(filter),
    ]);

    return { docs, total };
  }

  /**
   * Search conversations by title (case-insensitive regex).
   */
  async searchConversations(userId, query, opts = {}) {
    const {
      page  = CHAT.DEFAULT_PAGE,
      limit = CHAT.DEFAULT_PAGE_SIZE,
    } = opts;

    const filter = {
      userId,
      status:    { $ne: CHAT.STATUS.DELETED },
      deletedAt: null,
      title:     { $regex: query, $options: 'i' },
    };

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    return { docs, total };
  }

  /**
   * Rename a conversation title.
   */
  renameConversation(conversationId, title) {
    return Conversation.findByIdAndUpdate(
      conversationId,
      { title },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Toggle the archived flag on a conversation.
   */
  archiveConversation(conversationId, archived = true) {
    return Conversation.findByIdAndUpdate(
      conversationId,
      { archived },
      { new: true }
    ).lean();
  }

  /**
   * Soft-delete a conversation (sets status=deleted and deletedAt).
   */
  softDeleteConversation(conversationId) {
    return Conversation.findByIdAndUpdate(
      conversationId,
      { status: CHAT.STATUS.DELETED, deletedAt: new Date() },
      { new: true }
    ).lean();
  }

  /**
   * Permanently remove a conversation document.
   */
  deleteConversation(conversationId) {
    return Conversation.findByIdAndDelete(conversationId);
  }

  /**
   * Restore a soft-deleted conversation.
   */
  restoreConversation(conversationId) {
    return Conversation.findByIdAndUpdate(
      conversationId,
      { status: CHAT.STATUS.ACTIVE, deletedAt: null },
      { new: true }
    ).lean();
  }

  /**
   * Increment messageCount and update lastMessageAt timestamp.
   */
  updateConversationMeta(conversationId) {
    return Conversation.findByIdAndUpdate(
      conversationId,
      {
        $inc: { messageCount: 1 },
        lastMessageAt: new Date(),
      },
      { new: true }
    ).lean();
  }

  // ── Message queries ───────────────────────────────────────────

  /**
   * Persist a new message document.
   * @param {Object} dto - { conversationId, sender, content, messageType, metadata }
   */
  saveMessage(dto) {
    return Message.create(dto);
  }

  /**
   * Paginate messages for a conversation, oldest-first by default.
   */
  async findMessages(conversationId, opts = {}) {
    const {
      page  = CHAT.DEFAULT_PAGE,
      limit = CHAT.DEFAULT_PAGE_SIZE,
      sort  = CHAT.SORT.OLDEST,
    } = opts;

    const sortOrder = sort === CHAT.SORT.NEWEST ? { createdAt: -1 } : { createdAt: 1 };
    const skip      = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Message.find({ conversationId }).sort(sortOrder).skip(skip).limit(limit).lean(),
      Message.countDocuments({ conversationId }),
    ]);

    return { docs, total };
  }

  /**
   * Delete all messages belonging to a conversation (used on permanent delete).
   */
  deleteMessagesByConversation(conversationId) {
    return Message.deleteMany({ conversationId });
  }
}

export default new ChatRepository();

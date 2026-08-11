/**
 * PURPOSE
 * -------
 * Read-only MongoDB queries for the context module.
 * Operates across the Conversations and Messages collections
 * owned by Module 2 (Chat). This module never writes to either.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Find conversations by ID
 * - Find recent messages with configurable limits
 * - Find messages within a date/index range
 * - Count messages per conversation
 * - Find the latest interaction timestamp
 *
 * NEVER
 * -----
 * - Write, update, or delete any document
 * - Contain business logic (ownership checks, filtering)
 * - Import services from other modules
 *
 * EXPORTS
 * -------
 * contextRepository — singleton instance
 *
 * DEPENDS ON
 * ----------
 * Conversation model (Module 2), Message model (Module 2), context.constants
 *
 * NOTE
 * ----
 * We import the models directly from the chat module's model files.
 * The models are registered in Mongoose's global registry at startup,
 * so importing the same file from two modules is safe — Mongoose
 * returns the cached model rather than recompiling the schema.
 */

import Conversation from '../../chat/models/conversation.model.js';
import Message      from '../../chat/models/message.model.js';
import CONTEXT      from '../constants/context.constants.js';

class ContextRepository {

  // ── Conversation queries ──────────────────────────────────────

  /**
   * Find a conversation by ID.
   * Returns null if not found.
   */
  findConversation(conversationId) {
    return Conversation.findById(conversationId).lean();
  }

  // ── Message queries ───────────────────────────────────────────

  /**
   * Find the N most-recent non-deleted messages for a conversation.
   * Returns them in DB order (newest first from MongoDB), caller
   * is responsible for re-sorting into chronological order.
   *
   * @param {string} conversationId
   * @param {number} limit          — hard ceiling on messages returned
   */
  async findRecentMessages(conversationId, limit) {
    const docs = await Message
      .find({ conversationId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return docs;
  }

  /**
   * Find messages created between two dates (inclusive).
   * Returns oldest-first.
   */
  findMessagesByRange(conversationId, from, to) {
    const filter = { conversationId, deletedAt: null };
    if (from) filter.createdAt = { ...filter.createdAt, $gte: from };
    if (to)   filter.createdAt = { ...filter.createdAt, $lte: to };

    return Message
      .find(filter)
      .sort({ createdAt: 1 })
      .lean();
  }

  /**
   * Count all non-deleted messages for a conversation.
   */
  countMessages(conversationId) {
    return Message.countDocuments({ conversationId, deletedAt: null });
  }

  /**
   * Return the createdAt timestamp of the most recent message,
   * or null if the conversation has no messages.
   */
  async findLatestInteraction(conversationId) {
    const msg = await Message
      .findOne({ conversationId, deletedAt: null })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean();

    return msg ? msg.createdAt : null;
  }
}

export default new ContextRepository();

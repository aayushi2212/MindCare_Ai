/**
 * PURPOSE
 * -------
 * Assembles a structured, filtered, and size-limited context object
 * from a conversation's message history.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate ownership (user must own the conversation)
 * - Verify the conversation exists and is not deleted/archived
 * - Retrieve messages via the repository
 * - Filter out soft-deleted and empty messages
 * - Apply sender-type filters (user-only / assistant-only)
 * - Sort chronologically (oldest → newest)
 * - Enforce the MAX_CONTEXT_MESSAGES window
 * - Enforce the MAX_CONTEXT_CHARACTERS budget
 * - Map Message.sender → LLM-convention role (user / assistant)
 * - Identify repeated emotional patterns from message metadata
 * - Return a deterministic, standardised context object
 *
 * NEVER
 * -----
 * - Write to the database
 * - Generate AI responses
 * - Detect emotions or perform safety checks
 * - Import from Module 3 (emotion) or Module 5 (response)
 * - Contain Express request/response logic
 *
 * EXPORTS
 * -------
 * contextService — singleton instance
 *
 * DEPENDS ON
 * ----------
 * context.repository, context.constants, context.errors, shared/logger
 */

import contextRepository from '../repositories/context.repository.js';
import CONTEXT           from '../constants/context.constants.js';
import {
  ConversationNotFoundError,
  UnauthorizedConversationAccessError,
  InvalidContextLimitError,
} from '../errors/context.errors.js';
import logger from '../../../shared/logger/logger.js';

class ContextService {

  /**
   * Build and return a context object for a conversation.
   * This is the primary method consumed by other modules.
   *
   * @param {string} userId
   * @param {string} conversationId
   * @param {Object} opts
   * @param {number}  opts.limit                   — max messages to include
   * @param {boolean} opts.includeMetadata          — attach conversation-level metadata
   * @param {boolean} opts.includeAssistantMessages — include AI messages (default true)
   * @param {boolean} opts.includeUserMessages      — include user messages (default true)
   *
   * @returns {ContextObject}
   *
   * @typedef {Object} ContextObject
   * @property {string}   conversationId
   * @property {Array}    recentMessages        — [{role, content}]
   * @property {number}   messageCount          — total non-deleted messages
   * @property {Date|null} lastInteraction       — timestamp of most-recent message
   * @property {Array}    repeatedEmotions       — [{emotion, count}] for emotions seen 2+ times
   * @property {Object|null} metadata           — optional conversation-level metadata
   */
  async buildContext(userId, conversationId, opts = {}) {
    const {
      limit                    = CONTEXT.DEFAULT_CONTEXT_MESSAGES,
      includeMetadata          = false,
      includeAssistantMessages = true,
      includeUserMessages      = true,
    } = opts;

    // 1. Validate limit
    this._validateLimit(limit);

    // 2. Fetch and verify the conversation
    const conversation = await contextRepository.findConversation(conversationId);
    this._assertConversationExists(conversation);
    this._assertOwnership(conversation, userId);
    this._assertConversationAccessible(conversation);

    logger.info('Building context', { conversationId, userId, limit });

    // 3. Fetch more than needed so filtering still fills the window
    const fetchLimit = limit * CONTEXT.REPOSITORY_FETCH_MULTIPLIER;
    const rawMessages = await contextRepository.findRecentMessages(conversationId, fetchLimit);

    // 4. Filter, map, and build the context window
    const recentMessages = this._buildMessageWindow(rawMessages, {
      limit,
      includeAssistantMessages,
      includeUserMessages,
    });

    // 5. Fetch conversation-level metadata (count, last interaction)
    const [messageCount, lastInteraction] = await Promise.all([
      contextRepository.countMessages(conversationId),
      contextRepository.findLatestInteraction(conversationId),
    ]);

    // 6. Extract repeated emotion patterns from raw message metadata
    const repeatedEmotions = this._extractRepeatedEmotions(rawMessages);

    // 7. Assemble the context object
    const context = {
      conversationId,
      recentMessages,
      messageCount,
      lastInteraction,
      repeatedEmotions,
    };

    // 8. Optionally attach conversation-level metadata
    if (includeMetadata) {
      context.metadata = {
        title:       conversation.title,
        status:      conversation.status,
        archived:    conversation.archived,
        createdAt:   conversation.createdAt,
        lastEmotion: conversation.lastEmotion ?? null,
      };
    }

    logger.info('Context assembled', {
      conversationId,
      messageCount,
      contextWindowSize: recentMessages.length,
      repeatedEmotionCount: repeatedEmotions.length,
    });

    return context;
  }

  // ── Private helpers ────────────────────────────────────────────

  /**
   * Filter and transform raw Message documents into the context window.
   */
  _buildMessageWindow(rawMessages, { limit, includeAssistantMessages, includeUserMessages }) {
    const filtered = rawMessages
      .filter((m) => !m.deletedAt)
      .filter((m) => m.content && m.content.trim().length > 0)
      .filter((m) => {
        if (m.sender === 'user' && !includeUserMessages)      return false;
        if (m.sender === 'ai'   && !includeAssistantMessages) return false;
        return true;
      });

    const chronological = filtered.reverse();

    const mapped = chronological.map((m) => ({
      role:      CONTEXT.SENDER_TO_ROLE[m.sender] ?? CONTEXT.ROLE.USER,
      content:   m.content.trim(),
      createdAt: m.createdAt,
    }));

    const withinBudget = this._applyCharacterBudget(mapped);
    return withinBudget.slice(-limit);
  }

  /**
   * Drop the oldest messages until total character count is under budget.
   */
  _applyCharacterBudget(messages) {
    let totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);

    if (totalChars <= CONTEXT.MAX_CONTEXT_CHARACTERS) return messages;

    const result = [...messages];
    while (result.length > 0 && totalChars > CONTEXT.MAX_CONTEXT_CHARACTERS) {
      const dropped = result.shift();
      totalChars -= dropped.content.length;
    }

    logger.warn('Context character budget exceeded — oldest messages dropped', {
      dropped:   messages.length - result.length,
      remaining: result.length,
    });

    return result;
  }

  /**
   * Identify repeated emotional patterns from message metadata.
   *
   * Inspects each message's metadata.emotion field (populated by the
   * integrated pipeline once Modules 3 and 8 are wired). Returns an
   * array of emotions that appear two or more times, sorted by count
   * descending.
   *
   * Returns an empty array when no emotion metadata exists — this is
   * the expected state until the full pipeline is connected.
   *
   * @param   {Array} rawMessages — raw Message documents from the repository
   * @returns {Array<{ emotion: string, count: number }>}
   */
  _extractRepeatedEmotions(rawMessages) {
    const counts = {};

    for (const msg of rawMessages) {
      const emotion = msg?.metadata?.emotion;
      if (emotion && typeof emotion === 'string') {
        counts[emotion] = (counts[emotion] ?? 0) + 1;
      }
    }

    return Object.entries(counts)
      .filter(([, count]) => count >= CONTEXT.REPEATED_EMOTION_MIN_COUNT)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Throw InvalidContextLimitError if limit is outside allowed range.
   */
  _validateLimit(limit) {
    const n = Number(limit);
    if (!Number.isInteger(n) || n < CONTEXT.MIN_CONTEXT_MESSAGES || n > CONTEXT.MAX_CONTEXT_MESSAGES) {
      throw new InvalidContextLimitError(CONTEXT.MIN_CONTEXT_MESSAGES, CONTEXT.MAX_CONTEXT_MESSAGES);
    }
  }

  /**
   * Throw ConversationNotFoundError if the document is null or soft-deleted.
   */
  _assertConversationExists(conversation) {
    if (!conversation || conversation.deletedAt !== null) {
      throw new ConversationNotFoundError();
    }
  }

  /**
   * Throw UnauthorizedConversationAccessError if user does not own the conversation.
   */
  _assertOwnership(conversation, userId) {
    if (String(conversation.userId) !== String(userId)) {
      throw new UnauthorizedConversationAccessError();
    }
  }

  /**
   * Throw ConversationNotFoundError if the conversation status is not in the allowlist.
   */
  _assertConversationAccessible(conversation) {
    if (!CONTEXT.ALLOWED_STATUSES.includes(conversation.status)) {
      throw new ConversationNotFoundError();
    }
  }
}

export default new ContextService();

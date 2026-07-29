/**
 * PURPOSE
 * -------
 * Handles HTTP layer for conversation operations.
 *
 * RESPONSIBILITIES
 * -------
 * - Parse request, delegate to ChatService, respond
 *
 * NEVER
 * -------
 * - Generate AI responses
 * - Detect emotions
 *
 * EXPORTS
 * -------
 * createConversation, getConversations, getConversationById, deleteConversation
 *
 * DEPENDS ON
 * -------
 * ChatService, shared/response
 */

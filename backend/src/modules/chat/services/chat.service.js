/**
 * PURPOSE
 * -------
 * Business logic for managing chat sessions.
 *
 * RESPONSIBILITIES
 * -------
 * - Create, retrieve, archive conversations
 * - Enforce ownership rules
 *
 * NEVER
 * -------
 * - Generate AI responses (that is ConversationEngine's job)
 * - Call FastAPI directly
 *
 * EXPORTS
 * -------
 * createConversation(userId, dto), getConversations(userId), archiveConversation(id)
 *
 * DEPENDS ON
 * -------
 * ChatRepository
 */

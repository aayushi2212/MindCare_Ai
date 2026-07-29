/**
 * PURPOSE
 * -------
 * Retrieves and assembles user context to enrich the AI prompt.
 *
 * RESPONSIBILITIES
 * -------
 * - Fetch recent conversation history from ChatRepository
 * - Fetch user preferences and emotional state
 * - Assemble a unified context object
 *
 * NEVER
 * -------
 * - Store context
 * - Call the AI model
 *
 * EXPORTS
 * -------
 * getContext(userId, conversationId) → ContextObject
 *
 * DEPENDS ON
 * -------
 * ChatRepository, UserRepository, EmotionService
 */

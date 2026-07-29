/**
 * PURPOSE
 * -------
 * Top-level orchestrator for the AI conversational pipeline.
 *
 * RESPONSIBILITIES
 * -------
 * - Coordinate context retrieval, prompt building, AI call, safety check, and response formatting in sequence
 * - Emit conversation events for analytics
 *
 * NEVER
 * -------
 * - Implement any individual step directly — delegate to specialised services
 *
 * EXPORTS
 * -------
 * processMessage(userId, conversationId, userMessage) → AIResponse
 *
 * DEPENDS ON
 * -------
 * ContextService, PromptBuilderService, ResponsePipelineService, SafetyService, shared/events
 */

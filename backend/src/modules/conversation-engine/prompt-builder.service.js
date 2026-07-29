/**
 * PURPOSE
 * -------
 * Constructs the final prompt sent to the AI model.
 *
 * RESPONSIBILITIES
 * -------
 * - Combine system prompt, user context, conversation history, and current message into a structured prompt object
 * - Apply persona and tone instructions
 *
 * NEVER
 * -------
 * - Call the AI model
 * - Retrieve context from database
 *
 * EXPORTS
 * -------
 * buildPrompt(context, history, userMessage) → PromptObject
 *
 * DEPENDS ON
 * -------
 * shared/constants/prompts.js
 */

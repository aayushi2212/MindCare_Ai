/**
 * PURPOSE
 * -------
 * Runs safety checks on both inbound user messages and outbound AI responses.
 *
 * RESPONSIBILITIES
 * -------
 * - Check for crisis keywords and self-harm indicators
 * - Block or flag policy-violating content
 * - Trigger escalation workflows when needed
 *
 * NEVER
 * -------
 * - Generate responses
 * - Store messages
 *
 * EXPORTS
 * -------
 * checkInput(text) → SafetyResult, checkOutput(text) → SafetyResult
 *
 * DEPENDS ON
 * -------
 * safety constants, shared/events
 */

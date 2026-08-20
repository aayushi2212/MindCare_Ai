/**
 * ARCHITECTURE NOTE
 * -----------------
 * The conversation-engine module has been consolidated into:
 *
 *   chat/services/message-pipeline.service.js
 *
 * That file is the single authoritative orchestrator for the full
 * user-message → AI-response pipeline (Safety → Emotion → Context → Response).
 *
 * This directory is retained for structural reference only.
 * Do NOT add new implementation files here.
 */

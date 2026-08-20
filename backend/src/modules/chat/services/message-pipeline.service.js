/**
 * PURPOSE
 * -------
 * Orchestrates the full user-message → AI-response pipeline.
 * This service is the ONLY place where safety, emotion detection,
 * context assembly, and response generation are coordinated for chat.
 *
 * PIPELINE (Blueprint-correct order)
 * --------
 * 1. Validate conversation ownership
 * 2. Safety check (FIRST gate — before any AI processing)
 *    ↓ HIGH RISK → persist user + crisis response → return (skip AI pipeline)
 *    ↓ SAFE     → continue
 * 3. Emotion detection (Module 3)
 * 4. Context retrieval via ContextService (Module 4)
 *    — runs on EXISTING messages only (current message not yet saved)
 * 5. Response generation (Module 5) with emotion + context
 * 6. Persist USER message WITH emotion metadata (emotion describes the USER's message)
 * 7. Persist AI message (no emotion metadata — emotion belongs to the user message)
 * 8. Return { userMessage, aiMessage, emotion }
 *
 * WHY EMOTION/CONTEXT BEFORE PERSIST
 * -----------------------------------
 * Context must see only PREVIOUS messages. If we persist the current
 * user message first, buildContext() would include it as "prior history"
 * and the AI would see its own prompt as context — incorrect behaviour.
 *
 * NEVER
 * -----
 * - Handle HTTP request/response (controller's job)
 * - Access MongoDB directly (repository's job)
 * - Implement response strategies (ResponseService's job)
 * - Implement emotion detection (EmotionService's job)
 * - Build context objects (ContextService's job)
 *
 * DEPENDS ON
 * ----------
 * chat.service, chat.repository, emotion.service,
 * context.service, response.service, safety.service
 */

import chatService     from './chat.service.js';
import chatRepository  from '../repositories/chat.repository.js';
import emotionService  from '../../emotion/services/emotion.service.js';
import responseService from '../../response/services/response.service.js';
import contextService  from '../../context/services/context.service.js';
import safetyService, { SAFETY_STATUS } from '../../safety/services/safety.service.js';
import { ConversationNotFoundError, ConversationAccessDeniedError } from '../errors/chat.errors.js';
import logger from '../../../shared/logger/logger.js';

class MessagePipelineService {
  /**
   * Process a user message through the full pipeline.
   *
   * @param {string} userId
   * @param {string} conversationId
   * @param {string} userMessageText
   * @returns {{ userMessage, aiMessage, emotion }}
   */
  async processMessage(userId, conversationId, userMessageText) {

    // ── 1. Verify ownership ────────────────────────────────────────
    const conversation = await chatRepository.findConversation(conversationId);
    if (!conversation || conversation.deletedAt !== null) {
      throw new ConversationNotFoundError();
    }
    if (String(conversation.userId) !== String(userId)) {
      throw new ConversationAccessDeniedError();
    }

    // ── 2. SAFETY GATE (FIRST — before any AI processing) ─────────
    const safetyResult = safetyService.checkMessage(userMessageText);

    if (safetyResult.isHighRisk) {
      // Persist the user message so history is intact
      const userMessage = await chatService.saveMessage(userId, conversationId, {
        sender:  'user',
        content: userMessageText,
      });

      // Persist the predefined safe crisis response — no AI involved
      const aiMessage = await chatService.saveMessage(userId, conversationId, {
        sender:   'ai',
        content:  safetyResult.crisisResponse,
        metadata: { strategy: 'crisis_response', safety: { status: SAFETY_STATUS.HIGH_RISK } },
      });

      logger.info('Pipeline: crisis response delivered', { conversationId });

      return {
        userMessage,
        aiMessage,
        emotion: { emotion: 'neutral', confidence: 0.0 },
      };
    }

    // ── 3. Emotion detection (best-effort; fall back to neutral) ───
    // NOTE: Run BEFORE persisting the user message so context only sees
    // genuine prior history when we call buildContext below.
    let emotionResult = { emotion: 'neutral', confidence: 0.5 };
    try {
      emotionResult = await emotionService.analyze(userMessageText);
    } catch (err) {
      logger.warn('Pipeline: emotion detection failed, falling back to neutral', {
        error: err.message,
      });
    }

    // ── 4. Context retrieval (Module 4) — BEFORE persisting user msg ──
    // This ensures buildContext operates on PREVIOUS messages only.
    let contextObject = { recentMessages: [], messageCount: 0, repeatedEmotions: [] };
    try {
      contextObject = await contextService.buildContext(userId, conversationId, {
        limit: 10,
        includeAssistantMessages: true,
        includeUserMessages: true,
      });
    } catch (err) {
      logger.warn('Pipeline: context retrieval failed, using empty context', {
        error: err.message,
      });
    }

    // ── 5. Normalise emotion for Module 5 contract ─────────────────
    const emotion = {
      label:            emotionResult.emotion      ?? 'neutral',
      confidence:       emotionResult.confidence   ?? 0.5,
      secondaryEmotion: emotionResult.secondaryEmotion ?? null,
    };

    // ── 6. Generate AI response (Module 5) ─────────────────────────
    let aiContent        = "I'm here to support you. Could you tell me more?";
    let responseStrategy = 'fallback';
    try {
      const generated = await responseService.generateResponse({
        userMessage: userMessageText,
        emotion,
        context: {
          recentMessages:   contextObject.recentMessages,
          messageCount:     contextObject.messageCount,
          repeatedEmotions: contextObject.repeatedEmotions,
          lastInteraction:  contextObject.lastInteraction,
        },
        safety: { status: safetyResult.status },
      });
      aiContent        = generated.message;
      responseStrategy = generated.strategy;
    } catch (err) {
      logger.warn('Pipeline: response generation failed, using fallback', {
        error: err.message,
      });
    }

    // ── 7. Persist USER message WITH emotion metadata ──────────────
    // Saved AFTER context retrieval so buildContext never sees this
    // message as "prior conversation history".
    // IMPORTANT: metadata.emotion stored on the USER message — emotion
    // describes the user's emotional state, not the AI response.
    // ContextService._extractRepeatedEmotions() reads metadata.emotion
    // to compute repeated emotion patterns from USER messages.
    const userMessage = await chatService.saveMessage(userId, conversationId, {
      sender:  'user',
      content: userMessageText,
      metadata: {
        emotion:    emotionResult.emotion,          // string label e.g. "sad"
        confidence: emotionResult.confidence ?? 0.5,
        secondaryEmotion: emotionResult.secondaryEmotion ?? null,
      },
    });

    // ── 8. Persist AI message (no emotion metadata) ─────────────────
    // The AI message is the generated response; it does not carry
    // the user's emotional classification.
    const aiMessage = await chatService.saveMessage(userId, conversationId, {
      sender:   'ai',
      content:  aiContent,
      metadata: {
        strategy: responseStrategy,
        safety:   { status: safetyResult.status },
      },
    });

    logger.info('Pipeline: complete', {
      conversationId,
      emotion:         emotion.label,
      strategy:        responseStrategy,
      contextMessages: contextObject.recentMessages.length,
    });

    return { userMessage, aiMessage, emotion: emotionResult };
  }
}

export default new MessagePipelineService();

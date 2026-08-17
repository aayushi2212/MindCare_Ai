/**
 * PURPOSE
 * -------
 * Orchestrates the full user-message → AI-response pipeline.
 * This service is the ONLY place where emotion detection, context
 * assembly, and response generation are coordinated for chat.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate conversation ownership
 * - Persist the user message
 * - Call EmotionService to detect emotion
 * - Retrieve recent context from ChatRepository
 * - Call ResponseService to generate AI response
 * - Persist the AI message with emotion metadata
 * - Return both messages + detected emotion
 *
 * NEVER
 * -----
 * - Handle HTTP request/response (controller's job)
 * - Access MongoDB directly (repository's job)
 * - Implement response strategies (ResponseService's job)
 * - Implement emotion detection (EmotionService's job)
 *
 * DEPENDS ON
 * ----------
 * chat.service, chat.repository, emotion.service, response.service
 */

import chatService    from './chat.service.js';
import chatRepository from '../repositories/chat.repository.js';
import emotionService from '../../emotion/services/emotion.service.js';
import responseService from '../../response/services/response.service.js';
import { ConversationNotFoundError, ConversationAccessDeniedError } from '../errors/chat.errors.js';
import logger from '../../../shared/logger/logger.js';

class MessagePipelineService {
  /**
   * Process a user message through the full pipeline.
   * @param {string} userId
   * @param {string} conversationId
   * @param {string} userMessageText
   * @returns {{ userMessage, aiMessage, emotion }}
   */
  async processMessage(userId, conversationId, userMessageText) {
    // 1. Verify ownership via chat service
    const conversation = await chatRepository.findConversation(conversationId);
    if (!conversation || conversation.deletedAt !== null) {
      throw new ConversationNotFoundError();
    }
    if (String(conversation.userId) !== String(userId)) {
      throw new ConversationAccessDeniedError();
    }

    // 2. Persist user message
    const userMessage = await chatService.saveMessage(userId, conversationId, {
      sender:  'user',
      content: userMessageText,
    });

    // 3. Detect emotion (best-effort; fall back to neutral if unavailable)
    let emotionResult = { emotion: 'neutral', confidence: 0.5 };
    try {
      emotionResult = await emotionService.analyze(userMessageText);
    } catch (err) {
      logger.warn('Emotion detection failed, falling back to neutral', { error: err.message });
    }

    // 4. Build context from recent messages (last 6)
    let recentMessages = [];
    try {
      const msgResult = await chatRepository.findMessages(conversationId, {
        page: 1, limit: 7, sort: 'newest',
      });
      // Reverse so oldest first, exclude the message we just saved
      recentMessages = msgResult.docs
        .filter((m) => String(m._id) !== String(userMessage._id))
        .reverse()
        .slice(-6)
        .map((m) => ({
          role:    m.sender === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));
    } catch (err) {
      logger.warn('Context retrieval failed', { error: err.message });
    }

    // 5. Normalize emotion for Module 5 contract: { label, confidence }
    const emotion = {
      label:      emotionResult.emotion,
      confidence: emotionResult.confidence ?? 0.5,
      secondaryEmotion: emotionResult.secondaryEmotion ?? null,
    };

    // 6. Generate AI response
    let aiContent = 'I\'m here to support you. Could you tell me more?';
    let responseStrategy = 'fallback';
    try {
      const generated = await responseService.generateResponse({
        userMessage: userMessageText,
        emotion,
        context: { recentMessages },
      });
      aiContent        = generated.message;
      responseStrategy = generated.strategy;
    } catch (err) {
      logger.warn('Response generation failed, using fallback', { error: err.message });
    }

    // 7. Persist AI message with emotion metadata
    const aiMessage = await chatService.saveMessage(userId, conversationId, {
      sender:   'ai',
      content:  aiContent,
      metadata: {
        emotion:  emotionResult,
        strategy: responseStrategy,
      },
    });

    logger.info('Message pipeline complete', { conversationId, emotion: emotion.label });

    return { userMessage, aiMessage, emotion: emotionResult };
  }
}

export default new MessagePipelineService();

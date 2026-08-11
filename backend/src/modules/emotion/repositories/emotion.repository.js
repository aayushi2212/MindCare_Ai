/**
 * PURPOSE
 * -------
 * Repository abstraction for the emotion module.
 *
 * In Version 1, this module does NOT persist emotion data.
 * Emotion results are returned to the caller (e.g., Chat module)
 * which decides whether and where to store them.
 *
 * This file exists as the designated extension point for Version 2,
 * when emotion history or analytics storage may be required.
 *
 * FUTURE RESPONSIBILITIES (V2+)
 * --------------------------------
 * - Save emotion analysis results per message
 * - Query emotion history for a user or conversation
 * - Support analytics queries (emotion frequency, trends)
 *
 * NEVER
 * -----
 * - Contain business logic
 * - Call FastAPI
 *
 * EXPORTS
 * -------
 * emotionRepository — singleton (currently a no-op stub)
 *
 * DEPENDS ON
 * ----------
 * none (no model in V1)
 */

class EmotionRepository {
  /**
   * V2 placeholder: Save an emotion result linked to a message.
   * @param {Object} _dto - { userId, conversationId, messageId, emotion, confidence }
   */
  // async saveResult(_dto) {
  //   return EmotionResult.create(_dto);
  // }

  /**
   * V2 placeholder: Find emotion history for a user.
   * @param {string} _userId
   */
  // async findByUser(_userId) {
  //   return EmotionResult.find({ userId: _userId }).sort({ createdAt: -1 });
  // }
}

export default new EmotionRepository();

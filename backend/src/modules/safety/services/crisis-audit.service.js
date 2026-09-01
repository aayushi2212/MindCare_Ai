/**
 * PURPOSE
 * -------
 * Manages crisis audit records on behalf of the pipeline.
 *
 * RESPONSIBILITIES
 * -------
 * - Write minimal audit records when a crisis event occurs
 * - Enforce that raw message content is NEVER stored
 * - Provide ownership-scoped retrieval for authorised users
 *
 * NEVER
 * -----
 * - Store crisis message text
 * - Store detection patterns
 * - Allow one user to read another user's audit records
 *
 * EXPORTS
 * -------
 * crisisAuditService.logEvent(dto)
 * crisisAuditService.getEventsForUser(userId, options)
 *
 * DEPENDS ON
 * ----------
 * safety.repository, shared/logger
 */

import safetyRepository from '../repositories/safety.repository.js';
import logger from '../../../shared/logger/logger.js';

class CrisisAuditService {
  /**
   * Log a crisis detection event.
   * Called by the pipeline AFTER a crisis response has been sent.
   *
   * @param {{
   *   userId: string,
   *   conversationId?: string,
   *   riskLevel: string,
   *   category: string,
   *   action: string
   * }} dto
   * @returns {Promise<void>}  — fire-and-forget; pipeline must not block on this
   */
  async logEvent(dto) {
    try {
      await safetyRepository.createAuditRecord({
        userId:         dto.userId,
        conversationId: dto.conversationId ?? null,
        riskLevel:      dto.riskLevel,
        category:       dto.category,
        action:         dto.action,
      });

      logger.info('Safety audit: crisis event recorded', {
        userId:         dto.userId,
        conversationId: dto.conversationId,
        riskLevel:      dto.riskLevel,
        category:       dto.category,
        action:         dto.action,
        // NOTE: message content is NEVER logged here
      });
    } catch (err) {
      // Audit failures must not break the crisis response path.
      // Log the failure but swallow it.
      logger.error('Safety audit: failed to write crisis audit record', {
        error: err.message,
        userId: dto.userId,
      });
    }
  }

  /**
   * Return a user's own audit records (ownership-enforced at call site).
   * The caller must already have verified that the requesting user
   * matches userId.
   *
   * @param {string} userId
   * @param {{ limit?: number, page?: number }} options
   * @returns {Promise<{ records: object[], total: number }>}
   */
  async getEventsForUser(userId, { limit = 20, page = 1 } = {}) {
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage  = Math.max(Number(page)  || 1,  1);
    const skip      = (safePage - 1) * safeLimit;

    const [records, total] = await Promise.all([
      safetyRepository.getAuditRecordsByUser(userId, { limit: safeLimit, skip }),
      safetyRepository.countByUser(userId),
    ]);

    return { records, total };
  }
}

export default new CrisisAuditService();

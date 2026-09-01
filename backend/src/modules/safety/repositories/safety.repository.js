/**
 * PURPOSE
 * -------
 * MongoDB query layer for the Safety module.
 * All database interactions are isolated here.
 *
 * RESPONSIBILITIES
 * -------
 * - Create crisis audit records
 * - Query audit records by userId (ownership-scoped)
 *
 * NEVER
 * -----
 * - Contain business logic
 * - Store message content
 * - Allow cross-user data access
 *
 * EXPORTS
 * -------
 * safetyRepository.createAuditRecord(dto)
 * safetyRepository.getAuditRecordsByUser(userId, options)
 */

import CrisisAudit from '../models/crisis-audit.model.js';

class SafetyRepository {
  /**
   * Create a minimal crisis audit record.
   * @param {{ userId, conversationId, riskLevel, category, action }} dto
   * @returns {Promise<CrisisAudit>}
   */
  async createAuditRecord(dto) {
    const record = new CrisisAudit({
      userId:         dto.userId,
      conversationId: dto.conversationId ?? null,
      riskLevel:      dto.riskLevel,
      category:       dto.category ?? null,
      action:         dto.action,
    });
    return record.save();
  }

  /**
   * Return recent audit records for a specific user (ownership-scoped).
   * @param {string} userId
   * @param {{ limit?: number, skip?: number }} options
   * @returns {Promise<CrisisAudit[]>}
   */
  async getAuditRecordsByUser(userId, { limit = 20, skip = 0 } = {}) {
    return CrisisAudit
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 100))
      .select('-__v')
      .lean();
  }

  /**
   * Count audit records for a user.
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async countByUser(userId) {
    return CrisisAudit.countDocuments({ userId });
  }
}

export default new SafetyRepository();

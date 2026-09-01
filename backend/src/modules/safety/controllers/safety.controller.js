/**
 * PURPOSE
 * -------
 * Thin HTTP layer for the Safety module's protected endpoints.
 *
 * RESPONSIBILITIES
 * -------
 * - Return the authenticated user's own crisis audit records
 * - Enforce ownership (userId from JWT, not request body)
 *
 * NEVER
 * -----
 * - Allow cross-user data access
 * - Expose detection patterns or crisis message content
 * - Contain business logic
 *
 * EXPORTS
 * -------
 * getMyAuditEvents
 *
 * DEPENDS ON
 * ----------
 * crisis-audit.service, shared/utils/async-handler, shared/response/response.helper
 */

import crisisAuditService from '../services/crisis-audit.service.js';
import asyncHandler       from '../../../shared/utils/async-handler.js';
import { success }        from '../../../shared/response/response.helper.js';

/**
 * GET /safety/audit
 * Returns the authenticated user's own crisis audit events.
 * Ownership is derived from req.user.userId (JWT) — never from query params.
 */
export const getMyAuditEvents = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { limit, page } = req.query;

  const { records, total } = await crisisAuditService.getEventsForUser(userId, {
    limit: limit ? Number(limit) : 20,
    page:  page  ? Number(page)  : 1,
  });

  success(res, { records, total }, 200, 'Crisis audit records retrieved');
});

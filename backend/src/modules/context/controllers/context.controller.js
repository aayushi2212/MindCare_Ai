/**
 * PURPOSE
 * -------
 * Thin HTTP layer for the context module endpoints.
 * Receives requests, delegates to contextService, returns responses.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Extract validated inputs from req.params and req.query
 * - Call contextService.buildContext()
 * - Return a standardised JSON response
 *
 * NEVER
 * -----
 * - Contain business logic
 * - Access the database directly
 * - Import repositories or models
 *
 * EXPORTS
 * -------
 * getContext
 *
 * DEPENDS ON
 * ----------
 * context.service, shared/utils/async-handler, shared/response/response.helper
 */

import contextService from '../services/context.service.js';
import asyncHandler   from '../../../shared/utils/async-handler.js';
import { success }    from '../../../shared/response/response.helper.js';

/**
 * GET /context/:conversationId
 * Retrieve assembled context for a conversation.
 */
export const getContext = asyncHandler(async (req, res) => {
  const { conversationId }          = req.params;
  const {
    limit,
    includeMetadata,
    includeAssistantMessages,
    includeUserMessages,
  } = req.query;

  const context = await contextService.buildContext(req.user.userId, conversationId, {
    limit,
    includeMetadata,
    includeAssistantMessages,
    includeUserMessages,
  });

  success(res, context, 200, 'Context retrieved successfully');
});

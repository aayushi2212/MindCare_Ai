/**
 * PURPOSE
 * -------
 * Thin HTTP layer for the response engine endpoint.
 * Receives validated requests, delegates to ResponseService, returns responses.
 *
 * NEVER
 * -----
 * - Contain business logic or response templates
 * - Access MongoDB directly
 * - Call FastAPI
 * - Contain strategy selection logic
 *
 * EXPORTS
 * -------
 * generate
 *
 * DEPENDS ON
 * ----------
 * response.service, shared/utils/async-handler, shared/response/response.helper
 */

import responseService from '../services/response.service.js';
import asyncHandler    from '../../../shared/utils/async-handler.js';
import { success }     from '../../../shared/response/response.helper.js';

/**
 * POST /api/v1/response/generate
 *
 * Accepts a userMessage, emotion result, context, and safety state.
 * Returns the generated supportive response.
 */
export const generate = asyncHandler(async (req, res) => {
  const { userMessage, emotion, context, safety } = req.body;

  const result = await responseService.generateResponse({
    userMessage,
    emotion,
    context,
    safety,
  });

  success(res, result, 200, 'Response generated successfully');
});

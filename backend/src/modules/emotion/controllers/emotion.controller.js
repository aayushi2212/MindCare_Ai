/**
 * PURPOSE
 * -------
 * Thin HTTP layer for the emotion analyze endpoint.
 * Receives requests, delegates to EmotionService, returns responses.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Extract validated text from req.body
 * - Call emotionService.analyze()
 * - Return a standardised JSON response
 *
 * NEVER
 * -----
 * - Contain business logic (normalisation, confidence clamping)
 * - Call FastAPI directly
 * - Import the FastAPI client
 *
 * EXPORTS
 * -------
 * analyze
 *
 * DEPENDS ON
 * ----------
 * emotion.service, shared/utils/async-handler, shared/response/response.helper
 */

import emotionService from '../services/emotion.service.js';
import asyncHandler   from '../../../shared/utils/async-handler.js';
import { success }    from '../../../shared/response/response.helper.js';

/**
 * POST /emotion/analyze
 * Analyze the emotional content of a text string.
 */
export const analyze = asyncHandler(async (req, res) => {
  const result = await emotionService.analyze(req.body.text);
  success(res, result, 200, 'Emotion analysis complete');
});

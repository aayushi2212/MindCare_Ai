/**
 * PURPOSE
 * -------
 * Public entry point for the Safety module.
 * All external imports must come through this file — never from internal paths.
 *
 * EXPORTS
 * -------
 * safetyService    — singleton for crisis/safety checking
 * SAFETY_STATUS    — status constants ('safe' | 'high_risk')
 * SAFETY_RESOURCES — emergency and professional resources
 * safetyRouter     — Express router (mount at /api/v1/safety)
 */

import safetyService,   { SAFETY_STATUS } from './services/safety.service.js';
import { SAFETY_RESOURCES }               from './constants/safety.constants.js';
import safetyRouter                       from './routes/safety.routes.js';

export { safetyService, SAFETY_STATUS, SAFETY_RESOURCES, safetyRouter };
export default safetyService;

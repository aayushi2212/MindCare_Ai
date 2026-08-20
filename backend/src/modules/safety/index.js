/**
 * PURPOSE
 * -------
 * Public entry point for the safety module.
 * All external imports must come through this file — never from internal paths.
 *
 * EXPORTS
 * -------
 * safetyService — singleton for crisis/safety checking
 * SAFETY_STATUS — status constants for other modules
 */

import safetyService, { SAFETY_STATUS } from './services/safety.service.js';

export { safetyService, SAFETY_STATUS };
export default safetyService;

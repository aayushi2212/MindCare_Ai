/**
 * PURPOSE
 * -------
 * Public entry point for the response module.
 *
 * EXPORTS
 * -------
 * default         — Express router (mount at /api/v1/response)
 * responseService — service singleton for module-to-module calls
 *
 * Internal details (strategy, generator, validator internals, errors)
 * are NOT exported and must never be imported from outside this module.
 *
 * USAGE — other modules calling the Response Engine directly:
 *
 *   import { responseService } from '../response/index.js';
 *   const result = await responseService.generateResponse({ userMessage, emotion, context, safety });
 *
 * NEVER
 * -----
 * - Import strategy or generator internals from outside this module
 *
 * DEPENDS ON
 * ----------
 * response/routes/response.routes.js, response/services/response.service.js
 */

export { default }                          from './routes/response.routes.js';
export { default as responseService }       from './services/response.service.js';

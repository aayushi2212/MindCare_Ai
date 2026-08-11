/**
 * PURPOSE
 * -------
 * Public entry point for the context module.
 *
 * EXPORTS
 * -------
 * default        — Express router (mount at /api/v1/context)
 * contextService — service singleton for module-to-module calls
 *
 * Internal details (repository, validator internals) are NOT
 * exported and must never be imported from outside this module.
 *
 * USAGE — other modules calling context directly (e.g. Module 5):
 *
 *   import { contextService } from '../context/index.js';
 *   const ctx = await contextService.buildContext(userId, conversationId, opts);
 *
 * NEVER
 * -----
 * - Import contextRepository from outside this module
 *
 * DEPENDS ON
 * ----------
 * context/routes/context.routes.js, context/services/context.service.js
 */

export { default }                         from './routes/context.routes.js';
export { default as contextService }       from './services/context.service.js';

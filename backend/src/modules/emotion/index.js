/**
 * PURPOSE
 * -------
 * Public entry point for the emotion module.
 *
 * EXPORTS
 * -------
 * default        — Express router (mount at /api/v1/emotion)
 * emotionService — service singleton for internal module-to-module calls
 *
 * Internal implementation details (clients, repositories, validators)
 * are NOT exported and must never be imported from outside this module.
 *
 * USAGE — other modules calling emotion analysis directly:
 *
 *   import { emotionService } from '../emotion/index.js';
 *   const result = await emotionService.analyze(text);
 *
 * NEVER
 * -----
 * - Import fastapiClient from outside this module
 * - Import emotionRepository from outside this module
 *
 * DEPENDS ON
 * ----------
 * emotion/routes/emotion.routes.js, emotion/services/emotion.service.js
 */

export { default }        from './routes/emotion.routes.js';
export { default as emotionService } from './services/emotion.service.js';

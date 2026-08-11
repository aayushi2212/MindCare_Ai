/**
 * PURPOSE
 * -------
 * Public entry point for the chat module.
 * Only the router is exported — all internal services, repositories,
 * and models are private to this module.
 *
 * Other modules that need to reference conversation or message data
 * should use the shared event bus or extend this module's index.
 *
 * NEVER
 * -----
 * - Import chat.service or chat.repository from outside this module
 *
 * DEPENDS ON
 * ----------
 * chat/routes/chat.routes.js
 */

export { default } from './routes/chat.routes.js';

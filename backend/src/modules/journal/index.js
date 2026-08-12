/**
 * PURPOSE
 * -------
 * Public entry point for the Journal module.
 * All external imports must come through this file.
 *
 * EXPORTS
 * -------
 * journalRouter — Express router to be mounted in app.js
 *
 * NEVER
 * -----
 * Export internal implementation details (repositories, models directly).
 */

export { default } from './routes/journal.routes.js';

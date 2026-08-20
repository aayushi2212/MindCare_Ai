/**
 * PURPOSE
 * -------
 * Re-exports the auth User model — single source of truth for the User collection.
 * The user module shares the same underlying MongoDB collection as the auth module.
 *
 * DEPENDS ON
 * ----------
 * auth/models/user.model
 */
export { default } from '../../auth/models/user.model.js';

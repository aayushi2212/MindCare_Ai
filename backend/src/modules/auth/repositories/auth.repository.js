/**
 * PURPOSE
 * -------
 * Abstracts all MongoDB queries needed by the auth module.
 *
 * RESPONSIBILITIES
 * -------
 * - findUserByEmail, findUserById, createUser, saveRefreshToken, revokeRefreshToken
 *
 * NEVER
 * -------
 * - Contain business logic
 * - Call external services
 *
 * EXPORTS
 * -------
 * AuthRepository class with async query methods
 *
 * DEPENDS ON
 * -------
 * User model, mongoose
 */

/**
 * PURPOSE
 * -------
 * Business logic for user profile management.
 *
 * RESPONSIBILITIES
 * -------
 * - Fetch and update user records via UserRepository
 * - Enforce update rules (e.g. email uniqueness)
 *
 * NEVER
 * -------
 * - Handle tokens
 * - Send HTTP responses
 *
 * EXPORTS
 * -------
 * getById(id), update(id, dto), softDelete(id)
 *
 * DEPENDS ON
 * -------
 * UserRepository
 */

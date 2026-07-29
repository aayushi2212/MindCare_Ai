/**
 * PURPOSE
 * -------
 * Contains all business logic for authentication.
 *
 * RESPONSIBILITIES
 * -------
 * - Validate credentials
 * - Hash passwords
 * - Generate and verify JWT tokens
 * - Coordinate with AuthRepository
 *
 * NEVER
 * -------
 * - Handle HTTP request/response
 * - Send emails directly
 *
 * EXPORTS
 * -------
 * register(dto), login(dto), refresh(token), logout(userId)
 *
 * DEPENDS ON
 * -------
 * AuthRepository, shared/utils/jwt.js, bcrypt
 */

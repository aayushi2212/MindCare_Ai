/**
 * PURPOSE
 * -------
 * Receives HTTP requests for auth actions and delegates to AuthService.
 *
 * RESPONSIBILITIES
 * -------
 * - Extract and validate request data
 * - Call AuthService methods
 * - Return standardised HTTP responses
 *
 * NEVER
 * -------
 * - Hash passwords
 * - Generate tokens directly
 * - Query the database
 *
 * EXPORTS
 * -------
 * registerUser, loginUser, refreshToken, logoutUser
 *
 * DEPENDS ON
 * -------
 * AuthService, shared/response
 */

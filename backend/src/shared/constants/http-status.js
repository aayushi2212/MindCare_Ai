/**
 * PURPOSE
 * -------
 * Named constants for HTTP status codes used across the application.
 *
 * NEVER
 * -----
 * - Import HTTP libraries
 *
 * EXPORTS
 * -------
 * HTTP — frozen object of status codes
 *
 * DEPENDS ON
 * ----------
 * none
 */

const HTTP = Object.freeze({
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE:   503,
});

export default HTTP;

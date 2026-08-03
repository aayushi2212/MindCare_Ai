/**
 * PURPOSE
 * -------
 * Auth-module-scoped constants. Centralises all magic values used
 * across auth services, validators, and middleware.
 *
 * NEVER
 * -----
 * - Be imported from outside the auth module
 *   (use shared/constants for cross-module values)
 *
 * EXPORTS
 * -------
 * AUTH — frozen constants object
 *
 * DEPENDS ON
 * ----------
 * none
 */

const AUTH = Object.freeze({
  PASSWORD_MIN_LENGTH:      8,
  PASSWORD_MAX_LENGTH:      128,
  FULL_NAME_MIN_LENGTH:     2,
  FULL_NAME_MAX_LENGTH:     100,
  REFRESH_TOKEN_EXPIRES_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  BEARER_PREFIX:            'Bearer ',
  ACCOUNT_STATUS: Object.freeze({
    ACTIVE:    'active',
    SUSPENDED: 'suspended',
    DELETED:   'deleted',
  }),
});

export default AUTH;

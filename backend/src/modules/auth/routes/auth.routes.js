/**
 * PURPOSE
 * -------
 * Defines HTTP routes for all auth endpoints (POST /register, POST /login, POST /refresh, POST /logout).
 *
 * RESPONSIBILITIES
 * -------
 * - Map HTTP verbs and paths to controller methods
 * - Apply route-level validators
 *
 * NEVER
 * -------
 * - Contain logic
 * - Access database
 *
 * EXPORTS
 * -------
 * authRouter — Express Router
 *
 * DEPENDS ON
 * -------
 * express, auth.controller.js, validators/auth.validator.js
 */

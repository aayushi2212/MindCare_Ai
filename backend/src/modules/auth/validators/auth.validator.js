/**
 * PURPOSE
 * -------
 * Defines Joi/Zod schemas to validate auth request bodies.
 *
 * RESPONSIBILITIES
 * -------
 * - Validate register and login payloads
 * - Export middleware-ready validator functions
 *
 * NEVER
 * -------
 * - Perform business validation (e.g. does user exist)
 *
 * EXPORTS
 * -------
 * validateRegister, validateLogin — Express middleware
 *
 * DEPENDS ON
 * -------
 * joi or zod
 */

/**
 * PURPOSE
 * -------
 * Exposes safety check as an internal HTTP endpoint for other services.
 *
 * RESPONSIBILITIES
 * -------
 * - Accept text payload, return safety assessment
 *
 * NEVER
 * -------
 * - Make safety decisions in isolation without context
 *
 * EXPORTS
 * -------
 * checkContent
 *
 * DEPENDS ON
 * -------
 * SafetyService
 */

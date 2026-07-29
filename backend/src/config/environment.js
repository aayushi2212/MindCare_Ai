/**
 * PURPOSE
 * -------
 * Validates and exports all environment variables used by the backend.
 *
 * RESPONSIBILITIES
 * -------
 * - Read process.env values
 * - Validate required variables at startup
 * - Export typed config object
 *
 * NEVER
 * -------
 * - Set default secrets
 * - Contain connection logic
 *
 * EXPORTS
 * -------
 * env — { NODE_ENV, PORT, MONGO_URI, JWT_SECRET, AI_SERVICE_URL, ... }
 *
 * DEPENDS ON
 * -------
 * dotenv
 */

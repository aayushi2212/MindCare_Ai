/**
 * PURPOSE
 * -------
 * Establishes and exports the Mongoose connection to MongoDB Atlas.
 *
 * RESPONSIBILITIES
 * -------
 * - Connect to MongoDB using MONGO_URI from environment
 * - Export connection status helper
 *
 * NEVER
 * -------
 * - Run queries directly
 * - Define schemas or models
 *
 * EXPORTS
 * -------
 * connectDB() — async function that resolves when connected
 *
 * DEPENDS ON
 * -------
 * mongoose, config/environment.js, shared/logger
 */

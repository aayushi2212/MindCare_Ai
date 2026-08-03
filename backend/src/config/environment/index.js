/**
 * PURPOSE
 * -------
 * Validates and exports all environment variables used by the backend.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Read process.env values at startup
 * - Validate required variables and throw early if any are missing
 * - Export a single typed config object used throughout the app
 *
 * NEVER
 * -----
 * - Set default secrets (fail loudly in production instead)
 * - Contain connection logic
 *
 * EXPORTS
 * -------
 * env — { NODE_ENV, PORT, MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, ... }
 *
 * DEPENDS ON
 * ----------
 * dotenv
 */

import 'dotenv/config';

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, fallback) => process.env[key] ?? fallback;

const env = Object.freeze({
  NODE_ENV:            optional('NODE_ENV', 'development'),
  PORT:                parseInt(optional('PORT', '5000'), 10),

  // Database
  MONGO_URI:           required('MONGO_URI'),

  // JWT
  JWT_SECRET:          required('JWT_SECRET'),
  JWT_REFRESH_SECRET:  required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES:  optional('JWT_ACCESS_EXPIRES', '15m'),
  JWT_REFRESH_EXPIRES: optional('JWT_REFRESH_EXPIRES', '7d'),

  // Security
  BCRYPT_ROUNDS:       parseInt(optional('BCRYPT_ROUNDS', '12'), 10),

  // CORS
  CLIENT_URL:          optional('CLIENT_URL', 'http://localhost:5173'),

  // AI Service
  AI_SERVICE_URL:      optional('AI_SERVICE_URL', 'http://localhost:8000'),

  // Derived helpers
  isDev:               optional('NODE_ENV', 'development') === 'development',
  isProd:              optional('NODE_ENV', 'development') === 'production',
});

export default env;

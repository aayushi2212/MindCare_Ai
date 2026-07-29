/**
 * PURPOSE
 * -------
 * Configures and exports the application logger (Winston or Pino).
 *
 * RESPONSIBILITIES
 * -------
 * - Create logger with environment-appropriate transports (console in dev, file/cloud in prod)
 * - Export log level methods: info, warn, error, debug
 *
 * NEVER
 * -------
 * - Log sensitive data
 * - Call process.exit()
 *
 * EXPORTS
 * -------
 * logger — { info, warn, error, debug }
 *
 * DEPENDS ON
 * -------
 * winston or pino
 */

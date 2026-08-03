/**
 * PURPOSE
 * -------
 * Configures and exports the application logger.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Provide structured logging with levels: info, warn, error, debug
 * - Use colour formatting in development, JSON in production
 * - Never log sensitive data (passwords, tokens)
 *
 * NEVER
 * -----
 * - Call process.exit()
 * - Log req.body or raw token values
 *
 * EXPORTS
 * -------
 * logger — { info, warn, error, debug }
 *
 * DEPENDS ON
 * ----------
 * none (uses Node built-ins only to avoid extra deps at this stage)
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const isDev = (process.env.NODE_ENV ?? 'development') === 'development';

const colours = {
  error: '\x1b[31m', // red
  warn:  '\x1b[33m', // yellow
  info:  '\x1b[36m', // cyan
  debug: '\x1b[90m', // grey
  reset: '\x1b[0m',
};

const format = (level, message, meta) => {
  const ts = new Date().toISOString();

  if (isDev) {
    const col  = colours[level] ?? '';
    const rest = colours.reset;
    const tag  = `${col}[${level.toUpperCase()}]${rest}`;
    const extra = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} ${tag} ${message}${extra}`;
  }

  // Production: structured JSON per line
  return JSON.stringify({ ts, level, message, ...meta });
};

const log = (level) => (message, meta) => {
  const line = format(level, message, meta);
  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
};

const logger = {
  error: log('error'),
  warn:  log('warn'),
  info:  log('info'),
  debug: log('debug'),
};

export default logger;

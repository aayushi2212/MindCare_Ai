/**
 * PURPOSE
 * -------
 * Configures the Express application by registering middleware,
 * routes, security, documentation, and global error handling.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Configure Express
 * - Register global middleware (helmet, cors, json parsing, rate limiting)
 * - Register API routes
 * - Configure Swagger docs
 * - Handle 404 routes
 * - Register the global error handler (last)
 *
 * NEVER
 * -----
 * - Start the HTTP server
 * - Connect to the database
 * - Contain business logic
 *
 * DEPENDS ON
 * ----------
 * config/security/cors, config/security/helmet,
 * config/documentation/swagger, shared/middleware, feature modules
 */

import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import rateLimit  from 'express-rate-limit';

import corsOptions   from './config/security/cors.js';
import helmetOptions from './config/security/helmet.js';
import { setupSwagger } from './config/documentation/swagger.js';

import requestLogger from './shared/middleware/request-logger.middleware.js';
import errorHandler  from './shared/middleware/error.middleware.js';
import { NotFoundError } from './shared/errors/http-errors.js';

// ── Feature modules ───────────────────────────────────────────────
import authRouter      from './modules/auth/index.js';
import chatRouter      from './modules/chat/index.js';
import contextRouter   from './modules/context/index.js';
import responseRouter  from './modules/response/index.js';
import emotionRouter   from './modules/emotion/index.js';
import journalRouter   from './modules/journal/index.js';

// ── Analytics (Module 7): side-effect listeners + HTTP router ─────
import analyticsRouter from './modules/analytics/index.js';

const app = express();

/* -------------------------------------------------------------------------- */
/*                               Security Layer                               */
/* -------------------------------------------------------------------------- */

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------------------------------------- */
/*                              Rate Limiting                                 */
/* -------------------------------------------------------------------------- */

const limiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api', limiter);

/* -------------------------------------------------------------------------- */
/*                              Request Logging                               */
/* -------------------------------------------------------------------------- */

app.use(requestLogger);

/* -------------------------------------------------------------------------- */
/*                                API Docs                                    */
/* -------------------------------------------------------------------------- */

setupSwagger(app);

/* -------------------------------------------------------------------------- */
/*                              Health Check                                  */
/* -------------------------------------------------------------------------- */

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success:   true,
    message:   'MindCare AI API is running',
    timestamp: new Date().toISOString(),
  });
});

/* -------------------------------------------------------------------------- */
/*                               API Routes                                   */
/* -------------------------------------------------------------------------- */

app.use('/api/v1/auth',       authRouter);
app.use('/api/v1/chat',       chatRouter);
app.use('/api/v1/context',    contextRouter);
app.use('/api/v1/response',   responseRouter);
app.use('/api/v1/emotion',    emotionRouter);
app.use('/api/v1/journal',    journalRouter);
app.use('/api/v1/analytics',  analyticsRouter);

// TODO: mount these as each module is completed
// app.use('/api/v1/users',     userRouter);
// app.use('/api/v1/dashboard', dashboardRouter);

/* -------------------------------------------------------------------------- */
/*                              404 Not Found                                 */
/* -------------------------------------------------------------------------- */

app.use((_req, _res, next) => {
  next(new NotFoundError('Route not found'));
});

/* -------------------------------------------------------------------------- */
/*                           Global Error Handler                             */
/* -------------------------------------------------------------------------- */

app.use(errorHandler);

export default app;

/**
 * PURPOSE
 * -------
 * Configures Swagger/OpenAPI documentation for the REST API.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Define swaggerSpec using jsdoc comments in route files
 * - Export setupSwagger(app) to mount /api/docs
 *
 * NEVER
 * -----
 * - Document non-API internal modules
 * - Mount routes other than the docs endpoint
 *
 * EXPORTS
 * -------
 * setupSwagger(app) — mounts swagger-ui-express at /api/docs
 *
 * DEPENDS ON
 * ----------
 * swagger-jsdoc, swagger-ui-express, config/environment
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import env from '../environment/index.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'MindCare AI API',
      version:     '1.0.0',
      description: 'REST API documentation for the MindCare AI mental health platform',
    },
    servers: [
      {
        url:         `http://localhost:${env.PORT}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Scan all route files for @swagger annotations
  apis: ['./src/modules/**/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;

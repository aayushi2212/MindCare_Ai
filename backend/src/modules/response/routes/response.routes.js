/**
 * PURPOSE
 * -------
 * Defines all HTTP routes for the response engine module.
 *
 * ROUTES
 * ------
 * POST  /response/generate  — generate a supportive response from emotion + context
 *
 * NEVER
 * -----
 * - Contain logic
 * - Access the database directly
 *
 * DEPENDS ON
 * ----------
 * response.controller, response.validator, shared/middleware/auth.middleware
 */

import { Router }          from 'express';
import * as controller     from '../controllers/response.controller.js';
import { validateGenerate } from '../validators/response.validator.js';
import { authenticate }    from '../../../shared/middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Response
 *   description: Response Engine — generates supportive AI responses
 */

/**
 * @swagger
 * /response/generate:
 *   post:
 *     summary: Generate a supportive response from emotion + context
 *     tags: [Response]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userMessage, emotion]
 *             properties:
 *               userMessage:
 *                 type: string
 *                 example: "I feel overwhelmed."
 *               emotion:
 *                 type: object
 *                 required: [label, confidence]
 *                 properties:
 *                   label:
 *                     type: string
 *                     example: "anxiety"
 *                   confidence:
 *                     type: number
 *                     example: 0.92
 *                   secondaryEmotion:
 *                     type: string
 *                     nullable: true
 *               context:
 *                 type: object
 *                 properties:
 *                   recentMessages:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         role:
 *                           type: string
 *                           enum: [user, assistant]
 *                         content:
 *                           type: string
 *               safety:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [not_evaluated, safe, high_risk, medium_risk]
 *     responses:
 *       200:
 *         description: Response generated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       503:
 *         description: High-risk safety state — response bypassed
 */
router.post('/generate', authenticate, validateGenerate, controller.generate);

export default router;

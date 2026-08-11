/**
 * PURPOSE
 * -------
 * Defines all HTTP routes for the emotion module.
 *
 * ROUTES
 * ------
 * POST /emotion/analyze — classify emotion in a text string
 *
 * NEVER
 * -----
 * - Contain logic
 * - Access the database or AI service directly
 *
 * DEPENDS ON
 * ----------
 * emotion.controller, emotion.validator, shared/middleware/auth.middleware
 */

import { Router }        from 'express';
import * as controller   from '../controllers/emotion.controller.js';
import { validateAnalyze } from '../validators/emotion.validator.js';
import { authenticate }  from '../../../shared/middleware/auth.middleware.js';

const router = Router();

// All emotion routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Emotion
 *   description: Emotion classification via the AI service
 */

/**
 * @swagger
 * /emotion/analyze:
 *   post:
 *     summary: Analyze the emotional content of a text string
 *     tags: [Emotion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "I'm feeling overwhelmed and don't know what to do."
 *     responses:
 *       200:
 *         description: Emotion analysis result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Emotion analysis complete"
 *                 data:
 *                   type: object
 *                   properties:
 *                     emotion:
 *                       type: string
 *                       example: "anxiety"
 *                     confidence:
 *                       type: number
 *                       format: float
 *                       example: 0.94
 *                     secondaryEmotion:
 *                       type: string
 *                       nullable: true
 *                       example: "sadness"
 *                     colour:
 *                       type: string
 *                       example: "#FF9933"
 *                     icon:
 *                       type: string
 *                       example: "😰"
 *                     isUncertain:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Validation error (empty or too-long text)
 *       401:
 *         description: Not authenticated
 *       422:
 *         description: Unsupported emotion or invalid confidence from AI service
 *       503:
 *         description: AI service unavailable
 *       504:
 *         description: AI service timeout
 */
router.post('/analyze', validateAnalyze, controller.analyze);

export default router;

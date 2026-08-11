/**
 * PURPOSE
 * -------
 * Defines all HTTP routes for the context module.
 *
 * ROUTES
 * ------
 * GET /context/:conversationId — retrieve context for a conversation
 *
 * NEVER
 * -----
 * - Contain logic
 * - Access the database directly
 *
 * DEPENDS ON
 * ----------
 * context.controller, context.validator, shared/middleware/auth.middleware
 */

import { Router }            from 'express';
import * as controller       from '../controllers/context.controller.js';
import {
  validateConversationId,
  validateContextQuery,
}                            from '../validators/context.validator.js';
import { authenticate }      from '../../../shared/middleware/auth.middleware.js';

const router = Router();

// All context routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Context
 *   description: Conversation context and memory retrieval
 */

/**
 * @swagger
 * /context/{conversationId}:
 *   get:
 *     summary: Retrieve assembled conversation context
 *     description: >
 *       Returns a structured, ordered, and size-limited context object
 *       built from the conversation's message history. Used internally
 *       by the Response Engine (Module 5) and exposed here for testing.
 *     tags: [Context]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 24-character MongoDB ObjectId of the conversation
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Maximum number of messages to include in context
 *       - in: query
 *         name: includeMetadata
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include conversation-level metadata (title, status, emotion)
 *       - in: query
 *         name: includeAssistantMessages
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include AI assistant messages in context
 *       - in: query
 *         name: includeUserMessages
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include user messages in context
 *     responses:
 *       200:
 *         description: Context object assembled successfully
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
 *                   example: "Context retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversationId:
 *                       type: string
 *                       example: "64b3c12a1f0b2a0012345678"
 *                     recentMessages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             enum: [user, assistant]
 *                           content:
 *                             type: string
 *                     messageCount:
 *                       type: integer
 *                       example: 42
 *                     lastInteraction:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     metadata:
 *                       type: object
 *                       nullable: true
 *       400:
 *         description: Invalid conversation ID or query parameters
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: User does not own this conversation
 *       404:
 *         description: Conversation not found or not accessible
 */
router.get(
  '/:conversationId',
  validateConversationId,
  validateContextQuery,
  controller.getContext
);

export default router;

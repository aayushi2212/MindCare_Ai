/**
 * PURPOSE
 * -------
 * Defines all HTTP routes for the chat module.
 *
 * ROUTES
 * ------
 * POST   /chat                                — create conversation
 * GET    /chat                                — list conversations (paginated, filtered)
 * GET    /chat/:conversationId                — get full conversation
 * POST   /chat/:conversationId/messages       — save a message
 * GET    /chat/:conversationId/messages       — get messages (paginated)
 * PATCH  /chat/:conversationId                — rename conversation
 * DELETE /chat/:conversationId                — soft delete
 * DELETE /chat/:conversationId/permanent      — permanent delete
 *
 * NEVER
 * -----
 * - Contain logic
 * - Access the database directly
 *
 * DEPENDS ON
 * ----------
 * chat.controller, chat.validator, shared/middleware/auth.middleware
 */

import { Router }        from 'express';
import * as controller   from '../controllers/chat.controller.js';
import {
  validateCreateConversation,
  validateSendMessage,
  validateRenameConversation,
  validateListConversations,
  validatePaginationQuery,
  validateConversationId,
}                        from '../validators/chat.validator.js';
import { authenticate }  from '../../../shared/middleware/auth.middleware.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Conversation and message management
 */

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Chat]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: "My first session"
 *     responses:
 *       201:
 *         description: Conversation created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post('/', validateCreateConversation, controller.createConversation);

/**
 * @swagger
 * /chat:
 *   get:
 *     summary: List conversations for the authenticated user
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, oldest] }
 *       - in: query
 *         name: archived
 *         schema: { type: string, enum: ['true','false'] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of conversations
 *       401:
 *         description: Not authenticated
 */
router.get('/', validateListConversations, controller.listConversations);

/**
 * @swagger
 * /chat/{conversationId}:
 *   get:
 *     summary: Get a single conversation
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Conversation object
 *       400:
 *         description: Invalid ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Not found
 */
router.get('/:conversationId', validateConversationId, controller.getConversation);

/**
 * @swagger
 * /chat/{conversationId}/messages:
 *   post:
 *     summary: Save a new message to a conversation
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sender, content]
 *             properties:
 *               sender:
 *                 type: string
 *                 enum: [user, ai]
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               messageType:
 *                 type: string
 *                 enum: [text, media]
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Message saved
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Conversation not found
 */
router.post(
  '/:conversationId/messages',
  validateConversationId,
  validateSendMessage,
  controller.sendMessage
);

/**
 * @swagger
 * /chat/{conversationId}/messages:
 *   get:
 *     summary: Get paginated messages for a conversation
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [oldest, newest] }
 *     responses:
 *       200:
 *         description: Paginated messages
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Conversation not found
 */
router.get(
  '/:conversationId/messages',
  validateConversationId,
  validatePaginationQuery,
  controller.getMessages
);

/**
 * @swagger
 * /chat/{conversationId}:
 *   patch:
 *     summary: Rename a conversation
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Conversation renamed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Not found
 */
router.patch(
  '/:conversationId',
  validateConversationId,
  validateRenameConversation,
  controller.renameConversation
);

/**
 * @swagger
 * /chat/{conversationId}:
 *   delete:
 *     summary: Soft-delete a conversation
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Not found
 */

router.post(
  '/:conversationId/send',
  validateConversationId,
  controller.sendAndProcess
);

router.delete('/:conversationId', validateConversationId, controller.softDeleteConversation);

/**
 * @swagger
 * /chat/{conversationId}/permanent:
 *   delete:
 *     summary: Permanently delete a conversation and all its messages
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Permanently deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Not found
 */
router.delete(
  '/:conversationId/permanent',
  validateConversationId,
  controller.permanentDeleteConversation
);

export default router;

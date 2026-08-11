/**
 * PURPOSE
 * -------
 * Thin HTTP layer for all chat endpoints.
 * Receives requests, delegates to ChatService, returns responses.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Extract validated inputs from req
 * - Call the appropriate chatService method
 * - Return a standardised JSON response
 *
 * NEVER
 * -----
 * - Contain business logic (ownership, title generation, meta updates)
 * - Query the database directly
 * - Import models or repositories
 *
 * EXPORTS
 * -------
 * createConversation, listConversations, getConversation,
 * sendMessage, getMessages, renameConversation,
 * softDeleteConversation, permanentDeleteConversation
 *
 * DEPENDS ON
 * ----------
 * chat.service, shared/utils/async-handler, shared/response/response.helper
 */

import chatService  from '../services/chat.service.js';
import asyncHandler from '../../../shared/utils/async-handler.js';
import { success, created, noContent, paginated } from '../../../shared/response/response.helper.js';

// ── POST /chat ─────────────────────────────────────────────────────
export const createConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.createConversation(req.user.userId, req.body);
  created(res, { conversation }, 'Conversation created successfully');
});

// ── GET /chat ─────────────────────────────────────────────────────
export const listConversations = asyncHandler(async (req, res) => {
  const result = await chatService.listConversations(req.user.userId, req.query);
  paginated(res, result.conversations, result.pagination, 'Conversations retrieved');
});

// ── GET /chat/:conversationId ──────────────────────────────────────
export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.getConversation(
    req.user.userId,
    req.params.conversationId
  );
  success(res, { conversation });
});

// ── POST /chat/:conversationId/messages ────────────────────────────
export const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.saveMessage(
    req.user.userId,
    req.params.conversationId,
    req.body
  );
  created(res, { message }, 'Message saved successfully');
});

// ── GET /chat/:conversationId/messages ─────────────────────────────
export const getMessages = asyncHandler(async (req, res) => {
  const result = await chatService.getMessages(
    req.user.userId,
    req.params.conversationId,
    req.query
  );
  paginated(res, result.messages, result.pagination, 'Messages retrieved');
});

// ── PATCH /chat/:conversationId ────────────────────────────────────
export const renameConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.renameConversation(
    req.user.userId,
    req.params.conversationId,
    req.body.title
  );
  success(res, { conversation }, 'Conversation renamed successfully');
});

// ── DELETE /chat/:conversationId ───────────────────────────────────
export const softDeleteConversation = asyncHandler(async (req, res) => {
  await chatService.softDeleteConversation(
    req.user.userId,
    req.params.conversationId
  );
  noContent(res);
});

// ── DELETE /chat/:conversationId/permanent ─────────────────────────
export const permanentDeleteConversation = asyncHandler(async (req, res) => {
  await chatService.permanentDeleteConversation(
    req.user.userId,
    req.params.conversationId
  );
  noContent(res);
});

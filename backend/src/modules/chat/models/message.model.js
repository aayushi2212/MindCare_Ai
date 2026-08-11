/**
 * PURPOSE
 * -------
 * Defines the Mongoose schema and model for the Messages collection.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Store individual messages belonging to a conversation
 * - Track sender (user | ai), content, and messageType
 * - Provide a metadata field for future module extensions (Module 3+)
 *
 * NEVER
 * -----
 * - Store emotion predictions directly (Module 3 will use metadata or extend)
 * - Contain business logic
 * - Query the Conversations collection
 *
 * DEPENDS ON
 * ----------
 * mongoose, chat.constants
 */

import mongoose from 'mongoose';
import CHAT     from '../constants/chat.constants.js';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Conversation',
      required: [true, 'Conversation ID is required'],
      index:    true,
    },

    sender: {
      type:     String,
      enum:     Object.values(CHAT.SENDER),
      required: [true, 'Sender is required'],
    },

    content: {
      type:      String,
      required:  [true, 'Message content is required'],
      trim:      true,
      maxlength: [CHAT.MESSAGE_MAX_LENGTH, `Message cannot exceed ${CHAT.MESSAGE_MAX_LENGTH} characters`],
    },

    messageType: {
      type:    String,
      enum:    Object.values(CHAT.MESSAGE_TYPE),
      default: CHAT.MESSAGE_TYPE.TEXT,
    },

    // ── Extension point for Module 3+ (emotion, safety, context) ─
    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: false },
    toObject:   { virtuals: false },
  }
);

// ── Indexes for paginated message fetch ────────────────────────────
messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);

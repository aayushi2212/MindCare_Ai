/**
 * PURPOSE
 * -------
 * Defines the Mongoose schema and model for the Conversations collection.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Define conversation identity fields: userId, title, status
 * - Define metadata fields: messageCount, lastMessageAt, lastEmotion
 * - Define lifecycle fields: archived, deletedAt, createdAt, updatedAt
 *
 * NEVER
 * -----
 * - Store message bodies directly (Message model handles this)
 * - Store emotion predictions (Module 3 will extend lastEmotion)
 * - Contain business logic
 *
 * DEPENDS ON
 * ----------
 * mongoose, chat.constants
 */

import mongoose from 'mongoose';
import CHAT     from '../constants/chat.constants.js';

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User ID is required'],
      index:    true,
    },

    title: {
      type:      String,
      trim:      true,
      maxlength: [CHAT.TITLE_MAX_LENGTH, `Title cannot exceed ${CHAT.TITLE_MAX_LENGTH} characters`],
      default:   null,
    },

    status: {
      type:    String,
      enum:    Object.values(CHAT.STATUS),
      default: CHAT.STATUS.ACTIVE,
      index:   true,
    },

    // ── Message metadata ─────────────────────────────────────────
    messageCount: {
      type:    Number,
      default: 0,
      min:     0,
    },

    lastMessageAt: {
      type:    Date,
      default: null,
    },

    // ── Emotion placeholder — populated by Module 3 ──────────────
    lastEmotion: {
      type:    String,
      default: null,
    },

    // ── Soft-delete / archive lifecycle ──────────────────────────
    archived: {
      type:    Boolean,
      default: false,
      index:   true,
    },

    deletedAt: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: false },
    toObject:   { virtuals: false },
  }
);

// ── Compound indexes for list queries ──────────────────────────────
conversationSchema.index({ userId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, archived: 1, updatedAt: -1 });

export default mongoose.model('Conversation', conversationSchema);

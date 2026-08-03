/**
 * PURPOSE
 * -------
 * Mongoose model for the RefreshTokens collection.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Store one hashed refresh token per session (multi-device support)
 * - Auto-expire documents via MongoDB TTL index
 *
 * NEVER
 * -----
 * - Store the raw refresh token (only the bcrypt hash)
 * - Be used outside the Auth module
 *
 * DEPENDS ON
 * ----------
 * mongoose
 */

import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date,   required: true },
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
  },
  { timestamps: true }
);

// MongoDB TTL index — auto-deletes expired token documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);

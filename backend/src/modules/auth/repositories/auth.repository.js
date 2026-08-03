/**
 * PURPOSE
 * -------
 * Abstracts all MongoDB queries needed by the auth module.
 * Operates across two collections: users and refreshTokens.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Find, create, and update User documents for auth purposes
 * - Create, find, and delete RefreshToken documents
 * - Hash refresh tokens before persisting (never store raw tokens)
 *
 * NEVER
 * -----
 * - Contain business logic (password comparison, token signing)
 * - Query collections owned by other modules
 * - Return raw passwordHash unless required for comparison
 *
 * EXPORTS
 * -------
 * authRepository — singleton instance of AuthRepository
 *
 * DEPENDS ON
 * ----------
 * auth/models/user.model, auth/models/refresh-token.model, bcryptjs
 */

import bcrypt        from 'bcryptjs';
import User          from '../models/user.model.js';
import RefreshToken  from '../models/refresh-token.model.js';
import AUTH          from '../constants/auth.constants.js';

class AuthRepository {
  // ── User queries ──────────────────────────────────────────────

  findByEmail(email) {
    return User.findOne({ email }).select('+passwordHash');
  }

  findById(id) {
    return User.findById(id);
  }

  createUser(dto) {
    return User.create(dto);
  }

  updateLastLogin(userId) {
    return User.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }

  // ── Refresh token queries ─────────────────────────────────────

  async createRefreshToken(userId, rawToken, meta = {}) {
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + AUTH.REFRESH_TOKEN_EXPIRES_MS);
    return RefreshToken.create({
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent || null,
      ipAddress: meta.ipAddress || null,
    });
  }

  async findValidRefreshToken(userId, rawToken) {
    const tokens = await RefreshToken.find({
      userId,
      expiresAt: { $gt: new Date() },
    });

    for (const doc of tokens) {
      const match = await bcrypt.compare(rawToken, doc.tokenHash);
      if (match) return doc;
    }
    return null;
  }

  deleteRefreshToken(tokenId) {
    return RefreshToken.findByIdAndDelete(tokenId);
  }

  revokeAllRefreshTokens(userId) {
    return RefreshToken.deleteMany({ userId });
  }
}

export default new AuthRepository();

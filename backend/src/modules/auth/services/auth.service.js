/**
 * PURPOSE
 * -------
 * Contains all business logic for authentication.
 * Coordinates between AuthRepository, JWT utilities, and the event bus.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Validate registration data and create user accounts
 * - Validate login credentials and issue token pairs
 * - Rotate refresh tokens on every refresh call (security)
 * - Revoke sessions on logout (single device or all devices)
 * - Fetch the current user from a valid access token payload
 *
 * NEVER
 * -----
 * - Handle HTTP request/response (controller's job)
 * - Update user profile data (User module's job)
 * - Hash passwords directly (model pre-save hook handles this)
 *
 * EXPORTS
 * -------
 * authService — singleton instance
 *
 * DEPENDS ON
 * ----------
 * auth.repository, shared/utils/jwt, auth.errors, shared/events/event-bus, shared/logger
 */

import authRepository from '../repositories/auth.repository.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
}                     from '../../../shared/utils/jwt.js';
import {
  InvalidCredentialsError,
  AccountSuspendedError,
  AccountDeletedError,
  TokenExpiredError,
  TokenInvalidError,
  EmailAlreadyRegisteredError,
}                     from '../errors/auth.errors.js';
import AUTH           from '../constants/auth.constants.js';
import eventBus       from '../../../shared/events/event-bus.js';
import logger         from '../../../shared/logger/logger.js';

class AuthService {

  async register(dto, meta = {}) {
    const existing = await authRepository.findByEmail(dto.email);
    if (existing) throw new EmailAlreadyRegisteredError();

    const user = await authRepository.createUser({
      fullName:     dto.fullName,
      email:        dto.email,
      passwordHash: dto.password, // pre-save hook hashes it
    });

    logger.info('New user registered', { userId: user._id, email: user.email });
    eventBus.emit('user.registered', { userId: user._id });

    return this._issueTokenPair(user, meta);
  }

  async login(dto, meta = {}) {
    const user = await authRepository.findByEmail(dto.email);

    // Always call comparePassword to prevent timing attacks
    const passwordValid = user ? await user.comparePassword(dto.password) : false;

    if (!user || !passwordValid) throw new InvalidCredentialsError();

    if (user.accountStatus === AUTH.ACCOUNT_STATUS.SUSPENDED) throw new AccountSuspendedError();
    if (user.accountStatus === AUTH.ACCOUNT_STATUS.DELETED)   throw new AccountDeletedError();

    await authRepository.updateLastLogin(user._id);

    logger.info('User logged in', { userId: user._id });
    eventBus.emit('user.loggedIn', { userId: user._id });

    return this._issueTokenPair(user, meta);
  }

  async refresh(rawRefreshToken, meta = {}) {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new TokenExpiredError();
      throw new TokenInvalidError();
    }

    const tokenDoc = await authRepository.findValidRefreshToken(payload.userId, rawRefreshToken);
    if (!tokenDoc) throw new TokenInvalidError();

    await authRepository.deleteRefreshToken(tokenDoc._id);

    const user = await authRepository.findById(payload.userId);
    if (!user || user.accountStatus !== AUTH.ACCOUNT_STATUS.ACTIVE) throw new TokenInvalidError();

    logger.info('Token refreshed', { userId: user._id });

    return this._issueTokenPair(user, meta);
  }

  async logout(userId, rawRefreshToken) {
    if (rawRefreshToken) {
      const tokenDoc = await authRepository.findValidRefreshToken(userId, rawRefreshToken);
      if (tokenDoc) await authRepository.deleteRefreshToken(tokenDoc._id);
    } else {
      await authRepository.revokeAllRefreshTokens(userId);
    }

    logger.info('User logged out', { userId });
    eventBus.emit('user.loggedOut', { userId });
  }

  async getMe(userId) {
    const user = await authRepository.findById(userId);
    if (!user) throw new TokenInvalidError();
    return user;
  }

  async _issueTokenPair(user, meta = {}) {
    const payload      = { userId: String(user._id), email: user.email };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await authRepository.createRefreshToken(user._id, refreshToken, meta);

    return { user, accessToken, refreshToken };
  }
}

export default new AuthService();

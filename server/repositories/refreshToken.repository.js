const { RefreshToken } = require('../models/RefreshToken.model.js');

const refreshTokenRepository = {
  /**
   * Create a new refresh token
   */
  async create({ token, userId, expiresAt, deviceInfo }) {
    return RefreshToken.create({
      token,
      userId,
      expiresAt,
      deviceInfo,
    });
  },

  /**
   * Find a valid (non-revoked, non-expired) refresh token
   */
  async findValidToken(token) {
    return RefreshToken.findValidToken(token);
  },

  /**
   * Find a refresh token by token string
   */
  async findByToken(token) {
    return RefreshToken.findOne({ token });
  },

  /**
   * Revoke a specific token
   */
  async revokeToken(token, reason = 'logout') {
    const refreshToken = await RefreshToken.findOne({ token });
    if (!refreshToken) {
      return null;
    }
    return refreshToken.revoke(reason);
  },

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId, reason = 'logout_all') {
    return RefreshToken.revokeAllUserTokens(userId, reason);
  },

  /**
   * Update last used timestamp
   */
  async updateLastUsed(token) {
    return RefreshToken.updateOne({ token }, { $set: { lastUsedAt: new Date() } });
  },

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId) {
    return RefreshToken.getActiveSessions(userId);
  },

  /**
   * Replace token (for rotation)
   */
  async replaceToken(oldToken, newTokenData) {
    const oldRefreshToken = await RefreshToken.findOne({ token: oldToken });
    if (!oldRefreshToken) {
      return null;
    }

    // Create new token
    const newRefreshToken = await RefreshToken.create(newTokenData);

    // Mark old token as replaced
    oldRefreshToken.isRevoked = true;
    oldRefreshToken.revokedAt = new Date();
    oldRefreshToken.revokedReason = 'token_rotation';
    oldRefreshToken.replacedBy = newRefreshToken._id;
    await oldRefreshToken.save();

    return newRefreshToken;
  },

  /**
   * Cleanup expired tokens
   */
  async cleanupExpired() {
    return RefreshToken.cleanupExpiredTokens();
  },

  /**
   * Count active sessions for a user
   */
  async countActiveSessions(userId) {
    return RefreshToken.countDocuments({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
  },
};

module.exports = { refreshTokenRepository };

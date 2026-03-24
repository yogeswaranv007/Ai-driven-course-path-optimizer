const { userRepository } = require('../repositories/user.repository.js');
const { refreshTokenRepository } = require('../repositories/refreshToken.repository.js');
const { generateTokenPair, verifyAccessToken } = require('../utils/jwt.js');
const { parseDeviceInfo } = require('../utils/deviceParser.js');
const { config } = require('../config/env.js');

const authService = {
  /**
   * Register a new user and create session
   */
  async register({ name, email, password }, req = {}) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await userRepository.create({
      name,
      email,
      passwordHash: password,
      profile: {
        interests: [],
        dailyMinutes: 60,
        goal: 'General Learning',
      },
    });

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + config.jwt_refresh_expires_in_ms);
    const deviceInfo = parseDeviceInfo(req.headers?.['user-agent'], req.ip);

    await refreshTokenRepository.create({
      token: refreshToken,
      userId: user._id,
      expiresAt,
      deviceInfo,
    });

    return { user, accessToken, refreshToken };
  },

  /**
   * Login user and create session
   */
  async login({ email, password }, req = {}) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + config.jwt_refresh_expires_in_ms);
    const deviceInfo = parseDeviceInfo(req.headers?.['user-agent'], req.ip);

    await refreshTokenRepository.create({
      token: refreshToken,
      userId: user._id,
      expiresAt,
      deviceInfo,
    });

    return { user, accessToken, refreshToken };
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    // Find and validate refresh token
    const tokenDoc = await refreshTokenRepository.findValidToken(refreshToken);
    if (!tokenDoc) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const user = await userRepository.findById(tokenDoc.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new token pair (token rotation)
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id);

    // Replace old refresh token with new one
    const expiresAt = new Date(Date.now() + config.jwt_refresh_expires_in_ms);
    await refreshTokenRepository.replaceToken(refreshToken, {
      token: newRefreshToken,
      userId: user._id,
      expiresAt,
      deviceInfo: tokenDoc.deviceInfo,
    });

    // Update last used timestamp
    await refreshTokenRepository.updateLastUsed(newRefreshToken);

    return { user, accessToken, refreshToken: newRefreshToken };
  },

  /**
   * Logout user (revoke current session)
   */
  async logout(refreshToken) {
    if (!refreshToken) {
      return { success: true, message: 'No active session' };
    }

    await refreshTokenRepository.revokeToken(refreshToken, 'logout');
    return { success: true, message: 'Logged out successfully' };
  },

  /**
   * Logout from all devices (revoke all sessions)
   */
  async logoutAll(userId) {
    await refreshTokenRepository.revokeAllUserTokens(userId, 'logout_all');
    return { success: true, message: 'Logged out from all devices' };
  },

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId) {
    return refreshTokenRepository.getActiveSessions(userId);
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(userId, sessionId) {
    // Find the session and verify it belongs to the user
    const session = await refreshTokenRepository.findByToken(sessionId);
    if (!session || session.userId.toString() !== userId.toString()) {
      throw new Error('Session not found');
    }

    await refreshTokenRepository.revokeToken(sessionId, 'security');
    return { success: true, message: 'Session revoked' };
  },

  /**
   * OAuth login/register (for Google, etc.)
   */
  async oauthLogin(user, req = {}) {
    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + config.jwt_refresh_expires_in_ms);
    const deviceInfo = parseDeviceInfo(req.headers?.['user-agent'], req.ip);

    await refreshTokenRepository.create({
      token: refreshToken,
      userId: user._id,
      expiresAt,
      deviceInfo,
    });

    return { user, accessToken, refreshToken };
  },
};

module.exports = { authService };

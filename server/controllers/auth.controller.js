const { authService } = require('../services/auth.service.js');
const { config } = require('../config/env.js');

/**
 * Set authentication cookies
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  // Set access token cookie (shorter expiry)
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.jwt_access_expires_in_ms,
  });

  // Set refresh token cookie (longer expiry)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.jwt_refresh_expires_in_ms,
    path: '/auth/refresh', // Restrict to refresh endpoint only
  });
};

/**
 * Clear authentication cookies
 */
const clearAuthCookies = (res) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken', { path: '/auth/refresh' });
};

const authController = {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.register(
        { name, email, password },
        req
      );

      setAuthCookies(res, accessToken, refreshToken);

      res.status(201).json({
        user,
        accessToken, // Also return in response for clients not using cookies
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login({ email, password }, req);

      setAuthCookies(res, accessToken, refreshToken);

      res.status(200).json({
        user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refresh access token
   */
  async refresh(req, res, next) {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'No refresh token provided',
          code: 'NO_REFRESH_TOKEN',
        });
      }

      const {
        user,
        accessToken,
        refreshToken: newRefreshToken,
      } = await authService.refreshAccessToken(refreshToken);

      setAuthCookies(res, accessToken, newRefreshToken);

      res.status(200).json({
        user,
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  },

  /**
   * Logout user (current session)
   */
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      await authService.logout(refreshToken);

      clearAuthCookies(res);

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout from all devices
   */
  async logoutAll(req, res, next) {
    try {
      await authService.logoutAll(req.user._id);

      clearAuthCookies(res);

      res.status(200).json({ message: 'Logged out from all devices' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user
   */
  async me(req, res) {
    res.status(200).json({ user: req.user });
  },

  /**
   * Get active sessions
   */
  async getSessions(req, res, next) {
    try {
      const sessions = await authService.getActiveSessions(req.user._id);

      res.status(200).json({ sessions });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(req, res, next) {
    try {
      const { sessionId } = req.params;

      await authService.revokeSession(req.user._id, sessionId);

      res.status(200).json({ message: 'Session revoked successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Google OAuth callback
   */
  async googleCallback(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect(`${config.client_url}/login?error=oauth_failed`);
      }

      const { accessToken, refreshToken } = await authService.oauthLogin(user, req);

      setAuthCookies(res, accessToken, refreshToken);

      res.redirect(`${config.client_url}/dashboard`);
    } catch (error) {
      res.redirect(`${config.client_url}/login?error=oauth_failed`);
    }
  },
};

module.exports = { authController };

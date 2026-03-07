const { authService } = require('../services/auth.service.js');
const { config } = require('../config/env.js');
const { generateToken } = require('../utils/jwt.js');

const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const { user, token } = await authService.register({ name, email, password });

      res.cookie('token', token, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login({ email, password });

      res.cookie('token', token, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res) {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  },

  async me(req, res) {
    res.status(200).json({ user: req.user });
  },

  async googleCallback(req, res) {
    try {
      const user = req.user;
      const token = user ? generateToken(user._id) : null;

      if (!token) {
        return res.redirect(`${config.client_url}/login?error=oauth_failed`);
      }

      // Set token cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(`${config.client_url}/dashboard`);
    } catch (error) {
      res.redirect(`${config.client_url}/login?error=oauth_failed`);
    }
  },
};

module.exports = { authController };

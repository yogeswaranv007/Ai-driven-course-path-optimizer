const express = require('express');
const passport = require('passport');
const { authController } = require('../controllers/auth.controller.js');
const { validateRequest } = require('../middleware/validation.middleware.js');
const { authRateLimiter } = require('../middleware/rateLimiter.middleware.js');
const { registerSchema, loginSchema } = require('@learning-path-optimizer/shared');
const { authMiddleware } = require('../middleware/auth.middleware.js');
const { config } = require('../config/env.js');

const router = express.Router();

// Authentication
router.post('/register', authRateLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/logout/all', authMiddleware, authController.logoutAll);

// TEMPORARY ADMIN CREATOR ROUTE
router.get('/init-admin', async (req, res) => {
  try {
    const { User } = require('../models/User.model.js');
    let admin = await User.findOne({ email: 'coursepathadmin@gmail.com' });
    if (!admin) {
      admin = new User({
        name: 'System Admin',
        email: 'coursepathadmin@gmail.com',
        passwordHash: 'admin@123',
        role: 'admin',
      });
    } else {
      admin.role = 'admin';
      admin.passwordHash = 'admin@123';
    }
    await admin.save();

    const oldAdmin = await User.findOne({ email: 'we@gmail.com' });
    if (oldAdmin && oldAdmin.role === 'admin') {
      oldAdmin.role = 'user';
      await oldAdmin.save();
    }
    res.json({
      success: true,
      message:
        'SUCCESS! Admin account coursepathadmin@gmail.com created with password admin@123 in the live database.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Token management
router.post('/refresh', authController.refresh);

// User info
router.get('/me', authMiddleware, authController.me);

// Session management
router.get('/sessions', authMiddleware, authController.getSessions);
router.delete('/sessions/:sessionId', authMiddleware, authController.revokeSession);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.client_url}/login?error=oauth_failed`,
  }),
  authController.googleCallback
);

module.exports = router;

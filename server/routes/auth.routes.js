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

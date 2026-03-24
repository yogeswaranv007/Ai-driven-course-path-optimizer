const { verifyAccessToken, extractToken } = require('../utils/jwt.js');
const { userRepository } = require('../repositories/user.repository.js');

/**
 * Authentication middleware
 * Supports both Cookie and Authorization header authentication
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from either Authorization header or cookies
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
        code: 'NO_TOKEN',
      });
    }

    // Verify access token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        suggestion: 'Please refresh your token or log in again',
      });
    }

    // Get user from database
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('⚠️  Auth Middleware Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await userRepository.findById(decoded.userId);
        if (user) {
          req.user = user;
          req.userId = user._id;
        }
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

module.exports = { authMiddleware, optionalAuthMiddleware };

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { config } = require('../config/env.js');

/**
 * Generate a short-lived access token (JWT)
 * Used for API authentication
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId, type: 'access' }, config.jwt_secret, {
    expiresIn: config.jwt_access_expires_in,
  });
};

/**
 * Generate a long-lived refresh token (opaque token)
 * Stored in database for session management
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Generate both access and refresh tokens
 */
const generateTokenPair = (userId) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(),
  };
};

/**
 * Verify and decode access token
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt_secret);
    if (decoded.type !== 'access') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Decode token without verification (useful for expired token checks)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header or cookies
 */
const extractToken = (req) => {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fallback to cookie
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

// Legacy support - maintain backward compatibility
const generateToken = generateAccessToken;
const verifyToken = verifyAccessToken;

module.exports = {
  generateToken, // Legacy
  verifyToken, // Legacy
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  decodeToken,
  extractToken,
};

require('dotenv').config();

const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodb_uri:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/learning-path-optimizer',
  jwt_secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',

  // Access token (short-lived) - for API authentication
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwt_access_expires_in_ms: (() => {
    const value = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // 15 minutes default
    const [, num, unit] = match;
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return parseInt(num) * multipliers[unit];
  })(),

  // Refresh token (long-lived) - for session management
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  jwt_refresh_expires_in_ms: (() => {
    const value = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // 30 days default
    const [, num, unit] = match;
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return parseInt(num) * multipliers[unit];
  })(),

  // Legacy support
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
  groq_api_key: process.env.GROQ_API_KEY || '',

  client_url: process.env.CLIENT_URL || 'http://localhost:5173',
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    callback_url: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
  },
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
};

module.exports = { config };

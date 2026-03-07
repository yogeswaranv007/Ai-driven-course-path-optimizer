require('dotenv').config();

const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodb_uri:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/learning-path-optimizer',
  jwt_secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
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

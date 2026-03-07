const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const { config } = require('./config/env.js');
const { errorHandler } = require('./middleware/error.middleware.js');
const { generalRateLimiter } = require('./middleware/rateLimiter.middleware.js');
const routes = require('./routes/index.js');
require('./config/passport.js');

const app = express();

// Trust proxy (required for secure cookies behind Render/Heroku/etc.)
app.set('trust proxy', 1);

// Security
app.use(helmet());
const allowlist = [config.client_url]
  .concat((process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowlist.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(generalRateLimiter);

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/', routes);

// Error handler
app.use(errorHandler);

module.exports = app;

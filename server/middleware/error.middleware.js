const { logger } = require('../utils/logger.js');

const errorHandler = (err, req, res, _next) => {
  // Handle structured error responses with details
  if (err.statusCode && err.details) {
    return res.status(err.statusCode).json(err.details);
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Enhanced error logging for debugging
  const errorDetails = {
    message,
    path: req.path,
    method: req.method,
    statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.user?._id,
    body: req.method !== 'GET' ? req.body : undefined,
  };

  logger.error('API Error:', errorDetails);
  console.error('\n❌ ERROR:', message);
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  // Send detailed error response
  res.status(statusCode).json({
    error: message,
    statusCode,
    path: req.path,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details || err.cause,
    }),
  });
};

module.exports = { errorHandler };

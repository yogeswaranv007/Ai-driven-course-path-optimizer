const { logger } = require('../utils/logger.js');

const errorHandler = (err, req, res, _next) => {
  // Handle structured error responses with details
  if (err.statusCode && err.details) {
    return res.status(err.statusCode).json(err.details);
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(message, {
    path: req.path,
    method: req.method,
    statusCode,
    stack: err.stack,
  });

  res.status(statusCode).json({
    error: message,
    statusCode,
  });
};

module.exports = { errorHandler };

const LOG_LEVELS = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

const log = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };

  console.log(JSON.stringify(logEntry));
};

const logger = {
  info: (message, meta) => log(LOG_LEVELS.info, message, meta),
  warn: (message, meta) => log(LOG_LEVELS.warn, message, meta),
  error: (message, meta) => log(LOG_LEVELS.error, message, meta),
};

module.exports = { logger };

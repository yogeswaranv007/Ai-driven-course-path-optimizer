const mongoose = require('mongoose');
const { config } = require('./env.js');
const { logger } = require('../utils/logger.js');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb_uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = { connectDB };

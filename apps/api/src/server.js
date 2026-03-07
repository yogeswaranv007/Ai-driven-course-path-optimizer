const app = require('./app.js');
const { connectDB } = require('./config/db.js');
const { config } = require('./config/env.js');
const { logger } = require('./utils/logger.js');

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();

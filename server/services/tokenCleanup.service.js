const { refreshTokenRepository } = require('../repositories/refreshToken.repository.js');

/**
 * Token cleanup service
 * Periodically removes expired refresh tokens from database
 */
class TokenCleanupService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Start the cleanup service
   * @param {number} intervalMs - Cleanup interval in milliseconds (default: 1 hour)
   */
  start(intervalMs = 60 * 60 * 1000) {
    if (this.isRunning) {
      console.log('⚠️  Token cleanup service is already running');
      return;
    }

    console.log('🧹 Starting token cleanup service...');
    console.log(`   Cleanup interval: ${intervalMs / 1000 / 60} minutes`);

    // Run cleanup immediately
    this.cleanup();

    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Token cleanup service stopped');
    }
  }

  /**
   * Run token cleanup
   */
  async cleanup() {
    try {
      const deletedCount = await refreshTokenRepository.cleanupExpired();
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired refresh tokens`);
      }
    } catch (error) {
      console.error('⚠️  Token cleanup failed:', error.message);
    }
  }
}

// Create singleton instance
const tokenCleanupService = new TokenCleanupService();

module.exports = { tokenCleanupService };

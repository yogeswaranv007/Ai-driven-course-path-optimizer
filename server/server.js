const app = require('./app.js');
const { connectDB } = require('./config/db.js');
const { config } = require('./config/env.js');
const { logger } = require('./utils/logger.js');
const { tokenCleanupService } = require('./services/tokenCleanup.service.js');

const startServer = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  LEARNING PATH OPTIMIZER - SERVER STARTUP                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Check environment configuration
    console.log('🔍 Configuration Check:');
    console.log(`   Node Environment: ${config.node_env}`);
    console.log(`   Server Port: ${config.port}`);
    console.log(`   Client URL: ${config.client_url}`);

    // Check MongoDB connection
    console.log('\n📡 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB Connected Successfully\n');

    // Check Groq API configuration
    const groqConfigured = !!process.env.GROQ_API_KEY;
    console.log('🤖 AI Service Configuration:');
    if (groqConfigured) {
      console.log('   ✅ Groq API Key: Configured');
      console.log('   ℹ️  AI content generation enabled');
    } else {
      console.log('   ⚠️  Groq API Key: NOT CONFIGURED');
      console.log('   ℹ️  Using fallback content for roadmap generation');
      console.log('   📝 To enable AI: Add GROQ_API_KEY to .env file');
    }

    // Check demo mode
    const demoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
    console.log('\n🎮 Roadmap Generation Mode:');
    if (demoMode) {
      console.log('   📋 DEMO MODE (template cloning)');
    } else {
      console.log('   🚀 LIVE MODE (real-time generation)');
    }

    // Start token cleanup service
    console.log('\n🔐 Session Management:');
    console.log('   Starting token cleanup service...');
    tokenCleanupService.start(60 * 60 * 1000); // Clean up every hour
    console.log('   ✅ Token cleanup service started');

    console.log('\n─────────────────────────────────────────────────────────────────');
    app.listen(config.port, () => {
      console.log(`\n✅ Server is running on port ${config.port}`);
      console.log(`   Local: http://localhost:${config.port}`);
      console.log(`   Health check: http://localhost:${config.port}/health`);
      console.log('\n═════════════════════════════════════════════════════════════════\n');
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    console.error('Stack:', error.stack);
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();

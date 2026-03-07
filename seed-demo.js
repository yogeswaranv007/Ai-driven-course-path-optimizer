#!/usr/bin/env node
/**
 * Seed Demo Data Script
 * Run this to populate the database with demo users and roadmaps
 */

const path = require('path');
const apiDir = path.join(__dirname, 'server');

// Change working directory to api folder for proper module resolution
process.chdir(apiDir);

require('dotenv').config();
const mongoose = require('mongoose');
const { seedDemoData } = require(path.join(apiDir, 'utils', 'seedDemoData.js'));

async function run() {
  try {
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    await seedDemoData();

    console.log('🎉 All done! Database is ready for demo.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

run();

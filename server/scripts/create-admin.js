const mongoose = require('mongoose');
const { config } = require('../config/env.js');
const { User } = require('../models/User.model.js');

const promoteUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri);
    console.log('Connected to Database');

    // Email to promote (supplied as CLI argument)
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Please provide an email address. Usage: node create-admin.js <email>');
      process.exit(1);
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ User with email ${email} not found.`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`✅ Success! ${email} has been promoted to Admin.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

promoteUser();

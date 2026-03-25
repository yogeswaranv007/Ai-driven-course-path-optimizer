const mongoose = require('mongoose');
const { config } = require('../config/env.js');
const { User } = require('../models/User.model.js');

const initAdmin = async () => {
  try {
    await mongoose.connect(config.mongodb_uri);
    console.log('Connected to Database');

    // 1. Demote we@gmail.com back to standard user
    const oldAdmin = await User.findOne({ email: 'we@gmail.com' });
    if (oldAdmin && oldAdmin.role === 'admin') {
      oldAdmin.role = 'user';
      await oldAdmin.save();
      console.log('✅ Successfully revoked admin access for we@gmail.com');
    }

    // 2. Create or Update the absolute dedicated Admin Account
    const adminEmail = 'coursepathadmin@gmail.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = new User({
        name: 'System Admin',
        email: adminEmail,
        passwordHash: 'admin@123', // The schema pre-save hook automatically encrypts this
        role: 'admin',
        profile: {
          interests: [],
        },
      });
      await admin.save();
      console.log(`✅ Successfully created new dedicated admin account: ${adminEmail}`);
    } else {
      admin.role = 'admin';
      admin.passwordHash = 'admin@123';
      await admin.save();
      console.log(`✅ Successfully updated existing account ${adminEmail} to strict admin.`);
    }

    console.log('🎉 Admin Access initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  }
};

initAdmin();

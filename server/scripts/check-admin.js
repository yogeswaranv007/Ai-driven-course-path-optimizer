const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { config } = require('../config/env.js');
const { User } = require('../models/User.model.js');

(async () => {
  try {
    await mongoose.connect(config.mongodb_uri);
    const admin = await User.findOne({ email: 'coursepathadmin@gmail.com' });
    if (!admin) {
      console.log('Admin not found in DB!');
    } else {
      console.log('Admin found:', admin.email);
      console.log('Role:', admin.role);
      console.log('Password Hash in DB:', admin.passwordHash);
      const isMatch = await bcrypt.compare('admin@123', admin.passwordHash);
      console.log('Does "admin@123" match the hash?', isMatch);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();

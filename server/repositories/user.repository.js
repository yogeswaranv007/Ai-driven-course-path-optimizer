const { User } = require('../models/User.model.js');

const userRepository = {
  async create(userData) {
    const user = new User(userData);
    return user.save();
  },

  async findById(id) {
    return User.findById(id);
  },

  async findByEmail(email) {
    return User.findOne({ email });
  },

  async findByGoogleId(googleId) {
    return User.findOne({ googleId });
  },

  async updateProfile(userId, profileData) {
    return User.findByIdAndUpdate(userId, { profile: profileData }, { new: true });
  },

  async updateSkills(userId, skills) {
    return User.findByIdAndUpdate(userId, { skills }, { new: true, runValidators: true });
  },
};

module.exports = { userRepository };

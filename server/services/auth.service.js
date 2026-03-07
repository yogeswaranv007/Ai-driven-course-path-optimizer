const { userRepository } = require('../repositories/user.repository.js');
const { generateToken } = require('../utils/jwt.js');

const authService = {
  async register({ name, email, password }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await userRepository.create({
      name,
      email,
      passwordHash: password,
      profile: {
        interests: [],
        dailyMinutes: 60,
        goal: 'General Learning',
      },
    });

    const token = generateToken(user._id);
    return { user, token };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user._id);
    return { user, token };
  },
};

module.exports = { authService };

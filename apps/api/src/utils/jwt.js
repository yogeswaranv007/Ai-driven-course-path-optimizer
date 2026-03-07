const jwt = require('jsonwebtoken');
const { config } = require('../config/env.js');

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt_secret, {
    expiresIn: config.jwt_expires_in,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt_secret);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };

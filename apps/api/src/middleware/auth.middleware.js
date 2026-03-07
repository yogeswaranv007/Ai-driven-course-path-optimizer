const { verifyToken } = require('../utils/jwt.js');
const { userRepository } = require('../repositories/user.repository.js');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { authMiddleware };

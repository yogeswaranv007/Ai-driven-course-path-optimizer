const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied. Admin privileges required.',
      code: 'FORBIDDEN_ADMIN_ONLY',
    });
  }
};

module.exports = { isAdmin };

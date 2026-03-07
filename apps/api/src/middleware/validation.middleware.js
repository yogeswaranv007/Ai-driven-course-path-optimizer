const validateRequest = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Validation error',
      details: error.errors || error.message,
    });
  }
};

module.exports = { validateRequest };

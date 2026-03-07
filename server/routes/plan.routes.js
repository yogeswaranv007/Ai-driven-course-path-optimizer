const express = require('express');
const { planController } = require('../controllers/plan.controller.js');
const { validateRequest } = require('../middleware/validation.middleware.js');
const { planGenerateSchema } = require('@learning-path-optimizer/shared');
const { authMiddleware } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.post(
  '/generate',
  authMiddleware,
  validateRequest(planGenerateSchema),
  planController.generatePlan
);
router.get('/my', authMiddleware, planController.getMyPlans);

module.exports = router;

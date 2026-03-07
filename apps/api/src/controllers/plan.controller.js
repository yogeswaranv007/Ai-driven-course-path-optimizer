const { planService } = require('../services/plan.service.js');

const planController = {
  /**
   * Generate a learning plan based on job role and daily learning hours.
   *
   * Request body:
   * - skills: Array of {topic, level} objects
   * - jobRole: Target job role (e.g., "Full Stack Developer")
   * - hoursPerDay: 1-24 (available learning hours per day)
   */
  async generatePlan(req, res, next) {
    try {
      const { skills, jobRole, hoursPerDay } = req.body;

      const { plan, skillGaps, planMetadata } = await planService.generatePlan(req.user, {
        skills,
        jobRole,
        hoursPerDay,
      });

      res.status(201).json({
        plan,
        skillGaps,
        planMetadata,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyPlans(req, res, next) {
    try {
      const plans = await planService.getMyPlans(req.user._id);
      res.status(200).json({ plans });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { planController };

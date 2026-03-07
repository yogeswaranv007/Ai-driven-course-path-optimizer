const { LearningPlan } = require('../models/LearningPlan.model.js');

const learningPlanRepository = {
  async create(planData) {
    const plan = new LearningPlan(planData);
    return plan.save();
  },

  async findById(id) {
    return LearningPlan.findById(id).populate('userId', 'name email');
  },

  async findByUserId(userId) {
    return LearningPlan.find({ userId }).sort({ createdAt: -1 });
  },

  async findActiveByUserId(userId) {
    return LearningPlan.findOne({ userId, isActive: true });
  },

  async updateTaskStatus(planId, weekNo, taskIndex, status) {
    return LearningPlan.findOneAndUpdate(
      { _id: planId, 'weeks.weekNo': weekNo },
      {
        $set: {
          [`weeks.$.tasks.${taskIndex}.status`]: status,
          [`weeks.$.tasks.${taskIndex}.completedAt`]: status === 'completed' ? new Date() : null,
        },
      },
      { new: true }
    );
  },

  async deactivateOldPlans(userId) {
    return LearningPlan.updateMany({ userId, isActive: true }, { isActive: false });
  },
};

module.exports = { learningPlanRepository };

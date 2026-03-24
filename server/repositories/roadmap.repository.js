const { RoadmapInstance } = require('../models/RoadmapInstance.model.js');

const roadmapRepository = {
  /**
   * Create a new roadmap instance
   */
  async create(roadmapData) {
    const roadmap = new RoadmapInstance(roadmapData);
    return roadmap.save();
  },

  /**
   * Find roadmap by ID
   */
  async findById(roadmapId) {
    return RoadmapInstance.findById(roadmapId).populate('userId', 'name email');
  },

  /**
   * Find all roadmaps for a user
   */
  async findByUserId(userId, options = {}) {
    const query = { userId };

    // Optional status filter
    if (options.status) {
      query.status = options.status;
    }

    return RoadmapInstance.find(query)
      .sort({ createdAt: -1 })
      .select(options.fields || null)
      .limit(options.limit || 0);
  },

  /**
   * Find active roadmaps for a user
   */
  async findActiveByUserId(userId) {
    return this.findByUserId(userId, { status: 'active' });
  },

  /**
   * Update roadmap
   */
  async update(roadmapId, updateData) {
    return RoadmapInstance.findByIdAndUpdate(
      roadmapId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  },

  /**
   * Update task status within a roadmap
   */
  async updateTaskStatus(roadmapId, taskId, status) {
    const roadmap = await RoadmapInstance.findById(roadmapId);
    if (!roadmap) {
      return null;
    }

    const updated = roadmap.updateTaskStatus(taskId, status);
    if (updated) {
      await roadmap.save();
      return roadmap;
    }

    return null;
  },

  /**
   * Delete roadmap (soft delete by marking as abandoned)
   */
  async softDelete(roadmapId) {
    return this.update(roadmapId, {
      status: 'abandoned',
      lastAccessedAt: new Date(),
    });
  },

  /**
   * Hard delete roadmap
   */
  async hardDelete(roadmapId) {
    return RoadmapInstance.findByIdAndDelete(roadmapId);
  },

  /**
   * Update last accessed timestamp
   */
  async updateLastAccessed(roadmapId) {
    return this.update(roadmapId, { lastAccessedAt: new Date() });
  },

  /**
   * Get roadmap statistics for a user
   */
  async getUserStats(userId) {
    const roadmaps = await this.findByUserId(userId);

    return {
      total: roadmaps.length,
      active: roadmaps.filter((r) => r.status === 'active').length,
      completed: roadmaps.filter((r) => r.status === 'completed').length,
      paused: roadmaps.filter((r) => r.status === 'paused').length,
      abandoned: roadmaps.filter((r) => r.status === 'abandoned').length,
      averageCompletion:
        roadmaps.length > 0
          ? Math.round(
              roadmaps.reduce((sum, r) => sum + r.completionPercentage, 0) / roadmaps.length
            )
          : 0,
    };
  },

  /**
   * Get summary view of roadmaps (for dashboard)
   */
  async getRoadmapSummaries(userId) {
    return this.findByUserId(userId, {
      fields:
        'roadmapName roleName trackChosen createdAt status completionPercentage estimatedCompletionDays estimatedTotalHours lastAccessedAt dailyLearningMinutes skillSource phases totalPhases totalDays weeks',
    });
  },

  /**
   * Find the most recent roadmap template by role.
   * Used by demo mode to clone DB-backed dummy data.
   */
  async findLatestByRoleName(roleName) {
    return RoadmapInstance.findOne({ roleName }).sort({ updatedAt: -1, createdAt: -1 });
  },
};

module.exports = { roadmapRepository };

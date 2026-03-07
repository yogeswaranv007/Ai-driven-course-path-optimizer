const { roadmapRepository } = require('../repositories/roadmap.repository.js');
const { roadmapGenerationService } = require('../services/roadmapGeneration.service.js');

const getOwnerId = (roadmap) =>
  roadmap?.userId?._id ? roadmap.userId._id.toString() : roadmap?.userId?.toString();

const roadmapController = {
  /**
   * POST /api/roadmaps/generate
   * Generate a new roadmap
   */
  async generateRoadmap(req, res, next) {
    try {
      const userId = req.user._id;
      const { roleName, dailyLearningMinutes, skillSource, skills } = req.body;

      // Validate input
      if (!roleName) {
        return res.status(400).json({ error: 'Role name is required' });
      }

      if (!dailyLearningMinutes) {
        return res.status(400).json({ error: 'Daily learning minutes is required' });
      }

      if (!skillSource || !['profile', 'custom'].includes(skillSource)) {
        return res.status(400).json({
          error: 'Skill source must be "profile" or "custom"',
        });
      }

      if (skillSource === 'custom' && (!skills || skills.length === 0)) {
        return res.status(400).json({
          error: 'Skills array is required when using custom skill source',
        });
      }

      // Generate roadmap
      const roadmap = await roadmapGenerationService.generateRoadmapInstance(userId, {
        roleName,
        dailyLearningMinutes,
        skillSource,
        skills: skills || [],
      });

      res.status(201).json({
        message: 'Roadmap generated successfully',
        roadmap: {
          _id: roadmap._id,
          roleName: roadmap.roleName,
          trackChosen: roadmap.trackChosen,
          createdAt: roadmap.createdAt,
          estimatedCompletionDays: roadmap.estimatedCompletionDays,
          estimatedTotalHours: roadmap.estimatedTotalHours,
          status: roadmap.status,
        },
      });
    } catch (error) {
      console.error('Error generating roadmap:', error);

      if (error.message.includes('required') || error.message.includes('must be')) {
        return res.status(400).json({ error: error.message });
      }

      if (error.message.includes('No skills found')) {
        return res.status(400).json({ error: error.message });
      }

      next(error);
    }
  },

  /**
   * GET /api/roadmaps
   * Get all roadmaps for logged-in user
   */
  async getRoadmaps(req, res, next) {
    try {
      const userId = req.user._id;
      const roadmaps = await roadmapRepository.getRoadmapSummaries(userId);

      res.json({
        roadmaps: roadmaps.map((r) => ({
          _id: r._id,
          roleName: r.roleName,
          trackChosen: r.trackChosen,
          createdAt: r.createdAt,
          status: r.status,
          completionPercentage: r.completionPercentage,
          estimatedCompletionDays: r.estimatedCompletionDays,
          lastAccessedAt: r.lastAccessedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/roadmaps/:id
   * Get detailed roadmap by ID
   */
  async getRoadmapById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const roadmap = await roadmapRepository.findById(id);

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found' });
      }

      // Check if roadmap belongs to user
      if (getOwnerId(roadmap) !== userId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update last accessed
      await roadmapRepository.updateLastAccessed(id);

      res.json({
        roadmap: {
          _id: roadmap._id,
          roleName: roadmap.roleName,
          trackChosen: roadmap.trackChosen,
          dailyLearningMinutes: roadmap.dailyLearningMinutes,
          estimatedTotalHours: roadmap.estimatedTotalHours,
          estimatedCompletionDays: roadmap.estimatedCompletionDays,
          skillSource: roadmap.skillSource,
          skillsUsed: roadmap.skillsUsed,
          weeks: roadmap.weeks,
          status: roadmap.status,
          completionPercentage: roadmap.completionPercentage,
          createdAt: roadmap.createdAt,
          lastAccessedAt: roadmap.lastAccessedAt,
          roadmapMetadata: roadmap.roadmapMetadata,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/roadmaps/:id/tasks/:taskId
   * Update task status
   */
  async updateTaskStatus(req, res, next) {
    try {
      const { id, taskId } = req.params;
      const { status } = req.body;
      const userId = req.user._id;

      // Validate status
      const validStatuses = ['pending', 'in-progress', 'completed', 'skipped'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }

      // Get roadmap and verify ownership
      const roadmap = await roadmapRepository.findById(id);

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found' });
      }

      if (getOwnerId(roadmap) !== userId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update task status
      const updatedRoadmap = await roadmapRepository.updateTaskStatus(id, taskId, status);

      if (!updatedRoadmap) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Find the updated task
      const taskResult = updatedRoadmap.getTaskById(taskId);

      res.json({
        message: 'Task updated successfully',
        task: taskResult?.task,
        roadmapCompletionPercentage: updatedRoadmap.completionPercentage,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/roadmaps/:id
   * Delete (abandon) a roadmap
   */
  async deleteRoadmap(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      // Get roadmap and verify ownership
      const roadmap = await roadmapRepository.findById(id);

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found' });
      }

      if (getOwnerId(roadmap) !== userId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Soft delete (mark as abandoned)
      await roadmapRepository.softDelete(id);

      res.json({
        message: 'Roadmap deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/roadmaps/stats
   * Get roadmap statistics for user
   */
  async getStats(req, res, next) {
    try {
      const userId = req.user._id;
      const stats = await roadmapRepository.getUserStats(userId);

      res.json({ stats });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { roadmapController };

const { roadmapRepository } = require('../repositories/roadmap.repository.js');
const { roadmapGeneratorService } = require('../services/roadmapGenerator.service.js');
const { DeletedRoadmap } = require('../models/DeletedRoadmap.model.js');
const { RoadmapInstance } = require('../models/RoadmapInstance.model.js');

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
      const { roadmapName, roleName, dailyLearningMinutes, skillSource, skills } = req.body;

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

      // Stage 1: generate structure only
      const generationResult = await roadmapGeneratorService.generateRoadmapStructure(userId, {
        roadmapName,
        roleName,
        dailyLearningMinutes,
        skillSource,
        skills: skills || [],
      });
      const roadmap = generationResult.roadmap;

      res.status(201).json({
        message: 'Roadmap generated successfully with day-level content',
        quotaFallbackUsed: Boolean(generationResult.quotaFallbackUsed),
        quotaFallbackMessage: generationResult.quotaFallbackMessage,
        roadmap: {
          _id: roadmap._id,
          roadmapName: roadmap.roadmapName,
          roleName: roadmap.roleName,
          trackChosen: roadmap.trackChosen,
          createdAt: roadmap.createdAt,
          estimatedCompletionDays: roadmap.estimatedCompletionDays,
          estimatedTotalHours: roadmap.estimatedTotalHours,
          dailyLearningMinutes: roadmap.dailyLearningMinutes,
          skillSource: roadmap.skillSource,
          totalPhases: roadmap.totalPhases || (roadmap.phases || []).length,
          totalDays:
            roadmap.totalDays ||
            (roadmap.phases || []).reduce((sum, p) => sum + (p.days?.length || 0), 0),
          phases:
            (roadmap.phases || []).map((phase) => ({
              phaseNumber: phase.phaseNumber,
              phaseName: phase.phaseName,
              goal: phase.goal,
              startDay: phase.startDay,
              endDay: phase.endDay,
              days: (phase.days || []).map((day) => ({
                dayNumber: day.dayNumber,
                topic: day.topic,
                contentStatus: day.contentStatus,
              })),
            })) || [],
          generationStage: roadmap.roadmapMetadata?.generationStage || 'structure-generated',
          quotaFallbackUsed: Boolean(roadmap.roadmapMetadata?.quotaFallbackUsed),
          status: roadmap.status,
        },
      });
    } catch (error) {
      console.error('\n❌ Error generating roadmap:', error.message);
      console.error('Stack:', error.stack);

      // Provide detailed error responses
      if (error.message.includes('required') || error.message.includes('must be')) {
        return res.status(400).json({
          error: error.message,
          type: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
        });
      }

      if (error.message.includes('No skills found')) {
        return res.status(400).json({
          error: error.message,
          type: 'MISSING_SKILLS',
          suggestion: 'Add skills to your profile or use custom skill source',
          timestamp: new Date().toISOString(),
        });
      }

      if (error.message.includes('API key') || error.message.includes('GROQ')) {
        return res.status(500).json({
          error: 'AI service configuration error',
          type: 'AI_CONFIG_ERROR',
          details: error.message,
          suggestion: 'Contact administrator to configure Groq API key',
          timestamp: new Date().toISOString(),
        });
      }

      // Generic error with details
      return res.status(500).json({
        error: 'Failed to generate roadmap',
        type: 'GENERATION_ERROR',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
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
          roadmapName: r.roadmapName,
          roleName: r.roleName,
          trackChosen: r.trackChosen,
          createdAt: r.createdAt,
          status: r.status,
          completionPercentage: r.completionPercentage,
          estimatedCompletionDays: r.estimatedCompletionDays,
          dailyLearningMinutes: r.dailyLearningMinutes,
          skillSource: r.skillSource,
          totalPhases: r.totalPhases || r.phases?.length || 0,
          totalDays:
            r.totalDays ||
            (r.phases || []).reduce((sum, phase) => sum + (phase.days?.length || 0), 0),
          generationStage: r.roadmapMetadata?.generationStage || 'structure-generated',
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
          roadmapName: roadmap.roadmapName,
          roleName: roadmap.roleName,
          trackChosen: roadmap.trackChosen,
          dailyLearningMinutes: roadmap.dailyLearningMinutes,
          estimatedTotalHours: roadmap.estimatedTotalHours,
          estimatedCompletionDays: roadmap.estimatedCompletionDays,
          skillSource: roadmap.skillSource,
          skillsUsed: roadmap.skillsUsed,
          phases: roadmap.phases || [],
          totalPhases: roadmap.totalPhases || roadmap.phases?.length || 0,
          totalDays:
            roadmap.totalDays ||
            (roadmap.phases || []).reduce((sum, phase) => sum + (phase.days?.length || 0), 0),
          // Keep legacy shape until frontend fully migrates
          weeks: roadmap.weeks || [],
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

      const roadmapSnapshot = roadmap.toObject({ depopulate: true });

      await DeletedRoadmap.create({
        userId,
        originalRoadmapId: roadmap._id,
        roadmapName: roadmap.roadmapName || '',
        roleName: roadmap.roleName,
        completionPercentage: roadmap.completionPercentage || 0,
        dailyLearningMinutes: roadmap.dailyLearningMinutes || 0,
        createdAtOriginal: roadmap.createdAt,
        deletedAt: new Date(),
        roadmapData: roadmapSnapshot,
      });

      // Hard delete from active roadmaps collection
      await roadmapRepository.hardDelete(id);

      res.json({
        message: 'Roadmap moved to deleted roadmaps',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/roadmaps/deleted
   * Get deleted roadmaps for logged-in user
   */
  async getDeletedRoadmaps(req, res, next) {
    try {
      const userId = req.user._id;
      const deletedRoadmaps = await DeletedRoadmap.find({ userId })
        .sort({ deletedAt: -1 })
        .select(
          'roadmapName roleName completionPercentage dailyLearningMinutes createdAtOriginal deletedAt originalRoadmapId'
        );

      res.json({
        roadmaps: deletedRoadmaps.map((r) => ({
          _id: r._id,
          originalRoadmapId: r.originalRoadmapId,
          roadmapName: r.roadmapName,
          roleName: r.roleName,
          completionPercentage: r.completionPercentage,
          dailyLearningMinutes: r.dailyLearningMinutes,
          createdAtOriginal: r.createdAtOriginal,
          deletedAt: r.deletedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/roadmaps/deleted/:deletedId
   * Get one deleted roadmap detail for preview
   */
  async getDeletedRoadmapById(req, res, next) {
    try {
      const { deletedId } = req.params;
      const userId = req.user._id;

      const deletedRoadmap = await DeletedRoadmap.findById(deletedId);
      if (!deletedRoadmap) {
        return res.status(404).json({ error: 'Deleted roadmap not found' });
      }

      if (deletedRoadmap.userId.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        roadmap: {
          _id: deletedRoadmap._id,
          originalRoadmapId: deletedRoadmap.originalRoadmapId,
          roadmapName: deletedRoadmap.roadmapName,
          roleName: deletedRoadmap.roleName,
          completionPercentage: deletedRoadmap.completionPercentage,
          dailyLearningMinutes: deletedRoadmap.dailyLearningMinutes,
          createdAtOriginal: deletedRoadmap.createdAtOriginal,
          deletedAt: deletedRoadmap.deletedAt,
          roadmapData: deletedRoadmap.roadmapData,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/roadmaps/deleted/:deletedId/recover
   * Recover a roadmap from deleted collection back to active roadmaps
   */
  async recoverDeletedRoadmap(req, res, next) {
    try {
      const { deletedId } = req.params;
      const userId = req.user._id;

      const deletedRoadmap = await DeletedRoadmap.findById(deletedId);
      if (!deletedRoadmap) {
        return res.status(404).json({ error: 'Deleted roadmap not found' });
      }

      if (deletedRoadmap.userId.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const snapshot = { ...(deletedRoadmap.roadmapData || {}) };
      delete snapshot._id;
      delete snapshot.__v;
      delete snapshot.createdAt;
      delete snapshot.updatedAt;

      snapshot.userId = userId;
      snapshot.lastAccessedAt = new Date();
      if (Math.round(snapshot.completionPercentage || 0) >= 100) {
        snapshot.status = 'completed';
      } else if (snapshot.status === 'abandoned') {
        snapshot.status = 'active';
      }

      const restoredRoadmap = await RoadmapInstance.create(snapshot);
      await DeletedRoadmap.findByIdAndDelete(deletedId);

      res.json({
        message: 'Roadmap recovered successfully',
        roadmap: {
          _id: restoredRoadmap._id,
          roadmapName: restoredRoadmap.roadmapName,
          roleName: restoredRoadmap.roleName,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/roadmaps/deleted/:deletedId/permanent
   * Permanently delete a roadmap from deleted collection
   */
  async permanentlyDeleteRoadmap(req, res, next) {
    try {
      const { deletedId } = req.params;
      const userId = req.user._id;

      const deletedRoadmap = await DeletedRoadmap.findById(deletedId);
      if (!deletedRoadmap) {
        return res.status(404).json({ error: 'Deleted roadmap not found' });
      }

      if (deletedRoadmap.userId.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await DeletedRoadmap.findByIdAndDelete(deletedId);

      res.json({
        message: 'Roadmap permanently deleted',
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
      const roadmaps = await roadmapRepository.findByUserId(userId);
      const deletedCount = await DeletedRoadmap.countDocuments({ userId });

      const completedCount = roadmaps.filter(
        (r) => r.status === 'completed' || Math.round(r.completionPercentage || 0) >= 100
      ).length;

      const activeCount = roadmaps.filter(
        (r) =>
          r.status !== 'completed' &&
          r.status !== 'abandoned' &&
          Math.round(r.completionPercentage || 0) < 100
      ).length;

      const totalRoadmaps = activeCount + completedCount + deletedCount;
      const averageCompletion =
        roadmaps.length > 0
          ? Math.round(
              roadmaps.reduce((sum, roadmap) => sum + (roadmap.completionPercentage || 0), 0) /
                roadmaps.length
            )
          : 0;

      res.json({
        stats: {
          total: totalRoadmaps,
          active: activeCount,
          completed: completedCount,
          deleted: deletedCount,
          averageCompletion,
          totalRoadmaps,
          activeRoadmaps: activeCount,
          completedRoadmaps: completedCount,
          deletedRoadmaps: deletedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/roadmaps/:id/days/:dayNumber
   * Stage 2 generation: generate day learning content on demand
   */
  async getDayContent(req, res, next) {
    try {
      const userId = req.user._id;
      const { id, dayNumber } = req.params;

      const result = await roadmapGeneratorService.generateDayContent(
        userId,
        id,
        Number(dayNumber)
      );

      res.json({
        message: result.fromCache
          ? 'Day content loaded from cache'
          : 'Day content generated successfully',
        fromCache: result.fromCache,
        day: {
          dayNumber: result.day.dayNumber,
          topic: result.day.topic,
          estimatedMinutes: result.day.estimatedMinutes,
          contentStatus: result.day.contentStatus,
          content: result.day.content || null,
        },
        phase: {
          phaseNumber: result.phase.phaseNumber,
          phaseName: result.phase.phaseName,
          goal: result.phase.goal,
        },
      });
    } catch (error) {
      console.error(`\n❌ Error loading day ${req.params.dayNumber}:`, error.message);

      if (error.message === 'Roadmap not found') {
        return res.status(404).json({
          error: error.message,
          type: 'NOT_FOUND',
          roadmapId: req.params.id,
          timestamp: new Date().toISOString(),
        });
      }
      if (error.message === 'Day not found in roadmap') {
        return res.status(404).json({
          error: error.message,
          type: 'DAY_NOT_FOUND',
          dayNumber: req.params.dayNumber,
          timestamp: new Date().toISOString(),
        });
      }
      if (error.message === 'Access denied') {
        return res.status(403).json({
          error: 'You do not have permission to access this roadmap',
          type: 'ACCESS_DENIED',
          timestamp: new Date().toISOString(),
        });
      }
      if (error.message.includes('API') || error.message.includes('quota')) {
        return res.status(500).json({
          error: 'AI service error',
          type: 'AI_SERVICE_ERROR',
          details: error.message,
          suggestion:
            'Content generation may be temporarily unavailable. Fallback content provided.',
          timestamp: new Date().toISOString(),
        });
      }

      // Generic error
      return res.status(500).json({
        error: 'Failed to generate day content',
        type: 'CONTENT_GENERATION_ERROR',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },
};

module.exports = { roadmapController };

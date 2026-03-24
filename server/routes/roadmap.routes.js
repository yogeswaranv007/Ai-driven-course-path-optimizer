const express = require('express');
const { roadmapController } = require('../controllers/roadmap.controller.js');
const { authMiddleware } = require('../middleware/auth.middleware.js');
const { validateRequest } = require('../middleware/validation.middleware.js');
const {
  roadmapGenerateSchema,
  roadmapIdParamSchema,
  roadmapDayParamSchema,
  roadmapTaskStatusSchema,
} = require('@learning-path-optimizer/shared');

const router = express.Router();

// All roadmap routes require authentication
router.use(authMiddleware);

// POST /api/roadmaps/generate - Generate new roadmap
router.post('/generate', validateRequest(roadmapGenerateSchema), roadmapController.generateRoadmap);

// GET /api/roadmaps/stats - Get user statistics
router.get('/stats', roadmapController.getStats);

// GET /api/roadmaps/deleted - Get deleted roadmaps for user
router.get('/deleted', roadmapController.getDeletedRoadmaps);

// GET /api/roadmaps/deleted/:deletedId - Get deleted roadmap detail preview
router.get('/deleted/:deletedId', roadmapController.getDeletedRoadmapById);

// POST /api/roadmaps/deleted/:deletedId/recover - Recover deleted roadmap
router.post('/deleted/:deletedId/recover', roadmapController.recoverDeletedRoadmap);

// DELETE /api/roadmaps/deleted/:deletedId/permanent - Permanently delete from deleted roadmaps
router.delete('/deleted/:deletedId/permanent', roadmapController.permanentlyDeleteRoadmap);

// GET /api/roadmaps - Get all roadmaps for user
router.get('/', roadmapController.getRoadmaps);

// GET /api/roadmaps/:id - Get specific roadmap
router.get('/:id', validateRequest(roadmapIdParamSchema), roadmapController.getRoadmapById);

// GET /api/roadmaps/:id/days/:dayNumber - Generate/load day-level content
router.get(
  '/:id/days/:dayNumber',
  validateRequest(roadmapDayParamSchema),
  roadmapController.getDayContent
);

// PATCH /api/roadmaps/:id/tasks/:taskId - Update task status
router.patch(
  '/:id/tasks/:taskId',
  validateRequest(roadmapTaskStatusSchema),
  roadmapController.updateTaskStatus
);

// DELETE /api/roadmaps/:id - Delete roadmap
router.delete('/:id', validateRequest(roadmapIdParamSchema), roadmapController.deleteRoadmap);

module.exports = router;

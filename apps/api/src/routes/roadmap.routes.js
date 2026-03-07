const express = require('express');
const { roadmapController } = require('../controllers/roadmap.controller.js');
const { authMiddleware } = require('../middleware/auth.middleware.js');

const router = express.Router();

// All roadmap routes require authentication
router.use(authMiddleware);

// POST /api/roadmaps/generate - Generate new roadmap
router.post('/generate', roadmapController.generateRoadmap);

// GET /api/roadmaps/stats - Get user statistics
router.get('/stats', roadmapController.getStats);

// GET /api/roadmaps - Get all roadmaps for user
router.get('/', roadmapController.getRoadmaps);

// GET /api/roadmaps/:id - Get specific roadmap
router.get('/:id', roadmapController.getRoadmapById);

// PATCH /api/roadmaps/:id/tasks/:taskId - Update task status
router.patch('/:id/tasks/:taskId', roadmapController.updateTaskStatus);

// DELETE /api/roadmaps/:id - Delete roadmap
router.delete('/:id', roadmapController.deleteRoadmap);

module.exports = router;

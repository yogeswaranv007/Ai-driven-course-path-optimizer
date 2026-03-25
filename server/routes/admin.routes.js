const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware.js');
const { isAdmin } = require('../middleware/admin.middleware.js');
const { User } = require('../models/User.model.js');
const { RoadmapInstance } = require('../models/RoadmapInstance.model.js');

const router = express.Router();

// All admin routes must be authenticated and authorized
router.use(authMiddleware);
router.use(isAdmin);

/**
 * GET /api/admin/stats
 * Fetches dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRoadmaps = await RoadmapInstance.countDocuments();
    const activeRoadmaps = await RoadmapInstance.countDocuments({ status: 'in-progress' });

    // Calculate aggregate goal distribution
    const users = await User.find({}, 'profile.goal');
    const goalsDistribution = {};
    users.forEach((user) => {
      const goal = user.profile?.goal || 'General Learning';
      goalsDistribution[goal] = (goalsDistribution[goal] || 0) + 1;
    });

    const goalsChartData = Object.keys(goalsDistribution).map((key) => ({
      name: key,
      value: goalsDistribution[key],
    }));

    res.json({
      totalUsers,
      totalRoadmaps,
      activeRoadmaps,
      goalsChartData,
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/admin/users
 * Fetches list of all users and their roadmap counts
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });

    // We can fetch roadmap counts efficiently using aggregation or sequentially
    // Let's use lean for speed
    const userDocs = users.map((u) => u.toObject());

    for (let u of userDocs) {
      u.roadmapCount = await RoadmapInstance.countDocuments({ userId: u._id });
    }

    res.json(userDocs);
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * DELETE /api/admin/roadmaps/:id
 * Delete any user's roadmap
 */
router.delete('/roadmaps/:id', async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const deleted = await RoadmapInstance.findByIdAndDelete(roadmapId);

    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Roadmap not found.' });
    }

    res.json({ success: true, message: 'Roadmap permanently deleted.' });
  } catch (error) {
    console.error('Admin Delete Roadmap Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;

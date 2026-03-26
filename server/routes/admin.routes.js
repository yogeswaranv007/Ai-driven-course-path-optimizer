const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware.js');
const { isAdmin } = require('../middleware/admin.middleware.js');
const { User } = require('../models/User.model.js');
const { RoadmapInstance } = require('../models/RoadmapInstance.model.js');
const { GlobalTemplate } = require('../models/GlobalTemplate.model.js');
const roadmapOptimizerService = require('../services/roadmapOptimizer.service.js');

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
    const activeRoadmaps = await RoadmapInstance.countDocuments({
      status: { $in: ['active', 'in-progress'] },
    });

    // Calculate aggregate goal distribution based on generated roadmaps
    const roadmapsByRole = await RoadmapInstance.aggregate([
      { $group: { _id: '$roleName', count: { $sum: 1 } } },
    ]);

    const goalsChartData = roadmapsByRole
      .filter((item) => item._id) // Filter out undefined/null roleNames
      .map((item) => ({
        name: item._id,
        value: item.count,
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

/**
 * PUT /api/admin/password
 * Admin changes their own password
 */
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await User.findById(req.user._id);

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ error: 'Invalid password', message: 'Current password is incorrect' });
    }

    admin.passwordHash = newPassword;
    await admin.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Admin Password Update Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/admin/users
 * Manual user creation by admin
 */
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: 'User exists', message: 'Email already in use' });

    const user = new User({
      name,
      email,
      passwordHash: password,
      role: role || 'user',
      profile: { interests: [] },
    });
    await user.save();
    res.status(201).json({ success: true, user: { _id: user._id, name, email, role } });
  } catch (error) {
    console.error('Admin Create User Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * PUT /api/admin/users/:id
 * Manual user update by admin
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found', message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();
    res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Admin Update User Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/admin/users/:id/roadmaps
 * Fetch all roadmaps belonging to a specific user
 */
router.get('/users/:id/roadmaps', async (req, res) => {
  try {
    const roadmaps = await RoadmapInstance.find({ userId: req.params.id }).sort({ createdAt: -1 });
    res.json(roadmaps);
  } catch (error) {
    console.error('Admin Get User Roadmaps Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Hard delete user and all their roadmaps
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    if (userId === req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Cannot delete your own admin account.' });
    }

    await User.findByIdAndDelete(userId);
    await RoadmapInstance.deleteMany({ userId });

    res.json({ success: true, message: 'User and all associated roadmaps deleted.' });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/admin/templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await GlobalTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/admin/templates
 */
router.post('/templates', async (req, res) => {
  try {
    const { roleName, description, estimatedTotalDays } = req.body;
    let basePhases = req.body.basePhases || [];

    if (basePhases.length === 0) {
      basePhases = await roadmapOptimizerService.generateBaseTemplate(
        roleName,
        description,
        estimatedTotalDays
      );
    }

    // Fallback if AI fails or returns empty array
    if (basePhases.length === 0) {
      basePhases = [
        {
          phaseNumber: 1,
          phaseName: 'Core Fundamentals',
          goal: 'Master the basics of ' + roleName,
          startDay: 1,
          endDay: 5,
          days: [{ dayNumber: 1, topic: 'Introduction to ' + roleName, estimatedMinutes: 60 }],
        },
      ];
    }

    const template = new GlobalTemplate({
      ...req.body,
      basePhases,
    });

    await template.save();
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * PUT /api/admin/templates/:id
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const template = await GlobalTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template)
      return res.status(404).json({ error: 'Not found', message: 'Template not found' });
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * DELETE /api/admin/templates/:id
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    await GlobalTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/admin/roadmaps/broadcast
 * Broadcasts a roadmap to all users based on a template, optimizing via groups.
 */
router.post('/roadmaps/broadcast', async (req, res) => {
  try {
    const { templateId, mode } = req.body; // mode: 'generic' | 'optimized'
    const template = await GlobalTemplate.findById(templateId);
    if (!template)
      return res.status(404).json({ error: 'Not found', message: 'Template not found' });

    // Fetch all standard users (excluding admins, or include all?)
    const users = await User.find({ role: { $ne: 'admin' } });

    if (mode === 'generic') {
      // Fast branch: Create standard clone for everyone
      const roadmapsToInsert = users.map((user) => ({
        userId: user._id,
        templateId: template._id,
        roleName: template.roleName,
        roadmapName: `${template.roleName} Roadmap (System)`,
        dailyLearningMinutes: user.profile?.dailyMinutes || 60,
        skillSource: 'profile',
        status: 'active',
        phases: template.basePhases, // Direct generic clone
      }));
      await RoadmapInstance.insertMany(roadmapsToInsert);
      return res.json({
        success: true,
        message: `Generic roadmap broadcasted to ${users.length} users.`,
      });
    }

    // Optimized Branch
    res.json({ success: true, message: 'Optimized broadcast initiated in background.' });

    // Run heavily optimized AI call in background
    setTimeout(async () => {
      try {
        console.log('[ADMIN] Starting optimized broadcast algorithm...');
        const groups = roadmapOptimizerService.groupUsersForBroadcast(template.roleName, users);
        console.log(
          `[ADMIN] Grouped ${users.length} users into ${groups.size} optimized LLM calls.`
        );

        for (const [hash, groupData] of groups) {
          // This invokes exactly 1 Groq API call PER group, cutting costs drastically
          const optimizedPhases = await roadmapOptimizerService.optimizeTemplateForGroup(
            template.basePhases,
            template.roleName,
            groupData
          );

          const roadmapsToInsert = groupData.users.map((user) => ({
            userId: user._id,
            templateId: template._id,
            roleName: template.roleName,
            roadmapName: `${template.roleName} (Personalized)`,
            dailyLearningMinutes: user.profile?.dailyMinutes || 60,
            skillSource: 'profile',
            status: 'active',
            phases: optimizedPhases,
          }));
          await RoadmapInstance.insertMany(roadmapsToInsert);
        }
        console.log('[ADMIN] Optimized broadcast complete.');
      } catch (err) {
        console.error('[ADMIN] Broadcast Background Error:', err);
      }
    }, 0);
  } catch (error) {
    console.error('Admin Broadcast Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/admin/users/:id/roadmaps
 * Generate a new roadmap for a specific user using a template
 */
router.post('/users/:id/roadmaps', async (req, res) => {
  try {
    const userId = req.params.id;
    const { templateId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Not found', message: 'User not found' });

    const template = await GlobalTemplate.findById(templateId);
    if (!template)
      return res.status(404).json({ error: 'Not found', message: 'Template not found' });

    const roadmap = new RoadmapInstance({
      userId: user._id,
      templateId: template._id,
      roleName: template.roleName,
      roadmapName: `${template.roleName} (Assigned by Admin)`,
      dailyLearningMinutes: user.profile?.dailyMinutes || 60,
      skillSource: 'profile',
      status: 'active',
      phases: template.basePhases, // Direct assignment structure
    });
    await roadmap.save();

    res.json({ success: true, message: 'Roadmap generated for user successfully.' });
  } catch (error) {
    console.error('Admin Single Roadmap Gen Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;

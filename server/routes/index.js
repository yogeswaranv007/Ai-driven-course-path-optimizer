const express = require('express');
const authRoutes = require('./auth.routes.js');
const profileRoutes = require('./profile.routes.js'); // NEW
const roadmapRoutes = require('./roadmap.routes.js'); // NEW
const planRoutes = require('./plan.routes.js'); // DEPRECATED - keep for backward compatibility

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes); // NEW
router.use('/roadmaps', roadmapRoutes); // NEW - primary endpoint
router.use('/plans', planRoutes); // DEPRECATED - backward compatibility

module.exports = router;

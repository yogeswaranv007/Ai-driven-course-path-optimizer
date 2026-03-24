const express = require('express');
const { profileController } = require('../controllers/profile.controller.js');
const { authMiddleware } = require('../middleware/auth.middleware.js');
const { validateRequest } = require('../middleware/validation.middleware.js');
const {
  profileAddSkillSchema,
  profileUpdateSkillsSchema,
  profileDeleteSkillParamSchema,
} = require('@learning-path-optimizer/shared');

const router = express.Router();

// All profile routes require authentication
router.use(authMiddleware);

// GET /api/profile - Get user profile
router.get('/', profileController.getProfile);

// PUT /api/profile/skills - Update all skills
router.put('/skills', validateRequest(profileUpdateSkillsSchema), profileController.updateSkills);

// POST /api/profile/skills - Add a single skill
router.post('/skills', validateRequest(profileAddSkillSchema), profileController.addSkill);

// DELETE /api/profile/skills/:skillName - Remove a skill
router.delete(
  '/skills/:skillName',
  validateRequest(profileDeleteSkillParamSchema),
  profileController.removeSkill
);

module.exports = router;

const { profileService } = require('../services/profile.service.js');

const profileController = {
  /**
   * GET /api/profile
   * Get user profile with skills
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const profile = await profileService.getProfile(userId);

      res.json({
        user: profile,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/profile/skills
   * Update user's skills
   */
  async updateSkills(req, res, next) {
    try {
      const userId = req.user._id;
      const { skills } = req.body;

      if (!skills) {
        return res.status(400).json({
          error: 'Skills array is required',
        });
      }

      const updatedSkills = await profileService.updateSkills(userId, skills);

      res.json({
        message: 'Skills updated successfully',
        skills: updatedSkills,
      });
    } catch (error) {
      if (error.message.includes('must be') || error.message.includes('required')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /api/profile/skills
   * Add a single skill
   */
  async addSkill(req, res, next) {
    try {
      const userId = req.user._id;
      const { name, level } = req.body;

      if (!name || !level) {
        return res.status(400).json({
          error: 'Skill name and level are required',
        });
      }

      const validLevels = ['beginner', 'intermediate', 'advanced'];
      if (!validLevels.includes(level)) {
        return res.status(400).json({
          error: `Level must be one of: ${validLevels.join(', ')}`,
        });
      }

      const updatedSkills = await profileService.addSkill(userId, { name, level });

      res.json({
        message: 'Skill added successfully',
        skills: updatedSkills,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/profile/skills/:skillName
   * Remove a skill
   */
  async removeSkill(req, res, next) {
    try {
      const userId = req.user._id;
      const { skillName } = req.params;

      const updatedSkills = await profileService.removeSkill(userId, skillName);

      res.json({
        message: 'Skill removed successfully',
        skills: updatedSkills,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { profileController };

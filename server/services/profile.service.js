const { userRepository } = require('../repositories/user.repository.js');

const profileService = {
  /**
   * Get user profile with skills
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      skills: user.skills || [],
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  /**
   * Update user skills
   */
  async updateSkills(userId, skills) {
    // Validate skills array
    if (!Array.isArray(skills)) {
      throw new Error('Skills must be an array');
    }

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    for (const skill of skills) {
      if (!skill.name || typeof skill.name !== 'string') {
        throw new Error('Each skill must have a name');
      }
      if (!skill.level || !validLevels.includes(skill.level)) {
        throw new Error(`Skill level must be one of: ${validLevels.join(', ')}`);
      }
    }

    // Add addedAt timestamp to new skills
    const skillsWithTimestamp = skills.map((skill) => ({
      name: skill.name.trim(),
      level: skill.level,
      addedAt: skill.addedAt || new Date(),
    }));

    const updatedUser = await userRepository.updateSkills(userId, skillsWithTimestamp);
    if (!updatedUser) {
      throw new Error('Failed to update skills');
    }

    return updatedUser.skills;
  },

  /**
   * Add a single skill
   */
  async addSkill(userId, skill) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if skill already exists
    const existingSkill = user.skills.find(
      (s) => s.name.toLowerCase() === skill.name.toLowerCase()
    );

    if (existingSkill) {
      // Update existing skill
      existingSkill.level = skill.level;
      existingSkill.addedAt = new Date();
    } else {
      // Add new skill
      user.skills.push({
        name: skill.name.trim(),
        level: skill.level,
        addedAt: new Date(),
      });
    }

    await user.save();
    return user.skills;
  },

  /**
   * Remove a skill
   */
  async removeSkill(userId, skillName) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.skills = user.skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase());

    await user.save();
    return user.skills;
  },

  /**
   * Get user's skill level for a specific skill
   */
  async getSkillLevel(userId, skillName) {
    const user = await userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const skill = user.skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());

    return skill ? skill.level : null;
  },
};

module.exports = { profileService };

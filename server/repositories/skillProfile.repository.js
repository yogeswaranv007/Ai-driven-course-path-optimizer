const { SkillProfile } = require('../models/SkillProfile.model.js');

const skillProfileRepository = {
  async create(userId, data) {
    const profile = new SkillProfile({ userId, ...data });
    return profile.save();
  },

  async findByUserId(userId) {
    return SkillProfile.findOne({ userId });
  },

  async upsert(userId, data) {
    return SkillProfile.findOneAndUpdate({ userId }, data, { upsert: true, new: true });
  },

  async updateSkills(userId, skills) {
    return SkillProfile.findOneAndUpdate({ userId }, { skills }, { new: true });
  },

  async updateMarks(userId, marks) {
    return SkillProfile.findOneAndUpdate({ userId }, { marks }, { new: true });
  },
};

module.exports = { skillProfileRepository };

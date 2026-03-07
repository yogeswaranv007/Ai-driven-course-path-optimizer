const { PREREQUISITES } = require('../utils/prerequisites.js');

const skillGapAnalyzer = {
  calculateSkillGaps(skills, marks) {
    const skillMap = new Map(skills.map((s) => [s.topic, s.level]));
    const marksMap = new Map(marks.map((m) => [m.topic, m.scorePercent]));

    const gaps = [];

    for (const [topic, data] of Object.entries(PREREQUISITES)) {
      const requiredLevel = data.level;
      const currentLevel = skillMap.get(topic) || 0;
      const scorePercent = marksMap.get(topic) || 50; // Default to 50% if missing

      // Gap formula: (required - current) + low marks penalty
      const lowMarksPenalty = scorePercent < 60 ? (60 - scorePercent) / 20 : 0;
      const gapScore = Math.max(0, requiredLevel - currentLevel) + lowMarksPenalty;

      gaps.push({
        topic,
        category: data.category,
        requiredLevel,
        currentLevel,
        scorePercent,
        gapScore,
      });
    }

    // Sort by gap score descending
    return gaps.sort((a, b) => b.gapScore - a.gapScore);
  },
};

module.exports = { skillGapAnalyzer };

const { skillGapAnalyzer } = require('./skillGapAnalyzer.service.js');
const { resourceRecommender } = require('./resourceRecommender.service.js');

const toTaskKey = (week, topic, type) => {
  const normalized = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `week${week}-${normalized}-${type}`;
};

const planGenerator = {
  generatePlan({ skills, marks, dailyMinutes, goal }) {
    const skillGaps = skillGapAnalyzer.calculateSkillGaps(skills, marks);

    // Choose top 8 topics to focus on for 4 weeks
    const topTopics = skillGaps.slice(0, 8);

    // Total time per week = dailyMinutes * 7
    const totalWeeklyMinutes = dailyMinutes * 7;

    // Distribute time across topics evenly
    const timePerTopic = Math.floor(totalWeeklyMinutes / topTopics.length);

    const weeks = [];
    const explainability = [];
    for (let week = 1; week <= 4; week++) {
      const weekTopics = topTopics.slice((week - 1) * 2, week * 2); // 2 topics per week
      const goals = weekTopics.map(
        (t) => `Improve ${t.topic} (level ${t.currentLevel} → ${t.requiredLevel})`
      );

      const tasks = [];
      weekTopics.forEach((t, idx) => {
        const resources = resourceRecommender.getResourcesForTopic(t.topic);
        const studyTaskKey = toTaskKey(week, t.topic, 'study');
        const practiceTaskKey = toTaskKey(week, t.topic, 'practice');
        tasks.push({
          taskKey: studyTaskKey,
          title: `Study ${t.topic} fundamentals`,
          topic: t.topic,
          estMinutes: timePerTopic,
          resourceLinks: resources,
          status: 'pending',
        });
        tasks.push({
          taskKey: practiceTaskKey,
          title: `Practice ${t.topic} exercises`,
          topic: t.topic,
          estMinutes: Math.floor(timePerTopic / 2),
          resourceLinks: resources,
          status: 'pending',
        });

        explainability.push({
          taskKey: studyTaskKey,
          reasons: [
            `Your current rating for ${t.topic} is ${t.currentLevel}/5`,
            `Your marks are ${t.scorePercent}%`,
            `This is a prerequisite for advanced topics in ${t.category}`,
            `Target goal: ${goal}`,
          ],
        });

        explainability.push({
          taskKey: practiceTaskKey,
          reasons: [
            `Your current rating for ${t.topic} is ${t.currentLevel}/5`,
            `Your marks are ${t.scorePercent}%`,
            `This is a prerequisite for advanced topics in ${t.category}`,
            `Target goal: ${goal}`,
          ],
        });
      });

      weeks.push({
        weekNo: week,
        goals,
        tasks,
      });
    }

    return { weeks, explainability, skillGaps };
  },
};

module.exports = { planGenerator };

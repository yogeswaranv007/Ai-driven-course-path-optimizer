// Topic prerequisite graph
// This represents the learning dependencies between topics
const PREREQUISITES = {
  // JavaScript Path
  'JS Basics': { prereqs: [], level: 1, category: 'Web Development' },
  'DOM Manipulation': { prereqs: ['JS Basics'], level: 2, category: 'Web Development' },
  'Async JS': { prereqs: ['JS Basics'], level: 2, category: 'Web Development' },
  'React Basics': {
    prereqs: ['JS Basics', 'DOM Manipulation'],
    level: 3,
    category: 'Web Development',
  },
  'React Hooks': { prereqs: ['React Basics'], level: 4, category: 'Web Development' },
  'State Management': { prereqs: ['React Hooks'], level: 5, category: 'Web Development' },

  // Backend Path
  'Node.js Basics': { prereqs: ['JS Basics'], level: 2, category: 'Backend' },
  'Express.js': { prereqs: ['Node.js Basics'], level: 3, category: 'Backend' },
  'REST APIs': { prereqs: ['Express.js'], level: 3, category: 'Backend' },
  'Database Design': { prereqs: [], level: 2, category: 'Backend' },
  MongoDB: { prereqs: ['Database Design'], level: 3, category: 'Backend' },
  Authentication: { prereqs: ['Express.js'], level: 4, category: 'Backend' },

  // DSA Path
  'Arrays & Strings': { prereqs: [], level: 1, category: 'DSA' },
  'Linked Lists': { prereqs: ['Arrays & Strings'], level: 2, category: 'DSA' },
  'Stacks & Queues': { prereqs: ['Arrays & Strings'], level: 2, category: 'DSA' },
  Trees: { prereqs: ['Linked Lists'], level: 3, category: 'DSA' },
  Graphs: { prereqs: ['Trees'], level: 4, category: 'DSA' },
  'Dynamic Programming': {
    prereqs: ['Arrays & Strings', 'Trees'],
    level: 5,
    category: 'DSA',
  },

  // Python/ML Path
  'Python Basics': { prereqs: [], level: 1, category: 'Machine Learning' },
  'NumPy & Pandas': { prereqs: ['Python Basics'], level: 2, category: 'Machine Learning' },
  'Data Visualization': { prereqs: ['NumPy & Pandas'], level: 2, category: 'Machine Learning' },
  'ML Fundamentals': { prereqs: ['NumPy & Pandas'], level: 3, category: 'Machine Learning' },
  'Supervised Learning': { prereqs: ['ML Fundamentals'], level: 4, category: 'Machine Learning' },
  'Deep Learning': { prereqs: ['Supervised Learning'], level: 5, category: 'Machine Learning' },
};

// Get all prerequisites for a topic (recursively)
const getAllPrerequisites = (topic) => {
  const result = new Set();
  const queue = [topic];

  while (queue.length > 0) {
    const current = queue.shift();
    const topicData = PREREQUISITES[current];

    if (topicData && topicData.prereqs) {
      topicData.prereqs.forEach((prereq) => {
        if (!result.has(prereq)) {
          result.add(prereq);
          queue.push(prereq);
        }
      });
    }
  }

  return Array.from(result);
};

// Check if user has completed prerequisites
const hasCompletedPrereqs = (topic, userSkills) => {
  const prereqs = PREREQUISITES[topic]?.prereqs || [];
  if (prereqs.length === 0) return true;

  const userSkillMap = new Map(userSkills.map((s) => [s.topic, s.level]));

  return prereqs.every((prereq) => {
    const userLevel = userSkillMap.get(prereq) || 0;
    return userLevel >= 3; // Require at least level 3 to proceed
  });
};

// Get recommended next topics based on current skills
const getRecommendedTopics = (userSkills, limit = 10) => {
  const userSkillMap = new Map(userSkills.map((s) => [s.topic, s.level]));
  const recommendations = [];

  for (const [topic, data] of Object.entries(PREREQUISITES)) {
    const userLevel = userSkillMap.get(topic) || 0;

    // Skip if already proficient
    if (userLevel >= 4) continue;

    // Check prerequisites
    if (hasCompletedPrereqs(topic, userSkills)) {
      recommendations.push({
        topic,
        category: data.category,
        level: data.level,
        currentUserLevel: userLevel,
        gap: 5 - userLevel,
      });
    }
  }

  // Sort by gap (highest gap first)
  return recommendations.sort((a, b) => b.gap - a.gap).slice(0, limit);
};

module.exports = {
  PREREQUISITES,
  getAllPrerequisites,
  hasCompletedPrereqs,
  getRecommendedTopics,
};

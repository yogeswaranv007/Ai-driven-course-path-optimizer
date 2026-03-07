const { RESOURCES } = require('@learning-path-optimizer/shared');

const resourceRecommender = {
  getResourcesForTopic(topic) {
    return RESOURCES[topic] || [];
  },

  getRecommendedResources(topics) {
    return topics.map((topic) => ({
      topic,
      resources: this.getResourcesForTopic(topic),
    }));
  },
};

module.exports = { resourceRecommender };

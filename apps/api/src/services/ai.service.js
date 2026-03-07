// Placeholder AI service layer
// This can be connected to OpenAI, Azure OpenAI, or any LLM provider later

const aiService = {
  async generatePlanSummary(planData) {
    // TODO: Integrate LLM service
    return `This is your 4-week plan focused on ${planData.weeks.length} weeks of structured learning.`;
  },

  async suggestAlternativeResources(topic) {
    // TODO: Integrate LLM service
    return [
      { title: `Alternative resource for ${topic}`, url: 'https://example.com', type: 'article' },
    ];
  },

  async generateMotivationTip(progressPercent) {
    // TODO: Integrate LLM service
    return `You're ${progressPercent}% done! Keep going, consistency beats intensity.`;
  },
};

module.exports = { aiService };

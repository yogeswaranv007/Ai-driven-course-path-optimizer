const { DAY_CONTENT_PROMPT } = require('../prompts/roadmap.prompts.js');

function buildDayContentPrompt({
  roleName,
  phaseName,
  dayNumber,
  topic,
  dailyLearningMinutes,
  knownSkills,
}) {
  const knownSkillsText =
    (knownSkills || []).map((s) => `${s.name} (${s.level})`).join(', ') || 'None';
  const advancedSkillsText =
    (knownSkills || [])
      .filter((s) => ['intermediate', 'advanced'].includes(String(s.level || '').toLowerCase()))
      .map((s) => `${s.name} (${s.level})`)
      .join(', ') || 'None';

  return `${DAY_CONTENT_PROMPT}

Context:
- Role: ${roleName}
- Phase: ${phaseName}
- Day Number: ${dayNumber}
- Topic: ${topic}
- Daily Learning Minutes: ${dailyLearningMinutes}
- Known Skills: ${knownSkillsText}
- Skills to avoid repeating unless required prerequisite: ${advancedSkillsText}

Output quality checks before finalizing JSON:
- Ensure docs/videos teach the exact topic.
- Ensure practiceTask is implementable in one session and has a tangible output.
- Ensure learningObjectives are specific, not generic.

Generate content tailored for this exact day.`;
}

module.exports = {
  buildDayContentPrompt,
};

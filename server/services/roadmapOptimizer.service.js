const crypto = require('crypto');

/**
 * Service to handle roadmap generation optimization for admin broadcasting.
 * Implements strict grouping, normalization, and framework separation.
 */
class RoadmapOptimizerService {
  /**
   * Normalizes a user skill level combining Beginner/Intermediate.
   */
  normalizeSkillLevel(level) {
    const l = String(level || '').toLowerCase();
    if (l === 'advanced') return 'advanced';
    return 'beginner_intermediate';
  }

  /**
   * Normalizes a framework specifically to ensure completely isolated groups.
   */
  normalizeFrameworks(skills) {
    const frameworks = [
      'react',
      'angular',
      'vue',
      'svelte',
      'django',
      'express',
      'spring',
      'laravel',
    ];
    const activeFrameworks = skills
      .filter((s) => frameworks.includes(s.name.toLowerCase()))
      .map((s) => s.name.toLowerCase())
      .sort();
    return activeFrameworks.join('|');
  }

  /**
   * Generates a deterministic hash for a user profile based on target role, normalized skills, and frameworks.
   */
  generateProfileHash(targetRole, skills) {
    // 1. Sort skills alphabetically to ensure consistent hashing
    const sortedSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name));

    // 2. Normalize levels and build strict skill signature
    const skillSignature = sortedSkills
      .map((s) => `${s.name.toLowerCase()}:${this.normalizeSkillLevel(s.level)}`)
      .join(';');

    // 3. Extract exact framework constraints
    const frameworkSignature = this.normalizeFrameworks(skills);

    // 4. Combine into final deterministic string
    const combinedString = `role:${targetRole.toLowerCase()}|fw:${frameworkSignature}|skills:${skillSignature}`;

    // 5. Hash to build the final group ID
    return crypto.createHash('sha256').update(combinedString).digest('hex');
  }

  /**
   * Groups an array of users into optimized batch buckets.
   * Returns a Map of { hashKey: [array of user objects] }
   */
  groupUsersForBroadcast(targetRole, users) {
    const groups = new Map();

    for (const user of users) {
      // Assuming user has a populated profile.skills or similar structure
      const skills = user.skills || [];
      const hash = this.generateProfileHash(targetRole, skills);

      if (!groups.has(hash)) {
        groups.set(hash, {
          representativeSkills: skills,
          users: [],
        });
      }
      groups.get(hash).users.push(user);
    }

    return groups;
  }

  /**
   * Intelligently modifies a base template relying on the normalized skill profile.
   */
  async optimizeTemplateForGroup(basePhases, roleName, groupData) {
    const skills = groupData.representativeSkills || [];
    if (skills.length === 0) return basePhases;

    const skillList = skills.map((s) => `${s.name} (${s.level})`).join(', ');

    const { config } = require('../config/env.js');
    if (!config.groq_api_key) return basePhases;

    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: config.groq_api_key });

      const prompt = `You are a curriculum designer.
Target Role: ${roleName}
Skills User Already Has: ${skillList}

Standard Curriculum (JSON array of phases):
${JSON.stringify(basePhases)}

INSTRUCTIONS:
1. DO NOT teach skills they are already "advanced" or "intermediate" in. Remove those days or replace them with advanced application days.
2. If they have a framework skill (like React), pivot generic frontend days to use React specifically.
3. Keep the exact JSON Array structure: [{phaseNumber, phaseName, goal, startDay, endDay, days: [{dayNumber, topic, estimatedMinutes}]}]
4. Return ONLY the raw JSON array, without any markdown or code blocks.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
      });

      let responseText = completion.choices[0]?.message?.content || '';

      // Attempt clean extraction of JSON array
      const startIdx = responseText.indexOf('[');
      const endIdx = responseText.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        responseText = responseText.substring(startIdx, endIdx + 1);
        const optimizedParsed = JSON.parse(responseText);
        if (Array.isArray(optimizedParsed) && optimizedParsed.length > 0) {
          return optimizedParsed;
        }
      }
      return basePhases;
    } catch (err) {
      console.error('[Optimizer Error]', err.message);
      return basePhases; // Hard fallback
    }
  }
}

module.exports = new RoadmapOptimizerService();

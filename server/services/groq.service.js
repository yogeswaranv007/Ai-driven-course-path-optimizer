/**
 * Groq AI Service
 * Generates learning tasks, exercises, projects, and explanations
 * using Groq Chat Completions API.
 */

const Groq = require('groq-sdk');
const { buildDayContentPrompt } = require('../utils/promptBuilder.js');
const { resourceService } = require('./resource.service.js');

const GROQ_MODEL_CANDIDATES = [
  process.env.GROQ_MODEL,
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
].filter(Boolean);

if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️ GROQ_API_KEY not set in environment. AI features will be unavailable.');
}

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

function extractAssistantText(completion) {
  return completion?.choices?.[0]?.message?.content || '';
}

function extractBalancedJson(text, openingChar, closingChar) {
  if (!text) return null;
  const start = text.indexOf(openingChar);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index++) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === openingChar) depth += 1;
    if (char === closingChar) depth -= 1;

    if (depth === 0) {
      return text.slice(start, index + 1).trim();
    }
  }

  return null;
}

function extractJsonObject(text) {
  if (!text) return null;
  const fenced = text.match(/```json\n([\s\S]*?)\n```/);
  if (fenced?.[1]) return fenced[1];

  const arrayCandidate = extractBalancedJson(text, '[', ']');
  if (arrayCandidate) return arrayCandidate;

  const objectCandidate = extractBalancedJson(text, '{', '}');
  return objectCandidate;
}

function isGroqQuotaExceededError(error) {
  const message = String(error?.message || '').toLowerCase();
  const status = Number(error?.status || error?.response?.status || 0);
  return (
    status === 429 ||
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  );
}

function extractRetryDelayMs(error) {
  const message = String(error?.message || '');
  const secondsMatch = message.match(/try again in\s*([0-9.]+)s/i);
  if (secondsMatch?.[1]) {
    return Math.max(250, Math.ceil(Number(secondsMatch[1]) * 1000));
  }

  const millisMatch = message.match(/try again in\s*([0-9.]+)ms/i);
  if (millisMatch?.[1]) {
    return Math.max(250, Math.ceil(Number(millisMatch[1])));
  }

  return 1000;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isGroqModelUnavailableError(error) {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || error?.response?.data?.error?.code || '').toLowerCase();
  const status = Number(error?.status || error?.response?.status || 0);

  return (
    status === 400 &&
    (code.includes('model_decommissioned') ||
      message.includes('model_decommissioned') ||
      message.includes('decommissioned') ||
      (message.includes('model') && message.includes('no longer supported')))
  );
}

async function chatCompletion({ prompt, temperature = 0.6, maxTokens = 1024 }) {
  if (!groq) return '';

  let lastError = null;

  for (const model of GROQ_MODEL_CANDIDATES) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          temperature,
          max_tokens: maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        return extractAssistantText(completion);
      } catch (error) {
        lastError = error;

        if (isGroqModelUnavailableError(error)) {
          console.warn(`⚠️ Groq model unavailable: ${model}. Trying next model...`);
          break;
        }

        if (isGroqQuotaExceededError(error) && attempt < 2) {
          const waitMs = extractRetryDelayMs(error) + attempt * 300;
          await sleep(waitMs);
          continue;
        }

        throw error;
      }
    }
  }

  throw lastError || new Error('No available Groq model could complete the request');
}

async function generateWeeklyLearningPlan({
  jobRole,
  track,
  dailyHours,
  weeksRequired,
  weeklyTopics,
}) {
  if (!groq) {
    const fallback = generateRoleSpecificFallbackPlan(jobRole, weeklyTopics, weeksRequired);
    return { plan: fallback, weeks: fallback.weeks, isAiGenerated: false };
  }

  try {
    const prompt = buildWeeklyPlanPrompt({
      jobRole,
      track,
      dailyHours,
      weeksRequired,
      weeklyTopics,
    });

    const responseText = await chatCompletion({
      prompt,
      temperature: 0.7,
      maxTokens: 2048,
    });

    const rawJson = extractJsonObject(responseText);
    if (!rawJson) {
      const fallback = generateFallbackPlan(weeklyTopics, weeksRequired);
      return { plan: fallback, weeks: fallback.weeks, isAiGenerated: false };
    }

    const parsed = JSON.parse(rawJson);
    const validated = validateWeeklyPlan(parsed, weeksRequired);
    return {
      plan: validated,
      weeks: validated.weeks,
      isAiGenerated: true,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Groq API error:', error.message);
    }
    const fallback = generateRoleSpecificFallbackPlan(jobRole, weeklyTopics, weeksRequired);
    return {
      plan: fallback,
      weeks: fallback.weeks,
      isAiGenerated: false,
    };
  }
}

async function generateTaskExplanation(skillName, jobRole) {
  if (!groq) {
    return `${skillName} is an essential skill for becoming a ${jobRole}.`;
  }

  try {
    const prompt = `Explain in 1-2 sentences why "${skillName}" is important for a "${jobRole}". Be concise, practical, and motivating.`;
    return (await chatCompletion({ prompt, temperature: 0.6, maxTokens: 256 })).trim();
  } catch (_error) {
    return `${skillName} is essential for ${jobRole}.`;
  }
}

function buildWeeklyPlanPrompt({ jobRole, track, dailyHours, weeksRequired, weeklyTopics }) {
  const topicsStr = weeklyTopics.map((topic, index) => `Week ${index + 1}: ${topic}`).join('\n');

  return `
You are an expert learning path designer for aspiring ${jobRole}s.

Create a detailed ${weeksRequired}-week learning plan for someone pursuing ${jobRole} using the ${track} stack.
- Daily learning time: ${dailyHours} hours
- ${weeksRequired} weeks total

Weekly Topics to cover:
${topicsStr}

For EACH week, generate:
1. Main topic focus
2. 3-4 learning tasks (with duration in minutes)
3. 2-3 hands-on exercises
4. 1 mini-project
5. Explanation of why this week matters

Return ONLY a valid JSON object (no markdown, no code blocks) with this structure:
{
  "weeks": [
    {
      "weekNumber": 1,
      "topic": "week topic",
      "tasks": [
        {
          "title": "task title",
          "description": "what to learn",
          "durationMinutes": 120,
          "difficulty": "beginner|intermediate|advanced"
        }
      ],
      "exercises": [
        {
          "title": "exercise title",
          "description": "what to do",
          "durationMinutes": 60
        }
      ],
      "project": {
        "title": "mini project title",
        "description": "build this",
        "durationMinutes": 180
      },
      "why": "Why this week matters for ${jobRole}"
    }
  ]
}

Be specific. Use real examples. Make it actionable.
`;
}

function validateWeeklyPlan(plan, expectedWeeks) {
  if (!plan.weeks || !Array.isArray(plan.weeks)) {
    throw new Error('Invalid plan structure: missing weeks array');
  }

  const weeks = plan.weeks.slice(0, expectedWeeks);

  if (weeks.length < expectedWeeks) {
    for (let index = weeks.length; index < expectedWeeks; index++) {
      weeks.push({
        weekNumber: index + 1,
        topic: `Week ${index + 1} Topics`,
        tasks: [],
        exercises: [],
        project: null,
        why: '',
      });
    }
  }

  return {
    weeks: weeks.map((week, index) => ({
      weekNumber: week.weekNumber || index + 1,
      topic: week.topic || `Week ${index + 1}`,
      tasks: (week.tasks || []).map((task) => ({
        title: task.title || '',
        description: task.description || '',
        durationMinutes: Math.max(30, task.durationMinutes || 60),
        difficulty: task.difficulty || 'intermediate',
      })),
      exercises: (week.exercises || []).map((exercise) => ({
        title: exercise.title || '',
        description: exercise.description || '',
        durationMinutes: Math.max(30, exercise.durationMinutes || 60),
      })),
      project: week.project
        ? {
            title: week.project.title || '',
            description: week.project.description || '',
            durationMinutes: Math.max(60, week.project.durationMinutes || 180),
          }
        : null,
      why: week.why || '',
    })),
  };
}

function generateRoleSpecificFallbackPlan(jobRole, weeklyTopics, weeksRequired) {
  return generateFallbackPlan(
    weeklyTopics.map((topic) => `${topic} for ${jobRole}`),
    weeksRequired
  );
}

function generateFallbackPlan(weeklyTopics, weeksRequired) {
  const weeks = [];

  for (let i = 0; i < weeksRequired; i++) {
    const topic = weeklyTopics[i] || `Week ${i + 1} Topics`;
    weeks.push({
      weekNumber: i + 1,
      topic,
      tasks: [
        {
          title: `Study ${topic}`,
          description: `Deep dive into ${topic}. Read documentation and tutorials.`,
          durationMinutes: 120,
          difficulty: 'intermediate',
        },
        {
          title: `Practice ${topic} concepts`,
          description: `Apply what you learned with hands-on coding.`,
          durationMinutes: 90,
          difficulty: 'intermediate',
        },
      ],
      exercises: [
        {
          title: `Build a ${topic} exercise`,
          description: `Implement the concepts you just learned.`,
          durationMinutes: 60,
        },
      ],
      project: {
        title: `Mini Project: ${topic}`,
        description: `Create a small project applying ${topic}.`,
        durationMinutes: 150,
      },
      why: `${topic} is a critical skill for your career path. This week builds your understanding and practical experience.`,
    });
  }

  return { weeks };
}

async function generateStructuredLearningResources({ skill, level, durationMinutes }) {
  if (!groq) {
    return {
      skill,
      level,
      resources: [
        { type: 'documentation', title: `${skill} Official Docs`, url: '#' },
        { type: 'tutorial', title: `Learn ${skill}`, url: '#' },
      ],
      goals: [`Understand ${skill} fundamentals`, `Practice ${skill}`],
      tips: ['Study the official documentation', 'Practice with real examples'],
    };
  }

  try {
    const prompt = `Generate learning resources for the skill: ${skill} (${level} level, ${durationMinutes} minutes).

Return a JSON object with EXACTLY this structure:
{
  "skill": "${skill}",
  "level": "${level}",
  "goals": ["goal 1", "goal 2", "goal 3"],
  "resources": [
    {"type": "documentation", "title": "...", "description": "..."},
    {"type": "tutorial", "title": "...", "description": "..."},
    {"type": "practice", "title": "...", "description": "..."}
  ],
  "tips": ["tip 1", "tip 2"],
  "estimatedTime": ${durationMinutes}
}

Be specific and practical.`;

    const responseText = await chatCompletion({
      prompt,
      temperature: 0.5,
      maxTokens: 1024,
    });

    const rawJson = extractJsonObject(responseText);
    return rawJson
      ? JSON.parse(rawJson)
      : { skill, level, resources: [], goals: [], tips: ['Practice consistently'] };
  } catch (_error) {
    return { skill, level, resources: [], goals: [], tips: [] };
  }
}

async function generateTaskWithRetry({ skillName, jobRole, maxRetries = 2 }) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!groq) {
        return {
          title: `Learn ${skillName}`,
          description: `Master the fundamentals of ${skillName}`,
          difficulty: 'intermediate',
          durationMinutes: 120,
        };
      }

      const prompt = `Create a specific learning task for: ${skillName} (for ${jobRole}).

Return JSON:
{
  "title": "specific task title",
  "description": "detailed description",
  "subtasks": ["subtask 1", "subtask 2"],
  "difficulty": "beginner|intermediate|advanced",
  "durationMinutes": 60,
  "resources": ["resource 1", "resource 2"]
}`;

      const responseText = await chatCompletion({
        prompt,
        temperature: 0.6,
        maxTokens: 512,
      });

      const rawJson = extractJsonObject(responseText);
      return rawJson ? JSON.parse(rawJson) : null;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  console.error(
    `❌ Failed to generate task for ${skillName} after ${maxRetries} attempts:`,
    lastError?.message
  );

  return {
    title: `Learn ${skillName}`,
    description: `Master ${skillName} for your role as ${jobRole}`,
    difficulty: 'intermediate',
    durationMinutes: 120,
    resources: [],
  };
}

async function generateDayLearningContent({
  roleName,
  phaseName,
  dayNumber,
  topic,
  dailyLearningMinutes,
  knownSkills,
}) {
  const normalizedTopic = String(topic || '').toLowerCase();
  const heuristicObjectives =
    normalizedTopic.includes('let') && normalizedTopic.includes('const')
      ? [
          'Differentiate let, var, and const scope rules.',
          'Use const by default and let only when reassignment is required.',
          'Avoid hoisting-related bugs in block/function scope.',
        ]
      : normalizedTopic.includes('express') && normalizedTopic.includes('routing')
        ? [
            'Create RESTful route handlers with clear HTTP method semantics.',
            'Organize Express routes with modular routers and middleware.',
            'Implement route-level validation and consistent response patterns.',
          ]
        : normalizedTopic.includes('python') && normalizedTopic.includes('variable')
          ? [
              'Use Python primitive and collection data types effectively.',
              'Understand Python variable assignment and mutability.',
              'Write concise conditional and loop logic for backend tasks.',
            ]
          : [
              `Implement ${topic} in a working backend code example.`,
              `Validate ${topic} behavior with targeted tests or checks.`,
              `Integrate ${topic} into the current ${roleName} learning project.`,
            ];

  const heuristicPractice =
    normalizedTopic.includes('let') && normalizedTopic.includes('const')
      ? {
          title: 'Refactor variable declarations (let/var/const)',
          description:
            'Take an existing JS file, replace var safely, enforce const-first style, and verify behavior with tests.',
        }
      : normalizedTopic.includes('express') && normalizedTopic.includes('routing')
        ? {
            title: 'Build a modular Express router',
            description:
              'Implement versioned routes for users/tasks, add validation middleware, and return standardized error payloads.',
          }
        : {
            title: `Implement feature: ${topic}`,
            description: `Create or extend one concrete module for "${topic}" and verify it with runnable checks.`,
          };

  const fallbackContent = {
    learningObjectives: heuristicObjectives,
    whyImportant: `${topic} is required to progress toward ${roleName} responsibilities and real production delivery.`,
    practiceTask: {
      ...heuristicPractice,
      estimatedMinutes: Math.max(30, Math.round((dailyLearningMinutes || 120) * 0.5)),
    },
    resourceSuggestions: resourceService
      .getCuratedResourcesForTopic(topic, { roleName, knownSkills })
      .slice(0, 4),
    generatedBy: 'fallback',
    fallbackReason: 'generic-fallback',
  };

  if (!groq) {
    return {
      ...fallbackContent,
      fallbackReason: 'api-not-configured',
    };
  }

  try {
    const prompt = buildDayContentPrompt({
      roleName,
      phaseName,
      dayNumber,
      topic,
      dailyLearningMinutes,
      knownSkills,
    });

    const responseText = await chatCompletion({
      prompt,
      temperature: 0.6,
      maxTokens: 1024,
    });

    const rawJson = extractJsonObject(responseText);
    if (!rawJson) {
      return fallbackContent;
    }

    const parsed = JSON.parse(rawJson);
    return {
      learningObjectives: Array.isArray(parsed.learningObjectives)
        ? parsed.learningObjectives.filter(Boolean).slice(0, 5)
        : fallbackContent.learningObjectives,
      whyImportant: parsed.whyImportant || fallbackContent.whyImportant,
      practiceTask: {
        title: parsed.practiceTask?.title || fallbackContent.practiceTask.title,
        description: parsed.practiceTask?.description || fallbackContent.practiceTask.description,
        estimatedMinutes:
          Number(parsed.practiceTask?.estimatedMinutes) ||
          fallbackContent.practiceTask.estimatedMinutes,
      },
      resourceSuggestions: Array.isArray(parsed.resourceSuggestions)
        ? parsed.resourceSuggestions.slice(0, 5)
        : [],
      generatedBy: 'groq',
      fallbackReason: null,
    };
  } catch (error) {
    const fallbackReason = isGroqQuotaExceededError(error)
      ? 'quota-exceeded'
      : error.message?.includes('API key') || error.message?.includes('api_key')
        ? 'invalid-api-key'
        : error.message?.includes('timeout')
          ? 'timeout'
          : 'generic-fallback';

    return {
      ...fallbackContent,
      fallbackReason,
    };
  }
}

/**
 * Validates if a custom skill is relevant to a specific role
 * Returns relevance level and complementary technologies
 */
async function validateSkillRelevance(roleName, skillName) {
  if (!groq) {
    return {
      isRelevant: true,
      relevanceLevel: 'secondary',
      explanation: 'Skill validation unavailable (Groq API not configured)',
      complementaryTechs: [],
      estimatedHours: 60,
    };
  }

  try {
    const { SKILL_VALIDATION_PROMPT } = require('../prompts/roadmap.prompts.js');
    const prompt = SKILL_VALIDATION_PROMPT.replace('{ROLE}', roleName).replace(
      '{SKILL}',
      skillName
    );

    const responseText = await chatCompletion({
      prompt,
      temperature: 0.5,
      maxTokens: 800,
    });

    const jsonStr = extractJsonObject(responseText);
    if (!jsonStr) {
      return {
        isRelevant: true,
        relevanceLevel: 'secondary',
        explanation: 'Unable to validate skill',
        complementaryTechs: [],
        estimatedHours: 60,
      };
    }

    const result = JSON.parse(jsonStr);
    return {
      isRelevant: result.isRelevant !== false,
      relevanceLevel: result.relevanceLevel || 'secondary',
      explanation: result.explanation || '',
      complementaryTechs: Array.isArray(result.complementaryTechs) ? result.complementaryTechs : [],
      estimatedHours: Math.max(40, Math.min(160, result.estimatedHours || 60)),
    };
  } catch (error) {
    console.warn('⚠️ Skill validation error:', error.message);
    return {
      isRelevant: true,
      relevanceLevel: 'secondary',
      explanation: 'Validation service temporarily unavailable',
      complementaryTechs: [],
      estimatedHours: 60,
    };
  }
}

/**
 * Generates a custom phase structure for a skill + role combination
 * Returns 4 progressive learning phases
 */
async function generateCustomPhaseStructure(
  roleName,
  skillName,
  totalHours,
  dailyLearningMinutes,
  complementaryTechsOverride = []
) {
  if (!groq) {
    return null;
  }

  try {
    const { CUSTOM_PHASE_STRUCTURE_PROMPT } = require('../prompts/roadmap.prompts.js');

    const complementaryTechs = Array.isArray(complementaryTechsOverride)
      ? complementaryTechsOverride
      : [];
    const techList = complementaryTechs.slice(0, 3).join(', ') || skillName;

    const prompt = CUSTOM_PHASE_STRUCTURE_PROMPT.replace('{ROLE}', roleName)
      .replace('{SKILL}', skillName)
      .replace('{TECH_LIST}', techList)
      .replace('{TOTAL_HOURS}', String(totalHours))
      .replace('{DAILY_LEARNING_MINUTES}', String(dailyLearningMinutes));

    const responseText = await chatCompletion({
      prompt,
      temperature: 0.6,
      maxTokens: 2400,
    });

    const jsonStr = extractJsonObject(responseText);
    if (!jsonStr) {
      console.warn('⚠️ Failed to parse phase structure response');
      return null;
    }

    const phases = JSON.parse(jsonStr);
    if (!Array.isArray(phases) || phases.length < 3) {
      console.warn('⚠️ Invalid phase structure returned');
      return null;
    }

    return phases.slice(0, 4).map((phase, idx) => ({
      phaseNumber: idx + 1,
      phaseName: phase.phaseName || `Phase ${idx + 1} - ${skillName}`,
      goal: phase.goal || `Master ${skillName} progressively`,
      estimatedHours: Math.max(15, Math.min(40, phase.estimatedHours || 25)),
      topics: Array.isArray(phase.topics) ? phase.topics.slice(0, 8) : [],
      miniProject: phase.miniProject || `Build a ${skillName} project`,
    }));
  } catch (error) {
    console.warn('⚠️ Phase generation error:', error.message);
    return null;
  }
}

/**
 * Generates day-level content for a custom skill
 * Replaces static fallback content with dynamic Groq generation
 */
async function generateCustomDayContent({
  roleName,
  skillName,
  phaseName,
  dayNumber,
  totalDays,
  topic,
  dailyLearningMinutes,
}) {
  if (!groq) {
    return generateCustomDayContentFallback({
      roleName,
      skillName,
      phaseName,
      dayNumber,
      totalDays,
      topic,
      dailyLearningMinutes,
    });
  }

  try {
    const { CUSTOM_DAY_CONTENT_PROMPT } = require('../prompts/roadmap.prompts.js');

    const prompt = CUSTOM_DAY_CONTENT_PROMPT.replace('{ROLE}', roleName)
      .replace('{SKILL}', skillName)
      .replace('{PHASE}', phaseName)
      .replace('{DAY_NUMBER}', String(dayNumber))
      .replace('{TOTAL_DAYS}', String(totalDays))
      .replace('{TOPIC}', topic)
      .replace('{DAILY_MINUTES}', String(dailyLearningMinutes));

    const responseText = await chatCompletion({
      prompt,
      temperature: 0.6,
      maxTokens: 1200,
    });

    const jsonStr = extractJsonObject(responseText);
    if (!jsonStr) {
      console.warn('⚠️ Failed to parse custom day content response');
      return generateCustomDayContentFallback({
        roleName,
        skillName,
        phaseName,
        dayNumber,
        totalDays,
        topic,
        dailyLearningMinutes,
      });
    }

    const content = JSON.parse(jsonStr);
    return {
      learningObjectives: Array.isArray(content.learningObjectives)
        ? content.learningObjectives.slice(0, 5)
        : [],
      whyImportant: String(content.whyImportant || ''),
      practiceTask: content.practiceTask || {
        title: `${skillName}: ${topic}`,
        description: `Apply ${topic} in ${skillName}`,
        estimatedMinutes: dailyLearningMinutes,
      },
      resourceSuggestions: Array.isArray(content.resourceSuggestions)
        ? content.resourceSuggestions.slice(0, 4)
        : [],
      generatedAt: new Date(),
      generatedBy: 'groq',
      generationVersion: 1,
    };
  } catch (error) {
    console.warn('⚠️ Custom day content error:', error.message);
    return generateCustomDayContentFallback({
      roleName,
      skillName,
      phaseName,
      dayNumber,
      totalDays,
      topic,
      dailyLearningMinutes,
    });
  }
}

/**
 * Fallback for custom day content generation when Groq is unavailable
 */
function generateCustomDayContentFallback({
  roleName,
  skillName,
  phaseName,
  dayNumber,
  totalDays,
  topic,
  dailyLearningMinutes,
}) {
  const isEarlyDay = dayNumber <= 5;
  const isLateDay = dayNumber > totalDays - 5;

  let objectives = [];
  let practice = '';

  if (isEarlyDay) {
    objectives = [
      `Set up ${skillName} development environment and tooling`,
      `Understand ${topic} fundamentals in ${skillName} context`,
      `Write and run a simple ${skillName} example`,
    ];
    practice = `Set up a basic ${skillName} project with proper tooling and structure. Create a minimal working example demonstrating ${topic}.`;
  } else if (isLateDay) {
    objectives = [
      `Implement advanced ${topic} patterns in ${skillName}`,
      `Optimize and test ${topic} implementation`,
      `Document and deploy ${topic}-focused feature in ${skillName}`,
    ];
    practice = `Build a production-ready ${skillName} feature that applies ${topic}. Include testing, error handling, and deployment configuration.`;
  } else {
    objectives = [
      `Master ${topic} implementation techniques in ${skillName}`,
      `Build a feature using ${topic} concepts`,
      `Debug and optimize ${topic}-related code`,
    ];
    practice = `Implement a real feature in ${skillName} that uses ${topic}. Test the implementation and refactor for clarity.`;
  }

  return {
    learningObjectives: objectives,
    whyImportant: `${topic} is critical in ${skillName} development for ${roleName}s building production systems.`,
    practiceTask: {
      title: `${skillName}: ${topic}`,
      description: practice,
      estimatedMinutes: dailyLearningMinutes,
    },
    resourceSuggestions: [],
    generatedAt: new Date(),
    generatedBy: 'fallback',
    generationVersion: 1,
  };
}

module.exports = {
  generateWeeklyLearningPlan,
  generateTaskExplanation,
  validateWeeklyPlan,
  generateStructuredLearningResources,
  generateTaskWithRetry,
  generateDayLearningContent,
  isGroqQuotaExceededError,
  validateSkillRelevance,
  generateCustomPhaseStructure,
  generateCustomDayContent,
};

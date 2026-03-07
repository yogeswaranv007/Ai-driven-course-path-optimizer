/**
 * Gemini AI Service
 * Generates learning tasks, exercises, projects, and explanations
 * using Google's Generative AI (Gemini)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not set in environment. AI features will be unavailable.');
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Generate weekly learning tasks using Gemini
 * @param {Object} params
 * @param {string} params.jobRole - Target job role (e.g., "Full Stack Developer")
 * @param {string} params.track - Selected learning track (e.g., "MERN Stack")
 * @param {number} params.dailyHours - Daily learning time
 * @param {number} params.weeksRequired - Number of weeks in the plan
 * @param {Array<string>} params.weeklyTopics - Topics for each week
 * @returns {Promise<Object>} { plan: Structured weekly plan, isAiGenerated: boolean }
 */
async function generateWeeklyLearningPlan({
  jobRole,
  track,
  dailyHours,
  weeksRequired,
  weeklyTopics,
}) {
  if (!genAI) {
    console.warn('⚠️ Gemini API not configured. Using role-specific fallback plan.');
    return {
      plan: generateRoleSpecificFallbackPlan(jobRole, weeklyTopics, weeksRequired),
      isAiGenerated: false,
    };
  }

  try {
    // Use gemini-2.0-flash (available with this API key)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const prompt = buildWeeklyPlanPrompt({
      jobRole,
      track,
      dailyHours,
      weeksRequired,
      weeklyTopics,
    });

    const result = await model.generateContent(prompt);

    if (!result || !result.response || !result.response.text) {
      console.warn('⚠️ Invalid Gemini response structure. Using fallback.');
      return {
        plan: generateFallbackPlan(weeklyTopics, weeksRequired),
        isAiGenerated: false,
      };
    }

    const responseText = result.response.text();

    // Parse JSON from Gemini response - look for structured JSON first
    let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      jsonMatch = responseText.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
      console.warn('⚠️ Failed to parse Gemini JSON response. Using fallback.');
      return {
        plan: generateFallbackPlan(weeklyTopics, weeksRequired),
        isAiGenerated: false,
      };
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    const weeklyPlan = JSON.parse(jsonString);
    const validated = validateWeeklyPlan(weeklyPlan, weeksRequired);
    return {
      plan: validated,
      isAiGenerated: true,
    };
  } catch (error) {
    // Only log detailed errors in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Gemini API error:', error.message);
      // Log the full error for debugging
      if (error.response?.status) {
        console.error(`   Status: ${error.response.status}`);
      }
      if (error.status) {
        console.error(`   API Status: ${error.status}`);
      }
    }
    if (process.env.LOG_LEVEL === 'verbose') {
      console.warn('⚠️ Falling back to role-specific structured plan without AI enrichment.');
    }
    // Return fallback - do NOT rethrow to allow roadmap creation
    return {
      plan: generateRoleSpecificFallbackPlan(jobRole, weeklyTopics, weeksRequired),
      isAiGenerated: false,
    };
  }
}

/**
 * Generate explanation for why a specific task/skill is important
 * @param {string} skillName - Name of the skill
 * @param {string} jobRole - Target job role
 * @returns {Promise<string>} AI-generated explanation
 */
async function generateTaskExplanation(skillName, jobRole) {
  if (!genAI) {
    return `${skillName} is an essential skill for becoming a ${jobRole}.`;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 256,
      },
    });

    const prompt = `Explain in 1-2 sentences why "${skillName}" is important for a "${jobRole}". Be concise, practical, and motivating.`;

    const result = await model.generateContent(prompt);

    if (!result || !result.response || !result.response.text) {
      console.warn(`⚠️ Invalid response for explanation: ${skillName}`);
      return `${skillName} is essential for ${jobRole}.`;
    }

    return result.response.text().trim();
  } catch (error) {
    console.error('⚠️ Gemini explanation error:', error.message);
    return `${skillName} is essential for ${jobRole}.`;
  }
}

/**
 * Build the prompt for Gemini to generate weekly learning plan
 */
function buildWeeklyPlanPrompt({ jobRole, track, dailyHours, weeksRequired, weeklyTopics }) {
  const topicsStr = weeklyTopics.map((t, i) => `Week ${i + 1}: ${t}`).join('\n');

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

/**
 * Validate and normalize Gemini response
 */
function validateWeeklyPlan(plan, expectedWeeks) {
  if (!plan.weeks || !Array.isArray(plan.weeks)) {
    throw new Error('Invalid plan structure: missing weeks array');
  }

  // Ensure we have the expected number of weeks
  const weeks = plan.weeks.slice(0, expectedWeeks);

  if (weeks.length < expectedWeeks) {
    // Pad with empty weeks if needed
    for (let i = weeks.length; i < expectedWeeks; i++) {
      weeks.push({
        weekNumber: i + 1,
        topic: `Week ${i + 1} Topics`,
        tasks: [],
        exercises: [],
        project: null,
        why: '',
      });
    }
  }

  // Normalize each week
  return {
    weeks: weeks.map((week, idx) => ({
      weekNumber: week.weekNumber || idx + 1,
      topic: week.topic || `Week ${idx + 1}`,
      tasks: (week.tasks || []).map((task) => ({
        title: task.title || '',
        description: task.description || '',
        durationMinutes: Math.max(30, task.durationMinutes || 60),
        difficulty: task.difficulty || 'intermediate',
      })),
      exercises: (week.exercises || []).map((ex) => ({
        title: ex.title || '',
        description: ex.description || '',
        durationMinutes: Math.max(30, ex.durationMinutes || 60),
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

/**
 * Fallback plan when Gemini is unavailable
 */
/**
 * Generate role-specific static fallback plan with comprehensive data
 * @param {string} jobRole - Target job role
 * @param {Array<string>} weeklyTopics - Topics for each week
 * @param {number} weeksRequired - Number of weeks
 * @returns {Object} Structured weekly plan with role-specific content
 */
function generateRoleSpecificFallbackPlan(jobRole, weeklyTopics, weeksRequired) {
  const roleData = getRoleSpecificData(jobRole);
  const weeks = [];

  for (let i = 0; i < weeksRequired; i++) {
    const topic = weeklyTopics[i] || `Week ${i + 1} Topics`;
    const weekData = roleData[i] || roleData.default;

    weeks.push({
      weekNumber: i + 1,
      topic,
      tasks: weekData.tasks.map((task) => ({
        ...task,
        title: task.title.replace('{topic}', topic),
      })),
      exercises: weekData.exercises.map((ex) => ({
        ...ex,
        title: ex.title.replace('{topic}', topic),
      })),
      project: {
        ...weekData.project,
        title: weekData.project.title.replace('{topic}', topic),
        description: weekData.project.description.replace('{topic}', topic),
      },
      why: weekData.why.replace('{topic}', topic),
    });
  }

  return { weeks };
}

/**
 * Get role-specific static learning data
 */
function getRoleSpecificData(jobRole) {
  const roleKey = jobRole.toLowerCase().replace(/\s+/g, '-');

  const roleDataMap = {
    'frontend-developer': {
      default: {
        tasks: [
          {
            title: 'Master HTML5 Semantic Elements',
            description:
              'Learn modern HTML5 structure, accessibility features, and semantic tags for better SEO.',
            durationMinutes: 90,
            difficulty: 'beginner',
          },
          {
            title: 'CSS Flexbox & Grid Layouts',
            description:
              'Build responsive layouts using Flexbox and CSS Grid for modern web design.',
            durationMinutes: 120,
            difficulty: 'intermediate',
          },
          {
            title: 'JavaScript DOM Manipulation',
            description: 'Practice selecting, creating, and modifying DOM elements dynamically.',
            durationMinutes: 100,
            difficulty: 'intermediate',
          },
        ],
        exercises: [
          {
            title: 'Build a Responsive Navigation Bar',
            description:
              'Create a mobile-friendly navigation with hamburger menu using HTML, CSS, and JavaScript.',
            durationMinutes: 90,
          },
          {
            title: 'Interactive Form Validation',
            description: 'Implement client-side form validation with real-time feedback.',
            durationMinutes: 60,
          },
        ],
        project: {
          title: 'Personal Portfolio Website',
          description:
            'Design and build a fully responsive portfolio showcasing your projects with smooth animations.',
          durationMinutes: 180,
        },
        why: 'Frontend fundamentals form the foundation of user interface development. Mastering HTML, CSS, and JavaScript enables you to create engaging, accessible web experiences.',
      },
    },

    'backend-developer': {
      default: {
        tasks: [
          {
            title: 'Node.js Core Modules & NPM',
            description: 'Understand fs, path, http modules and package management with npm.',
            durationMinutes: 100,
            difficulty: 'intermediate',
          },
          {
            title: 'Express.js RESTful API Design',
            description: 'Build REST APIs with proper routing, middleware, and error handling.',
            durationMinutes: 130,
            difficulty: 'intermediate',
          },
          {
            title: 'MongoDB CRUD Operations',
            description: 'Master Create, Read, Update, Delete operations with Mongoose ODM.',
            durationMinutes: 110,
            difficulty: 'intermediate',
          },
        ],
        exercises: [
          {
            title: 'Create Authentication Middleware',
            description: 'Implement JWT-based authentication with access and refresh tokens.',
            durationMinutes: 90,
          },
          {
            title: 'Database Schema Design',
            description: 'Design normalized schemas with relationships for a blog system.',
            durationMinutes: 70,
          },
        ],
        project: {
          title: 'Task Management REST API',
          description:
            'Build a complete task management API with authentication, CRUD operations, and MongoDB integration.',
          durationMinutes: 200,
        },
        why: 'Backend development powers the logic and data management of applications. These skills enable you to build scalable, secure server-side systems.',
      },
    },

    'full-stack-developer': {
      default: {
        tasks: [
          {
            title: 'React Component Architecture',
            description: 'Learn functional components, hooks, and component composition patterns.',
            durationMinutes: 110,
            difficulty: 'intermediate',
          },
          {
            title: 'Node.js + Express Backend Setup',
            description: 'Set up Express server with middleware, routing, and database connection.',
            durationMinutes: 100,
            difficulty: 'intermediate',
          },
          {
            title: 'RESTful API Integration',
            description:
              'Connect React frontend to Express backend using axios and handle async operations.',
            durationMinutes: 120,
            difficulty: 'intermediate',
          },
        ],
        exercises: [
          {
            title: 'Build CRUD Application Flow',
            description:
              'Implement complete Create-Read-Update-Delete flow from frontend to database.',
            durationMinutes: 100,
          },
          {
            title: 'State Management with Context',
            description: 'Manage global application state using React Context API.',
            durationMinutes: 80,
          },
        ],
        project: {
          title: 'Full-Stack E-commerce App',
          description:
            'Build a complete e-commerce platform with product catalog, cart, and checkout using MERN stack.',
          durationMinutes: 240,
        },
        why: 'Full-stack development combines frontend and backend skills, making you versatile and capable of building complete applications independently.',
      },
    },

    'react-developer': {
      default: {
        tasks: [
          {
            title: 'React Hooks Deep Dive',
            description:
              'Master useState, useEffect, useContext, useMemo, useCallback, and custom hooks.',
            durationMinutes: 100,
            difficulty: 'intermediate',
          },
          {
            title: 'State Management Patterns',
            description: 'Learn Redux Toolkit, Zustand, or Jotai for complex state management.',
            durationMinutes: 120,
            difficulty: 'advanced',
          },
          {
            title: 'React Performance Optimization',
            description: 'Optimize rendering with React.memo, lazy loading, and code splitting.',
            durationMinutes: 90,
            difficulty: 'advanced',
          },
        ],
        exercises: [
          {
            title: 'Custom Hook Creation',
            description:
              'Build reusable custom hooks for data fetching, form handling, and local storage.',
            durationMinutes: 80,
          },
          {
            title: 'Testing React Components',
            description: 'Write unit tests using React Testing Library and Jest.',
            durationMinutes: 90,
          },
        ],
        project: {
          title: 'Real-time Dashboard with React',
          description:
            'Create an interactive dashboard with charts, filters, and real-time data updates using React and WebSockets.',
          durationMinutes: 200,
        },
        why: 'React specialization makes you an expert in building modern, performant user interfaces. These advanced skills are highly valued in the job market.',
      },
    },

    'node.js-developer': {
      default: {
        tasks: [
          {
            title: 'Async JavaScript & Promises',
            description:
              'Master callbacks, promises, async/await, and error handling in asynchronous code.',
            durationMinutes: 100,
            difficulty: 'intermediate',
          },
          {
            title: 'Express.js Advanced Middleware',
            description:
              'Create custom middleware for logging, authentication, rate limiting, and validation.',
            durationMinutes: 110,
            difficulty: 'advanced',
          },
          {
            title: 'Database Optimization & Indexing',
            description:
              'Optimize MongoDB queries with indexes, aggregation pipelines, and performance tuning.',
            durationMinutes: 120,
            difficulty: 'advanced',
          },
        ],
        exercises: [
          {
            title: 'Build Microservices Architecture',
            description:
              'Design and implement microservices communication using REST and message queues.',
            durationMinutes: 100,
          },
          {
            title: 'WebSocket Real-time Features',
            description: 'Implement real-time chat or notifications using Socket.IO.',
            durationMinutes: 90,
          },
        ],
        project: {
          title: 'Scalable Node.js API Gateway',
          description:
            'Build an API gateway with rate limiting, caching, load balancing, and service orchestration.',
          durationMinutes: 220,
        },
        why: 'Node.js specialization enables you to build high-performance, scalable backend systems. These skills are essential for modern server-side development.',
      },
    },
  };

  return roleDataMap[roleKey] || roleDataMap['full-stack-developer'];
}

/**
 * Generate generic fallback plan (kept for backward compatibility)
 */
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

/**
 * ========== ADVANCED GEMINI CONTENT GENERATION ==========
 * Best practices for structured AI content generation
 */

/**
 * Generate structured learning resources with guaranteed JSON output
 * @param {Object} params
 * @param {string} params.skill - The skill to generate resources for
 * @param {string} params.level - Experience level (beginner, intermediate, advanced)
 * @param {number} params.durationMinutes - How long to spend on this
 * @returns {Promise<Object>} Structured learning resources
 */
async function generateStructuredLearningResources({ skill, level, durationMinutes }) {
  if (!genAI) {
    return {
      skill,
      level,
      resources: [
        { type: 'documentation', title: `${skill} Official Docs`, url: '#' },
        { type: 'tutorial', title: `Learn ${skill}`, url: '#' },
      ],
      goals: [`Understand ${skill} fundamentals`, `Practice ${skill}`],
      tips: [`Study the official documentation`, `Practice with real examples`],
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.5, // Lower temperature for consistency
        maxOutputTokens: 1024,
        responseMimeType: 'application/json', // Force JSON response
      },
    });

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

    const result = await model.generateContent(prompt);

    if (!result || !result.response || !result.response.text) {
      console.warn(`⚠️ Invalid Gemini response for resources: ${skill}`);
      return {
        skill,
        level,
        resources: [],
        goals: [],
        tips: ['Study official documentation', 'Practice regularly'],
      };
    }

    const responseText = result.response.text();

    // Try to parse JSON
    try {
      // If using responseMimeType: 'application/json', response is already JSON string
      const resources = JSON.parse(responseText);
      return resources;
    } catch (parseError) {
      console.warn(`⚠️ Failed to parse resources JSON for ${skill}`, parseError.message);
      return {
        skill,
        level,
        resources: [],
        goals: [],
        tips: [],
      };
    }
  } catch (error) {
    console.error(`❌ Error generating resources for ${skill}:`, error.message);
    return {
      skill,
      level,
      resources: [],
      goals: [],
      tips: [],
    };
  }
}

/**
 * Generate task with error handling and retry logic
 * @param {Object} params
 * @param {string} params.skillName - Skill name
 * @param {string} params.jobRole - Target role
 * @param {number} params.maxRetries - Number of retries (default: 2)
 * @returns {Promise<Object>} Structured task object
 */
async function generateTaskWithRetry({ skillName, jobRole, maxRetries = 2 }) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!genAI) {
        return {
          title: `Learn ${skillName}`,
          description: `Master the fundamentals of ${skillName}`,
          difficulty: 'intermediate',
          durationMinutes: 120,
        };
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      });

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

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${skillName}:`, error.message);

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed, log and return fallback
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

module.exports = {
  generateWeeklyLearningPlan,
  generateTaskExplanation,
  validateWeeklyPlan,
  generateStructuredLearningResources,
  generateTaskWithRetry,
};

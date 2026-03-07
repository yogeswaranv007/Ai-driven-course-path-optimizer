/**
 * GEMINI API - PRACTICAL CODE EXAMPLES
 * Complete working examples for Node.js backend
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// ============================================================================
// EXAMPLE 1: Generate Structured Learning Plan (CORRECT WAY)
// ============================================================================

async function generateWeeklyLearningPlan() {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      generationConfig: {
        temperature: 0.5, // Lower temperature = consistent structure
        maxOutputTokens: 2048,
        responseMimeType: 'application/json', // Force JSON output
      },
    });

    const prompt = `
You are a master curriculum designer for JavaScript developers.

Create a detailed 4-week learning plan for someone learning React and Node.js.
- Daily learning time: 2 hours per day
- Focus: Full Stack JavaScript Development

Return a JSON object with EXACTLY this structure (no markdown, no code blocks):
{
  "title": "4-Week React & Node.js Masterclass",
  "weeksRequired": 4,
  "totalHours": 56,
  "weeks": [
    {
      "weekNumber": 1,
      "topic": "React Fundamentals",
      "learningGoals": [
        "Understand JSX and components",
        "Learn state and props",
        "Master hooks (useState, useEffect)"
      ],
      "dailyTasks": [
        {
          "day": "Monday",
          "title": "JSX Basics and Components",
          "description": "Learn the fundamentals of JSX syntax and functional components",
          "durationMinutes": 120,
          "difficulty": "beginner"
        }
      ],
      "exercises": [
        {
          "title": "Build a Counter Component",
          "description": "Create a React component that increments and decrements a counter",
          "durationMinutes": 90
        }
      ],
      "whyThisWeek": "React components are the foundation of modern web development. Understanding JSX and state management is essential."
    }
  ]
}

Be specific. Each week should be progressively harder. Make exercises hands-on and actionable.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Since we used responseMimeType: 'application/json', response is valid JSON
    const learningPlan = JSON.parse(responseText);

    console.log('✅ Generated Learning Plan:');
    console.log(JSON.stringify(learningPlan, null, 2));

    return learningPlan;
  } catch (error) {
    console.error('❌ Error generating learning plan:', error.message);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Generate Task Explanations with Error Handling
// ============================================================================

async function generateTaskDescription(skillName, duration = 120) {
  let retries = 3;
  let lastError = null;

  while (retries > 0) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash-latest',
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
Generate a specific, actionable learning task for: "${skillName}"
Duration: ${duration} minutes

Return JSON (no markdown):
{
  "title": "specific task title",
  "description": "what to learn",
  "objectives": ["objective 1", "objective 2"],
  "subtasks": [
    {
      "step": 1,
      "title": "subtitle",
      "description": "what to do",
      "timeMinutes": 30
    }
  ],
  "resources": [
    {"type": "documentation", "title": "title", "url": "example.com"},
    {"type": "video", "title": "title", "url": "youtube.com"}
  ],
  "difficulty": "beginner",
  "tips": ["tip 1", "tip 2"]
}

Make it specific to ${skillName}. Use real frameworks and tools.
`;

      const result = await model.generateContent(prompt);

      if (!result?.response?.text) {
        throw new Error('Invalid API response');
      }

      const task = JSON.parse(result.response.text());
      console.log(`✅ Task for ${skillName}:`, task);
      return task;
    } catch (error) {
      lastError = error;
      retries--;
      console.warn(`⚠️  Attempt failed (${4 - retries}/3): ${error.message}`);

      if (retries > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const waitTime = 1000 * Math.pow(2, 3 - retries);
        console.log(`   Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  console.error(`❌ Failed to generate task after 3 retries:`, lastError?.message);

  // Return fallback
  return {
    title: `Learn ${skillName}`,
    description: `Master ${skillName} fundamentals`,
    difficulty: 'intermediate',
    timeMinutes: duration,
    resources: [],
  };
}

// ============================================================================
// EXAMPLE 3: Batch Generate Multiple Tasks (Efficient)
// ============================================================================

async function batchGenerateTasks(skills) {
  /**
   * Example: skills = [
   *   { name: 'React', level: 'beginner' },
   *   { name: 'Node.js', level: 'intermediate' },
   *   { name: 'MongoDB', level: 'beginner' }
   * ]
   */

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 3000,
      responseMimeType: 'application/json',
    },
  });

  const skillsList = skills.map((s) => `- ${s.name} (${s.level})`).join('\n');

  const prompt = `
Generate a learning task for EACH of these skills:
${skillsList}

Return a JSON array with one task per skill:
{
  "tasks": [
    {
      "skill": "skill name",
      "title": "task title",
      "description": "task description",
      "duration": 120,
      "difficulty": "beginner|intermediate|advanced",
      "resources": ["resource 1", "resource 2"]
    }
  ]
}

Make each task relevant to the specified skill level.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());

    console.log('✅ Batch tasks generated:', response);
    return response.tasks;
  } catch (error) {
    console.error('❌ Batch generation failed:', error.message);
    return [];
  }
}

// ============================================================================
// EXAMPLE 4: Generate Roadmap with Frontend Developer Track
// ============================================================================

async function generateRoadmapForFrontendDeveloper() {
  try {
    // This now works because we added frontend-developer track!
    const roadmapData = {
      roleName: 'Frontend Developer',
      dailyLearningMinutes: 120,
      skillSource: 'custom',
      skills: [
        { name: 'JavaScript', level: 'intermediate' },
        { name: 'React', level: 'beginner' },
        { name: 'CSS', level: 'intermediate' },
      ],
    };

    console.log('📋 Generating roadmap for:', roadmapData.roleName);

    // Call your backend endpoint
    const response = await fetch('http://localhost:5000/roadmaps/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
      body: JSON.stringify(roadmapData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ Roadmap created:', result.roadmap._id);
    console.log('   Weeks:', result.roadmap.weeks.length);
    console.log('   Total Hours:', result.roadmap.estimatedTotalHours);

    return result.roadmap;
  } catch (error) {
    console.error('❌ Roadmap generation failed:', error.message);
  }
}

// ============================================================================
// EXAMPLE 5: Error Handling Best Practices
// ============================================================================

async function generateWithRobustErrorHandling(skill) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Generate a learning task for: ${skill}. Return JSON.`;

  try {
    // Attempt 1: Try with full features
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000) // 10s timeout
      ),
    ]);

    // Validate response
    if (!result?.response) {
      throw new Error('No response from API');
    }

    if (!result.response.text) {
      throw new Error('Empty response text');
    }

    const text = result.response.text();

    // Validate JSON
    if (!text.includes('{')) {
      throw new Error('Response is not JSON format');
    }

    // Parse JSON
    const data = JSON.parse(text);

    if (!data.title || !data.description) {
      throw new Error('Missing required fields in response');
    }

    console.log('✅ Successfully generated:', data.title);
    return data;
  } catch (error) {
    // Categorize error and handle appropriately
    if (error.message.includes('Timeout')) {
      console.error('⏱️  Request timeout - API is slow');
      // Fallback or queue for retry
    } else if (error.message.includes('401')) {
      console.error('🔐 Invalid API key');
      // Don't retry, fix API key
    } else if (error.message.includes('429')) {
      console.error('⚠️  Rate limited - waiting before retry');
      // Implement exponential backoff
    } else if (error.message.includes('JSON')) {
      console.error('📄 Response was not JSON');
      // Model may have added markdown wrappers
    } else {
      console.error('❌ Unexpected error:', error.message);
    }

    // Return safe fallback
    return {
      title: `Learn ${skill}`,
      description: `Master ${skill} fundamentals`,
      difficulty: 'intermediate',
      duration: 120,
    };
  }
}

// ============================================================================
// EXAMPLE 6: Production-Ready Configuration
// ============================================================================

class GeminiRoadmapService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = 'gemini-1.5-flash-latest';
    this.config = {
      forStructured: {
        temperature: 0.5,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        topK: 40,
        topP: 0.95,
      },
      forExplanations: {
        temperature: 0.7,
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
      },
      forDeterministic: {
        temperature: 0.2,
        maxOutputTokens: 256,
      },
    };
  }

  /**
   * Generate with automatic caching and retry
   */
  async generateCached(prompt, cacheKey, maxAge = 24 * 60 * 60) {
    // Check cache first (implement your own cache - Redis, memcached, etc.)
    const cached = await this.getFromCache(cacheKey);
    if (cached && Date.now() - cached.timestamp < maxAge * 1000) {
      console.log(`📦 Cache hit for: ${cacheKey}`);
      return cached.data;
    }

    // Generate new
    const data = await this.generateWithRetry(prompt, 3);

    // Store in cache
    await this.storeInCache(cacheKey, data);
    return data;
  }

  /**
   * Generate with built-in retry logic
   */
  async generateWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: this.config.forStructured,
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return JSON.parse(text);
      } catch (error) {
        console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt === maxRetries) {
          console.error(`All ${maxRetries} attempts failed`);
          throw error;
        }

        // Exponential backoff
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async getFromCache(key) {
    // TODO: Implement your cache backend
    return null;
  }

  async storeInCache(key, data) {
    // TODO: Implement your cache backend
  }
}

// ============================================================================
// USAGE IN YOUR EXPRESS ROUTES
// ============================================================================

/*
// In your Express router:
router.post('/roadmaps/generate', async (req, res, next) => {
  try {
    const { roleName, dailyLearningMinutes, skillSource, skills } = req.body;
    const userId = req.user._id;

    // Validate
    if (!roleName) {
      return res.status(400).json({ error: 'roleName required' });
    }

    // Generate roadmap
    const roadmap = await roadmapGenerationService.generateRoadmapInstance(userId, {
      roleName,
      dailyLearningMinutes,
      skillSource,
      skills,
    });

    // Now with correct Gemini model and frontend-developer track support!
    res.status(201).json({
      message: 'Roadmap generated successfully',
      roadmap: {
        _id: roadmap._id,
        roleName: roadmap.roleName,
        weeks: roadmap.weeks,
        status: 'active',
        estimatedCompletionDays: roadmap.estimatedCompletionDays,
      }
    });
  } catch (error) {
    console.error('Generation error:', error);
    next(error);
  }
});
*/

// ============================================================================
// TESTING
// ============================================================================

async function runExamples() {
  console.log('🚀 Running Gemini Examples...\n');

  try {
    // Example 1: Generate learning plan
    console.log('--- Example 1: Learning Plan ---');
    await generateWeeklyLearningPlan();

    // Example 2: Single task
    console.log('\n--- Example 2: Single Task ---');
    await generateTaskDescription('React Hooks');

    // Example 3: Batch tasks
    console.log('\n--- Example 3: Batch Tasks ---');
    await batchGenerateTasks([
      { name: 'React', level: 'beginner' },
      { name: 'Node.js', level: 'intermediate' },
      { name: 'MongoDB', level: 'beginner' },
    ]);

    // Example 5: Error handling
    console.log('\n--- Example 5: Error Handling ---');
    await generateWithRobustErrorHandling('TypeScript');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export for use in your services
module.exports = {
  generateWeeklyLearningPlan,
  generateTaskDescription,
  batchGenerateTasks,
  generateRoadmapForFrontendDeveloper,
  generateWithRobustErrorHandling,
  GeminiRoadmapService,
  runExamples,
};

// Run if executed directly
if (require.main === module) {
  runExamples();
}

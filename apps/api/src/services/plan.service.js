const { learningPlanRepository } = require('../repositories/learningPlan.repository.js');
const { generateRoadmap } = require('./roadmap.service.js');
const { clampToMinimumHours, computeDailyHoursMode } = require('./planningModes.service.js');
const { generateWeeklyLearningPlan } = require('./gemini.service.js');

/**
 * Mock data for track templates and skills
 * TODO: Replace with actual database models in production
 */
function getMockTracksAndSkills() {
  const mernTrack = {
    id: 'mern-full-stack',
    trackId: 'mern-full-stack',
    name: 'MERN Full Stack Developer',
    roleId: 'full-stack-developer',
    minimumHours: 150,
    averageHours: 195,
    marketDemandScore: 0.95,
    ecosystemScore: 0.9,
    salaryScore: 0.85,
    futureProofScore: 0.8,
    easeOfLearningScore: 0.6,
  };

  const mernTemplate = {
    nodes: [
      {
        nodeId: 'js-basics',
        skillId: 'javascript-basics',
        skillName: 'JavaScript Basics',
        milestoneId: 'milestone-1-foundations',
        estimatedHours: 40,
        priority: 'mandatory',
        prerequisites: [],
      },
      {
        nodeId: 'react-basics',
        skillId: 'react',
        skillName: 'React Fundamentals',
        milestoneId: 'milestone-1-foundations',
        estimatedHours: 30,
        priority: 'mandatory',
        prerequisites: ['js-basics'],
      },
      {
        nodeId: 'node-backend',
        skillId: 'nodejs',
        skillName: 'Node.js & Express',
        milestoneId: 'milestone-2-backend',
        estimatedHours: 50,
        priority: 'mandatory',
        prerequisites: ['js-basics'],
      },
      {
        nodeId: 'mongodb',
        skillId: 'mongodb',
        skillName: 'MongoDB & Mongoose',
        milestoneId: 'milestone-2-backend',
        estimatedHours: 35,
        priority: 'mandatory',
        prerequisites: ['node-backend'],
      },
      {
        nodeId: 'integration',
        skillId: 'mern-integration',
        skillName: 'Full Stack Integration',
        milestoneId: 'milestone-3-fullstack',
        estimatedHours: 40,
        priority: 'mandatory',
        prerequisites: ['react-basics', 'mongodb'],
      },
    ],
    milestones: [
      {
        milestoneId: 'milestone-1-foundations',
        name: 'JavaScript & Frontend Foundations',
        description: 'Master JavaScript and React basics',
      },
      {
        milestoneId: 'milestone-2-backend',
        name: 'Backend Development',
        description: 'Build server-side applications with Node.js and MongoDB',
      },
      {
        milestoneId: 'milestone-3-fullstack',
        name: 'Full Stack Integration',
        description: 'Integrate frontend and backend into complete applications',
      },
    ],
  };

  const skillsById = {
    'javascript-basics': {
      skillId: 'javascript-basics',
      name: 'JavaScript Basics',
      proficiencyLevels: { none: 1.0, basic: 0.4, intermediate: 0.2, advanced: 0.05 },
    },
    react: {
      skillId: 'react',
      name: 'React',
      proficiencyLevels: { none: 1.0, basic: 0.4, intermediate: 0.2, advanced: 0.05 },
    },
    nodejs: {
      skillId: 'nodejs',
      name: 'Node.js',
      proficiencyLevels: { none: 1.0, basic: 0.4, intermediate: 0.2, advanced: 0.05 },
    },
    mongodb: {
      skillId: 'mongodb',
      name: 'MongoDB',
      proficiencyLevels: { none: 1.0, basic: 0.4, intermediate: 0.2, advanced: 0.05 },
    },
    'mern-integration': {
      skillId: 'mern-integration',
      name: 'MERN Integration',
      proficiencyLevels: { none: 1.0, basic: 0.4, intermediate: 0.2, advanced: 0.05 },
    },
  };

  return { tracks: [mernTrack], templates: { [mernTrack.id]: mernTemplate }, skillsById };
}

/**
 * Convert user skills input to proficiency map
 */
function convertSkillsToProficiency(skills) {
  const proficiencyMap = {
    0: 'none',
    1: 'none',
    2: 'basic',
    3: 'intermediate',
    4: 'intermediate',
    5: 'advanced',
  };

  const result = {};
  for (const skill of skills) {
    const skillKey = skill.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    result[skillKey] = proficiencyMap[skill.level] || 'none';
  }
  return result;
}

/**
 * Transform roadmap to weeks format for backward compatibility
 */
/**
 * Transform roadmap nodes into a week/day/task structure respecting daily learning limits.
 *
 * @param {Object} roadmap - Roadmap with nodes containing adjustedHours
 * @param {number} hoursPerDay - Daily learning hours (default 4)
 * @returns {Array<Object>} Weeks array with structure: { weekNumber, days: [{ dayNumber, tasks: [...] }] }
 */
function transformRoadmapToWeeks(roadmap, hoursPerDay = 4) {
  const dailyMinutes = Math.round(hoursPerDay * 60);
  const regularNodes = roadmap.nodes.filter((n) => n.nodeId !== 'buffer-node');

  if (regularNodes.length === 0) {
    return [];
  }

  // Calculate total learning time required
  const totalMinutes = regularNodes.reduce(
    (sum, node) => sum + Math.ceil(node.adjustedHours * 60),
    0
  );
  const totalDaysRequired = Math.ceil(totalMinutes / dailyMinutes);
  const totalWeeksRequired = Math.ceil(totalDaysRequired / 7);

  // Distribute tasks across days respecting daily minute limits
  const days = [];
  let currentDayNumber = 1;
  let nodeIndex = 0;
  let nodeRemainingMinutes = Math.ceil(regularNodes[0].adjustedHours * 60);

  while (nodeIndex < regularNodes.length && currentDayNumber <= totalDaysRequired) {
    const dayTasks = [];
    let dayMinutesUsed = 0;

    // Fill day with tasks up to dailyMinutes limit
    while (dayMinutesUsed < dailyMinutes && nodeIndex < regularNodes.length) {
      const currentNode = regularNodes[nodeIndex];
      const minutesAvailableInDay = dailyMinutes - dayMinutesUsed;

      if (nodeRemainingMinutes <= minutesAvailableInDay) {
        // Node fits completely in this day
        dayTasks.push({
          taskKey: `day${currentDayNumber}-${currentNode.nodeId}`,
          title: `Study ${currentNode.skillName}`,
          topic: currentNode.skillName,
          type: 'study',
          durationMinutes: nodeRemainingMinutes,
          reason: `${currentNode.skillName} is a ${currentNode.priority === 'mandatory' ? 'mandatory' : 'key'} skill for your learning path. This builds your technical foundation and is essential for advancing to more complex topics.`,
          resourceLinks: [],
          status: 'pending',
        });

        dayMinutesUsed += nodeRemainingMinutes;
        nodeIndex += 1;

        // Prepare next node's duration
        if (nodeIndex < regularNodes.length) {
          nodeRemainingMinutes = Math.ceil(regularNodes[nodeIndex].adjustedHours * 60);
        }
      } else {
        // Node needs to be split across days
        dayTasks.push({
          taskKey: `day${currentDayNumber}-${currentNode.nodeId}-part${Math.ceil((regularNodes[nodeIndex].adjustedHours * 60 - nodeRemainingMinutes + minutesAvailableInDay) / minutesAvailableInDay)}`,
          title: `Study ${currentNode.skillName} (Part ${Math.ceil((regularNodes[nodeIndex].adjustedHours * 60 - nodeRemainingMinutes + minutesAvailableInDay) / minutesAvailableInDay)})`,
          topic: currentNode.skillName,
          type: 'study',
          durationMinutes: minutesAvailableInDay,
          reason: `${currentNode.skillName} is a ${currentNode.priority === 'mandatory' ? 'mandatory' : 'key'} skill for your learning path. This builds your technical foundation and is essential for advancing to more complex topics.`,
          resourceLinks: [],
          status: 'pending',
        });

        nodeRemainingMinutes -= minutesAvailableInDay;
        dayMinutesUsed = dailyMinutes;
      }
    }

    // Only add day if it has tasks
    if (dayTasks.length > 0) {
      days.push({
        dayNumber: currentDayNumber,
        tasks: dayTasks,
      });
    }

    currentDayNumber += 1;
  }

  // Group days into weeks (7 days per week)
  const weeks = [];
  for (let week = 1; week <= totalWeeksRequired; week++) {
    const startDayIdx = (week - 1) * 7;
    const endDayIdx = Math.min(startDayIdx + 7, days.length);
    const weekDays = days.slice(startDayIdx, endDayIdx);

    weeks.push({
      weekNumber: week,
      days: weekDays,
    });
  }

  return weeks;
}

/**
 * Generate skill gaps from roadmap nodes
 */
function generateSkillGaps(nodes, userSkills) {
  const gaps = [];
  const regularNodes = nodes.filter((n) => n.nodeId !== 'buffer-node');

  for (const node of regularNodes) {
    if (node.proficiencyLevel === 'none' || node.proficiencyLevel === 'basic') {
      gaps.push({
        topic: node.skillName,
        category: 'Technical',
        currentLevel: node.proficiencyLevel === 'none' ? 0 : 2,
        requiredLevel: 5,
        scorePercent: 50,
        gapScore: node.proficiencyLevel === 'none' ? 5 : 3,
      });
    }
  }

  return gaps;
}

const planService = {
  /**
   * Generate a learning plan based on daily learning hours.
   *
   * Workflow:
   * 1. Validate user inputs (skills, daily hours, job role)
   * 2. Select best track for target job role
   * 3. Generate roadmap with skill gaps
   * 4. Transform to weekly schedule respecting daily hours limit
   * 5. Call Gemini AI to generate tasks, exercises, projects per week
   * 6. Save complete plan with AI-enriched content
   *
   * @param {Object} user - User object from auth
   * @param {Object} options - Generation options
   * @param {Array<Object>} options.skills - User's current skills
   * @param {number} options.hoursPerDay - Available learning hours per day (1-10)
   * @param {string} options.jobRole - Target job role (e.g., "Full Stack Developer")
   * @returns {Promise<{plan, skillGaps, planMetadata}>}
   */
  async generatePlan(user, { skills, hoursPerDay = null, jobRole = null }) {
    // Deactivate old active plans
    await learningPlanRepository.deactivateOldPlans(user._id);

    // Get mock data (TODO: Replace with actual DB queries)
    const { tracks, templates, skillsById } = getMockTracksAndSkills();

    // Convert skills to proficiency format
    const userSkills = convertSkillsToProficiency(skills);

    // STEP 1: Strict numeric validation and normalization
    let effectiveHoursPerDay = hoursPerDay;
    let planningParams = {};

    // === STRICT NUMERIC NORMALIZATION ===
    // Convert to numbers and validate BEFORE any math operations
    if (effectiveHoursPerDay !== null && effectiveHoursPerDay !== undefined) {
      effectiveHoursPerDay = Number(effectiveHoursPerDay);
      if (!Number.isFinite(effectiveHoursPerDay)) {
        const error = new Error('VALIDATION_ERROR');
        error.statusCode = 400;
        error.details = {
          error: 'VALIDATION_ERROR',
          message: 'hoursPerDay must be a valid finite number',
          field: 'hoursPerDay',
          receivedValue: hoursPerDay,
          receivedType: typeof hoursPerDay,
        };
        throw error;
      }
    }

    // Validate hoursPerDay range (1-10 as per spec)
    if (!effectiveHoursPerDay || effectiveHoursPerDay <= 0 || effectiveHoursPerDay > 24) {
      const error = new Error('VALIDATION_ERROR');
      error.statusCode = 400;
      error.details = {
        error: 'VALIDATION_ERROR',
        message: 'hoursPerDay must be between 1 and 24 (recommended 1-10)',
        field: 'hoursPerDay',
        receivedValue: effectiveHoursPerDay,
      };
      throw error;
    }

    // Validate jobRole is provided
    if (!jobRole || typeof jobRole !== 'string' || jobRole.trim().length === 0) {
      const error = new Error('VALIDATION_ERROR');
      error.statusCode = 400;
      error.details = {
        error: 'VALIDATION_ERROR',
        message: 'jobRole is required (e.g., "Full Stack Developer")',
        field: 'jobRole',
        receivedValue: jobRole,
      };
      throw error;
    }

    try {
      // STEP 2: Generate roadmap using intelligent services
      // Note: Using 1-year baseline (365 days) for roadmap generation
      const targetDaysBaseline = 365;
      const roadmap = generateRoadmap(
        user._id.toString(),
        'full-stack-developer',
        targetDaysBaseline,
        userSkills,
        tracks,
        templates,
        skillsById,
        {
          startDate: new Date(),
          hoursPerDay: effectiveHoursPerDay,
        }
      );

      // Get track for minimum hours constraint
      const selectedTrack = tracks.find((t) => t.trackId === roadmap.selectedTrackId);
      const trackMinimumHours = selectedTrack ? selectedTrack.minimumHours : null;

      // STEP 3: Calculate planning parameters
      const totalAdjustedHours = roadmap.nodes
        .filter((n) => n.nodeId !== 'buffer-node')
        .reduce((sum, node) => sum + (Number(node.adjustedHours) || 0), 0);

      // === GUARD AGAINST NaN (totalAdjustedHours must be finite) ===
      if (!Number.isFinite(totalAdjustedHours) || totalAdjustedHours < 0) {
        const error = new Error('INTERNAL_CALCULATION_ERROR');
        error.statusCode = 500;
        error.details = {
          error: 'INTERNAL_CALCULATION_ERROR',
          message: 'Failed to compute total adjusted hours - invalid node data',
          debugInfo: {
            totalAdjustedHours,
            nodeCount: roadmap.nodes.length,
            nonBufferNodeCount: roadmap.nodes.filter((n) => n.nodeId !== 'buffer-node').length,
          },
        };
        throw error;
      }

      // Calculate daily hours mode parameters
      planningParams = computeDailyHoursMode(
        totalAdjustedHours,
        effectiveHoursPerDay,
        trackMinimumHours
      );

      // Transform to weeks format for frontend compatibility
      const weeks = transformRoadmapToWeeks(roadmap, effectiveHoursPerDay);
      const skillGaps = generateSkillGaps(roadmap.nodes, userSkills);

      // STEP 4: Integrate Gemini AI to generate tasks, exercises, projects
      const weeklyTopics = roadmap.nodes
        .filter((n) => n.nodeId !== 'buffer-node')
        .map((node) => node.skillName);

      const weeksRequired = Math.ceil(planningParams.computedDays / 7);

      // Call Gemini to generate AI-enriched learning content
      let aiEnrichedPlan = null;
      try {
        console.log(`📚 Generating AI learning plan for ${jobRole} (${weeksRequired} weeks)...`);
        aiEnrichedPlan = await generateWeeklyLearningPlan({
          jobRole,
          track: roadmap.selectedTrackName,
          dailyHours: effectiveHoursPerDay,
          weeksRequired,
          weeklyTopics,
        });
        console.log('✨ AI learning plan generated successfully');
      } catch (geminiError) {
        console.warn(
          '⚠️ Gemini AI generation failed, using fallback plan structure:',
          geminiError.message
        );
        // Plan will still be generated with structured weeks, just without AI content
        aiEnrichedPlan = null;
      }

      // Merge AI-generated content with structural weeks if available
      const enrichedWeeks = weeks.map((week, idx) => {
        const aiWeek = aiEnrichedPlan?.weeks?.[idx];
        return {
          ...week,
          // Add AI-generated content if available
          aiContent: aiWeek
            ? {
                topic: aiWeek.topic,
                why: aiWeek.why,
                tasks: aiWeek.tasks || [],
                exercises: aiWeek.exercises || [],
                project: aiWeek.project || null,
              }
            : null,
        };
      });

      // Create explainability data
      const explainability = [
        {
          taskKey: 'roadmap-generation',
          reasons: [
            roadmap.reasoning,
            `Selected track: ${roadmap.selectedTrackName}`,
            `Daily learning pace: ${effectiveHoursPerDay} hours/day`,
            `Target role: ${jobRole}`,
            `Actual required: ${roadmap.actualDays} days`,
            `Buffer time: ${roadmap.bufferDays} days`,
            ...(aiEnrichedPlan
              ? [`✨ AI-powered learning tasks and exercises generated by Gemini`]
              : ['📌 Using template-based learning structure']),
            ...(planningParams.advisoryMessage
              ? [`Advisory: ${planningParams.advisoryMessage}`]
              : []),
          ],
        },
      ];

      // Save plan with job role and learning hour configuration
      const plan = await learningPlanRepository.create({
        userId: user._id,
        planVersion: 4, // Job-role-based planning with Gemini integration
        skillGaps,
        weeks: enrichedWeeks,
        explainability,
        isActive: true,
        // Store original roadmap data for future reference
        roadmapMetadata: {
          roadmapId: roadmap.roadmapId,
          selectedTrackId: roadmap.selectedTrackId,
          actualDays: roadmap.actualDays,
          bufferDays: roadmap.bufferDays,
          milestoneCount: roadmap.milestoneCount,
          nodeCount: roadmap.nodeCount,
          metrics: roadmap.selectedTrackMetrics,
        },
        // Store job-role and daily hours configuration
        jobRoleMetadata: {
          jobRole,
          hoursPerDay: effectiveHoursPerDay,
          computedDays: planningParams.computedDays,
          totalHours: totalAdjustedHours,
          weeksRequired,
          aiEnhanced: !!aiEnrichedPlan,
        },
      });

      return {
        plan,
        skillGaps,
        planMetadata: {
          jobRole,
          hoursPerDay: effectiveHoursPerDay,
          ...planningParams,
        },
      };
    } catch (error) {
      if (error.code === 'INSUFFICIENT_TIME') {
        // INSUFFICIENT_TIME error from roadmap generation
        const errorMessage = error.message || '';
        console.error('Roadmap generation failed - insufficient time:', errorMessage);
        throw new Error(
          `Cannot generate plan for ${jobRole}: ${errorMessage}. ` +
            `Try increasing hoursPerDay to meet the track requirements.`
        );
      }
      console.error('Failed to generate plan:', error);
      throw new Error(`Plan generation failed: ${error.message}`);
    }
  },

  async getMyPlans(userId) {
    return learningPlanRepository.findByUserId(userId);
  },
};

module.exports = { planService };

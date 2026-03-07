const { roadmapRepository } = require('../repositories/roadmap.repository.js');
const { userRepository } = require('../repositories/user.repository.js');
const { generateRoadmap } = require('./roadmap.service.js');
const { generateWeeklyLearningPlan } = require('./gemini.service.js');
const { computeDailyHoursMode } = require('./planningModes.service.js');

const roadmapGenerationService = {
  /**
   * Generate a new roadmap instance for a user
   *
   * @param {ObjectId} userId - User ID
   * @param {Object} options - Generation options
   * @param {string} options.roleName - Target job role
   * @param {number} options.dailyLearningMinutes - Daily learning time
   * @param {string} options.skillSource - "profile" or "custom"
   * @param {Array} options.skills - Skills array (only if skillSource = "custom")
   * @returns {Promise<RoadmapInstance>}
   */
  async generateRoadmapInstance(userId, options) {
    const { roleName, dailyLearningMinutes, skillSource, skills } = options;

    // Validation
    if (!roleName) {
      throw new Error('Role name is required');
    }
    if (!dailyLearningMinutes || dailyLearningMinutes < 30 || dailyLearningMinutes > 480) {
      throw new Error('Daily learning minutes must be between 30 and 480 (8 hours)');
    }
    if (!skillSource || !['profile', 'custom'].includes(skillSource)) {
      throw new Error('Skill source must be "profile" or "custom"');
    }

    // Step 1: Get skills based on source
    let skillsToUse = [];
    if (skillSource === 'profile') {
      const user = await userRepository.findById(userId);
      if (!user || !user.skills || user.skills.length === 0) {
        throw new Error(
          'No skills found in profile. Please add skills to your profile first or use custom skills.'
        );
      }
      skillsToUse = user.skills.map((s) => ({
        name: s.name,
        level: s.level,
      }));
    } else {
      // Custom skills
      if (!skills || !Array.isArray(skills) || skills.length === 0) {
        throw new Error('Skills array is required when using custom skill source');
      }
      skillsToUse = skills.map((s) => ({
        name: s.name,
        level: s.level,
      }));
    }

    // Convert skills to the format expected by roadmap generation
    const userSkills = this._convertSkillsToLegacyFormat(skillsToUse);

    // Step 2: Generate roadmap using existing logic
    const hoursPerDay = dailyLearningMinutes / 60;

    // Get mock data (TODO: Replace with DB in production)
    const { tracks, templates, skillsById } = this._getMockData();

    const requestedRoleId = this._getRoleIdFromName(roleName);
    const hasRequestedRoleTrack = tracks.some((track) => track.roleId === requestedRoleId);
    const roleIdForGeneration = hasRequestedRoleTrack ? requestedRoleId : 'full-stack-developer';

    if (!hasRequestedRoleTrack) {
      console.warn(
        `⚠️ No tracks found for roleId=${requestedRoleId}. Falling back to full-stack-developer.`
      );
    }

    // Generate roadmap structure
    const roadmap = generateRoadmap(
      userId.toString(),
      roleIdForGeneration,
      365, // Baseline days
      userSkills,
      tracks,
      templates,
      skillsById,
      {
        startDate: new Date(),
        hoursPerDay,
      }
    );

    // Step 3: Calculate timeline
    const selectedTrack = tracks.find((t) => t.trackId === roadmap.selectedTrackId);
    const totalHours = roadmap.nodes
      .filter((n) => n.nodeId !== 'buffer-node')
      .reduce((sum, node) => sum + (Number(node.adjustedHours) || 0), 0);

    const planningParams = computeDailyHoursMode(
      totalHours,
      hoursPerDay,
      selectedTrack?.minimumHours
    );

    // Step 4: Transform roadmap to weekly structure
    const weeks = this._transformToWeeks(roadmap, dailyLearningMinutes);

    // Step 5: Enrich with Gemini AI content
    const weeksRequired = Math.ceil(planningParams.computedDays / 7);
    const weeklyTopics = roadmap.nodes
      .filter((n) => n.nodeId !== 'buffer-node')
      .map((node) => node.skillName);

    let enrichedWeeks = weeks;
    try {
      console.log(`📚 Generating AI content for ${roleName} roadmap (${weeksRequired} weeks)...`);
      const aiResult = await generateWeeklyLearningPlan({
        jobRole: roleName,
        track: roadmap.selectedTrackName,
        dailyHours: hoursPerDay,
        weeksRequired,
        weeklyTopics,
      });

      // Check if AI actually generated content or fallback was used
      if (aiResult.isAiGenerated) {
        console.log('✨ AI content generated successfully');
      }

      const aiPlan = aiResult.plan;

      // Merge AI content with structural weeks
      enrichedWeeks = weeks.map((week, idx) => ({
        ...week,
        aiContent: aiPlan?.weeks?.[idx]
          ? {
              why: aiPlan.weeks[idx].why,
              keyTakeaways: aiPlan.weeks[idx].keyTakeaways || [],
              summary: aiPlan.weeks[idx].summary || '',
            }
          : null,
      }));
    } catch (geminiError) {
      console.warn('⚠️ Gemini AI failed, using basic structure:', geminiError.message);
    }

    // Step 6: Create roadmap instance
    const roadmapData = {
      userId,
      roleName,
      trackChosen: roadmap.selectedTrackId,
      dailyLearningMinutes,
      estimatedTotalHours: totalHours,
      estimatedCompletionDays: planningParams.computedDays,
      skillSource,
      skillsUsed: skillsToUse,
      weeks: enrichedWeeks,
      status: 'active',
      completionPercentage: 0,
      lastAccessedAt: new Date(),
      roadmapMetadata: {
        trackId: roadmap.selectedTrackId,
        selectedTrackName: roadmap.selectedTrackName,
        totalSkills: skillsToUse.length,
        milestoneCount: roadmap.milestoneCount,
        nodeCount: roadmap.nodeCount,
        metrics: roadmap.selectedTrackMetrics,
      },
    };

    const roadmapInstance = await roadmapRepository.create(roadmapData);
    console.log(`✅ Roadmap created: ${roadmapInstance._id}`);

    return roadmapInstance;
  },

  /**
   * Convert new skill format to legacy format for roadmap generation
   */
  _convertSkillsToLegacyFormat(skills) {
    const levelMap = {
      beginner: 2,
      intermediate: 3,
      advanced: 4,
    };

    return skills.map((s) => ({
      topic: s.name,
      level: levelMap[s.level] || 2,
    }));
  },

  /**
   * Get role ID from role name
   */
  _getRoleIdFromName(roleName) {
    const roleMapping = {
      'Frontend Developer': 'frontend-developer',
      'Backend Developer': 'backend-developer',
      'Full Stack Developer': 'full-stack-developer',
      'React Developer': 'react-developer',
      'Node.js Developer': 'nodejs-developer',
    };

    return roleMapping[roleName] || 'full-stack-developer';
  },

  /**
   * Transform roadmap nodes into weekly task structure
   */
  _transformToWeeks(roadmap, dailyMinutes) {
    const regularNodes = roadmap.nodes.filter((n) => n.nodeId !== 'buffer-node');

    if (regularNodes.length === 0) {
      return [];
    }

    // Calculate total learning time
    const totalMinutes = regularNodes.reduce(
      (sum, node) => sum + Math.ceil(node.adjustedHours * 60),
      0
    );
    const totalDays = Math.ceil(totalMinutes / dailyMinutes);
    const totalWeeks = Math.ceil(totalDays / 7);

    // Distribute tasks across days
    const days = [];
    let currentDayNumber = 1;
    let nodeIndex = 0;
    let nodeRemainingMinutes = Math.ceil(regularNodes[0].adjustedHours * 60);

    while (nodeIndex < regularNodes.length && currentDayNumber <= totalDays) {
      const tasks = [];
      let dayMinutesUsed = 0;

      while (dayMinutesUsed < dailyMinutes && nodeIndex < regularNodes.length) {
        const currentNode = regularNodes[nodeIndex];
        const minutesAvailable = dailyMinutes - dayMinutesUsed;

        if (nodeRemainingMinutes <= minutesAvailable) {
          // Task fits in remaining day time
          tasks.push({
            taskId: `task_${currentDayNumber}_${nodeIndex + 1}`,
            title: `Study ${currentNode.skillName}`,
            description: `Learn the fundamentals and key concepts of ${currentNode.skillName}`,
            skill: currentNode.skillName,
            estimatedMinutes: nodeRemainingMinutes,
            dayNumber: currentDayNumber,
            weekNumber: Math.ceil(currentDayNumber / 7),
            status: 'pending',
            completedAt: null,
            reason: `${currentNode.skillName} is ${currentNode.priority === 'mandatory' ? 'essential' : 'important'} for your role`,
            resources: [],
            exercise: null,
          });

          dayMinutesUsed += nodeRemainingMinutes;
          nodeIndex++;

          if (nodeIndex < regularNodes.length) {
            nodeRemainingMinutes = Math.ceil(regularNodes[nodeIndex].adjustedHours * 60);
          }
        } else {
          // Task needs to be split
          const partNumber = Math.ceil(
            (regularNodes[nodeIndex].adjustedHours * 60 - nodeRemainingMinutes + minutesAvailable) /
              minutesAvailable
          );

          tasks.push({
            taskId: `task_${currentDayNumber}_${nodeIndex + 1}_part${partNumber}`,
            title: `Study ${currentNode.skillName} (Part ${partNumber})`,
            description: `Continue learning ${currentNode.skillName}`,
            skill: currentNode.skillName,
            estimatedMinutes: minutesAvailable,
            dayNumber: currentDayNumber,
            weekNumber: Math.ceil(currentDayNumber / 7),
            status: 'pending',
            completedAt: null,
            reason: `${currentNode.skillName} is ${currentNode.priority === 'mandatory' ? 'essential' : 'important'} for your role`,
            resources: [],
            exercise: null,
          });

          nodeRemainingMinutes -= minutesAvailable;
          dayMinutesUsed = dailyMinutes;
        }
      }

      if (tasks.length > 0) {
        days.push({ dayNumber: currentDayNumber, tasks });
      }

      currentDayNumber++;
    }

    // Group days into weeks
    const weeks = [];
    for (let week = 1; week <= totalWeeks; week++) {
      const startDayIdx = (week - 1) * 7;
      const endDayIdx = Math.min(startDayIdx + 7, days.length);
      const weekDays = days.slice(startDayIdx, endDayIdx);

      if (weekDays.length > 0) {
        const weekTopic = weekDays[0]?.tasks[0]?.skill || 'Learning';
        const weekTotalMinutes = weekDays.reduce(
          (sum, day) => sum + day.tasks.reduce((s, t) => s + t.estimatedMinutes, 0),
          0
        );

        weeks.push({
          weekNumber: week,
          topic: weekTopic,
          totalMinutes: weekTotalMinutes,
          tasks: weekDays.flatMap((day) => day.tasks),
          aiContent: null, // Will be filled by Gemini
        });
      }
    }

    return weeks;
  },

  /**
   * Get mock data for roadmap generation
   * TODO: Replace with database queries
   */
  _getMockData() {
    // Define tracks for each role
    const tracks = [
      {
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
      },
      {
        id: 'react-frontend',
        trackId: 'react-frontend',
        name: 'React Frontend Developer',
        roleId: 'frontend-developer',
        minimumHours: 120,
        averageHours: 160,
        marketDemandScore: 0.92,
        ecosystemScore: 0.95,
        salaryScore: 0.8,
        futureProofScore: 0.85,
        easeOfLearningScore: 0.65,
      },
      {
        id: 'node-backend',
        trackId: 'node-backend',
        name: 'Node.js Backend Developer',
        roleId: 'backend-developer',
        minimumHours: 140,
        averageHours: 180,
        marketDemandScore: 0.9,
        ecosystemScore: 0.88,
        salaryScore: 0.9,
        futureProofScore: 0.82,
        easeOfLearningScore: 0.6,
      },
      {
        id: 'react-specialist',
        trackId: 'react-specialist',
        name: 'React Specialist',
        roleId: 'react-developer',
        minimumHours: 100,
        averageHours: 130,
        marketDemandScore: 0.93,
        ecosystemScore: 0.96,
        salaryScore: 0.85,
        futureProofScore: 0.88,
        easeOfLearningScore: 0.7,
      },
      {
        id: 'node-specialist',
        trackId: 'node-specialist',
        name: 'Node.js Specialist',
        roleId: 'nodejs-developer',
        minimumHours: 110,
        averageHours: 145,
        marketDemandScore: 0.88,
        ecosystemScore: 0.87,
        salaryScore: 0.88,
        futureProofScore: 0.8,
        easeOfLearningScore: 0.65,
      },
    ];

    // Define templates for each track with core skill nodes
    const templates = {
      'mern-full-stack': {
        nodes: [
          { skillId: 'javascript', priority: 'mandatory' },
          { skillId: 'html-css', priority: 'mandatory' },
          { skillId: 'react', priority: 'mandatory' },
          { skillId: 'node', priority: 'mandatory' },
          { skillId: 'mongodb', priority: 'mandatory' },
          { skillId: 'rest-api', priority: 'recommended' },
          { skillId: 'express', priority: 'recommended' },
        ],
        milestones: [],
      },
      'react-frontend': {
        nodes: [
          { skillId: 'javascript', priority: 'mandatory' },
          { skillId: 'html-css', priority: 'mandatory' },
          { skillId: 'react', priority: 'mandatory' },
          { skillId: 'state-management', priority: 'recommended' },
          { skillId: 'responsive-design', priority: 'recommended' },
          { skillId: 'rest-api', priority: 'optional' },
        ],
        milestones: [],
      },
      'node-backend': {
        nodes: [
          { skillId: 'javascript', priority: 'mandatory' },
          { skillId: 'node', priority: 'mandatory' },
          { skillId: 'express', priority: 'mandatory' },
          { skillId: 'mongodb', priority: 'recommended' },
          { skillId: 'rest-api', priority: 'mandatory' },
          { skillId: 'database-design', priority: 'recommended' },
        ],
        milestones: [],
      },
      'react-specialist': {
        nodes: [
          { skillId: 'javascript', priority: 'mandatory' },
          { skillId: 'react', priority: 'mandatory' },
          { skillId: 'hooks', priority: 'mandatory' },
          { skillId: 'state-management', priority: 'mandatory' },
          { skillId: 'testing-react', priority: 'recommended' },
          { skillId: 'performance-optimization', priority: 'recommended' },
        ],
        milestones: [],
      },
      'node-specialist': {
        nodes: [
          { skillId: 'javascript', priority: 'mandatory' },
          { skillId: 'node', priority: 'mandatory' },
          { skillId: 'express', priority: 'mandatory' },
          { skillId: 'async-programming', priority: 'mandatory' },
          { skillId: 'system-design', priority: 'recommended' },
          { skillId: 'scalability', priority: 'recommended' },
        ],
        milestones: [],
      },
    };

    return {
      tracks,
      templates,
      skillsById: {},
    };
  },
};

module.exports = { roadmapGenerationService };

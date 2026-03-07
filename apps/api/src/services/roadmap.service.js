/**
 * Roadmap Service (orchestration layer)
 *
 * Coordinates all roadmap generation steps:
 * - Track selection
 * - Topological ordering
 * - Duration adjustment
 * - Timeline generation
 * - Milestone aggregation
 */

const {
  topologicalSort,
  adjustNodeDurations,
  generateTimeline,
  generateMilestones,
} = require('./roadmapGenerator.service');

const { selectBestTrack } = require('./trackSelector.service');

let roadmapCounter = 0;

/**
 * Generate a complete user roadmap instance.
 * Orchestrates track selection, timeline generation, and milestone creation.
 *
 * @param {string} userId
 * @param {string} roleId
 * @param {number} targetDays
 * @param {Object} userSkills - { skillId: proficiencyLevel, ... }
 * @param {Array<Object>} tracks - available tracks with id, roleId, name, minimumDays, etc.
 * @param {Object<string, Object>} templatesByTrackId - templates indexed by track id
 * @param {Object<string, Object>} skillsById - skill definitions
 * @param {Object} options
 * @returns {{ roadmapId, userId, roleId, selectedTrackId, startDate, endDate, targetDays, milestones, nodes, reasoning }}
 */
function generateRoadmap(
  userId,
  roleId,
  targetDays,
  userSkills,
  tracks,
  templatesByTrackId,
  skillsById = {},
  options = {}
) {
  if (!userId || !roleId || targetDays < 1) {
    const error = new Error('Invalid parameters: userId, roleId, targetDays required');
    error.code = 'INVALID_PARAMETERS';
    throw error;
  }

  // Step 1: Select the best track
  const selectionResult = selectBestTrack(roleId, targetDays, userSkills, {
    tracks,
    templatesByTrackId,
    ...options,
  });

  if (!selectionResult.chosenTrackId) {
    const error = new Error(`No track selected for roleId=${roleId}, targetDays=${targetDays}`);
    error.code = 'NO_TRACK_SELECTED';
    throw error;
  }

  const trackTemplate = templatesByTrackId[selectionResult.chosenTrackId];

  if (!trackTemplate) {
    const error = new Error(`Missing template for trackId=${selectionResult.chosenTrackId}`);
    error.code = 'MISSING_TEMPLATE';
    throw error;
  }

  if (!trackTemplate || !trackTemplate.nodes || !Array.isArray(trackTemplate.nodes)) {
    const error = new Error(`Invalid track template for trackId=${chosenTrack.trackId}`);
    error.code = 'INVALID_TRACK_TEMPLATE';
    throw error;
  }

  // Step 2: Topological sort to order nodes by prerequisites
  const sortedNodes = topologicalSort(trackTemplate.nodes);

  // Step 3: Adjust node durations based on user proficiency
  const adjustedNodes = adjustNodeDurations(sortedNodes, userSkills, skillsById);

  // Step 4: Generate timeline with dates
  const startDate = options.startDate || new Date();
  const hoursPerDay = options.hoursPerDay || 4;

  const timelineResult = generateTimeline(adjustedNodes, targetDays, startDate, hoursPerDay);

  // Step 5: Generate milestones from timeline
  const templateMilestones = trackTemplate.milestones || [];
  const milestones = generateMilestones(templateMilestones, timelineResult.nodes);

  // Step 6: Build roadmap instance
  const roadmapId = `${userId}-${roleId}-${Date.now()}-${++roadmapCounter}`;
  const endDate = timelineResult.nodes[timelineResult.nodes.length - 1].endDate;

  return {
    roadmapId,
    userId,
    roleId,
    selectedTrackId: selectionResult.chosenTrackId,
    selectedTrackName: selectionResult.chosenTrackName,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    targetDays,
    actualDays: timelineResult.requiredDays,
    bufferDays: timelineResult.bufferDays,
    nodeCount: timelineResult.nodes.length,
    milestoneCount: milestones.length,
    nodes: timelineResult.nodes,
    milestones,
    reasoning: selectionResult.reasons.join('; '),
    selectedTrackMetrics: {
      skillFitScore: selectionResult.scoreBreakdown.skillFit,
      feasibilityScore: selectionResult.scoreBreakdown.feasibility,
      marketScore: selectionResult.scoreBreakdown.market,
      finalScore: selectionResult.score,
    },
  };
}

module.exports = {
  generateRoadmap,
};

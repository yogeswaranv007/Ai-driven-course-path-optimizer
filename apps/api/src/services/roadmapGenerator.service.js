/**
 * Roadmap Generator Service (timeline engine core)
 *
 * Implements deterministic roadmap generation primitives:
 * - topologicalSort
 * - adjustNodeDurations
 * - generateTimeline
 */

const DEFAULT_PROFICIENCY_MULTIPLIERS = {
  none: 1.0,
  basic: 0.4,
  intermediate: 0.2,
  advanced: 0.05,
};

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Apply topological sort to roadmap nodes based on prerequisites.
 * Deterministic order for same input (queue preserves input order).
 *
 * @param {Array<Object>} nodes
 * @returns {Array<Object>}
 */
function topologicalSort(nodes) {
  const adjacencyList = {};
  const inDegree = {};
  const nodeById = {};

  for (const node of nodes) {
    adjacencyList[node.nodeId] = [];
    inDegree[node.nodeId] = 0;
    nodeById[node.nodeId] = node;
  }

  for (const node of nodes) {
    for (const prerequisiteNodeId of node.prerequisites || []) {
      if (!adjacencyList[prerequisiteNodeId]) {
        throw new Error(`Invalid prerequisite: ${prerequisiteNodeId} not found in nodes`);
      }
      adjacencyList[prerequisiteNodeId].push(node.nodeId);
      inDegree[node.nodeId] += 1;
    }
  }

  const queue = [];
  const sorted = [];

  for (const node of nodes) {
    if (inDegree[node.nodeId] === 0) {
      queue.push(node);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);

    for (const dependentNodeId of adjacencyList[current.nodeId]) {
      inDegree[dependentNodeId] -= 1;
      if (inDegree[dependentNodeId] === 0) {
        queue.push(nodeById[dependentNodeId]);
      }
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Cycle detected in skill graph');
  }

  return sorted;
}

/**
 * Adjust node durations using user proficiency and skill multipliers.
 *
 * @param {Array<Object>} nodes
 * @param {Object} userSkills
 * @param {Object<string, Object>} skillsById
 * @returns {Array<Object>}
 */
function adjustNodeDurations(nodes, userSkills, skillsById = {}) {
  return nodes.map((node, index) => {
    const proficiencyLevel = userSkills[node.skillId] || 'none';
    const skill = skillsById[node.skillId];
    const proficiencyMultipliers = skill?.proficiencyLevels || DEFAULT_PROFICIENCY_MULTIPLIERS;
    const multiplier = proficiencyMultipliers[proficiencyLevel];

    if (multiplier === undefined) {
      throw new Error(`Invalid proficiency level: ${proficiencyLevel} for skillId=${node.skillId}`);
    }

    const adjustedHours = node.estimatedHours * multiplier;

    return {
      nodeId: node.nodeId,
      skillId: node.skillId,
      skillName: node.skillName,
      milestoneId: node.milestoneId,
      baseHours: node.estimatedHours,
      adjustedHours,
      proficiencyLevel,
      priority: node.priority,
      prerequisites: node.prerequisites || [],
      sequenceOrder: index + 1,
      startDate: null,
      endDate: null,
      estimatedDays: 0,
    };
  });
}

/**
 * Generate node timeline with strict date semantics:
 * - startDate inclusive
 * - endDate exclusive
 *
 * @param {Array<Object>} nodes
 * @param {number} targetDays
 * @param {Date} startDate
 * @param {number} hoursPerDay
 * @returns {{ nodes: Array<Object>, bufferDays: number, requiredDays: number }}
 */
function generateTimeline(nodes, targetDays, startDate, hoursPerDay) {
  if (hoursPerDay <= 0) {
    throw new Error(`Invalid hoursPerDay: ${hoursPerDay}`);
  }

  const totalAdjustedHours = nodes.reduce((sum, node) => sum + node.adjustedHours, 0);
  const requiredDays = Math.ceil(totalAdjustedHours / hoursPerDay);

  if (targetDays < requiredDays) {
    const error = new Error(`INSUFFICIENT_TIME: Need ${requiredDays} days, got ${targetDays}`);
    error.code = 'INSUFFICIENT_TIME';
    error.requiredDays = requiredDays;
    throw error;
  }

  let currentDate = new Date(startDate);

  const nodesWithDates = nodes.map((node) => {
    const estimatedDays = Math.ceil(node.adjustedHours / hoursPerDay);
    const nodeStartDate = new Date(currentDate);
    currentDate = addDays(currentDate, estimatedDays);
    const nodeEndDate = new Date(currentDate);

    return {
      ...node,
      startDate: nodeStartDate,
      endDate: nodeEndDate,
      estimatedDays,
    };
  });

  const bufferDays = targetDays - requiredDays;

  if (bufferDays > 0) {
    const bufferNode = {
      nodeId: 'buffer-node',
      skillId: 'buffer',
      skillName: 'Review & Catch-up Time',
      milestoneId: 'buffer-milestone',
      startDate: new Date(currentDate),
      endDate: addDays(currentDate, bufferDays),
      estimatedDays: bufferDays,
      baseHours: 0,
      adjustedHours: 0,
      proficiencyLevel: 'none',
      priority: 'optional',
      prerequisites:
        nodesWithDates.length > 0 ? [nodesWithDates[nodesWithDates.length - 1].nodeId] : [],
      sequenceOrder: nodesWithDates.length + 1,
    };

    nodesWithDates.push(bufferNode);
  }

  return {
    nodes: nodesWithDates,
    bufferDays,
    requiredDays,
  };
}

/**
 * Generate milestone instances from template milestones and timeline nodes.
 * Aggregates node date ranges by milestone, respecting exclusive endDate semantics.
 *
 * @param {Array<Object>} templateMilestones
 * @param {Array<Object>} nodes - nodes with startDate/endDate from generateTimeline
 * @returns {Array<Object>} MilestoneInstance[]
 */
function generateMilestones(templateMilestones, nodes) {
  const millisPerDay = 24 * 60 * 60 * 1000;
  const milestones = [];

  // Build a map of nodes by milestoneId
  const nodesByMilestoneId = {};
  for (const node of nodes) {
    if (!node.milestoneId) continue;

    if (!nodesByMilestoneId[node.milestoneId]) {
      nodesByMilestoneId[node.milestoneId] = [];
    }
    nodesByMilestoneId[node.milestoneId].push(node);
  }

  // Process each template milestone
  for (const templateMilestone of templateMilestones) {
    const milestoneNodes = nodesByMilestoneId[templateMilestone.milestoneId] || [];

    if (milestoneNodes.length === 0) {
      continue;
    }

    // Sort by sequenceOrder to ensure deterministic first/last
    const sorted = milestoneNodes.sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    const firstNode = sorted[0];
    const lastNode = sorted[sorted.length - 1];

    const startDate = new Date(firstNode.startDate);
    const endDate = new Date(lastNode.endDate);

    // Calculate days using exclusive-end semantics
    const estimatedDays = Math.floor((endDate - startDate) / millisPerDay);

    milestones.push({
      milestoneId: templateMilestone.milestoneId,
      milestoneName: templateMilestone.name,
      description: templateMilestone.description || '',
      startDate,
      endDate,
      estimatedDays,
      nodeCount: milestoneNodes.length,
    });
  }

  // Check for buffer milestone
  const bufferNode = nodes.find((node) => node.nodeId === 'buffer-node');
  if (bufferNode) {
    const bufferStartDate = new Date(bufferNode.startDate);
    const bufferEndDate = new Date(bufferNode.endDate);
    const bufferEstimatedDays = Math.floor((bufferEndDate - bufferStartDate) / millisPerDay);

    milestones.push({
      milestoneId: 'buffer-milestone',
      milestoneName: 'Review & Catch-up Time',
      description: 'Buffer time for review and catching up',
      startDate: bufferStartDate,
      endDate: bufferEndDate,
      estimatedDays: bufferEstimatedDays,
      nodeCount: 1,
      isBuffer: true,
    });
  }

  return milestones;
}

module.exports = {
  addDays,
  topologicalSort,
  adjustNodeDurations,
  generateTimeline,
  generateMilestones,
};

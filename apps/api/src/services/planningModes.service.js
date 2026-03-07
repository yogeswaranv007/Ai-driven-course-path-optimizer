/**
 * Planning Modes Service
 *
 * Implements dual planning mode logic:
 * 1. DAILY_HOURS (default): Generate timeline based on hours per day
 * 2. DEADLINE_DAYS (optional): Validate feasibility against a deadline
 *
 * Maintains determinism: same inputs → same outputs (no randomness)
 */

const MAX_HOURS_PER_DAY = 24;

/**
 * Clamp totalAdjustedHours to Track minimum.
 *
 * Prevents proficiency multipliers from making a track unrealistically short.
 * If track has minimum of 100 hours but user expertise reduces to 50 hours,
 * still count 100 hours for planning (clamped to minimum).
 *
 * @param {number} totalAdjustedHours - Sum of all node adjusted hours
 * @param {number} minimumHours - Track's minimum hours requirement
 * @returns {number} - max(totalAdjustedHours, minimumHours)
 */
function clampToMinimumHours(totalAdjustedHours, minimumHours) {
  if (minimumHours && minimumHours > 0) {
    return Math.max(totalAdjustedHours, minimumHours);
  }
  return totalAdjustedHours;
}

/**
 * Compute planning parameters for DAILY_HOURS mode
 *
 * Behavior:
 * - Timeline is strictly based on hoursPerDay
 * - Do NOT compress or scale hours upward
 * - Do NOT inflate workload
 * - Respect track.minimumHours (clamp to prevent unrealistic compression)
 *
 * @param {number} totalAdjustedHours - Sum of all node adjusted hours
 * @param {number} hoursPerDay - User's available learning hours per day
 * @param {number} minimumHours - Track's minimum hours requirement
 * @param {number} targetDays - Optional reference (for advisory message only)
 * @returns {{
 *   computedDays: number,
 *   actualDays: number,
 *   requiredHoursPerDay: number | null,
 *   advisoryMessage: string | null,
 *   isFeasible: boolean
 * }}
 */
function computeDailyHoursMode(
  totalAdjustedHours,
  hoursPerDay,
  minimumHours = null,
  targetDays = null
) {
  if (hoursPerDay <= 0) {
    throw new Error(`Invalid hoursPerDay: ${hoursPerDay}`);
  }

  // Step 1: Clamp to minimum hours
  const totalHoursUsed = clampToMinimumHours(totalAdjustedHours, minimumHours);

  // Step 2: Core computation: based on hoursPerDay only
  const computedDays = Math.ceil(totalHoursUsed / hoursPerDay);
  const actualDays = computedDays; // No buffer added in mode logic; handled by roadmapGenerator

  let requiredHoursPerDay = null;
  let advisoryMessage = null;
  let isFeasible = true;

  // Step 3: If targetDays provided, check if user's hoursPerDay is sufficient
  if (targetDays && targetDays > 0) {
    requiredHoursPerDay = Math.ceil(totalHoursUsed / targetDays);

    if (requiredHoursPerDay > hoursPerDay) {
      isFeasible = false;
      advisoryMessage = `To finish within ${targetDays} days, you need ${requiredHoursPerDay} hours/day (you selected ${hoursPerDay}). With ${hoursPerDay} hours/day, you'll need ${computedDays} days.`;
    }
  }

  return {
    computedDays,
    actualDays,
    requiredHoursPerDay,
    advisoryMessage,
    isFeasible,
  };
}

/**
 * Compute planning parameters for DEADLINE_DAYS mode
 *
 * Validates feasibility and provides fallback if impossible.
 *
 * Step 1: Track minimum hours constraint
 * Step 2: Physical feasibility check (max 24 hours/day)
 * Step 3: User-hours feasibility check
 * Step 4: Feasible case with optional buffer
 *
 * @param {number} totalAdjustedHours - Sum of all node adjusted hours
 * @param {number} targetDays - Deadline the user wants to meet
 * @param {number} hoursPerDay - User's available learning hours per day
 * @param {number} minimumHours - Track's minimum hours requirement
 * @returns {{
 *   isFeasible: boolean,
 *   computedDays: number,
 *   requiredHoursPerDay: number | null,
 *   minimumDaysAtMaxHours: number | null,
 *   maxHoursPerDayUsedForFallback: number | null,
 *   advisoryMessage: string | null
 * }}
 */
function computeDeadlineDaysMode(totalAdjustedHours, targetDays, hoursPerDay, minimumHours = null) {
  if (targetDays <= 0) {
    throw new Error(`Invalid targetDays: ${targetDays}`);
  }
  if (hoursPerDay <= 0) {
    throw new Error(`Invalid hoursPerDay: ${hoursPerDay}`);
  }

  // STEP 1: Clamp to minimum hours
  const totalHoursUsed = clampToMinimumHours(totalAdjustedHours, minimumHours);

  const availableHours = targetDays * hoursPerDay;
  const maxAvailableHours = targetDays * MAX_HOURS_PER_DAY;

  // STEP 2: Physical Feasibility Check (MAX_HOURS_PER_DAY constraint)
  if (maxAvailableHours < totalHoursUsed) {
    const minimumDaysAtMaxHours = Math.ceil(totalHoursUsed / MAX_HOURS_PER_DAY);
    return {
      isFeasible: false,
      computedDays: minimumDaysAtMaxHours,
      requiredHoursPerDay: MAX_HOURS_PER_DAY,
      minimumDaysAtMaxHours,
      maxHoursPerDayUsedForFallback: MAX_HOURS_PER_DAY,
      advisoryMessage: `Physically impossible: Even at 24 hours/day, you need ${minimumDaysAtMaxHours} days (you only have ${targetDays}). Fallback plan provided: ${targetDays} days with fallback timeline.`,
    };
  }

  // STEP 3: User-Hours Feasibility Check
  if (availableHours < totalHoursUsed) {
    const requiredHoursPerDay = Math.ceil(totalHoursUsed / targetDays);

    return {
      isFeasible: false,
      computedDays: targetDays,
      requiredHoursPerDay,
      minimumDaysAtMaxHours: null,
      maxHoursPerDayUsedForFallback: null,
      advisoryMessage: `Not feasible with current pace: You need ${requiredHoursPerDay} hours/day to finish in ${targetDays} days (you selected ${hoursPerDay}). Consider increasing study time or extending deadline.`,
    };
  }

  // STEP 4: Feasible Case
  // Timeline strictly uses hoursPerDay (not compressed)
  const requiredDays = Math.ceil(totalHoursUsed / hoursPerDay);
  const bufferDays = targetDays - requiredDays;

  return {
    isFeasible: true,
    computedDays: requiredDays,
    requiredHoursPerDay: null,
    minimumDaysAtMaxHours: null,
    maxHoursPerDayUsedForFallback: null,
    advisoryMessage:
      bufferDays > 0
        ? `Feasible! You'll complete in ${requiredDays} days (${bufferDays} buffer days available).`
        : `Tight timeline: You'll finish in exactly ${requiredDays} days with no buffer.`,
  };
}

/**
 * Deterministically insert a buffer node if bufferDays > 0
 *
 * This maintains determinism: same inputs → same buffer node structure every time.
 *
 * @param {Array<Object>} nodes - Nodes with populated startDate and endDate
 * @param {number} bufferDays - Number of buffer days calculated
 * @param {Date} startDate - Roadmap start date (for calculation)
 * @returns {Array<Object>} - Nodes with buffer node appended (if bufferDays > 0)
 */
function insertBufferNodeDeterministically(nodes, bufferDays, startDate) {
  // Defensive: if no buffer, return as-is
  if (bufferDays <= 0 || bufferDays === 0) {
    return nodes;
  }

  // Buffer node is always inserted at the end with deterministic nodeId
  const bufferNode = {
    nodeId: 'buffer-node',
    skillId: 'buffer',
    skillName: 'Review & Catch-up Time',
    milestoneId: 'buffer-milestone',
    startDate: nodes.length > 0 ? new Date(nodes[nodes.length - 1].endDate) : new Date(startDate),
    endDate: (() => {
      const result = new Date(nodes.length > 0 ? nodes[nodes.length - 1].endDate : startDate);
      result.setDate(result.getDate() + bufferDays);
      return result;
    })(),
    estimatedDays: bufferDays,
    baseHours: 0,
    adjustedHours: 0,
    proficiencyLevel: 'none',
    priority: 'optional',
    prerequisites: nodes.length > 0 ? [nodes[nodes.length - 1].nodeId] : [],
    sequenceOrder: nodes.length + 1,
    isBufferNode: true,
  };

  return [...nodes, bufferNode];
}

module.exports = {
  MAX_HOURS_PER_DAY,
  clampToMinimumHours,
  computeDailyHoursMode,
  computeDeadlineDaysMode,
  insertBufferNodeDeterministically,
};

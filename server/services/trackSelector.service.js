/**
 * TrackSelectorService
 *
 * Responsible for deterministically selecting the best track for a user
 * based on skills, timeline, and market factors.
 *
 * Implements the Track Selection Engine per CORE_LOGIC_REDESIGN.md
 */

/**
 * Compute skill fit score (0–1)
 *
 * Measures overlap between user's current skills and track's required skills,
 * weighted by skill priority (mandatory > recommended > optional) and user's
 * proficiency level in each skill.
 *
 * @param {Object} userSkills - Map of skillId -> proficiencyLevel ("none" | "basic" | "intermediate" | "advanced")
 * @param {Object} trackTemplate - Track's RoadmapTemplate with nodes array
 * @returns {number} Score between 0 and 1
 */
function computeSkillFitScore(userSkills, trackTemplate) {
  // Deduplicate skillIds - each skill counted once even if in multiple nodes
  const trackSkillIds = Array.from(new Set(trackTemplate.nodes.map((n) => n.skillId)));

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const skillId of trackSkillIds) {
    const userProficiency = userSkills[skillId] || 'none';

    // Find first node with this skillId to get priority
    const node = trackTemplate.nodes.find((n) => n.skillId === skillId);
    if (!node) {
      throw new Error(`Node not found for skillId: ${skillId}`);
    }

    // Weight by priority: mandatory > recommended > optional
    const priorityWeights = {
      mandatory: 1.0,
      recommended: 0.6,
      optional: 0.3,
    };
    const priorityWeight = priorityWeights[node.priority];

    if (priorityWeight === undefined) {
      throw new Error(`Invalid priority: ${node.priority}`);
    }

    // Proficiency multiplier: higher proficiency = less work needed
    const proficiencyValues = {
      advanced: 1.0,
      intermediate: 0.6,
      basic: 0.3,
      none: 0.0,
    };
    const proficiencyValue = proficiencyValues[userProficiency];

    if (proficiencyValue === undefined) {
      throw new Error(`Invalid proficiency level: ${userProficiency}`);
    }

    totalWeight += priorityWeight;
    earnedWeight += priorityWeight * proficiencyValue;
  }

  if (totalWeight === 0) {
    return 0;
  }

  return earnedWeight / totalWeight;
}

/**
 * Compute feasibility score (0–1)
 *
 * Measures how achievable the targetDays is given the track's time requirements.
 * - targetDays >= averageDays → score = 1.0 (comfortable)
 * - targetDays >= minimumDays && < averageDays → linear interpolation (0.3 to 1.0)
 * - targetDays < minimumDays → ERROR (should be filtered before calling)
 *
 * @param {number} targetDays - User's target completion days
 * @param {number} trackMinimumDays - Track's minimum required days (tight timeline)
 * @param {number} trackAverageDays - Track's average required days (comfortable timeline)
 * @returns {number} Score between 0 and 1
 * @throws {Error} If targetDays < trackMinimumDays (infeasible track)
 */
function computeFeasibilityScore(targetDays, trackMinimumDays, trackAverageDays) {
  // PRECONDITION: targetDays >= trackMinimumDays
  // Infeasible tracks should be filtered before scoring
  if (targetDays < trackMinimumDays) {
    throw new Error(
      `Infeasible track passed to scoring: targetDays=${targetDays} < minimumDays=${trackMinimumDays}`
    );
  }

  // Perfect score if targetDays >= averageDays (comfortable timeline)
  if (targetDays >= trackAverageDays) {
    return 1.0;
  }

  // Linear interpolation between minimum and average
  // At minimum: score = 0.3 (tight but doable)
  // At average: score = 1.0 (comfortable)
  const range = trackAverageDays - trackMinimumDays;
  const position = targetDays - trackMinimumDays;

  return 0.3 + (0.7 * position) / range;
}

/**
 * Compute market score (0–1)
 *
 * Aggregates track's market value based on multiple factors:
 * - marketDemand (35%): Job postings, demand trends
 * - ecosystem (25%): Libraries, community support
 * - salaryPotential (20%): Earning potential
 * - futureProof (15%): Industry longevity and trends
 * - easeOfLearning (5%): Learning curve (minor factor)
 *
 * @param {Object} track - Track object with score fields
 * @returns {number} Score between 0 and 1
 */
function computeMarketScore(track) {
  const weights = {
    marketDemand: 0.35,
    ecosystem: 0.25,
    salaryPotential: 0.2,
    futureProof: 0.15,
    easeOfLearning: 0.05,
  };

  // Ensure all score fields exist, default to 0.5 if missing
  const marketDemandScore = track.marketDemandScore ?? 0.5;
  const ecosystemScore = track.ecosystemScore ?? 0.5;
  const salaryPotentialScore = track.salaryPotentialScore ?? 0.5;
  const futureProofScore = track.futureProofScore ?? 0.5;
  const easeOfLearningScore = track.easeOfLearningScore ?? 0.5;

  // Validate scores are in [0, 1]
  const scores = {
    marketDemandScore,
    ecosystemScore,
    salaryPotentialScore,
    futureProofScore,
    easeOfLearningScore,
  };

  for (const [key, value] of Object.entries(scores)) {
    if (value < 0 || value > 1) {
      throw new Error(`Invalid score for ${key}: ${value}. Must be between 0 and 1.`);
    }
  }

  return (
    marketDemandScore * weights.marketDemand +
    ecosystemScore * weights.ecosystem +
    salaryPotentialScore * weights.salaryPotential +
    futureProofScore * weights.futureProof +
    easeOfLearningScore * weights.easeOfLearning
  );
}

function computeFinalScore(skillFitScore, feasibilityScore, marketScore) {
  const weights = {
    skill: 0.4,
    feasibility: 0.3,
    market: 0.3,
  };

  return (
    weights.skill * skillFitScore +
    weights.feasibility * feasibilityScore +
    weights.market * marketScore
  );
}

function compareByTieBreakRules(left, right) {
  const scoreDelta = Math.abs(left.score - right.score);

  if (scoreDelta > 0.02) {
    return right.score - left.score;
  }

  if (left.scoreBreakdown.skillFit !== right.scoreBreakdown.skillFit) {
    return right.scoreBreakdown.skillFit - left.scoreBreakdown.skillFit;
  }

  if (left.marketDemandScore !== right.marketDemandScore) {
    return right.marketDemandScore - left.marketDemandScore;
  }

  if (left.minimumDays !== right.minimumDays) {
    return left.minimumDays - right.minimumDays;
  }

  return String(left.trackId).localeCompare(String(right.trackId));
}

/**
 * Select best track for a role based on skills and target timeline.
 *
 * @param {string} roleId
 * @param {number} targetDays
 * @param {Object} userSkills
 * @param {Object} options
 * @param {Array<Object>} options.tracks
 * @param {Object<string, Object>} options.templatesByTrackId
 * @returns {Object}
 */
function selectBestTrack(roleId, targetDays, userSkills, options = {}) {
  const tracks = Array.isArray(options.tracks) ? options.tracks : [];
  const templatesByTrackId = options.templatesByTrackId || {};

  const roleTracks = tracks.filter((track) => track.roleId === roleId);

  if (roleTracks.length === 0) {
    throw new Error(`No tracks found for roleId=${roleId}`);
  }

  // === FIX: Convert minimumHours to minimumDays for comparison ===
  // Tracks now use minimumHours, but trackSelector logic uses days
  // Assume 4 hours/day as baseline for minimum calculation
  const HOURS_PER_DAY_BASELINE = 4;

  const feasibleTracks = roleTracks.filter((track) => {
    // Convert track's minimumHours to days for backward compatibility
    const trackMinimumDays = track.minimumHours
      ? Math.ceil(track.minimumHours / HOURS_PER_DAY_BASELINE)
      : track.minimumDays || 0;
    return targetDays >= trackMinimumDays;
  });

  if (feasibleTracks.length === 0) {
    // === GUARD AGAINST NaN ===
    const minimumDaysValues = roleTracks
      .map((track) => {
        if (track.minimumHours && Number.isFinite(track.minimumHours)) {
          return Math.ceil(track.minimumHours / HOURS_PER_DAY_BASELINE);
        } else if (track.minimumDays && Number.isFinite(track.minimumDays)) {
          return track.minimumDays;
        } else {
          return Infinity; // Exclude invalid tracks
        }
      })
      .filter((val) => val !== Infinity);

    if (minimumDaysValues.length === 0) {
      const error = new Error('INTERNAL_CALCULATION_ERROR');
      error.statusCode = 500;
      error.details = {
        error: 'INTERNAL_CALCULATION_ERROR',
        message: 'No valid tracks with minimumHours or minimumDays',
        debugInfo: {
          roleId,
          trackCount: roleTracks.length,
          tracks: roleTracks.map((t) => ({
            id: t.id,
            minimumHours: t.minimumHours,
            minimumDays: t.minimumDays,
          })),
        },
      };
      throw error;
    }

    const minimumDaysRequired = Math.min(...minimumDaysValues);

    // === FINAL NaN GUARD ===
    if (!Number.isFinite(minimumDaysRequired)) {
      const error = new Error('INTERNAL_CALCULATION_ERROR');
      error.statusCode = 500;
      error.details = {
        error: 'INTERNAL_CALCULATION_ERROR',
        message: 'minimumDaysRequired calculation resulted in NaN or Infinity',
        debugInfo: {
          minimumDaysRequired,
          minimumDaysValues,
          roleTracks: roleTracks.map((t) => ({
            id: t.id,
            minimumHours: t.minimumHours,
            minimumDays: t.minimumDays,
          })),
        },
      };
      throw error;
    }

    const error = new Error(
      `INSUFFICIENT_TIME: targetDays=${targetDays}, minimumDaysRequired=${minimumDaysRequired}`
    );
    error.code = 'INSUFFICIENT_TIME';
    error.statusCode = 400;
    error.minimumDaysRequired = minimumDaysRequired;
    throw error;
  }

  const rankedTracks = feasibleTracks.map((track) => {
    const template = templatesByTrackId[track.id];
    if (!template) {
      throw new Error(`Missing roadmap template for trackId=${track.id}`);
    }

    // === FIX: Convert hours to days for feasibility scoring ===
    const HOURS_PER_DAY_BASELINE = 4;
    const trackMinimumDays = track.minimumHours
      ? Math.ceil(track.minimumHours / HOURS_PER_DAY_BASELINE)
      : track.minimumDays || 0;
    const trackAverageDays = track.averageHours
      ? Math.ceil(track.averageHours / HOURS_PER_DAY_BASELINE)
      : track.averageDays || trackMinimumDays * 1.3;

    const skillFit = computeSkillFitScore(userSkills, template);
    const feasibility = computeFeasibilityScore(targetDays, trackMinimumDays, trackAverageDays);
    const market = computeMarketScore(track);
    const finalScore = computeFinalScore(skillFit, feasibility, market);

    return {
      trackId: track.id,
      trackName: track.name,
      score: finalScore,
      minimumDays: trackMinimumDays,
      marketDemandScore: track.marketDemandScore ?? 0.5,
      reasons: [
        `Skill fit: ${(skillFit * 100).toFixed(1)}% match`,
        `Feasibility: ${targetDays} days vs minimum ${track.minimumDays} days`,
        `Market score: ${market.toFixed(3)}`,
      ],
      scoreBreakdown: {
        skillFit,
        feasibility,
        market,
      },
    };
  });

  rankedTracks.sort(compareByTieBreakRules);

  const chosen = rankedTracks[0];
  const alternatives = rankedTracks.slice(1).map((track) => ({
    trackId: track.trackId,
    trackName: track.trackName,
    score: track.score,
    reasons: track.reasons,
  }));

  return {
    chosenTrackId: chosen.trackId,
    chosenTrackName: chosen.trackName,
    score: chosen.score,
    reasons: chosen.reasons,
    alternatives,
    scoreBreakdown: chosen.scoreBreakdown,
  };
}

module.exports = {
  computeSkillFitScore,
  computeFeasibilityScore,
  computeMarketScore,
  computeFinalScore,
  selectBestTrack,
};

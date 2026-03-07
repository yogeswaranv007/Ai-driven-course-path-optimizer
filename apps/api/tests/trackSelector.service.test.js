/**
 * Unit Tests for TrackSelectorService
 *
 * Tests the three core scoring functions:
 * - computeSkillFitScore
 * - computeFeasibilityScore
 * - computeMarketScore
 */

const {
  computeSkillFitScore,
  computeFeasibilityScore,
  computeMarketScore,
  selectBestTrack,
} = require('../src/services/trackSelector.service');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a mock RoadmapTemplate for testing
 */
function createMockTemplate(nodes) {
  return { nodes };
}

/**
 * Create a mock Track with market scores
 */
function createMockTrack(overrides = {}) {
  return {
    id: 'test-track',
    name: 'Test Track',
    marketDemandScore: 0.85,
    ecosystemScore: 0.8,
    salaryPotentialScore: 0.75,
    futureProofScore: 0.7,
    easeOfLearningScore: 0.65,
    ...overrides,
  };
}

// ============================================================================
// TEST SUITE 1: computeSkillFitScore
// ============================================================================

console.log('\n=== TEST SUITE: computeSkillFitScore ===\n');

// Test 1.1: User with all mandatory skills (advanced proficiency)
(() => {
  const template = createMockTemplate([
    { skillId: 'javascript', priority: 'mandatory' },
    { skillId: 'react', priority: 'mandatory' },
  ]);

  const userSkills = {
    javascript: 'advanced',
    react: 'advanced',
  };

  const score = computeSkillFitScore(userSkills, template);
  const expected = 1.0;

  console.log(`✓ Test 1.1: User with all mandatory (advanced)`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 1.2: User with no skills (all "none")
(() => {
  const template = createMockTemplate([
    { skillId: 'javascript', priority: 'mandatory' },
    { skillId: 'react', priority: 'mandatory' },
  ]);

  const userSkills = {
    javascript: 'none',
    react: 'none',
  };

  const score = computeSkillFitScore(userSkills, template);
  const expected = 0.0;

  console.log(`✓ Test 1.2: User with no skills`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 1.3: Mixed priority and proficiency (from design doc example)
(() => {
  const template = createMockTemplate([
    { skillId: 'javascript-basics', priority: 'mandatory' },
    { skillId: 'javascript-basics', priority: 'mandatory' }, // duplicate
    { skillId: 'react-basics', priority: 'mandatory' },
    { skillId: 'node-basics', priority: 'mandatory' },
    { skillId: 'mongodb', priority: 'mandatory' },
    { skillId: 'skill5', priority: 'mandatory' },
    { skillId: 'skill6', priority: 'mandatory' },
    { skillId: 'skill7', priority: 'mandatory' },
    { skillId: 'skill8', priority: 'mandatory' },
    { skillId: 'skill9', priority: 'recommended' },
    { skillId: 'skill10', priority: 'recommended' },
  ]);

  const userSkills = {
    'javascript-basics': 'advanced',
    'react-basics': 'intermediate',
    'node-basics': 'basic',
    mongodb: 'none',
    skill5: 'none',
    skill6: 'none',
    skill7: 'none',
    skill8: 'none',
    skill9: 'none',
    skill10: 'none',
  };

  const score = computeSkillFitScore(userSkills, template);

  // Manual calculation:
  // Unique skills: javascript-basics, react-basics, node-basics, mongodb, skill5-10
  // Because of Set deduplication, we have:
  // - 8 mandatory unique skills
  // - 2 recommended unique skills
  // Total weight = 8*1.0 + 2*0.6 = 9.2
  // Earned:
  //   javascript-basics: mandatory, advanced → 1.0 * 1.0 = 1.0
  //   react-basics: mandatory, intermediate → 1.0 * 0.6 = 0.6
  //   node-basics: mandatory, basic → 1.0 * 0.3 = 0.3
  //   mongodb: mandatory, none → 1.0 * 0.0 = 0.0
  //   skill5-8: mandatory, none → 1.0 * 0.0 = 0.0 (4*0.0)
  //   skill9-10: recommended, none → 0.6 * 0.0 = 0.0 (2*0.0)
  // Total earned = 1.0 + 0.6 + 0.3 = 1.9
  // Score = 1.9 / 9.2 ≈ 0.2065

  const expected = 1.9 / 9.2;

  console.log(`✓ Test 1.3: Mixed priority and proficiency`);
  console.log(`  Expected: ${expected.toFixed(4)}, Got: ${score.toFixed(4)}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 1.4: Deduplication - same skill in multiple nodes
(() => {
  const template = createMockTemplate([
    { skillId: 'javascript', priority: 'mandatory' },
    { skillId: 'javascript', priority: 'mandatory' }, // duplicate
    { skillId: 'javascript', priority: 'mandatory' }, // triplicate
  ]);

  const userSkills = {
    javascript: 'advanced',
  };

  const score = computeSkillFitScore(userSkills, template);

  // With deduplication, only ONE javascript entry counted
  // Total weight = 1.0
  // Earned = 1.0 * 1.0 = 1.0
  // Score = 1.0 / 1.0 = 1.0
  const expected = 1.0;

  console.log(`✓ Test 1.4: Deduplication of duplicate skills`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 1.5: Intermediate proficiency
(() => {
  const template = createMockTemplate([{ skillId: 'javascript', priority: 'mandatory' }]);

  const userSkills = {
    javascript: 'intermediate',
  };

  const score = computeSkillFitScore(userSkills, template);

  // Total weight = 1.0
  // Earned = 1.0 * 0.6 = 0.6
  // Score = 0.6 / 1.0 = 0.6
  const expected = 0.6;

  console.log(`✓ Test 1.5: Intermediate proficiency`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 1.6: Optional skill
(() => {
  const template = createMockTemplate([{ skillId: 'javascript', priority: 'optional' }]);

  const userSkills = {
    javascript: 'advanced',
  };

  const score = computeSkillFitScore(userSkills, template);

  // Total weight = 0.3
  // Earned = 0.3 * 1.0 = 0.3
  // Score = 0.3 / 0.3 = 1.0
  const expected = 1.0;

  console.log(`✓ Test 1.6: Optional skill (advanced)`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 1.7: Missing skill defaults to "none"
(() => {
  const template = createMockTemplate([
    { skillId: 'javascript', priority: 'mandatory' },
    { skillId: 'python', priority: 'mandatory' },
  ]);

  const userSkills = {
    javascript: 'advanced',
    // python is missing
  };

  const score = computeSkillFitScore(userSkills, template);

  // Total weight = 1.0 + 1.0 = 2.0
  // javascript: earned = 1.0 * 1.0 = 1.0
  // python (missing): earned = 1.0 * 0.0 = 0.0
  // Total earned = 1.0
  // Score = 1.0 / 2.0 = 0.5
  const expected = 0.5;

  console.log(`✓ Test 1.7: Missing skill defaults to none`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 1.8: Error on invalid priority
(() => {
  const template = createMockTemplate([{ skillId: 'javascript', priority: 'invalid-priority' }]);

  const userSkills = {
    javascript: 'advanced',
  };

  try {
    computeSkillFitScore(userSkills, template);
    console.log(`✗ Test 1.8: Error on invalid priority - FAILED (no error thrown)`);
  } catch (e) {
    console.log(`✓ Test 1.8: Error on invalid priority`);
    console.log(`  Error: ${e.message}`);
  }
})();

// ============================================================================
// TEST SUITE 2: computeFeasibilityScore
// ============================================================================

console.log('\n=== TEST SUITE: computeFeasibilityScore ===\n');

// Test 2.1: targetDays >= averageDays (comfortable)
(() => {
  const score = computeFeasibilityScore(220, 180, 220);
  const expected = 1.0;

  console.log(`✓ Test 2.1: Comfortable timeline (targetDays >= averageDays)`);
  console.log(`  targetDays=220, min=180, avg=220`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 2.2: targetDays = minimumDays (tight timeline)
(() => {
  const score = computeFeasibilityScore(180, 180, 220);
  const expected = 0.3;

  console.log(`✓ Test 2.2: Tight timeline (targetDays = minimumDays)`);
  console.log(`  targetDays=180, min=180, avg=220`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 2.3: targetDays at midpoint (linear interpolation)
(() => {
  const score = computeFeasibilityScore(200, 180, 220);
  // range = 220 - 180 = 40
  // position = 200 - 180 = 20
  // score = 0.3 + (0.7 * 20 / 40) = 0.3 + 0.35 = 0.65
  const expected = 0.65;

  console.log(`✓ Test 2.3: Midpoint timeline`);
  console.log(`  targetDays=200, min=180, avg=220`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 2.4: targetDays > averageDays
(() => {
  const score = computeFeasibilityScore(300, 180, 220);
  const expected = 1.0;

  console.log(`✓ Test 2.4: Very comfortable timeline (targetDays > averageDays)`);
  console.log(`  targetDays=300, min=180, avg=220`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 2.5: Error on infeasible targetDays
(() => {
  try {
    computeFeasibilityScore(100, 180, 220);
    console.log(`✗ Test 2.5: Error on infeasible targetDays - FAILED (no error thrown)`);
  } catch (e) {
    console.log(`✓ Test 2.5: Error on infeasible targetDays`);
    console.log(`  targetDays=100, min=180, avg=220`);
    console.log(`  Error: ${e.message}`);
  }
})();

// Test 2.6: Design doc example (MERN track)
(() => {
  const score = computeFeasibilityScore(200, 180, 220);
  const expected = 0.65;

  console.log(`✓ Test 2.6: Design doc example (MERN)`);
  console.log(`  targetDays=200, min=180, avg=220`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// ============================================================================
// TEST SUITE 3: computeMarketScore
// ============================================================================

console.log('\n=== TEST SUITE: computeMarketScore ===\n');

// Test 3.1: Design doc MERN example
(() => {
  const track = createMockTrack({
    marketDemandScore: 0.95,
    ecosystemScore: 0.92,
    salaryPotentialScore: 0.88,
    futureProofScore: 0.9,
    easeOfLearningScore: 0.75,
  });

  const score = computeMarketScore(track);

  // Manual calculation:
  // (0.95 × 0.35) + (0.92 × 0.25) + (0.88 × 0.20) + (0.90 × 0.15) + (0.75 × 0.05)
  // = 0.3325 + 0.23 + 0.176 + 0.135 + 0.0375
  // = 0.911
  const expected = 0.911;

  console.log(`✓ Test 3.1: Design doc MERN example`);
  console.log(`  Expected: ${expected.toFixed(3)}, Got: ${score.toFixed(3)}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 3.2: All scores at 0.5 (neutral)
(() => {
  const track = createMockTrack({
    marketDemandScore: 0.5,
    ecosystemScore: 0.5,
    salaryPotentialScore: 0.5,
    futureProofScore: 0.5,
    easeOfLearningScore: 0.5,
  });

  const score = computeMarketScore(track);
  const expected = 0.5;

  console.log(`✓ Test 3.2: All scores at 0.5 (neutral)`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 3.3: All scores at 1.0 (maximum)
(() => {
  const track = createMockTrack({
    marketDemandScore: 1.0,
    ecosystemScore: 1.0,
    salaryPotentialScore: 1.0,
    futureProofScore: 1.0,
    easeOfLearningScore: 1.0,
  });

  const score = computeMarketScore(track);
  const expected = 1.0;

  console.log(`✓ Test 3.3: All scores at 1.0 (maximum)`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 3.4: All scores at 0.0 (minimum)
(() => {
  const track = createMockTrack({
    marketDemandScore: 0.0,
    ecosystemScore: 0.0,
    salaryPotentialScore: 0.0,
    futureProofScore: 0.0,
    easeOfLearningScore: 0.0,
  });

  const score = computeMarketScore(track);
  const expected = 0.0;

  console.log(`✓ Test 3.4: All scores at 0.0 (minimum)`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 3.5: Missing scores default to 0.5
(() => {
  const track = {
    id: 'test-track',
    name: 'Test Track',
    // All scores omitted
  };

  const score = computeMarketScore(track);
  const expected = 0.5; // All scores default to 0.5

  console.log(`✓ Test 3.5: Missing scores default to 0.5`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// Test 3.6: Error on invalid score (> 1)
(() => {
  const track = createMockTrack({
    marketDemandScore: 1.5, // Invalid
  });

  try {
    computeMarketScore(track);
    console.log(`✗ Test 3.6: Error on invalid score (> 1) - FAILED (no error thrown)`);
  } catch (e) {
    console.log(`✓ Test 3.6: Error on invalid score (> 1)`);
    console.log(`  Error: ${e.message}`);
  }
})();

// Test 3.7: Error on invalid score (< 0)
(() => {
  const track = createMockTrack({
    ecosystemScore: -0.1, // Invalid
  });

  try {
    computeMarketScore(track);
    console.log(`✗ Test 3.7: Error on invalid score (< 0) - FAILED (no error thrown)`);
  } catch (e) {
    console.log(`✓ Test 3.7: Error on invalid score (< 0)`);
    console.log(`  Error: ${e.message}`);
  }
})();

// Test 3.8: Weights verification (should sum to 1.0)
(() => {
  // All scores 1.0 should result in 1.0
  // All scores 0.0 should result in 0.0
  // Mixed (0.8) should result in 0.8

  const track = createMockTrack({
    marketDemandScore: 0.8,
    ecosystemScore: 0.8,
    salaryPotentialScore: 0.8,
    futureProofScore: 0.8,
    easeOfLearningScore: 0.8,
  });

  const score = computeMarketScore(track);
  const expected = 0.8; // Weights sum to 1.0, so 0.8 * 1.0 = 0.8

  console.log(`✓ Test 3.8: Weights verification (sum to 1.0)`);
  console.log(`  All scores = 0.8`);
  console.log(`  Expected: ${expected}, Got: ${score}`);
  console.assert(Math.abs(score - expected) < 0.01, `FAILED: Expected ${expected}, got ${score}`);
})();

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n=== ALL TESTS COMPLETED ===\n');
console.log('To run these tests, use:');
console.log('  node apps/api/tests/trackSelector.service.test.js');

// ============================================================================
// TEST SUITE 4: selectBestTrack
// ============================================================================

console.log('\n=== TEST SUITE: selectBestTrack ===\n');

function createSelectionFixtures() {
  const tracks = [
    {
      id: 'mern',
      roleId: 'fullstack',
      name: 'MERN Stack',
      minimumDays: 180,
      averageDays: 220,
      marketDemandScore: 0.95,
      ecosystemScore: 0.92,
      salaryPotentialScore: 0.88,
      futureProofScore: 0.9,
      easeOfLearningScore: 0.75,
    },
    {
      id: 'pern',
      roleId: 'fullstack',
      name: 'PERN Stack',
      minimumDays: 200,
      averageDays: 240,
      marketDemandScore: 0.72,
      ecosystemScore: 0.8,
      salaryPotentialScore: 0.82,
      futureProofScore: 0.78,
      easeOfLearningScore: 0.7,
    },
    {
      id: 'mean',
      roleId: 'fullstack',
      name: 'MEAN Stack',
      minimumDays: 190,
      averageDays: 230,
      marketDemandScore: 0.74,
      ecosystemScore: 0.8,
      salaryPotentialScore: 0.79,
      futureProofScore: 0.76,
      easeOfLearningScore: 0.71,
    },
  ];

  const templatesByTrackId = {
    mern: {
      nodes: [
        { skillId: 'javascript', priority: 'mandatory' },
        { skillId: 'react', priority: 'mandatory' },
        { skillId: 'node', priority: 'mandatory' },
        { skillId: 'mongodb', priority: 'mandatory' },
      ],
    },
    pern: {
      nodes: [
        { skillId: 'javascript', priority: 'mandatory' },
        { skillId: 'react', priority: 'mandatory' },
        { skillId: 'node', priority: 'mandatory' },
        { skillId: 'postgresql', priority: 'mandatory' },
      ],
    },
    mean: {
      nodes: [
        { skillId: 'javascript', priority: 'mandatory' },
        { skillId: 'angular', priority: 'mandatory' },
        { skillId: 'node', priority: 'mandatory' },
        { skillId: 'mongodb', priority: 'mandatory' },
      ],
    },
  };

  return { tracks, templatesByTrackId };
}

(() => {
  const fixtures = createSelectionFixtures();
  const userSkills = {
    javascript: 'advanced',
    react: 'intermediate',
    node: 'basic',
    mongodb: 'none',
  };

  const result = selectBestTrack('fullstack', 200, userSkills, fixtures);

  console.log('✓ Test 4.1: Select best feasible track by final score');
  console.log(`  chosenTrackId=${result.chosenTrackId}, score=${result.score.toFixed(3)}`);
  console.assert(
    result.chosenTrackId === 'mern',
    `FAILED: Expected mern, got ${result.chosenTrackId}`
  );
  console.assert(Array.isArray(result.alternatives), 'FAILED: alternatives should be an array');
})();

(() => {
  const fixtures = createSelectionFixtures();
  const userSkills = {
    javascript: 'advanced',
  };

  const result = selectBestTrack('fullstack', 185, userSkills, fixtures);

  console.log('✓ Test 4.2: Filter infeasible tracks before scoring');
  console.log(`  chosenTrackId=${result.chosenTrackId}`);
  console.assert(
    result.chosenTrackId === 'mern',
    `FAILED: Expected mern, got ${result.chosenTrackId}`
  );
})();

(() => {
  const fixtures = createSelectionFixtures();
  const userSkills = {
    javascript: 'advanced',
  };

  try {
    selectBestTrack('fullstack', 150, userSkills, fixtures);
    console.log(
      '✗ Test 4.3: INSUFFICIENT_TIME when all tracks infeasible - FAILED (no error thrown)'
    );
  } catch (error) {
    console.log('✓ Test 4.3: INSUFFICIENT_TIME when all tracks infeasible');
    console.log(`  code=${error.code}, minimumDaysRequired=${error.minimumDaysRequired}`);
    console.assert(
      error.code === 'INSUFFICIENT_TIME',
      `FAILED: expected INSUFFICIENT_TIME, got ${error.code}`
    );
    console.assert(
      error.minimumDaysRequired === 180,
      `FAILED: expected minimumDaysRequired 180, got ${error.minimumDaysRequired}`
    );
  }
})();

(() => {
  const tracks = [
    {
      id: 'a-track',
      roleId: 'fullstack',
      name: 'A Track',
      minimumDays: 180,
      averageDays: 220,
      marketDemandScore: 0.9,
      ecosystemScore: 0.8,
      salaryPotentialScore: 0.8,
      futureProofScore: 0.8,
      easeOfLearningScore: 0.8,
    },
    {
      id: 'b-track',
      roleId: 'fullstack',
      name: 'B Track',
      minimumDays: 180,
      averageDays: 220,
      marketDemandScore: 0.95,
      ecosystemScore: 0.8,
      salaryPotentialScore: 0.8,
      futureProofScore: 0.8,
      easeOfLearningScore: 0.8,
    },
  ];

  const templatesByTrackId = {
    'a-track': {
      nodes: [
        { skillId: 'js', priority: 'mandatory' },
        { skillId: 'react', priority: 'mandatory' },
      ],
    },
    'b-track': {
      nodes: [
        { skillId: 'js', priority: 'mandatory' },
        { skillId: 'vue', priority: 'mandatory' },
      ],
    },
  };

  const userSkills = {
    js: 'advanced',
    react: 'advanced',
    vue: 'none',
  };

  const result = selectBestTrack('fullstack', 200, userSkills, { tracks, templatesByTrackId });

  console.log('✓ Test 4.4: Tie-break favors higher skill fit when score gap <= 0.02');
  console.log(`  chosenTrackId=${result.chosenTrackId}`);
  console.assert(
    result.chosenTrackId === 'a-track',
    `FAILED: expected a-track, got ${result.chosenTrackId}`
  );
})();

(() => {
  const fixtures = createSelectionFixtures();

  try {
    selectBestTrack('non-existent-role', 200, {}, fixtures);
    console.log('✗ Test 4.5: Error when role has no tracks - FAILED (no error thrown)');
  } catch (error) {
    console.log('✓ Test 4.5: Error when role has no tracks');
    console.log(`  Error: ${error.message}`);
  }
})();

console.log('\n=== ALL TESTS COMPLETED ===\n');
console.log('To run these tests, use:');
console.log('  node apps/api/tests/trackSelector.service.test.js');

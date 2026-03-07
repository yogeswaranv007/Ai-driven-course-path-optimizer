const { generateRoadmap } = require('../src/services/roadmap.service');

console.log('\n=== TEST SUITE: roadmap.service (integration) ===\n');

// Helper: Create MERN template
function createMERNTemplate() {
  return {
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
}

// Helper: Create MERN track metadata
function createMERNTrack(id = 'mern-full-stack') {
  return {
    id,
    trackId: id,
    name: 'MERN Full Stack Developer',
    roleId: 'full-stack-developer',
    minimumDays: 180,
    averageDays: 220,
    marketDemandScore: 0.95,
    ecosystemScore: 0.9,
    salaryScore: 0.85,
    futureProofScore: 0.8,
    easeOfLearningScore: 0.6,
  };
}

// Helper: Create skills by ID
function createSkillsById() {
  return {
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
}

// Test 1: Full roadmap generation with comfortable timeline
(() => {
  const mernTrack = createMERNTrack('mern-1');
  const mernTemplate = createMERNTemplate();
  const skillsById = createSkillsById();

  const roadmap = generateRoadmap(
    'user-123',
    'full-stack-developer',
    200,
    {
      'javascript-basics': 'intermediate',
      react: 'basic',
      nodejs: 'none',
      mongodb: 'none',
      'mern-integration': 'none',
    },
    [mernTrack],
    { [mernTrack.id]: mernTemplate },
    skillsById,
    {
      startDate: new Date('2026-03-03T00:00:00.000Z'),
      hoursPerDay: 4,
    }
  );

  console.log('✓ Full roadmap generation with comfortable timeline');
  console.assert(roadmap.userId === 'user-123', `FAILED: unexpected userId ${roadmap.userId}`);
  console.assert(roadmap.roleId === 'full-stack-developer', `FAILED: unexpected roleId`);
  console.assert(roadmap.selectedTrackId === 'mern-1', `FAILED: unexpected trackId`);
  console.assert(roadmap.targetDays === 200, `FAILED: unexpected targetDays`);
  console.assert(roadmap.actualDays > 0, `FAILED: actualDays should be positive`);
  console.assert(roadmap.bufferDays >= 0, `FAILED: bufferDays should be non-negative`);
  console.assert(roadmap.nodes.length > 0, `FAILED: nodes should not be empty`);
  console.assert(
    roadmap.milestones.length >= 3,
    `FAILED: expected at least 3 milestones, got ${roadmap.milestones.length}`
  );
  console.assert(roadmap.endDate > roadmap.startDate, `FAILED: endDate should be after startDate`);
  console.assert(roadmap.roadmapId, `FAILED: roadmapId should be generated`);
})();

// Test 2: Verify topological ordering is applied (prerequisites respected)
(() => {
  const mernTrack = createMERNTrack('mern-2');
  const mernTemplate = createMERNTemplate();
  const skillsById = createSkillsById();

  const roadmap = generateRoadmap(
    'user-456',
    'full-stack-developer',
    200,
    { 'javascript-basics': 'none' },
    [mernTrack],
    { [mernTrack.id]: mernTemplate },
    skillsById,
    { hoursPerDay: 4 }
  );

  // Verify that js-basics comes before react-basics and node-backend
  const jsBasicsIdx = roadmap.nodes.findIndex((n) => n.nodeId === 'js-basics');
  const reactIdx = roadmap.nodes.findIndex((n) => n.nodeId === 'react-basics');
  const nodeIdx = roadmap.nodes.findIndex((n) => n.nodeId === 'node-backend');

  console.log('✓ Topological ordering: prerequisites are respected');
  console.assert(jsBasicsIdx < reactIdx, `FAILED: js-basics should come before react-basics`);
  console.assert(jsBasicsIdx < nodeIdx, `FAILED: js-basics should come before node-backend`);

  // Verify sequential dates (exclusive-end semantics)
  const bufferlessNodes = roadmap.nodes.filter((n) => n.nodeId !== 'buffer-node');
  const allDatesContinuous = bufferlessNodes.every((node, idx) => {
    if (idx === 0) return true;
    const prevNode = bufferlessNodes[idx - 1];
    return node.startDate.getTime() === prevNode.endDate.getTime();
  });

  console.assert(
    allDatesContinuous,
    `FAILED: nodes should have sequential dates with exclusive-end semantics`
  );
})();

// Test 3: Milestone aggregation is correct
(() => {
  const mernTrack = createMERNTrack('mern-3');
  const mernTemplate = createMERNTemplate();
  const skillsById = createSkillsById();

  const roadmap = generateRoadmap(
    'user-789',
    'full-stack-developer',
    250,
    {},
    [mernTrack],
    { [mernTrack.id]: mernTemplate },
    skillsById,
    { hoursPerDay: 4 }
  );

  // Verify milestones
  const milestone1 = roadmap.milestones.find((m) => m.milestoneId === 'milestone-1-foundations');
  const milestone2 = roadmap.milestones.find((m) => m.milestoneId === 'milestone-2-backend');
  const milestone3 = roadmap.milestones.find((m) => m.milestoneId === 'milestone-3-fullstack');

  console.log('✓ Milestone aggregation with correct date ranges');
  console.assert(milestone1, `FAILED: milestone-1 not found`);
  console.assert(milestone2, `FAILED: milestone-2 not found`);
  console.assert(milestone3, `FAILED: milestone-3 not found`);
  console.assert(milestone1.nodeCount > 0, `FAILED: milestone-1 should have nodes`);
  console.assert(milestone2.nodeCount > 0, `FAILED: milestone-2 should have nodes`);
  console.assert(milestone3.nodeCount > 0, `FAILED: milestone-3 should have nodes`);
  console.assert(
    milestone1.estimatedDays > 0,
    `FAILED: milestone-1 estimatedDays should be positive`
  );
  console.assert(
    milestone3.endDate > milestone1.startDate,
    `FAILED: milestone-3 should end after milestone-1 starts`
  );
})();

// Test 4: Buffer allocation is included
(() => {
  const mernTrack = createMERNTrack('mern-4');
  const mernTemplate = createMERNTemplate();
  const skillsById = createSkillsById();

  const roadmap = generateRoadmap(
    'user-999',
    'full-stack-developer',
    300,
    { react: 'advanced' },
    [mernTrack],
    { [mernTrack.id]: mernTemplate },
    skillsById,
    { hoursPerDay: 4 }
  );

  const bufferNode = roadmap.nodes.find((n) => n.nodeId === 'buffer-node');
  const bufferMilestone = roadmap.milestones.find((m) => m.isBuffer === true);

  console.log('✓ Buffer allocation included in nodes and milestones');
  console.assert(bufferNode, `FAILED: buffer-node should be present with extra days`);
  console.assert(bufferNode.estimatedDays > 0, `FAILED: buffer node should have days`);
  console.assert(bufferMilestone, `FAILED: buffer milestone should be created`);
  console.assert(roadmap.bufferDays > 0, `FAILED: bufferDays should be positive`);
})();

// Test 5: Proficiency adjustment is applied (advanced skill reduces actual days)
(() => {
  const mernTrack1 = createMERNTrack('mern-5a');
  const mernTrack2 = createMERNTrack('mern-5b');
  const mernTemplate = createMERNTemplate();
  const skillsById = createSkillsById();

  // Generate two roadmaps: one with basic skills, one with advanced
  const roadmapBasic = generateRoadmap(
    'user-basic',
    'full-stack-developer',
    400,
    { 'javascript-basics': 'basic' },
    [mernTrack1],
    { [mernTrack1.id]: mernTemplate },
    skillsById,
    { hoursPerDay: 4 }
  );

  const roadmapAdvanced = generateRoadmap(
    'user-advanced',
    'full-stack-developer',
    400,
    { 'javascript-basics': 'advanced' },
    [mernTrack2],
    { [mernTrack2.id]: mernTemplate },
    skillsById,
    { hoursPerDay: 4 }
  );

  console.log('✓ Proficiency adjustment reduces actual days for advanced skills');
  console.assert(
    roadmapAdvanced.actualDays < roadmapBasic.actualDays,
    `FAILED: advanced user should have fewer actual days. Basic: ${roadmapBasic.actualDays}, Advanced: ${roadmapAdvanced.actualDays}`
  );
})();

// Test 6: Error handling - insufficient time
(() => {
  const mernTrack = createMERNTrack('mern-6');
  const mernTemplate = createMERNTemplate();
  const skillsById = createSkillsById();

  try {
    generateRoadmap(
      'user-error',
      'full-stack-developer',
      50,
      {},
      [mernTrack],
      { [mernTrack.id]: mernTemplate },
      skillsById,
      { hoursPerDay: 4 }
    );
    console.log('✗ Error handling insufficient time - FAILED (no error thrown)');
  } catch (error) {
    console.log('✓ Error handling: INSUFFICIENT_TIME when targetDays too low');
    console.assert(
      error.code === 'INSUFFICIENT_TIME',
      `FAILED: expected INSUFFICIENT_TIME, got ${error.code}`
    );
  }
})();

// Test 7: Error handling - invalid parameters
(() => {
  const mernTrack = createMERNTrack('mern-7');
  const mernTemplate = createMERNTemplate();
  const skillsById = createSkillsById();

  try {
    generateRoadmap(
      '', // invalid: empty userId
      'full-stack-developer',
      200,
      {},
      [mernTrack],
      { [mernTrack.id]: mernTemplate },
      skillsById
    );
    console.log('✗ Error handling invalid parameters - FAILED (no error thrown)');
  } catch (error) {
    console.log('✓ Error handling: INVALID_PARAMETERS for missing userId');
    console.assert(
      error.code === 'INVALID_PARAMETERS',
      `FAILED: expected INVALID_PARAMETERS, got ${error.code}`
    );
  }
})();

// Test 8: Verify roadmapId uniqueness (timestamp-based)
(() => {
  const mernTrack1 = createMERNTrack('mern-8a');
  const mernTrack2 = createMERNTrack('mern-8b');
  const mernTemplate = createMERNTemplate();
  const skillsById = createSkillsById();

  const roadmap1 = generateRoadmap(
    'user-unique',
    'full-stack-developer',
    200,
    {},
    [mernTrack1],
    { [mernTrack1.id]: mernTemplate },
    skillsById,
    { hoursPerDay: 4 }
  );

  const roadmap2 = generateRoadmap(
    'user-unique',
    'full-stack-developer',
    200,
    {},
    [mernTrack2],
    { [mernTrack2.id]: mernTemplate },
    skillsById,
    { hoursPerDay: 4 }
  );

  console.log('✓ Roadmap IDs are unique across generations');
  console.assert(roadmap1.roadmapId !== roadmap2.roadmapId, `FAILED: roadmapIds should be unique`);
})();

// Test 9: Scoring metrics are included in result
(() => {
  const mernTrack = createMERNTrack('mern-9');
  const mernTemplate = createMERNTemplate();
  const skillsById = createSkillsById();

  const roadmap = generateRoadmap(
    'user-metrics',
    'full-stack-developer',
    200,
    { 'javascript-basics': 'intermediate' },
    [mernTrack],
    { [mernTrack.id]: mernTemplate },
    skillsById,
    { hoursPerDay: 4 }
  );

  console.log('✓ Scoring metrics are included in roadmap result');
  console.assert(roadmap.selectedTrackMetrics, `FAILED: selectedTrackMetrics not found`);
  console.assert(
    typeof roadmap.selectedTrackMetrics.skillFitScore === 'number',
    `FAILED: skillFitScore should be number`
  );
  console.assert(
    typeof roadmap.selectedTrackMetrics.feasibilityScore === 'number',
    `FAILED: feasibilityScore should be number`
  );
  console.assert(
    typeof roadmap.selectedTrackMetrics.marketScore === 'number',
    `FAILED: marketScore should be number`
  );
  console.assert(
    typeof roadmap.selectedTrackMetrics.finalScore === 'number',
    `FAILED: finalScore should be number`
  );
  console.assert(roadmap.reasoning, `FAILED: reasoning should be included`);
})();

console.log('\n=== roadmap.service integration tests completed ===\n');
console.log('To run these tests, use:');
console.log('  node apps/api/tests/roadmap.service.test.js');

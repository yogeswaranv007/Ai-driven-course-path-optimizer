const {
  topologicalSort,
  adjustNodeDurations,
  generateTimeline,
  generateMilestones,
} = require('../src/services/roadmapGenerator.service');

console.log('\n=== TEST SUITE: roadmapGenerator.service ===\n');

// -----------------------------------------------------------------------------
// topologicalSort
// -----------------------------------------------------------------------------

(() => {
  const nodes = [
    { nodeId: 'node-1', prerequisites: [] },
    { nodeId: 'node-2', prerequisites: ['node-1'] },
    { nodeId: 'node-3', prerequisites: ['node-2'] },
  ];

  const sorted = topologicalSort(nodes);
  const orderedIds = sorted.map((n) => n.nodeId);

  console.log('✓ topologicalSort orders nodes by prerequisites');
  console.assert(
    JSON.stringify(orderedIds) === JSON.stringify(['node-1', 'node-2', 'node-3']),
    `FAILED: Unexpected order ${orderedIds.join(', ')}`
  );
})();

(() => {
  const nodes = [{ nodeId: 'node-a', prerequisites: ['missing-node'] }];

  try {
    topologicalSort(nodes);
    console.log('✗ topologicalSort invalid prerequisite - FAILED (no error thrown)');
  } catch (error) {
    console.log('✓ topologicalSort throws on invalid prerequisite');
    console.assert(
      error.message.includes('Invalid prerequisite'),
      `FAILED: Unexpected error ${error.message}`
    );
  }
})();

(() => {
  const nodes = [
    { nodeId: 'node-1', prerequisites: ['node-2'] },
    { nodeId: 'node-2', prerequisites: ['node-1'] },
  ];

  try {
    topologicalSort(nodes);
    console.log('✗ topologicalSort cycle detection - FAILED (no error thrown)');
  } catch (error) {
    console.log('✓ topologicalSort detects cycle');
    console.assert(
      error.message.includes('Cycle detected'),
      `FAILED: Unexpected error ${error.message}`
    );
  }
})();

// -----------------------------------------------------------------------------
// adjustNodeDurations
// -----------------------------------------------------------------------------

(() => {
  const nodes = [
    {
      nodeId: 'node-1',
      skillId: 'javascript-basics',
      skillName: 'JavaScript Basics',
      milestoneId: 'milestone-1',
      estimatedHours: 40,
      priority: 'mandatory',
      prerequisites: [],
    },
    {
      nodeId: 'node-2',
      skillId: 'react-basics',
      skillName: 'React Basics',
      milestoneId: 'milestone-1',
      estimatedHours: 30,
      priority: 'mandatory',
      prerequisites: ['node-1'],
    },
  ];

  const userSkills = {
    'javascript-basics': 'advanced',
    'react-basics': 'intermediate',
  };

  const skillsById = {
    'javascript-basics': {
      proficiencyLevels: {
        none: 1.0,
        basic: 0.4,
        intermediate: 0.2,
        advanced: 0.05,
      },
    },
    'react-basics': {
      proficiencyLevels: {
        none: 1.0,
        basic: 0.4,
        intermediate: 0.2,
        advanced: 0.05,
      },
    },
  };

  const adjusted = adjustNodeDurations(nodes, userSkills, skillsById);

  console.log('✓ adjustNodeDurations applies proficiency multipliers');
  console.assert(
    adjusted[0].adjustedHours === 2,
    `FAILED: expected 2, got ${adjusted[0].adjustedHours}`
  );
  console.assert(
    adjusted[1].adjustedHours === 6,
    `FAILED: expected 6, got ${adjusted[1].adjustedHours}`
  );
  console.assert(
    adjusted[0].sequenceOrder === 1,
    `FAILED: expected sequenceOrder 1, got ${adjusted[0].sequenceOrder}`
  );
  console.assert(
    adjusted[1].sequenceOrder === 2,
    `FAILED: expected sequenceOrder 2, got ${adjusted[1].sequenceOrder}`
  );
})();

// -----------------------------------------------------------------------------
// generateTimeline
// -----------------------------------------------------------------------------

(() => {
  const nodes = [
    {
      nodeId: 'node-1',
      skillId: 'javascript-basics',
      skillName: 'JavaScript Basics',
      milestoneId: 'milestone-1',
      baseHours: 40,
      adjustedHours: 2,
      proficiencyLevel: 'advanced',
      priority: 'mandatory',
      prerequisites: [],
      sequenceOrder: 1,
      startDate: null,
      endDate: null,
      estimatedDays: 0,
    },
    {
      nodeId: 'node-2',
      skillId: 'react-basics',
      skillName: 'React Basics',
      milestoneId: 'milestone-1',
      baseHours: 30,
      adjustedHours: 6,
      proficiencyLevel: 'intermediate',
      priority: 'mandatory',
      prerequisites: ['node-1'],
      sequenceOrder: 2,
      startDate: null,
      endDate: null,
      estimatedDays: 0,
    },
  ];

  const startDate = new Date('2026-03-03T00:00:00.000Z');
  const result = generateTimeline(nodes, 5, startDate, 4);

  console.log('✓ generateTimeline allocates sequential exclusive date ranges');
  console.assert(
    result.requiredDays === 2,
    `FAILED: expected requiredDays 2, got ${result.requiredDays}`
  );
  console.assert(
    result.bufferDays === 3,
    `FAILED: expected bufferDays 3, got ${result.bufferDays}`
  );
  console.assert(
    result.nodes.length === 3,
    `FAILED: expected 3 nodes (incl buffer), got ${result.nodes.length}`
  );

  const firstNode = result.nodes[0];
  const secondNode = result.nodes[1];
  const bufferNode = result.nodes[2];

  console.assert(
    firstNode.estimatedDays === 1,
    `FAILED: expected first estimatedDays 1, got ${firstNode.estimatedDays}`
  );
  console.assert(
    secondNode.estimatedDays === 2,
    `FAILED: expected second estimatedDays 2, got ${secondNode.estimatedDays}`
  );
  console.assert(
    secondNode.startDate.getTime() === firstNode.endDate.getTime(),
    'FAILED: expected node-2 startDate to equal node-1 endDate (exclusive semantics)'
  );
  console.assert(
    bufferNode.nodeId === 'buffer-node',
    `FAILED: expected buffer-node, got ${bufferNode.nodeId}`
  );
  console.assert(
    JSON.stringify(bufferNode.prerequisites) === JSON.stringify(['node-2']),
    `FAILED: expected buffer prereq ['node-2'], got ${JSON.stringify(bufferNode.prerequisites)}`
  );
})();

(() => {
  const nodes = [];
  const startDate = new Date('2026-03-03T00:00:00.000Z');
  const result = generateTimeline(nodes, 3, startDate, 4);

  console.log('✓ generateTimeline handles empty nodes safely and still inserts buffer');
  console.assert(
    result.nodes.length === 1,
    `FAILED: expected only buffer node, got ${result.nodes.length}`
  );
  console.assert(result.nodes[0].nodeId === 'buffer-node', 'FAILED: expected buffer-node');
  console.assert(
    JSON.stringify(result.nodes[0].prerequisites) === JSON.stringify([]),
    `FAILED: expected empty prerequisites, got ${JSON.stringify(result.nodes[0].prerequisites)}`
  );
})();

(() => {
  const nodes = [
    {
      nodeId: 'node-1',
      skillId: 'javascript-basics',
      skillName: 'JavaScript Basics',
      milestoneId: 'milestone-1',
      baseHours: 40,
      adjustedHours: 20,
      proficiencyLevel: 'basic',
      priority: 'mandatory',
      prerequisites: [],
      sequenceOrder: 1,
      startDate: null,
      endDate: null,
      estimatedDays: 0,
    },
  ];

  try {
    generateTimeline(nodes, 2, new Date('2026-03-03T00:00:00.000Z'), 4);
    console.log('✗ generateTimeline insufficient time - FAILED (no error thrown)');
  } catch (error) {
    console.log('✓ generateTimeline throws INSUFFICIENT_TIME when targetDays too low');
    console.assert(
      error.code === 'INSUFFICIENT_TIME',
      `FAILED: expected INSUFFICIENT_TIME, got ${error.code}`
    );
    console.assert(
      error.requiredDays === 5,
      `FAILED: expected requiredDays 5, got ${error.requiredDays}`
    );
  }
})();

// -----------------------------------------------------------------------------
// generateMilestones
// -----------------------------------------------------------------------------

(() => {
  const nodes = [
    {
      nodeId: 'node-1',
      skillId: 'javascript-basics',
      skillName: 'JavaScript Basics',
      milestoneId: 'milestone-1',
      baseHours: 40,
      adjustedHours: 2,
      proficiencyLevel: 'advanced',
      priority: 'mandatory',
      prerequisites: [],
      sequenceOrder: 1,
      startDate: new Date('2026-03-03T00:00:00.000Z'),
      endDate: new Date('2026-03-04T00:00:00.000Z'),
      estimatedDays: 1,
    },
    {
      nodeId: 'node-2',
      skillId: 'react-basics',
      skillName: 'React Basics',
      milestoneId: 'milestone-1',
      baseHours: 30,
      adjustedHours: 6,
      proficiencyLevel: 'intermediate',
      priority: 'mandatory',
      prerequisites: ['node-1'],
      sequenceOrder: 2,
      startDate: new Date('2026-03-04T00:00:00.000Z'),
      endDate: new Date('2026-03-06T00:00:00.000Z'),
      estimatedDays: 2,
    },
  ];

  const templateMilestones = [
    {
      milestoneId: 'milestone-1',
      name: 'JavaScript Foundation',
      description: 'Learn JavaScript and React basics',
    },
  ];

  const result = generateMilestones(templateMilestones, nodes);

  console.log('✓ generateMilestones aggregates nodes by milestoneId with correct date range');
  console.assert(result.length === 1, `FAILED: expected 1 milestone, got ${result.length}`);
  console.assert(
    result[0].milestoneId === 'milestone-1',
    `FAILED: expected milestone-1, got ${result[0].milestoneId}`
  );
  console.assert(
    result[0].milestoneName === 'JavaScript Foundation',
    `FAILED: unexpected name ${result[0].milestoneName}`
  );
  console.assert(
    result[0].nodeCount === 2,
    `FAILED: expected nodeCount 2, got ${result[0].nodeCount}`
  );
  console.assert(
    result[0].startDate.getTime() === new Date('2026-03-03T00:00:00.000Z').getTime(),
    'FAILED: unexpected startDate'
  );
  console.assert(
    result[0].endDate.getTime() === new Date('2026-03-06T00:00:00.000Z').getTime(),
    'FAILED: unexpected endDate'
  );
  console.assert(
    result[0].estimatedDays === 3,
    `FAILED: expected estimatedDays 3, got ${result[0].estimatedDays}`
  );
})();

(() => {
  const nodes = [
    {
      nodeId: 'node-1',
      skillId: 'javascript-basics',
      skillName: 'JavaScript Basics',
      milestoneId: 'milestone-1',
      baseHours: 40,
      adjustedHours: 2,
      proficiencyLevel: 'advanced',
      priority: 'mandatory',
      prerequisites: [],
      sequenceOrder: 1,
      startDate: new Date('2026-03-03T00:00:00.000Z'),
      endDate: new Date('2026-03-13T00:00:00.000Z'),
      estimatedDays: 10,
    },
    {
      nodeId: 'buffer-node',
      skillId: 'buffer',
      skillName: 'Review & Catch-up Time',
      milestoneId: 'buffer-milestone',
      baseHours: 0,
      adjustedHours: 0,
      proficiencyLevel: 'none',
      priority: 'optional',
      prerequisites: ['node-1'],
      sequenceOrder: 2,
      startDate: new Date('2026-03-13T00:00:00.000Z'),
      endDate: new Date('2026-03-20T00:00:00.000Z'),
      estimatedDays: 7,
    },
  ];

  const templateMilestones = [
    {
      milestoneId: 'milestone-1',
      name: 'Core Skills',
      description: 'Foundation skills',
    },
  ];

  const result = generateMilestones(templateMilestones, nodes);

  console.log('✓ generateMilestones appends buffer milestone if buffer-node exists');
  console.assert(result.length === 2, `FAILED: expected 2 milestones, got ${result.length}`);
  console.assert(
    result[1].milestoneId === 'buffer-milestone',
    `FAILED: expected buffer-milestone, got ${result[1].milestoneId}`
  );
  console.assert(
    result[1].milestoneName === 'Review & Catch-up Time',
    'FAILED: unexpected buffer name'
  );
  console.assert(result[1].isBuffer === true, 'FAILED: expected isBuffer flag');
  console.assert(
    result[1].estimatedDays === 7,
    `FAILED: expected buffer estimatedDays 7, got ${result[1].estimatedDays}`
  );
})();

(() => {
  const nodes = [
    {
      nodeId: 'node-1',
      skillId: 'javascript-basics',
      skillName: 'JavaScript Basics',
      milestoneId: 'milestone-1',
      baseHours: 40,
      adjustedHours: 2,
      proficiencyLevel: 'advanced',
      priority: 'mandatory',
      prerequisites: [],
      sequenceOrder: 1,
      startDate: new Date('2026-03-03T00:00:00.000Z'),
      endDate: new Date('2026-03-04T00:00:00.000Z'),
      estimatedDays: 1,
    },
    {
      nodeId: 'node-2',
      skillId: 'react-basics',
      skillName: 'React Basics',
      milestoneId: 'milestone-2',
      baseHours: 30,
      adjustedHours: 6,
      proficiencyLevel: 'intermediate',
      priority: 'mandatory',
      prerequisites: ['node-1'],
      sequenceOrder: 2,
      startDate: new Date('2026-03-04T00:00:00.000Z'),
      endDate: new Date('2026-03-08T00:00:00.000Z'),
      estimatedDays: 4,
    },
    {
      nodeId: 'node-3',
      skillId: 'node-backend',
      skillName: 'Node & Express',
      milestoneId: 'milestone-2',
      baseHours: 50,
      adjustedHours: 10,
      proficiencyLevel: 'basic',
      priority: 'mandatory',
      prerequisites: ['node-2'],
      sequenceOrder: 3,
      startDate: new Date('2026-03-08T00:00:00.000Z'),
      endDate: new Date('2026-03-13T00:00:00.000Z'),
      estimatedDays: 5,
    },
  ];

  const templateMilestones = [
    {
      milestoneId: 'milestone-1',
      name: 'JavaScript Foundation',
      description: 'Learn JavaScript basics',
    },
    {
      milestoneId: 'milestone-2',
      name: 'Frontend & Backend',
      description: 'Learn React and Node.js',
    },
  ];

  const result = generateMilestones(templateMilestones, nodes);

  console.log('✓ generateMilestones handles multiple milestones independently');
  console.assert(result.length === 2, `FAILED: expected 2 milestones, got ${result.length}`);
  console.assert(
    result[0].milestoneName === 'JavaScript Foundation',
    'FAILED: unexpected first milestone name'
  );
  console.assert(
    result[0].estimatedDays === 1,
    `FAILED: expected first milestone estimatedDays 1, got ${result[0].estimatedDays}`
  );
  console.assert(
    result[1].milestoneName === 'Frontend & Backend',
    'FAILED: unexpected second milestone name'
  );
  console.assert(
    result[1].estimatedDays === 9,
    `FAILED: expected second milestone estimatedDays 9, got ${result[1].estimatedDays}`
  );
  console.assert(
    result[1].nodeCount === 2,
    `FAILED: expected second milestone nodeCount 2, got ${result[1].nodeCount}`
  );
})();

(() => {
  const nodes = [];
  const templateMilestones = [
    {
      milestoneId: 'milestone-1',
      name: 'Some Milestone',
      description: 'This milestone has no nodes',
    },
  ];

  const result = generateMilestones(templateMilestones, nodes);

  console.log('✓ generateMilestones skips template milestones with no matching nodes');
  console.assert(result.length === 0, `FAILED: expected 0 milestones, got ${result.length}`);
})();
console.log('To run these tests, use:');
console.log('  node apps/api/tests/roadmapGenerator.service.test.js');

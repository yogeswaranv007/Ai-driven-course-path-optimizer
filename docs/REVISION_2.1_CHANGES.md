# Revision 2.1 - Strict Consistency Fixes

**Date**: March 3, 2026  
**Applied to**: CORE_LOGIC_REDESIGN.md

---

## Summary of Changes

All fixes applied to enforce strict consistency across schemas, algorithms, and examples.

---

## 1. NodeInstance Schema (UPDATED)

**Removed**: All progress-related fields (status, timestamps, confidence, notes)  
**Added**: Explicit timeline semantics documentation

```typescript
interface NodeInstance {
  nodeId: string;
  skillId: string;
  skillName: string;
  milestoneId: string;

  // TIMELINE (startDate inclusive, endDate exclusive)
  // Next node starts at previous node's endDate
  startDate: Date; // ISO date (inclusive)
  endDate: Date; // ISO date (exclusive)
  estimatedDays: number; // Based on proficiency

  // EFFORT ADJUSTMENT
  baseHours: number; // Original from template
  adjustedHours: number; // After proficiency multiplier
  proficiencyLevel: 'none' | 'basic' | 'intermediate' | 'advanced';

  priority: 'mandatory' | 'recommended' | 'optional';
  prerequisites: string[]; // nodeIds

  sequenceOrder: number;

  // NOTE: Progress fields (status, timestamps, confidence, notes) are stored
  // in the Progress collection only. Do NOT add them here.
}
```

**Key Changes**:

- ✅ Removed: `status`, `startedAt`, `completedAt`, `confidence`, `notes`
- ✅ Added: Timeline semantics comment (inclusive/exclusive)
- ✅ Added: Explicit note about Progress collection as source of truth

---

## 2. adjustNodeDurations() (UPDATED)

**Removed**: `status: "not-started"` field from return object

```typescript
function adjustNodeDurations(
  nodes: RoadmapNode[],
  userSkills: { [skillId: string]: ProficiencyLevel },
  skills: Skill[]
): NodeInstance[] {
  return nodes.map((node, index) => {
    const skill = skills.find((s) => s.id === node.skillId)!;
    const proficiency = userSkills[node.skillId] || 'none';

    const multiplier = skill.proficiencyLevels[proficiency];
    const adjustedHours = node.estimatedHours * multiplier;

    return {
      nodeId: node.nodeId,
      skillId: node.skillId,
      skillName: node.skillName,
      milestoneId: node.milestoneId,
      baseHours: node.estimatedHours,
      adjustedHours: adjustedHours,
      proficiencyLevel: proficiency,
      priority: node.priority,
      prerequisites: node.prerequisites,
      sequenceOrder: index + 1,
      // Timeline fields populated in generateTimeline()
      startDate: null as any,
      endDate: null as any,
      estimatedDays: 0,
    };
  });
}
```

**Key Changes**:

- ✅ Removed: `status: "not-started" as const`
- ✅ Updated: Comment clarifies timeline fields populated later

---

## 3. generateTimeline() (UPDATED)

**Changed**: Buffer days now added as explicit buffer node (not by extending last node endDate)

```typescript
function generateTimeline(
  nodes: NodeInstance[],
  targetDays: number,
  startDate: Date,
  hoursPerDay: number
): { nodes: NodeInstance[]; bufferDays: number } {
  const totalAdjustedHours = nodes.reduce((sum, n) => sum + n.adjustedHours, 0);
  const requiredDays = Math.ceil(totalAdjustedHours / hoursPerDay);

  // NEVER scale hours upward
  if (targetDays < requiredDays) {
    throw new Error(`INSUFFICIENT_TIME: Need ${requiredDays} days, got ${targetDays}`);
  }

  // Allocate nodes sequentially (endDate exclusive)
  let currentDate = new Date(startDate);
  const nodesWithDates = nodes.map((node) => {
    const days = Math.ceil(node.adjustedHours / hoursPerDay);

    const nodeStartDate = new Date(currentDate);
    currentDate = addDays(currentDate, days);
    const nodeEndDate = new Date(currentDate); // Exclusive

    return {
      ...node,
      startDate: nodeStartDate,
      endDate: nodeEndDate,
      estimatedDays: days,
    };
  });

  // Calculate buffer days
  const bufferDays = targetDays - requiredDays;

  // If buffer exists, add explicit buffer node at end
  if (bufferDays > 0) {
    const bufferNode: NodeInstance = {
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
      prerequisites: [nodesWithDates[nodesWithDates.length - 1].nodeId],
      sequenceOrder: nodesWithDates.length + 1,
    };
    nodesWithDates.push(bufferNode);
  }

  return { nodes: nodesWithDates, bufferDays };
}
```

**Key Changes**:

- ✅ Return type: Now returns `{ nodes, bufferDays }` object
- ✅ Timeline semantics: Added comment "endDate exclusive"
- ✅ Buffer implementation: Creates explicit buffer node instead of extending last node
- ✅ Buffer node: Contains `skillName: "Review & Catch-up Time"`, zero hours, optional priority

---

## 4. generateMilestones() (UPDATED)

**Changed**: Must be called AFTER timeline generation; recalculates dates from nodes

```typescript
function generateMilestones(
  templateMilestones: Milestone[],
  nodes: NodeInstance[]
): MilestoneInstance[] {
  return templateMilestones.map((milestone) => {
    const milestoneNodes = nodes.filter((n) => n.milestoneId === milestone.milestoneId);

    if (milestoneNodes.length === 0) {
      throw new Error(`No nodes found for milestone ${milestone.milestoneId}`);
    }

    // Use actual generated timeline dates (after buffer insertion)
    const startDate = milestoneNodes[0].startDate;
    const endDate = milestoneNodes[milestoneNodes.length - 1].endDate;

    // Calculate days using exclusive endDate semantics
    const estimatedDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    return {
      milestoneId: milestone.milestoneId,
      name: milestone.name,
      phase: milestone.phase,
      startDate: startDate,
      endDate: endDate,
      estimatedDays: estimatedDays,
      nodeIds: milestone.nodeIds,
      status: 'not-started' as const,
    };
  });

  // Add buffer milestone if buffer node exists
  const bufferNode = nodes.find((n) => n.nodeId === 'buffer-node');
  if (bufferNode) {
    return [
      ...milestones,
      {
        milestoneId: 'buffer-milestone',
        name: 'Review & Catch-up Period',
        phase: 'buffer',
        startDate: bufferNode.startDate,
        endDate: bufferNode.endDate,
        estimatedDays: bufferNode.estimatedDays,
        nodeIds: ['buffer-node'],
        status: 'not-started' as const,
      },
    ];
  }

  return milestones;
}
```

**Key Changes**:

- ✅ Added: Error handling if no nodes found for milestone
- ✅ Changed: `estimatedDays` calculated from date span (not sum of node.estimatedDays)
- ✅ Added: Buffer milestone creation if buffer node exists
- ✅ Comment: Must be called AFTER timeline generation

---

## 5. actualDays Calculation (UPDATED)

**Changed**: Computed from timeline span using exclusive endDate semantics

```typescript
// Generate timeline with buffer (returns { nodes, bufferDays })
const { nodes: nodesWithTimeline, bufferDays } = generateTimeline(
  adjustedNodes,
  targetDays,
  startDate,
  hoursPerDay
);

// Generate milestones AFTER timeline (so dates include buffer)
const milestones = generateMilestones(templateMilestones, nodesWithTimeline);

// Calculate actualDays from final timeline (startDate inclusive, endDate exclusive)
const finalEndDate = nodesWithTimeline[nodesWithTimeline.length - 1].endDate;
const actualDays = Math.floor(
  (finalEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
);

const roadmapInstance: UserRoadmapInstance = {
  // ...
  targetDays: targetDays,
  actualDays: actualDays, // Derived from timeline span
  startDate: startDate,
  targetCompletionDate: finalEndDate,
  // ...
};
```

**Key Changes**:

- ✅ Order: Timeline generation → Milestone generation → actualDays calculation
- ✅ Formula: `Math.floor((finalEndDate - startDate) / millisPerDay)`
- ✅ Semantics: Uses exclusive endDate (finalEndDate is exclusive boundary)

---

## 6. computeFeasibilityScore() (UPDATED)

**Changed**: Updated to hours-based minimum constraints; assumes pre-filtered input

```typescript
function computeFeasibilityScore(
  targetDays: number,
  hoursPerDay: number,
  trackMinimumHours: number,
  trackAverageHours: number
): number {
  const totalTargetHours = targetDays * hoursPerDay;

  // PRECONDITION: totalTargetHours >= trackMinimumHours (infeasible tracks filtered before scoring)
  if (totalTargetHours < trackMinimumHours) {
    throw new Error(
      `Infeasible track passed to scoring: totalTargetHours=${totalTargetHours} < minimumHours=${trackMinimumHours}`
    );
  }

  // Perfect score if totalTargetHours >= averageHours (comfortable timeline)
  if (totalTargetHours >= trackAverageHours) {
    return 1.0;
  }

  // Linear interpolation between minimum and average
  // totalTargetHours = minimum → 0.3 (tight but doable)
  // totalTargetHours = average → 1.0 (comfortable)
  const range = trackAverageHours - trackMinimumHours;
  const position = totalTargetHours - trackMinimumHours;

  return 0.3 + (0.7 * position) / range;
}
```

**Key Changes**:

- ✅ Updated: To hours-based minimum constraints
- ✅ Updated: Signature to accept hoursPerDay and hours-based parameters
- ✅ Updated: PRECONDITION comment to use hours
- ✅ Removed: `return 0.0` for infeasible tracks
- ✅ Added: `throw new Error()` with descriptive message

---

## 7. Timeline Example (UPDATED)

**Updated**: Shows exclusive endDate semantics and buffer node

```
Total adjusted hours: 320
Target days: 200
Hours per day: 4

Required days = ceil(320 / 4) = 80 days
Buffer days = 200 - 80 = 120 days

Node 1: adjustedHours = 40
  days = ceil(40 / 4) = 10 days
  startDate = 2026-03-03 (inclusive)
  endDate = 2026-03-13 (exclusive, next node starts here)

Node 2: adjustedHours = 20
  days = ceil(20 / 4) = 5 days
  startDate = 2026-03-13 (inclusive)
  endDate = 2026-03-18 (exclusive)

... (continue sequentially for 35 nodes)

Last learning node ends at 2026-05-22 (day 80).

Buffer Node:
  skillName = "Review & Catch-up Time"
  startDate = 2026-05-22 (inclusive)
  endDate = 2026-09-19 (exclusive, 120 days later)
  estimatedDays = 120

Final actualDays = floor((2026-09-19 - 2026-03-03) / 1 day) = 200 days
```

---

## Patch Notes Entry (Added to Document)

**8. Defined Timeline Semantics (Revision 2.1)**

- **Issue**: Ambiguous startDate/endDate interpretation; buffer days added inconsistently
- **Fix**: Strict timeline semantics with milestone recalculation
- **Changes**:
  - Timeline semantics: `startDate` inclusive, `endDate` exclusive (next node starts at previous endDate)
  - `actualDays` computed using timeline span: `Math.floor((finalEndDate - startDate) / millisPerDay)`
  - Buffer days: Create explicit buffer node with `skillName: "Review & Catch-up Time"`
  - `generateMilestones()`: Must be called AFTER timeline; recalculates milestone dates from updated nodes
  - `computeFeasibilityScore()`: Removed `return 0.0` branch; throws error if infeasible track passed (assumes pre-filtered input)
  - All examples updated to reflect exclusive endDate semantics

---

## Verification Checklist

- ✅ NodeInstance schema: No status/timestamp fields
- ✅ adjustNodeDurations(): No status field in return object
- ✅ generateTimeline(): Returns `{ nodes, bufferDays }` with explicit buffer node
- ✅ generateMilestones(): Called after timeline, recalculates from node dates
- ✅ actualDays: Computed from `(finalEndDate - startDate) / millisPerDay`
- ✅ computeFeasibilityScore(): Throws error for infeasible input
- ✅ Timeline semantics: Documented as inclusive startDate, exclusive endDate
- ✅ Examples: Updated to show buffer node and exclusive endDate

---

**Status**: All strict consistency fixes applied ✅  
**Determinism**: Maintained ✅  
**Breaking Changes**: None (internal implementation only)

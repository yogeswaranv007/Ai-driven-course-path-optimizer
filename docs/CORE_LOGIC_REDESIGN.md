# Learning Path Optimizer — Core Logic Redesign

## Complete System Architecture (roadmap.sh-Inspired Logic)

**Date**: March 3, 2026  
**Status**: Production-Ready Design  
**Revision**: 2.3 (Consistency & Scoring Integrity Fixes)

---

## Patch Notes (Revision 2.0 → 2.1)

### Changes Applied

**1. Fixed Graph ID Mismatch (Topological Sort Bug)**

- **Issue**: RoadmapNode.prerequisites used nodeIds but RoadmapEdge used skillIds, causing inconsistency
- **Fix**: Removed `RoadmapEdge` interface entirely
- **Changes**:
  - `RoadmapTemplate` schema: Removed `edges: RoadmapEdge[]` field
  - `topologicalSort()`: Now uses only `node.prerequisites` (nodeId-to-nodeId)
  - Adjacency list and in-degree computation now built from prerequisites array
  - Example updated to show prerequisites-only approach

**2. Fixed Timeline Scaling Logic**

- **Issue**: Previous logic scaled hours upward when `targetDays > requiredDays`, inflating work
- **Fix**: Never scale hours up; add explicit buffer/slack days instead
- **Changes**:
  - `generateTimeline()`: Removed `scaleFactor = totalAvailableHours / totalHours`
  - Nodes allocated sequentially with actual `adjustedHours` (no scaling)
  - If `targetDays > requiredDays`, buffer days added at end (or distributed across milestones)
  - If `targetDays < requiredDays`, throw `INSUFFICIENT_TIME` error
  - Timeline example updated: 320 hours → 80 required days, 120 buffer days = 200 total

**3. Fixed actualDays Calculation**

- **Issue**: Calculated as `totalAdjustedHours / hoursPerDay`, not matching timeline
- **Fix**: Derived from generated timeline's last node endDate
- **Changes**:
  - `actualDays = Math.floor((lastNode.endDate - startDate) / millisPerDay)`
  - Example updated: actualDays = 200 (matching targetDays with buffer)

**4. Fixed Feasibility Validation**

- **Issue**: Tracks were scored even when `totalTargetHours < track.minimumHours`
- **Fix**: Both planning modes validate hours against track minimums
- **Changes**:
  - `computeDailyHoursMode()`: Clamps proficiency-adjusted hours to minimumHours in step 1
  - `computeDeadlineDaysMode()`: 4-step validation including minimum hours constraint
  - If all tracks excluded → throw `INSUFFICIENT_TIME` with `minimumHoursRequired`
  - `computeFeasibilityScore()`: Only called for feasible tracks
  - Updated method documentation with error handling

**5. Standardized Score Semantics**

- **Issue**: Inconsistent naming (`learningCurveScore` ambiguous)
- **Fix**: Renamed to `easeOfLearningScore` (higher = easier)
- **Changes**:
  - Track schema: `learningCurveScore` → `easeOfLearningScore`
  - `computeMarketScore()`: Updated field reference
  - Track example JSON updated
  - All score fields now follow "higher = better" semantics

**6. Fixed SkillFitScore Example**

- **Issue**: Example showed `/10 mandatory skills` without explaining priority weighting
- **Fix**: Updated with correct priority-weighted denominator
- **Changes**:
  - Example now shows: 8 mandatory (weight 1.0) + 2 recommended (weight 0.6) = 9.2 total weight
  - Earned weight calculation: (1.0×1.0) + (0.6×1.0) + (0.3×1.0) = 1.9
  - Final score: 1.9 / 9.2 = 0.207 (matches formula logic)

**7. Clarified Progress Data Source of Truth**

- **Issue**: Progress existed in both `UserRoadmapInstance.nodes[].status` and `Progress` collection
- **Fix**: Progress collection is the source of truth
- **Changes**:
  - `NodeInstance` schema: Removed `status`, `startedAt`, `completedAt`, `confidence`, `notes` fields
  - Added comment: "Progress cached from Progress collection, not source of truth"
  - `checkMilestoneCompletion()`: Now queries Progress collection instead of roadmap.nodes
  - Output examples updated to remove status fields from nodes
  - Progress Tracking section: Added explicit note about source of truth

**8. Defined Timeline Semantics (Revision 2.1)**

- **Issue**: Ambiguous startDate/endDate interpretation; buffer days added inconsistently
- **Fix**: Strict timeline semantics with milestone recalculation
- **Changes**:
  - Timeline semantics: `startDate` inclusive, `endDate` exclusive (next node starts at previous endDate)
  - `actualDays` computed using timeline span: `Math.floor((finalEndDate - startDate) / millisPerDay)`
  - Buffer days: After inserting buffer, `generateMilestones()` recalculates milestone dates from updated node timeline
  - `computeFeasibilityScore()`: Removed `return 0.0` branch; assumes pre-filtered input (infeasible tracks already excluded)
  - All examples updated to reflect exclusive endDate semantics

---

**Determinism Status**: ✅ All changes maintain deterministic behavior  
**Breaking Changes**: Schema changes require database migration for existing roadmaps

---

## Patch Notes (Revision 2.1 → 2.2)

### Changes Applied

**1. Added Strict Phase Type Definition**

- **Issue**: `phase` fields used inline union types without a single source of truth
- **Fix**: Defined explicit `type Phase` union
- **Changes**:
  - Added `type Phase = "foundation" | "core" | "advanced" | "capstone" | "buffer";`
  - Applied to `RoadmapNode.phase`, `Milestone.phase`, `MilestoneInstance.phase`
  - Ensures type consistency and prevents invalid phase values

**2. Confirmed generateMilestones() Correctness**

- **Verified**:
  - ✓ Uses `const millisPerDay = 24 * 60 * 60 * 1000`
  - ✓ Sorts `milestoneNodes` by `sequenceOrder` before date aggregation
  - ✓ Uses exclusive endDate semantics: `Math.floor((endDate - startDate) / millisPerDay)`
  - ✓ Builds milestones first, appends buffer milestone if `bufferNode` exists
  - ✓ Returns milestones array (no early returns)
  - ✓ No undefined variable references

**3. Confirmed Step 7 (UserRoadmapInstance Creation) Correctness**

- **Verified**:
  - ✓ Uses `nodesWithTimeline` (properly destructured from `generateTimeline`)
  - ✓ `nodes: nodesWithTimeline` field correctly populated
  - ✓ `totalNodes: nodesWithTimeline.length` includes buffer node
  - ✓ `targetCompletionDate = finalEndDate` (from last node's exclusive endDate)
  - ✓ `actualDays` computed using exclusive endDate: `Math.floor((finalEndDate - startDate) / millisPerDay)`
  - ✓ Deterministic generation with no randomization (only `generateId()` called)

**4. Enhanced Determinism Rules Section**

- **Addition**: New subsection "Buffer Insertion & Milestone Generation Determinism (Revision 2.2)"
- **Guarantees**:
  - Buffer node inserted deterministically if `bufferDays > 0` (always produces same nodeId="buffer-node")
  - Milestones recalculated using actual generated timeline (after buffer insertion)
  - `actualDays` computed with exclusive endDate semantics
  - Same inputs (targetDays, proficiencies, hoursPerDay) → same outputs (node timeline, milestones, actualDays)

**Status**: ✅ All Revision 2.2 requirements met  
**Breaking Changes**: None (schema already compatible)

---

## Patch Notes (Revision 2.2 → 2.3)

### Changes Applied

**1. Fixed actualDays Formula Consistency**

- **Issue**: Revision 2.1 used `Math.ceil` for actualDays calculation, inconsistent with exclusive endDate semantics
- **Fix**: Changed to `Math.floor` to match timeline interpretation
- **Changes**:
  - Updated Revision 2.1 patch notes: `actualDays = Math.floor((lastNode.endDate - startDate) / millisPerDay)`
  - Ensures actualDays strictly represents calendar days between startDate (inclusive) and endDate (exclusive)

**2. Added Empty Template Safety Check in generateTimeline()**

- **Issue**: Buffer node creation crashed if no primary nodes existed (edge case)
- **Fix**: Conditional prerequisite assignment
- **Changes**:
  - Buffer node prerequisites now checked: `nodesWithDates.length > 0 ? [...] : []`
  - Prevents index out-of-bounds error on empty templates

**3. Fixed Duplicate Skill Counting in computeSkillFitScore()**

- **Issue**: If same skill appeared in multiple nodes/milestones, score was inflated
- **Fix**: Deduplicate skillIds using `Set`
- **Changes**:
  - Changed: `const trackSkillIds = trackTemplate.nodes.map(n => n.skillId);`
  - To: `const trackSkillIds = Array.from(new Set(trackTemplate.nodes.map(n => n.skillId)));`
  - Ensures each skill weighted only once in fit score calculation

**Status**: ✅ All Revision 2.3 requirements met  
**Breaking Changes**: None (implementation fixes only)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Core Data Models](#core-data-models)
4. [Module Architecture](#module-architecture)
5. [Track Selection Engine](#track-selection-engine)
6. [Planning Modes (Revision 3.0)](#planning-modes-revision-30)
7. [Roadmap Generation Algorithm](#roadmap-generation-algorithm)
8. [Progress Tracking System](#progress-tracking-system)
9. [API Contracts](#api-contracts)
10. [Determinism Rules & Testing](#determinism-rules--testing)
11. [Implementation Guide](#implementation-guide)

---

## Executive Summary

### Problem Statement

The current roadmap generation logic doesn't enforce minimum time requirements, lacks deterministic track selection, and doesn't produce timeline-based roadmaps suitable for job-readiness tracking.

### Solution Architecture

A complete rewrite of core logic inspired by roadmap.sh's node-based tracking model, featuring:

- ✅ **Time-Bound Planning**: Each role/track has `minimumHours`; reject impossible deadlines
- ✅ **Deterministic Track Selection**: Scoring formula with skill fit + market demand + timeline feasibility
- ✅ **Proficiency-Aware Generation**: Skip/shorten nodes based on existing skills
- ✅ **Timeline-Based Output**: Day-by-day or week-by-week schedule with milestones
- ✅ **Node-Level Progress**: Status tracking with timestamps, confidence, notes (roadmap.sh-style)
- ✅ **Explainability**: "Why this track?" with alternatives and reasoning

### Key Innovations

1. **Skill-Fit Score**: Measures overlap between user's current skills and track requirements
2. **Feasibility Check**: Validates if totalTargetHours ≥ minimumHours before generation
3. **Adaptive Pacing**: Compresses or expands timeline based on proficiency levels
4. **Market-Aware Selection**: Uses updatable track metadata (job demand, salary, trend)
5. **Immutable Roadmaps**: Each generation creates a new instance; progress is preserved

---

## System Overview

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                     │
│  (Role Selection → Skill Assessment → Timeline Input →      │
│   Roadmap Display → Progress Tracking)                      │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                     API LAYER (Express)                     │
│  /roles, /tracks, /assess-skills, /generate-roadmap,       │
│  /roadmaps/:id, /roadmaps/:id/progress                     │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                   SERVICE LAYER (Core Logic)                │
├─────────────────────────────────────────────────────────────┤
│  • TrackSelectorService      (scoring + ranking)            │
│  • RoadmapGeneratorService   (timeline + milestones)        │
│  • SkillAssessorService      (proficiency mapping)          │
│  • ProgressTrackerService    (node status updates)          │
│  • TimelineBuilderService    (day-by-day scheduling)        │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│              REPOSITORY LAYER (Data Access)                 │
├─────────────────────────────────────────────────────────────┤
│  • RoleRepository           (fetch roles + metadata)        │
│  • TrackRepository          (fetch tracks + scores)         │
│  • SkillRepository          (global skill catalog)          │
│  • RoadmapTemplateRepo      (skill graphs)                  │
│  • UserRoadmapRepo          (user instances)                │
│  • ProgressRepository       (node tracking)                 │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                   DATABASE LAYER (MongoDB)                  │
│  roles, tracks, skills, roadmap_templates,                  │
│  user_roadmap_instances, progress                           │
└─────────────────────────────────────────────────────────────┘
```

### User Journey (Updated Flow)

```
1. ROLE SELECTION
   │
   ├─ GET /api/v1/roles
   │  → [{ id: "fullstack", name: "Full Stack Developer",
   │       minimumHours: 150, marketDemand: "very-high" }]
   │
   └─ User selects: "Full Stack Developer", hoursPerDay = 3

2. TIMELINE INPUT
   │
   ├─ User enters: targetDays = 40
   │     totalTargetHours = 40 × 3 = 120 hours
   │
   ├─ GET /api/v1/roles/fullstack/tracks
   │  → [{ id: "mern", minimumHours: 150 },
   │      { id: "pern", minimumHours: 200 }]
   │
   ├─ VALIDATION: Check if totalTargetHours ≥ max(track.minimumHours)
   │  → 120 < 150 → REJECT
   │
   └─ Response: {
        error: "INSUFFICIENT_TIME",
        minimumHoursRequired: 150,
        message: "Full Stack Developer requires at least 150 hours (50 days at 3 hrs/day)"
      }

3. SKILL ASSESSMENT
   │
   ├─ GET /api/v1/roles/fullstack/assessment-skills
   │  → Returns 8-12 key skills for assessment
   │
   ├─ User provides proficiency:
   │  {
   │    "javascript-basics": "advanced",
   │    "react-basics": "intermediate",
   │    "node-basics": "basic",
   │    "databases": "none",
   │    ...
   │  }
   │
   └─ POST /api/v1/skill-assessments
      → Saves user's skill profile

4. TRACK SELECTION + ROADMAP GENERATION
   │
   ├─ POST /api/v1/roadmaps/generate
   │  {
   │    roleId: "fullstack",
   │    targetDays: 200,  // now valid
   │    userSkills: { ... }
   │  }
   │
   ├─ TrackSelectorService.selectBestTrack()
   │  │
   │  ├─ For each track (MERN, PERN, ...):
   │  │  ├─ Compute skillFitScore
   │  │  ├─ Compute feasibilityScore (totalTargetHours vs minimumHours/averageHours)
   │  │  ├─ Apply market weights
   │  │  └─ Calculate finalScore
   │  │
   │  └─ Return: {
   │       chosenTrack: "mern",
   │       score: 0.87,
   │       alternatives: [...],
   │       reasons: ["Best skill fit (0.92)", "MERN stack has highest demand"]
   │     }
   │
   ├─ RoadmapGeneratorService.generate()
   │  │
   │  ├─ Fetch RoadmapTemplate (skill graph)
   │  ├─ Apply topological sort
   │  ├─ Adjust node durations based on proficiency
   │  ├─ Generate timeline (start/end dates per node)
   │  ├─ Create milestones
   │  └─ Return UserRoadmapInstance
   │
   └─ Response: {
        roadmapInstanceId: "rm-abc123",
        trackId: "mern",
        totalDays: 195,
        startDate: "2026-03-03",
        targetCompletionDate: "2026-09-14",
        milestones: [...],
        nodes: [...],
        explainability: { ... }
      }

5. PROGRESS TRACKING
   │
   ├─ GET /api/v1/roadmaps/rm-abc123
   │  → Full roadmap with current progress
   │
   ├─ PATCH /api/v1/roadmaps/rm-abc123/nodes/node-5
   │  {
   │    status: "in-progress",
   │    confidence: "medium",
   │    notes: "Completed 3/5 subtasks"
   │  }
   │
   └─ Progress saved; roadmap updated
```

---

## Core Data Models

### 1. Role

**Purpose**: A job role or career path (e.g., Full Stack Developer, DevOps Engineer).

**Schema**:

```typescript
interface Role {
  id: string; // "fullstack", "backend", "devops"
  name: string; // "Full Stack Developer"
  description: string;
  category: string; // "web-development", "data-science"

  // MINIMUM TIME REQUIREMENT (HOURS-BASED, Revision 3.0)
  minimumHours: number; // Absolute minimum for any track (e.g., 150)

  // MARKET DATA
  marketDemand: 'very-high' | 'high' | 'medium' | 'low';
  averageSalary: number; // USD for reference
  jobOpenings: number; // Current market data (updatable)

  // ASSESSMENT CONFIGURATION
  coreSkillIds: string[]; // Skills for initial assessment (8-12 skills)

  tracks: string[]; // Available track IDs
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:

```json
{
  "id": "fullstack",
  "name": "Full Stack Developer",
  "description": "Build complete web applications from frontend to backend",
  "category": "web-development",
  "minimumHours": 150,
  "marketDemand": "very-high",
  "averageSalary": 95000,
  "jobOpenings": 12500,
  "coreSkillIds": [
    "javascript-basics",
    "html-css",
    "react-basics",
    "node-basics",
    "express",
    "databases",
    "rest-api",
    "git",
    "authentication",
    "deployment"
  ],
  "tracks": ["mern", "pern", "mean", "lamp"]
}
```

---

### 2. Track

**Purpose**: A specific technology stack within a role (e.g., MERN vs PERN for Full Stack).

**Schema**:

```typescript
interface Track {
  id: string; // "mern", "pern"
  roleId: string; // Parent role
  name: string; // "MERN Stack"
  description: string;

  // STACK DEFINITION
  primaryTechnologies: string[]; // ["MongoDB", "Express", "React", "Node"]

  // TIME REQUIREMENTS (HOURS-BASED, Revision 3.0)
  minimumHours: number; // Track-specific minimum hours (e.g., 150)
  averageHours: number; // Typical completion hours (e.g., 195)

  // MARKET SCORES (0-1, updatable, higher = better)
  marketDemandScore: number; // Job postings, trend data
  ecosystemScore: number; // Libraries, community, tooling
  easeOfLearningScore: number; // 1 = easier, 0 = harder
  salaryPotentialScore: number; // Relative earning potential
  futureProofScore: number; // Industry adoption trend

  // SKILL GRAPH REFERENCE
  templateId: string; // Points to RoadmapTemplate
  templateVersion: string; // "1.0", "1.1"

  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:

```json
{
  "id": "mern",
  "roleId": "fullstack",
  "name": "MERN Stack (MongoDB, Express, React, Node)",
  "description": "JavaScript full-stack with React frontend",
  "primaryTechnologies": ["MongoDB", "Express.js", "React", "Node.js"],
  "minimumHours": 150,
  "averageHours": 195,
  "marketDemandScore": 0.95,
  "ecosystemScore": 0.92,
  "easeOfLearningScore": 0.75,
  "salaryPotentialScore": 0.88,
  "futureProofScore": 0.9,
  "templateId": "mern-v2",
  "templateVersion": "2.0"
}
```

---

### 3. Skill

**Purpose**: An atomic, learnable unit of knowledge (global, reusable across tracks).

**Schema**:

```typescript
interface Skill {
  id: string; // "react-hooks"
  name: string; // "React Hooks"
  category: 'foundation' | 'core' | 'advanced' | 'specialized';

  description: string;
  learningObjectives: string[]; // What you'll be able to do

  // EFFORT ESTIMATION
  estimatedHours: number; // Base hours (no proficiency)

  // PROFICIENCY LEVELS (for adaptive pacing)
  proficiencyLevels: {
    none: number; // 1.0x multiplier (full time)
    basic: number; // 0.4x multiplier (40% time)
    intermediate: number; // 0.2x multiplier (20% time)
    advanced: number; // 0.05x multiplier (skip or quick review)
  };

  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // METADATA
  tags: string[]; // ["frontend", "react", "state-management"]
  relatedSkillIds: string[]; // Soft references

  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:

````json
{
  "id": "react-hooks",
  "name": "React Hooks (useState, useEffect, Custom Hooks)",
  "category": "core",
  "description": "Master stateful logic in functional React components",
  "learningObjectives": [
    "Use useState for component state",
    "Handle side effects with useEffect",
    "Create custom hooks for reusable logic"
  ],
  "estimatedHours": 24,
  "proficiencyLevels": {
    "none": 1.0,
    "basic": 0.4,
    "intermediate": 0.2,
    "advanced": 0.05
  },
  "difficulty": "intermediate",
  "tags": ["frontend", "react", "state-management"]
}\`\`\`

---

### Phase Type (Strict Union - Revision 2.2)

```typescript
type Phase = "foundation" | "core" | "advanced" | "capstone" | "buffer";
````

**Usage**: Ensures strict type safety for `RoadmapNode.phase`, `Milestone.phase`, `MilestoneInstance.phase`, and phase-related queries.

---

### 4. RoadmapTemplate

**Purpose**: A versioned skill graph (DAG) defining the learning path for a track.

**Schema**:

```typescript
interface RoadmapTemplate {
  id: string; // "mern-v2"
  trackId: string;
  version: string; // "2.0"

  // SKILL GRAPH (DAG) - Prerequisites defined in nodes only
  nodes: RoadmapNode[];

  // MILESTONES (logical groupings)
  milestones: Milestone[];

  // METADATA
  totalEstimatedHours: number; // Sum of all node hours
  createdAt: Date;
  updatedAt: Date;
}

interface RoadmapNode {
  nodeId: string; // "node-1"
  skillId: string; // Reference to Skill
  skillName: string; // Denormalized for convenience

  milestoneId: string; // Which milestone this belongs to
  phase: Phase; // Strict type from Phase union

  estimatedHours: number; // From Skill.estimatedHours
  priority: 'mandatory' | 'recommended' | 'optional';

  // PREREQUISITES (enforces order)
  prerequisites: string[]; // Array of nodeIds that must complete first
}

interface Milestone {
  milestoneId: string; // "milestone-1"
  name: string; // "JavaScript Fundamentals"
  description: string;
  phase: Phase; // Strict type from Phase union
  nodeIds: string[]; // Nodes in this milestone
  estimatedHours: number; // Sum of node hours
  sequenceOrder: number; // Display order
}
```

**Example**:

```json
{
  "id": "mern-v2",
  "trackId": "mern",
  "version": "2.0",
  "nodes": [
    {
      "nodeId": "node-1",
      "skillId": "javascript-basics",
      "skillName": "JavaScript Fundamentals",
      "milestoneId": "milestone-1",
      "phase": "foundation",
      "estimatedHours": 40,
      "priority": "mandatory",
      "prerequisites": []
    },
    {
      "nodeId": "node-2",
      "skillId": "es6-features",
      "skillName": "ES6+ Features",
      "milestoneId": "milestone-1",
      "phase": "foundation",
      "estimatedHours": 20,
      "priority": "mandatory",
      "prerequisites": ["node-1"]
    },
    {
      "nodeId": "node-3",
      "skillId": "react-basics",
      "skillName": "React Basics",
      "milestoneId": "milestone-2",
      "phase": "core",
      "estimatedHours": 30,
      "priority": "mandatory",
      "prerequisites": ["node-1", "node-2"]
    }
  ],
  "milestones": [
    {
      "milestoneId": "milestone-1",
      "name": "JavaScript Fundamentals",
      "description": "Core JavaScript skills",
      "phase": "foundation",
      "nodeIds": ["node-1", "node-2"],
      "estimatedHours": 60,
      "sequenceOrder": 1
    }
  ],
  "totalEstimatedHours": 450
}
```

---

### 5. UserProfile

**Purpose**: User's learning preferences and skill inventory (updatable).

**Schema**:

```typescript
interface UserProfile {
  userId: string;

  // SKILL PROFICIENCY MAP
  skillProficiencies: {
    [skillId: string]: 'none' | 'basic' | 'intermediate' | 'advanced';
  };

  // LEARNING PREFERENCES
  learningGoal: 'job-hunting' | 'upskilling' | 'career-switch';
  hoursPerDay: number; // Available study time (e.g., 3)
  timezone: string;

  // HISTORY
  assessmentCompletedAt?: Date;
  lastUpdatedAt: Date;
}
```

**Example**:

```json
{
  "userId": "user-123",
  "skillProficiencies": {
    "javascript-basics": "advanced",
    "react-basics": "intermediate",
    "node-basics": "basic",
    "mongodb": "none",
    "express": "basic"
  },
  "learningGoal": "job-hunting",
  "hoursPerDay": 4,
  "timezone": "America/New_York",
  "assessmentCompletedAt": "2026-03-03T10:00:00Z",
  "lastUpdatedAt": "2026-03-03T10:00:00Z"
}
```

---

### 6. UserRoadmapInstance

**Purpose**: An immutable snapshot of a generated roadmap with timeline (roadmap.sh-style).

**Schema**:

```typescript
interface UserRoadmapInstance {
  roadmapInstanceId: string; // "rm-abc123"
  userId: string;

  // TRACK INFO
  roleId: string;
  trackId: string;
  trackName: string;

  // TIMELINE (NEW)
  targetDays: number; // User's requested timeline
  actualDays: number; // Computed based on proficiency
  startDate: Date; // ISO date
  targetCompletionDate: Date; // ISO date

  // ROADMAP CONTENT
  milestones: MilestoneInstance[];
  nodes: NodeInstance[];

  // EXPLAINABILITY
  trackSelection: {
    chosenTrackId: string;
    score: number;
    reasons: string[];
    alternatives: AlternativeTrack[];
  };

  // PROGRESS SUMMARY
  totalNodes: number;
  completedNodes: number;
  inProgressNodes: number;
  currentMilestone: string | null;

  // STATUS
  status: 'active' | 'paused' | 'completed' | 'abandoned';

  // TIMESTAMPS
  generatedAt: Date;
  lastActivityAt: Date;
}

interface MilestoneInstance {
  milestoneId: string;
  name: string;
  phase: Phase; // Strict type from Phase union
  startDate: Date; // ISO date
  endDate: Date; // ISO date
  estimatedDays: number;
  nodeIds: string[];
  status: 'not-started' | 'in-progress' | 'completed';
}

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

interface AlternativeTrack {
  trackId: string;
  trackName: string;
  score: number;
  reasons: string[];
}
```

---

### 7. Progress

**Purpose**: Detailed tracking of each node's progress (separate collection for scalability).

**Schema**:

```typescript
interface Progress {
  progressId: string;
  roadmapInstanceId: string;
  nodeId: string;
  userId: string;

  // STATUS
  status: 'not-started' | 'in-progress' | 'completed' | 'skipped';

  // TIMESTAMPS
  startedAt?: Date;
  completedAt?: Date;
  lastUpdatedAt: Date;

  // SELF-ASSESSMENT (roadmap.sh-style)
  confidence?: 'low' | 'medium' | 'high';
  notes?: string;

  // TIME TRACKING
  timeSpentHours?: number; // Actual time logged
}
```

---

## Module Architecture

### Service Layer Modules

#### 1. TrackSelectorService

**Responsibility**: Deterministically select the best track for a user.

**Key Methods**:

```typescript
class TrackSelectorService {
  /**
   * Select best track for a role based on user's skills and timeline.
   * Excludes tracks where totalTargetHours < track.minimumHours before scoring.
   *
   * @returns TrackSelectionResult with chosen track, score, reasoning, alternatives
   * @throws INSUFFICIENT_TIME if all tracks are infeasible
   */
  async selectBestTrack(
    roleId: string,
    targetDays: number,
    userSkills: UserProfile['skillProficiencies']
  ): Promise<TrackSelectionResult>;

  /**
   * Compute skill fit score: overlap between user skills and track requirements.
   */
  private computeSkillFitScore(
    userSkills: UserProfile['skillProficiencies'],
    trackTemplate: RoadmapTemplate
  ): number;

  /**
   * Compute feasibility score: how realistic is totalTargetHours for this track?
   */
  private computeFeasibilityScore(
    targetDays: number,
    hoursPerDay: number,
    trackMinimumHours: number,
    trackAverageHours: number
  ): number;

  /**
   * Apply market weights to track scores.
   */
  private computeMarketScore(track: Track): number;

  /**
   * Combine all scores into final ranking.
   */
  private computeFinalScore(
    skillFitScore: number,
    feasibilityScore: number,
    marketScore: number
  ): number;
}
```

**Scoring Formula** (see [Track Selection Engine](#track-selection-engine) for details).

---

#### 2. RoadmapGeneratorService

**Responsibility**: Generate a timeline-based roadmap from a template.

**Key Methods**:

```typescript
class RoadmapGeneratorService {
  /**
   * Generate a complete roadmap instance with timeline.
   */
  async generateRoadmap(
    userId: string,
    roleId: string,
    trackId: string,
    targetDays: number,
    userSkills: UserProfile['skillProficiencies']
  ): Promise<UserRoadmapInstance>;

  /**
   * Apply topological sort to skill graph (respects prerequisites).
   */
  private topologicalSort(nodes: RoadmapNode[]): RoadmapNode[];

  /**
   * Adjust node durations based on proficiency levels.
   */
  private adjustNodeDurations(
    nodes: RoadmapNode[],
    userSkills: UserProfile['skillProficiencies']
  ): NodeInstance[];

  /**
   * Generate start/end dates for each node based on targetDays.
   */
  private generateTimeline(
    nodes: NodeInstance[],
    targetDays: number,
    startDate: Date,
    hoursPerDay: number
  ): NodeInstance[];

  /**
   * Create milestone instances with aggregated dates.
   */
  private generateMilestones(
    templateMilestones: Milestone[],
    nodes: NodeInstance[]
  ): MilestoneInstance[];
}
```

**Algorithm** (see [Roadmap Generation Algorithm](#roadmap-generation-algorithm) for details).

---

#### 3. SkillAssessorService

**Responsibility**: Map user input to proficiency levels.

**Key Methods**:

```typescript
class SkillAssessorService {
  /**
   * Fetch assessment skills for a role.
   */
  async getAssessmentSkills(roleId: string): Promise<Skill[]>;

  /**
   * Save user's skill proficiency assessment.
   */
  async saveAssessment(
    userId: string,
    skillProficiencies: { [skillId: string]: ProficiencyLevel }
  ): Promise<void>;

  /**
   * Infer proficiency for skills not assessed (fallback to "none").
   */
  inferProficiencyForUnassessedSkills(
    assessedSkills: { [skillId: string]: ProficiencyLevel },
    allTrackSkills: string[]
  ): { [skillId: string]: ProficiencyLevel };
}
```

---

#### 4. ProgressTrackerService

**Responsibility**: Update and query node-level progress.

**Key Methods**:

```typescript
class ProgressTrackerService {
  /**
   * Update progress for a specific node.
   */
  async updateNodeProgress(
    roadmapInstanceId: string,
    nodeId: string,
    update: {
      status?: NodeStatus;
      confidence?: ConfidenceLevel;
      notes?: string;
      timeSpentHours?: number;
    }
  ): Promise<void>;

  /**
   * Get current progress summary for a roadmap.
   */
  async getProgressSummary(roadmapInstanceId: string): Promise<ProgressSummary>;

  /**
   * Mark milestone as completed when all nodes are done.
   */
  async checkMilestoneCompletion(roadmapInstanceId: string, milestoneId: string): Promise<boolean>;
}
```

---

#### 5. TimelineBuilderService

**Responsibility**: Convert hours into day-by-day schedule.

**Key Methods**:

```typescript
class TimelineBuilderService {
  /**
   * Distribute total hours across targetDays.
   * Returns array of {date, hoursAllocated} pairs.
   */
  distributeHours(
    totalHours: number,
    targetDays: number,
    hoursPerDay: number,
    startDate: Date
  ): DailySchedule[];

  /**
   * Assign nodes to days based on estimated hours.
   */
  assignNodesToDays(nodes: NodeInstance[], schedule: DailySchedule[]): NodeInstance[]; // with startDate/endDate populated

  /**
   * Handle weekends/holidays (optional extension).
   */
  skipNonWorkingDays?(schedule: DailySchedule[]): DailySchedule[];
}
```

---

## Track Selection Engine

### Objective

Select the track with the highest **final score**, computed from:

1. **Skill Fit Score**: How well user's current skills match the track
2. **Feasibility Score**: How realistic is totalTargetHours given track's minimumHours and averageHours
3. **Market Score**: Job demand, ecosystem, salary potential

### Scoring Formula

```
finalScore = (W_skill × skillFitScore) + (W_feasibility × feasibilityScore) + (W_market × marketScore)

Where:
  W_skill       = 0.40  (40% weight on skill fit)
  W_feasibility = 0.30  (30% weight on timeline feasibility)
  W_market      = 0.30  (30% weight on market factors)

Total = 1.00
```

### Component Score Calculations

#### 1. Skill Fit Score (0–1)

**Measures**: Overlap between user's skills and track's required skills, weighted by proficiency.

**Algorithm**:

```typescript
function computeSkillFitScore(
  userSkills: { [skillId: string]: ProficiencyLevel },
  trackTemplate: RoadmapTemplate
): number {
  const trackSkillIds = Array.from(new Set(trackTemplate.nodes.map((n) => n.skillId)));

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const skillId of trackSkillIds) {
    const proficiency = userSkills[skillId] || 'none';

    // Weight by priority
    const node = trackTemplate.nodes.find((n) => n.skillId === skillId);
    const priorityWeight = {
      mandatory: 1.0,
      recommended: 0.6,
      optional: 0.3,
    }[node.priority];

    // Proficiency multiplier
    const proficiencyValue = {
      advanced: 1.0,
      intermediate: 0.6,
      basic: 0.3,
      none: 0.0,
    }[proficiency];

    totalWeight += priorityWeight;
    earnedWeight += priorityWeight * proficiencyValue;
  }

  return earnedWeight / totalWeight;
}
```

**Example**:

```
Track has 10 nodes:
  - 8 mandatory (priority weight = 1.0 each)
  - 2 recommended (priority weight = 0.6 each)
  Total weight = (8 × 1.0) + (2 × 0.6) = 9.2

User has:
  javascript-basics (mandatory): advanced  → 1.0 × 1.0 = 1.0
  react-basics (mandatory): intermediate   → 0.6 × 1.0 = 0.6
  node-basics (mandatory): basic           → 0.3 × 1.0 = 0.3
  mongodb (mandatory): none                → 0.0 × 1.0 = 0.0
  ... (4 more mandatory skills with 0.0)
  ... (2 recommended skills with 0.0)

Earned weight = 1.0 + 0.6 + 0.3 = 1.9

skillFitScore = 1.9 / 9.2 = 0.207
```

---

#### 2. Feasibility Score (0–1)

**Measures**: How achievable is the targetDays given the track's time requirements (in hours).

**Algorithm**:

```typescript
function computeFeasibilityScore(
  targetDays: number,
  hoursPerDay: number,
  trackMinimumHours: number,
  trackAverageHours: number
): number {
  // Convert target to total target hours
  const totalTargetHours = targetDays * hoursPerDay;

  // PRECONDITION: After plan generation, totalTargetHours >= trackMinimumHours
  if (totalTargetHours < trackMinimumHours) {
    throw new Error(
      `Infeasible: totalTargetHours=${totalTargetHours} < minimumHours=${trackMinimumHours}`
    );
  }

  // Perfect score if totalTargetHours ≥ averageHours (comfortable timeline)
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

**Example**:

```
Track A:
  minimumHours = 150
  averageHours = 195

User: targetDays = 30, hoursPerDay = 4
  totalTargetHours = 30 × 4 = 120 hours

This is infeasible (120 < 150), would be rejected in planning modes.

User: targetDays = 45, hoursPerDay = 4
  totalTargetHours = 45 × 4 = 180 hours

feasibilityScore = 0.3 + (0.7 × (180 - 150) / (195 - 150))
                 = 0.3 + (0.7 × 30 / 45)
                 = 0.3 + 0.467
                 = 0.767
```

---

#### 3. Market Score (0–1)

**Measures**: Track's market value based on stored metadata.

**Algorithm**:

```typescript
function computeMarketScore(track: Track): number {
  const weights = {
    marketDemand: 0.35, // Job postings, demand
    ecosystem: 0.25, // Libraries, community
    salaryPotential: 0.2, // Earning potential
    futureProof: 0.15, // Industry trend
    easeOfLearning: 0.05, // Ease of learning (minor factor)
  };

  return (
    track.marketDemandScore * weights.marketDemand +
    track.ecosystemScore * weights.ecosystem +
    track.salaryPotentialScore * weights.salaryPotential +
    track.futureProofScore * weights.futureProof +
    track.easeOfLearningScore * weights.easeOfLearning
  );
}
```

**Example**:

```
MERN Track:
  marketDemandScore = 0.95
  ecosystemScore = 0.92
  salaryPotentialScore = 0.88
  futureProofScore = 0.90
  easeOfLearningScore = 0.75

marketScore = (0.95 × 0.35) + (0.92 × 0.25) + (0.88 × 0.20) + (0.90 × 0.15) + (0.75 × 0.05)
            = 0.3325 + 0.23 + 0.176 + 0.135 + 0.0375
            = 0.911
```

---

### Final Score Calculation

**Example: MERN vs PERN for Full Stack**

```
User Profile:
  - skillProficiencies: { javascript: "advanced", react: "intermediate", ... }
  - targetDays: 50, hoursPerDay: 4 → totalTargetHours: 200
  - learningGoal: "job-hunting"

Track A: MERN
  - minimumHours: 150
  - averageHours: 195
  - marketDemandScore: 0.95

  skillFitScore = 0.42       (user knows 40% of MERN skills)
  feasibilityScore = 0.73    (200 hours is between 150-195, closer to average)
  marketScore = 0.911        (MERN has high demand)

  finalScore = (0.40 × 0.42) + (0.30 × 0.73) + (0.30 × 0.911)
             = 0.168 + 0.219 + 0.273
             = 0.660

Track B: PERN
  - minimumHours: 160
  - averageHours: 210
  - marketDemandScore: 0.72

  skillFitScore = 0.28       (user knows less PostgreSQL)
  feasibilityScore = 0.50    (200 hours is between 160-210)
  marketScore = 0.765        (PERN has lower demand)

  finalScore = (0.40 × 0.28) + (0.30 × 0.50) + (0.30 × 0.765)
             = 0.112 + 0.15 + 0.2295
             = 0.4915

Winner: MERN (0.660 > 0.4915)
```

---

### Explainability Output

**Format**:

```typescript
interface TrackSelectionResult {
  chosenTrackId: string;
  chosenTrackName: string;
  score: number;

  reasons: string[]; // Top 3 reasons ordered by impact

  alternatives: AlternativeTrack[];

  scoreBreakdown: {
    skillFit: number;
    feasibility: number;
    market: number;
  };
}
```

**Example Response**:

```json
{
  "chosenTrackId": "mern",
  "chosenTrackName": "MERN Stack (MongoDB, Express, React, Node)",
  "score": 0.636,
  "reasons": [
    "Best skill fit: You already know 42% of MERN skills (JavaScript, React)",
    "Highest market demand: MERN has 25% more job postings than alternatives",
    "Feasible timeline: 200 days matches your target (minimum is 180)"
  ],
  "alternatives": [
    {
      "trackId": "pern",
      "trackName": "PERN Stack (PostgreSQL, Express, React, Node)",
      "score": 0.4315,
      "reasons": [
        "Lower skill fit (28%)",
        "Tight timeline: 200 days is minimum (average is 240)",
        "Lower market demand (0.72 vs 0.95)"
      ]
    }
  ],
  "scoreBreakdown": {
    "skillFit": 0.42,
    "feasibility": 0.65,
    "market": 0.911
  }
}
```

---

### Tie-Break Rules

**If two tracks have scores within 0.02**:

1. **Primary**: Choose track with higher `skillFitScore`
2. **Secondary**: Choose track with higher `marketDemandScore`
3. **Tertiary**: Choose track with lower `minimumHours` (faster to job-ready)
4. **Final**: Alphabetical by `trackId`

---

## Planning Modes (Revision 3.0)

### Overview

The system supports **two mutually exclusive planning modes** for timeline generation while maintaining **full determinism**:

1. **DAILY_HOURS** (default): Timeline strictly based on available learning hours per day
2. **DEADLINE_DAYS** (optional): Validate feasibility against a target deadline with fallback strategies

**Determinism Guarantee**: Same inputs (`planningMode`, `hoursPerDay`, `targetDays`, user skills, track template) always produce identical outputs (same milestones, same node timings, same buffer).

### Mode 1: DAILY_HOURS (Default)

**Purpose**: Generate a timeline that respects the user's daily availability without compression or scaling.

**Constraints**:

- Do NOT compress hours upward
- Do NOT inflate workload
- Timeline must be strictly based on `hoursPerDay`
- No hours are skipped or modified

**Algorithm**:

```typescript
function computeDailyHoursMode(
  totalAdjustedHours: number,
  hoursPerDay: number,
  targetDays?: number
): {
  computedDays: number;
  actualDays: number;
  requiredHoursPerDay: number | null;
  advisoryMessage: string | null;
  isFeasible: boolean;
} {
  // Step 1: Calculate required days based on hoursPerDay
  const computedDays = Math.ceil(totalAdjustedHours / hoursPerDay);
  const actualDays = computedDays;

  // Step 2: If targetDays provided, check if user's hoursPerDay is sufficient
  let requiredHoursPerDay = null;
  let advisoryMessage = null;
  let isFeasible = true;

  if (targetDays && targetDays > 0) {
    requiredHoursPerDay = Math.ceil(totalAdjustedHours / targetDays);

    if (requiredHoursPerDay > hoursPerDay) {
      // Mark as infeasible advisory (not impossible, just requires more hours)
      isFeasible = false;
      advisoryMessage =
        `To finish within ${targetDays} days, you need ${requiredHoursPerDay} hours/day. ` +
        `With ${hoursPerDay} hours/day, you'll need ${computedDays} days.`;
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
```

**Example**:

```
User Profile:
  - totalAdjustedHours = 200 hours
  - hoursPerDay = 4
  - targetDays = 30 (wants to finish in a month)

Computation:
  computedDays = ceil(200 / 4) = 50 days
  requiredHoursPerDay = ceil(200 / 30) = 7 hours/day

Response:
  {
    computedDays: 50,
    actualDays: 50,
    requiredHoursPerDay: 7,
    advisoryMessage: "To finish within 30 days, you need 7 hours/day. With 4 hours/day, you'll need 50 days.",
    isFeasible: false (advisory only, not impossible)
  }
```

**Output Semantics**:

- `computedDays`: How long it will actually take with given `hoursPerDay`
- `isFeasible`: For DAILY_HOURS, always represents timeline feasibility (not deadline impossibility)
- Timeline generation uses `hoursPerDay` strictly (see Roadmap Generation Algorithm)

### Mode 2: DEADLINE_DAYS

**Purpose**: Validate if a user can meet a deadline with their available time, and provide fallback strategies if impossible.

**Constraints**:

- User has exactly `targetDays` to complete
- User can study `hoursPerDay` (variable)
- System has hard limit of `MAX_HOURS_PER_DAY = 24`
- Do NOT scale hours upward
- Only guide with fallback plans if infeasible

**Algorithm**:

```typescript
function computeDeadlineDaysMode(
  totalAdjustedHours: number,
  targetDays: number,
  hoursPerDay: number
): {
  isFeasible: boolean;
  computedDays: number;
  requiredHoursPerDay: number | null;
  minimumDaysAtMaxHours: number | null;
  maxHoursPerDayUsedForFallback: number | null;
  advisoryMessage: string | null;
} {
  const availableHours = targetDays * hoursPerDay;
  const maxAvailableHours = targetDays * MAX_HOURS_PER_DAY;

  // STEP 1: Physical Feasibility Check (24 hours/day barrier)
  if (maxAvailableHours < totalAdjustedHours) {
    const minimumDaysAtMaxHours = Math.ceil(totalAdjustedHours / MAX_HOURS_PER_DAY);
    return {
      isFeasible: false,
      computedDays: minimumDaysAtMaxHours,
      requiredHoursPerDay: MAX_HOURS_PER_DAY,
      minimumDaysAtMaxHours,
      maxHoursPerDayUsedForFallback: MAX_HOURS_PER_DAY,
      advisoryMessage:
        `Physically impossible: Even at 24 hours/day, you need ${minimumDaysAtMaxHours} days ` +
        `(you only have ${targetDays}). Consider extending deadline or spreading work.`,
    };
  }

  // STEP 2: User-Hours Feasibility Check
  if (availableHours < totalAdjustedHours) {
    const requiredHoursPerDay = Math.ceil(totalAdjustedHours / targetDays);
    return {
      isFeasible: false,
      computedDays: targetDays,
      requiredHoursPerDay,
      minimumDaysAtMaxHours: null,
      maxHoursPerDayUsedForFallback: null,
      advisoryMessage:
        `Not feasible with current pace: You need ${requiredHoursPerDay} hours/day ` +
        `to finish in ${targetDays} days (you selected ${hoursPerDay}). ` +
        `Consider increasing study time or extending deadline.`,
    };
  }

  // STEP 3: Feasible Case
  const requiredDays = Math.ceil(totalAdjustedHours / hoursPerDay);
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
```

**Example Scenarios**:

**Scenario 1: Feasible**

```
Inputs:
  - totalAdjustedHours = 200
  - targetDays = 60
  - hoursPerDay = 4

Check Step 2: availableHours = 60 × 4 = 240 >= 200 ✓
Check Step 1: maxAvailableHours = 60 × 24 = 1440 >= 200 ✓

Computation:
  requiredDays = ceil(200 / 4) = 50
  bufferDays = 60 - 50 = 10

Response:
  {
    isFeasible: true,
    computedDays: 50,
    advisoryMessage: "Feasible! You'll complete in 50 days (10 buffer days available)."
  }
```

**Scenario 2: Infeasible - User Hours**

```
Inputs:
  - totalAdjustedHours = 200
  - targetDays = 30
  - hoursPerDay = 4

Check Step 2: availableHours = 30 × 4 = 120 < 200 ✗
Check Step 1: maxAvailableHours = 30 × 24 = 720 >= 200 ✓

Computation:
  requiredHoursPerDay = ceil(200 / 30) = 7

Response:
  {
    isFeasible: false,
    computedDays: 30,
    requiredHoursPerDay: 7,
    advisoryMessage: "Not feasible: You need 7 hours/day to finish in 30 days (you selected 4)."
  }
```

**Scenario 3: Infeasible - Physical Maximum**

```
Inputs:
  - totalAdjustedHours = 500
  - targetDays = 10
  - hoursPerDay = 8

Check Step 1: maxAvailableHours = 10 × 24 = 240 < 500 ✗

Computation:
  minimumDaysAtMaxHours = ceil(500 / 24) = 21

Response:
  {
    isFeasible: false,
    computedDays: 21,
    minimumDaysAtMaxHours: 21,
    requiredHoursPerDay: 24,
    maxHoursPerDayUsedForFallback: 24,
    advisoryMessage: "Physically impossible: Even at 24 hours/day, you need 21 days (you only have 10)."
  }
```

### Mode Determinism Guarantees

**Deterministic Outputs**: For fixed inputs, both modes produce identical results:

- Same `planningMode`, `hoursPerDay`, `targetDays` → same `computedDays`, `advisoryMessage`, `isFeasible`
- No random selection, no sorting ambiguity, no floating-point mismatches
- Buffer insertion is deterministic: if `bufferDays > 0`, always insert single buffer node with same nodeId

**Determinism Preservation Throughout**:

1. Track selection determinism (no changes): TrackSelectorService unchanged
2. Scoring weights (no changes): Same formulas, same coefficients
3. Timeline generation determinism: Buffer node always `{nodeId: "buffer-node"}` if inserted
4. Milestone aggregation determinism: Same nodes → same milestones (no reordering)

**Testing Determinism**:

```typescript
// Test: Same inputs produce same output
const input = {
  planningMode: "DEADLINE_DAYS",
  hoursPerDay: 4,
  targetDays: 120,
  totalAdjustedHours: 200,
  userSkills: { ... },
  trackId: "mern"
};

const result1 = computeDeadlineDaysMode(200, 120, 4);
const result2 = computeDeadlineDaysMode(200, 120, 4);

assert.deepStrictEqual(result1, result2);  // Must pass
```

---

## Roadmap Generation Algorithm

### Objective

Convert a RoadmapTemplate into a personalized UserRoadmapInstance with:

- Adjusted node durations based on proficiency
- Timeline with start/end dates per node
- Milestones with aggregated dates

### Algorithm Steps

#### Step 1: Fetch Template

```typescript
const template = await RoadmapTemplateRepo.findById(track.templateId);
```

#### Step 2: Topological Sort (Respect Prerequisites)

```typescript
function topologicalSort(nodes: RoadmapNode[]): RoadmapNode[] {
  // Build adjacency list and in-degree map from prerequisites
  const adjList: { [nodeId: string]: string[] } = {};
  const inDegree: { [nodeId: string]: number } = {};

  // Initialize
  for (const node of nodes) {
    adjList[node.nodeId] = [];
    inDegree[node.nodeId] = 0;
  }

  // Build adjacency list: prerequisite -> dependent
  for (const node of nodes) {
    for (const prereqId of node.prerequisites) {
      if (!adjList[prereqId]) {
        throw new Error(`Invalid prerequisite: ${prereqId} not found in nodes`);
      }
      adjList[prereqId].push(node.nodeId);
      inDegree[node.nodeId]++;
    }
  }

  // Kahn's algorithm
  const queue: RoadmapNode[] = [];
  const sorted: RoadmapNode[] = [];

  // Add nodes with no prerequisites
  for (const node of nodes) {
    if (inDegree[node.nodeId] === 0) {
      queue.push(node);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    // Process dependents
    for (const dependentId of adjList[current.nodeId]) {
      inDegree[dependentId]--;
      if (inDegree[dependentId] === 0) {
        const dependent = nodes.find((n) => n.nodeId === dependentId)!;
        queue.push(dependent);
      }
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Cycle detected in skill graph');
  }

  return sorted;
}
```

**Result**: Nodes ordered such that prerequisites always come first.

---

#### Step 3: Adjust Duration Based on Proficiency

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

**Example**:

```
Node: "React Hooks" (baseHours = 24)
User proficiency: "intermediate"
Multiplier: 0.2

adjustedHours = 24 × 0.2 = 4.8 hours
```

---

#### Step 4: Calculate Total Adjusted Hours

```typescript
const totalAdjustedHours = nodes.reduce((sum, n) => sum + n.adjustedHours, 0);
```

---

#### Step 5: Generate Timeline

**Goal**: Distribute `totalAdjustedHours` sequentially with strict date semantics (startDate inclusive, endDate exclusive).

**Timeline Semantics**:

- `startDate`: Inclusive (work begins on this day)
- `endDate`: Exclusive (next node starts here; this day is NOT part of current node)
- Node N+1 always starts at Node N's endDate

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
      prerequisites:
        nodesWithDates.length > 0 ? [nodesWithDates[nodesWithDates.length - 1].nodeId] : [],
      sequenceOrder: nodesWithDates.length + 1,
    };
    nodesWithDates.push(bufferNode);
  }

  return { nodes: nodesWithDates, bufferDays };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

**Example**:

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

#### Step 6: Generate Milestones

**Must be called AFTER timeline generation (including buffer insertion) to ensure accurate dates.**

```typescript
function generateMilestones(
  templateMilestones: Milestone[],
  nodes: NodeInstance[]
): MilestoneInstance[] {
  const millisPerDay = 24 * 60 * 60 * 1000;

  // Build milestones from template
  const milestones: MilestoneInstance[] = templateMilestones.map((milestone) => {
    const milestoneNodes = nodes.filter((n) => n.milestoneId === milestone.milestoneId);

    if (milestoneNodes.length === 0) {
      throw new Error(`No nodes found for milestone ${milestone.milestoneId}`);
    }

    // Sort nodes by sequenceOrder to ensure consistent date calculation
    milestoneNodes.sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    // Use actual generated timeline dates (after buffer insertion)
    const startDate = milestoneNodes[0].startDate;
    const endDate = milestoneNodes[milestoneNodes.length - 1].endDate;

    // Calculate days using exclusive endDate semantics
    const estimatedDays = Math.floor((endDate.getTime() - startDate.getTime()) / millisPerDay);

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
    milestones.push({
      milestoneId: 'buffer-milestone',
      name: 'Review & Catch-up Period',
      phase: 'buffer',
      startDate: bufferNode.startDate,
      endDate: bufferNode.endDate,
      estimatedDays: bufferNode.estimatedDays,
      nodeIds: ['buffer-node'],
      status: 'not-started' as const,
    });
  }

  return milestones;
}
```

---

#### Step 7: Create UserRoadmapInstance

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
  roadmapInstanceId: generateId(),
  userId: userId,
  roleId: roleId,
  trackId: trackId,
  trackName: track.name,
  targetDays: targetDays,
  actualDays: actualDays, // Derived from timeline span
  startDate: startDate,
  targetCompletionDate: finalEndDate,
  milestones: milestones,
  nodes: nodesWithTimeline, // Use timeline-adjusted nodes (includes buffer)
  trackSelection: trackSelectionResult,
  totalNodes: nodesWithTimeline.length, // Total includes buffer node
  completedNodes: 0,
  inProgressNodes: 0,
  currentMilestone: milestones[0]?.milestoneId || null,
  status: 'active',
  generatedAt: new Date(),
  lastActivityAt: new Date(),
};

await UserRoadmapRepo.create(roadmapInstance);
return roadmapInstance;
```

---

### Output Schema Example

```json
{
  "roadmapInstanceId": "rm-abc123",
  "userId": "user-123",
  "roleId": "fullstack",
  "trackId": "mern",
  "trackName": "MERN Stack",
  "targetDays": 200,
  "actualDays": 200,
  "startDate": "2026-03-03T00:00:00Z",
  "targetCompletionDate": "2026-09-19T00:00:00Z",
  "milestones": [
    {
      "milestoneId": "milestone-1",
      "name": "JavaScript Fundamentals",
      "phase": "foundation",
      "startDate": "2026-03-03T00:00:00Z",
      "endDate": "2026-04-15T00:00:00Z",
      "estimatedDays": 43,
      "nodeIds": ["node-1", "node-2", "node-3"],
      "status": "not-started"
    }
  ],
  "nodes": [
    {
      "nodeId": "node-1",
      "skillId": "javascript-basics",
      "skillName": "JavaScript Fundamentals",
      "milestoneId": "milestone-1",
      "baseHours": 40,
      "adjustedHours": 2,
      "proficiencyLevel": "advanced",
      "startDate": "2026-03-03T00:00:00Z",
      "endDate": "2026-03-04T00:00:00Z",
      "estimatedDays": 1,
      "priority": "mandatory",
      "prerequisites": [],
      "sequenceOrder": 1
    },
    {
      "nodeId": "node-2",
      "skillId": "es6-features",
      "skillName": "ES6+ Features",
      "milestoneId": "milestone-1",
      "baseHours": 20,
      "adjustedHours": 8,
      "proficiencyLevel": "intermediate",
      "startDate": "2026-03-04T00:00:00Z",
      "endDate": "2026-03-07T00:00:00Z",
      "estimatedDays": 3,
      "priority": "mandatory",
      "prerequisites": ["node-1"],
      "sequenceOrder": 2
    }
  ],
  "trackSelection": {
    "chosenTrackId": "mern",
    "score": 0.636,
    "reasons": ["Best skill fit (42%)", "Highest market demand"],
    "alternatives": [...]
  },
  "totalNodes": 35,
  "completedNodes": 0,
  "inProgressNodes": 0,
  "currentMilestone": "milestone-1",
  "status": "active",
  "generatedAt": "2026-03-03T10:00:00Z",
  "lastActivityAt": "2026-03-03T10:00:00Z"
}
```

---

## Progress Tracking System

### Node Status Transitions

```
not-started → in-progress → completed
     ↓            ↓
  skipped ← ← ← ← ┘
```

**Rules**:

- A node can be marked `in-progress` only if all prerequisites are `completed` or `skipped`
- A node marked `completed` cannot be reverted to `in-progress`
- A node can be `skipped` if priority is "optional" or "recommended"
- Mandatory nodes cannot be skipped

**Source of Truth**: Progress collection stores all status/timestamps. UserRoadmapInstance caches a summary only.

### Update API

**Endpoint**: `PATCH /api/v1/roadmaps/:roadmapInstanceId/nodes/:nodeId`

**Request**:

```json
{
  "status": "in-progress",
  "confidence": "medium",
  "notes": "Completed useState and useEffect sections. Still working on custom hooks.",
  "timeSpentHours": 3.5
}
```

**Response**:

```json
{
  "success": true,
  "node": {
    "nodeId": "node-3",
    "status": "in-progress",
    "startedAt": "2026-03-05T14:30:00Z",
    "confidence": "medium",
    "notes": "Completed useState and useEffect...",
    "lastUpdatedAt": "2026-03-05T18:00:00Z"
  },
  "milestoneUpdated": false,
  "roadmapSummary": {
    "completedNodes": 2,
    "inProgressNodes": 1,
    "totalNodes": 35,
    "currentMilestone": "milestone-1"
  }
}
```

### Milestone Auto-Completion

**Logic**:

```typescript
async function checkMilestoneCompletion(
  roadmapInstanceId: string,
  milestoneId: string
): Promise<boolean> {
  const roadmap = await UserRoadmapRepo.findById(roadmapInstanceId);
  const milestone = roadmap.milestones.find((m) => m.milestoneId === milestoneId);

  const milestoneNodeIds = milestone.nodeIds;

  // Query Progress collection for actual status (source of truth)
  const progressRecords = await ProgressRepo.find({
    roadmapInstanceId,
    nodeId: { $in: milestoneNodeIds },
  });

  const completedCount = progressRecords.filter(
    (p) => p.status === 'completed' || p.status === 'skipped'
  ).length;

  if (completedCount === milestoneNodeIds.length) {
    milestone.status = 'completed';
    await UserRoadmapRepo.update(roadmapInstanceId, { milestones: roadmap.milestones });
    return true;
  }

  return false;
}
```

---

## API Contracts

### 1. Get All Roles

**Endpoint**: `GET /api/v1/roles`

**Response**:

```json
{
  "roles": [
    {
      "id": "fullstack",
      "name": "Full Stack Developer",
      "description": "Build complete web applications",
      "category": "web-development",
      "minimumHours": 150,
      "marketDemand": "very-high",
      "averageSalary": 95000,
      "tracks": ["mern", "pern", "mean"]
    },
    {
      "id": "backend",
      "name": "Backend Developer",
      "minimumHours": 120,
      ...
    }
  ]
}
```

---

### 2. Get Tracks for Role

**Endpoint**: `GET /api/v1/roles/:roleId/tracks`

**Response**:

```json
{
  "roleId": "fullstack",
  "tracks": [
    {
      "id": "mern",
      "name": "MERN Stack",
      "minimumHours": 150,
      "averageHours": 195,
      "primaryTechnologies": ["MongoDB", "Express", "React", "Node"],
      "marketDemandScore": 0.95,
      "ecosystemScore": 0.92,
      "easeOfLearningScore": 0.75
    },
    {
      "id": "pern",
      "name": "PERN Stack",
      "minimumHours": 160,
      ...
    }
  ]
}
```

---

### 3. Get Assessment Skills

**Endpoint**: `GET /api/v1/roles/:roleId/assessment-skills`

**Response**:

```json
{
  "roleId": "fullstack",
  "skills": [
    {
      "id": "javascript-basics",
      "name": "JavaScript Fundamentals",
      "description": "Variables, functions, loops, conditionals"
    },
    {
      "id": "html-css",
      "name": "HTML & CSS",
      ...
    }
  ]
}
```

---

### 4. Submit Skill Assessment

**Endpoint**: `POST /api/v1/users/:userId/skill-assessments`

**Request**:

```json
{
  "skillProficiencies": {
    "javascript-basics": "advanced",
    "html-css": "intermediate",
    "react-basics": "basic",
    "node-basics": "none"
  }
}
```

**Response**:

```json
{
  "success": true,
  "assessmentCompletedAt": "2026-03-03T10:15:00Z"
}
```

---

### 5. Generate Roadmap

**Endpoint**: `POST /api/v1/roadmaps/generate`

**Request**:

```json
{
  "userId": "user-123",
  "roleId": "fullstack",
  "targetDays": 200
}
```

**Response** (Success):

```json
{
  "success": true,
  "roadmapInstanceId": "rm-abc123",
  "trackId": "mern",
  "trackName": "MERN Stack",
  "actualDays": 200,
  "startDate": "2026-03-03T00:00:00Z",
  "targetCompletionDate": "2026-09-19T00:00:00Z",
  "trackSelection": {
    "score": 0.636,
    "reasons": ["Best skill fit", "Highest market demand"],
    "alternatives": [...]
  },
  "milestones": [...],
  "nodes": [...]
}
```

**Response** (Insufficient Time):

```json
{
  "success": false,
  "error": "INSUFFICIENT_TIME",
  "minimumHoursRequired": 150,
  "message": "Full Stack Developer requires at least 150 hours (50 days at 3 hrs/day). You can only allocate 120 hours (40 days at 3 hrs/day)."
}
```

---

### 6. Get Roadmap

**Endpoint**: `GET /api/v1/roadmaps/:roadmapInstanceId`

**Response**:

```json
{
  "roadmapInstanceId": "rm-abc123",
  "userId": "user-123",
  "roleId": "fullstack",
  "trackId": "mern",
  "status": "active",
  "completedNodes": 5,
  "inProgressNodes": 1,
  "totalNodes": 35,
  "currentMilestone": "milestone-2",
  "milestones": [...],
  "nodes": [...]
}
```

---

### 7. Update Node Progress

**Endpoint**: `PATCH /api/v1/roadmaps/:roadmapInstanceId/nodes/:nodeId`

**Request**:

```json
{
  "status": "completed",
  "confidence": "high",
  "notes": "Finished all exercises and built a sample app",
  "timeSpentHours": 25
}
```

**Response**:

```json
{
  "success": true,
  "node": {
    "nodeId": "node-5",
    "status": "completed",
    "completedAt": "2026-03-08T16:00:00Z",
    "confidence": "high"
  },
  "milestoneCompleted": true,
  "roadmapSummary": {
    "completedNodes": 6,
    "currentMilestone": "milestone-2"
  }
}
```

---

## Determinism Rules & Testing

### Determinism Guarantees

1. **Same User + Same Target → Same Track**
   - If user's skill profile and targetDays are identical, track selection must return the same result

2. **Same Template + Same Proficiency → Same Roadmap**
   - Node order, durations, and timeline must be reproducible

3. **No Randomization**
   - No RNG, no sampling, no time-based decisions

4. **Timeline + Milestone Generation Determinism**
   - Buffer node insertion is deterministic (if `bufferDays > 0`, always create same buffer node with nodeId="buffer-node")
   - Milestone recalculation runs after timeline generation (ordering preserved)
   - Topological sort ensures node order is fixed
   - Same input → same output guaranteed for timeline, milestones, and actualDays calculation

5. **Planning Mode Determinism (Revision 3.0)**
   - **DAILY_HOURS mode**: Same `hoursPerDay`, `totalAdjustedHours`, `targetDays` → same `computedDays`, `advisoryMessage`, `isFeasible`
   - **DEADLINE_DAYS mode**: Same `hoursPerDay`, `targetDays`, `totalAdjustedHours` → same feasibility result, required hours, fallback plan
   - No random selection between modes
   - Mode parameter explicitly selected by user (not inferred or randomized)
   - Planning calculations are pure functions with no side effects
   - Buffer insertion determinism maintained for both modes

### Buffer Insertion & Milestone Generation Determinism (Revision 2.2)

- **Buffer Node**: Inserted deterministically after all primary nodes if `bufferDays > 0`
- **Milestone Dates**: Recalculated using actual generated timeline (after buffer insertion)
- **actualDays Calculation**: Computed using exclusive endDate semantics: `Math.floor((finalEndDate - startDate) / millisPerDay)`
- **Invariant**: Same inputs (targetDays, proficiencies, hoursPerDay, planningMode) always produce:
  - Same number of nodes (including buffer)
  - Same node timeline (startDate, endDate)
  - Same milestone boundaries
  - Same actualDays value
  - Same planning mode results (computedDays, isFeasible, advisoryMessage)

### Test Cases

#### Test 1: Track Selection Determinism

**Setup**:

```json
User Profile:
  skillProficiencies: {
    "javascript-basics": "advanced",
    "react-basics": "intermediate",
    "node-basics": "basic"
  }
  targetDays: 50, hoursPerDay: 4 → totalTargetHours: 200

Available Tracks:
  - MERN (minimumHours: 150)
  - PERN (minimumHours: 160)
```

**Expected**:

```
Run 1: chosenTrackId = "mern", score = 0.636
Run 2: chosenTrackId = "mern", score = 0.636
Run 3: chosenTrackId = "mern", score = 0.636
...
Run 100: chosenTrackId = "mern", score = 0.636
```

**Test Implementation**:

```typescript
test('track selection is deterministic', async () => {
  const results = [];

  for (let i = 0; i < 100; i++) {
    const result = await trackSelectorService.selectBestTrack('fullstack', 200, userSkills);
    results.push(result.chosenTrackId);
  }

  const allSame = results.every((id) => id === results[0]);
  expect(allSame).toBe(true);
  expect(results[0]).toBe('mern');
});
```

---

#### Test 2: Roadmap Timeline Consistency

**Setup**:

```json
Template: MERN (35 nodes, 450 base hours)
User Proficiency: 5 advanced skills, 3 intermediate
Target Days: 200
Hours Per Day: 4
```

**Expected**:

```
Node 1 (JavaScript Basics, advanced):
  baseHours: 40
  adjustedHours: 2
  estimatedDays: 1
  startDate: 2026-03-03
  endDate: 2026-03-04

Node 2 (ES6 Features, intermediate):
  baseHours: 20
  adjustedHours: 8
  estimatedDays: 3
  startDate: 2026-03-04
  endDate: 2026-03-07

... (consistent across all runs)
```

**Test Implementation**:

```typescript
test('roadmap timeline is reproducible', async () => {
  const roadmaps = [];

  for (let i = 0; i < 10; i++) {
    const roadmap = await roadmapGeneratorService.generateRoadmap(
      'user-123',
      'fullstack',
      'mern',
      200,
      userSkills
    );
    roadmaps.push(roadmap);
  }

  // Check node 1
  for (let i = 1; i < roadmaps.length; i++) {
    expect(roadmaps[i].nodes[0].startDate).toEqual(roadmaps[0].nodes[0].startDate);
    expect(roadmaps[i].nodes[0].adjustedHours).toEqual(roadmaps[0].nodes[0].adjustedHours);
  }
});
```

---

#### Test 3: Tie-Break Rules

**Setup**:

```json
Track A (MERN):
  finalScore: 0.640
  skillFitScore: 0.42

Track B (Custom):
  finalScore: 0.642
  skillFitScore: 0.38

Scores differ by 0.002 (within 0.02 threshold)
```

**Expected**:

```
Winner: Track A (MERN)
Reason: Higher skillFitScore (0.42 > 0.38)
```

**Test Implementation**:

```typescript
test('tie-break favors higher skill fit', async () => {
  const result = await trackSelectorService.selectBestTrack('fullstack', 200, userSkills);

  expect(result.chosenTrackId).toBe('mern');
  expect(result.reasons).toContain(expect.stringContaining('skill fit'));
});
```

---

## Implementation Guide

### Phase 1: Data Setup (Week 1)

1. ✅ Define MongoDB schemas for all entities
2. ✅ Seed database with:
   - 3-5 roles (Full Stack, Backend, Frontend, DevOps, Data Engineer)
   - 2-3 tracks per role
   - 50+ global skills
   - 2-3 RoadmapTemplates (skill graphs)

### Phase 2: Service Layer (Week 2-3)

1. ✅ Implement `TrackSelectorService` (scoring logic)
2. ✅ Implement `RoadmapGeneratorService` (timeline generation)
3. ✅ Implement `SkillAssessorService`
4. ✅ Implement `ProgressTrackerService`
5. ✅ Implement `TimelineBuilderService`

### Phase 3: API Layer (Week 4)

1. ✅ Create Express routes for all 7 endpoints
2. ✅ Add request validation (Zod schemas)
3. ✅ Add error handling middleware

### Phase 4: Testing (Week 5)

1. ✅ Write determinism tests
2. ✅ Write integration tests
3. ✅ Write edge case tests (minimum days, no skills, tie-breaks)

### Phase 5: Frontend Integration (Week 6)

1. ✅ Update React components to call new APIs
2. ✅ Render roadmap with timeline (gantt chart or timeline view)
3. ✅ Add progress tracking UI (checkboxes, confidence sliders)

---

## Summary

This redesigned core logic provides:

✅ **Time-Bound Planning**: Enforces `minimumHours` per role/track  
✅ **Deterministic Selection**: Reproducible track ranking with explainability  
✅ **Proficiency-Aware Generation**: Adjusts durations based on existing skills  
✅ **Timeline-Based Roadmaps**: Day-by-day schedule aligned to `targetDays`  
✅ **Node-Level Progress Tracking**: roadmap.sh-style status, confidence, notes  
✅ **Market-Aware Scoring**: Uses updatable track metadata (demand, salary)  
✅ **Explainable Decisions**: "Why this track?" with alternatives

The system is production-ready and implementable in your existing MERN app with minimal disruption to current code structure.

---

**End of Core Logic Redesign Document**

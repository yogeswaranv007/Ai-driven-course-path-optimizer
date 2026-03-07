# Learning Path Optimizer — Complete System Architecture

## Comprehensive Technical Documentation (PHASES 1–3)

**Last Updated**: February 20, 2026  
**Status**: ✅ APPROVED (Phases 1–3 Complete; Phase 4 Pending)

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Core Entities & Domain Model (PHASE 1)](#core-entities--domain-model-phase-1)
3. [User Onboarding & Input Flow (PHASE 2)](#user-onboarding--input-flow-phase-2)
4. [Track Selection Engine (PHASE 3)](#track-selection-engine-phase-3)
5. [Complete End-to-End Data Flow](#complete-end-to-end-data-flow)
6. [Database Schema](#database-schema)
7. [API Contract Summary](#api-contract-summary)
8. [Key Design Decisions](#key-design-decisions)

---

## Vision & Goals

### Mission

Enable users to learn any professional skill by generating **personalized, explainable learning roadmaps** that adapt to their experience level, goals, and available time. The system must:

1. **Never block generation** — If skills are missing, assume beginner level and proceed
2. **Be deterministic** — Same user + same inputs = same track selected every time
3. **Be explainable** — Users understand WHY a track was chosen and what skills matter
4. **Be efficient** — Respect user time constraints; prioritize job-readiness over perfection

### Key Principles

- **Skills are global** — Not owned by tracks; reused across roles
- **Tracks are technology choices** — React vs Vue vs Angular are different paths to the same role
- **Roles are career goals** — Frontend Developer, Backend Developer, etc.
- **Profiles are mutable, roadmaps are immutable** — Update profile anytime; roadmap is a snapshot
- **Fallback gracefully** — Missing skills don't break generation; DEFAULT_BEGINNER is the safety net

---

## Core Entities & Domain Model (PHASE 1)

### Entity Relationship Diagram

```
┌──────────┐
│   User   │ (existing auth system)
└────┬─────┘
     │ has one
     ↓
┌──────────────────┐
│   UserProfile    │ (learning preferences, skill history)
└──────────────────┘

┌──────────┐
│   Role   │ e.g., "Frontend Developer"
├──────────┤
│ id       │
│ name     │
│ coreSkillIds[] │ (static array of Skill IDs required for all tracks)
└────┬─────┘
     │ has many
     ↓
┌──────────────┐
│   Track      │ e.g., "React"
├──────────────┤
│ id           │
│ roleId       │
│ primaryTech  │
│ scores (6)   │ ecosystem, hiring, ease, time, community, trend
└────┬─────────┘
     │ has many (versions)
     ↓
┌─────────────────────┐
│  RoadmapTemplate    │ (v1, v2, ...)
├─────────────────────┤
│ id                  │
│ trackId             │
│ skillGraph          │ DAG of Skills with prerequisites
│ nodes[]             │ (RoadmapNodes)
└─────────────────────┘

┌───────────────────┐
│ Skill (Global)    │
├───────────────────┤
│ id                │
│ name              │
│ category          │
│ difficulty        │
│ estimatedHours    │
│ learningObjectives│
└───────────────────┘

┌────────────────────┐
│ Resource           │
├────────────────────┤
│ id                 │
│ title              │
│ type               │ (video, article, course, book, etc.)
│ url                │
│ qualityRating      │
│ learningStyle[]    │
│ targetDifficulty   │
└────────────────────┘

┌──────────────────────────┐
│ UserRoadmapInstance      │
├──────────────────────────┤
│ id                       │
│ userId                   │
│ roleId + trackId         │
│ roadmapNodes[] (ordered) │
│ assumptionPolicyUsed     │
│ missingInputs[]          │
│ status                   │
└──────────────────────────┘
```

### Entity Definitions

#### Role

| Field               | Type          | Purpose                                                                                                                |
| ------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`                | string        | "frontend-developer"                                                                                                   |
| `name`              | string        | "Frontend Developer"                                                                                                   |
| `description`       | string        | Marketing description                                                                                                  |
| `coreSkillIds[]`    | array<string> | **NEW**: Static list of Skill IDs required for all tracks in this role (e.g., Git, problem-solving, JavaScript basics) |
| `averageTimeToHire` | integer       | Weeks of focused learning to job-ready                                                                                 |
| `marketDemand`      | enum          | "very-high", "high", "medium", "niche"                                                                                 |
| `targetAudience[]`  | array<string> | ["college students", "career switchers", "self-learners"]                                                              |

**Critical Design**: `coreSkillIds` is stored statically in the database. The system does NOT derive core skills dynamically from skill graphs; instead, it uses this curated list. This ensures consistency.

#### Track

| Field                 | Type          | Purpose                                            |
| --------------------- | ------------- | -------------------------------------------------- |
| `id`                  | string        | "frontend-react"                                   |
| `name`                | string        | "React & Modern Frontend"                          |
| `roleId`              | string        | Parent role                                        |
| `primaryTech`         | string        | "React" (marketing)                                |
| `supportingTechs[]`   | array<string> | ["Redux", "Next.js", "Tailwind"]                   |
| `ecosystemScore`      | number 0–1    | Quality of tooling, libraries, documentation       |
| `hiringValueScore`    | number 0–1    | Job market demand and salary potential             |
| `easeOfLearningScore` | number 0–1    | How beginner-friendly (1 = easiest)                |
| `timeToJobReadyScore` | number 0–1    | Speed to employment-level competency (1 = fastest) |
| `communitySizeScore`  | number 0–1    | Active developers, forums, mentorship              |
| `marketTrendScore`    | number 0–1    | Adoption growth, future relevance                  |
| `communitySize`       | string        | "huge", "large", "medium", "small"                 |
| `trendingUp`          | boolean       | Is adoption increasing?                            |

**Critical Design**: Scores are NOT auto-computed; they're entered by human reviewers. This ensures quality and stability. The Track Selection Engine (Phase 3) uses these scores to deterministically rank tracks.

#### Skill

| Field                  | Type          | Purpose                                |
| ---------------------- | ------------- | -------------------------------------- |
| `id`                   | string        | "react-hooks"                          |
| `name`                 | string        | "React Hooks"                          |
| `category`             | string        | "core", "optional", "advanced"         |
| `difficulty`           | enum          | "beginner", "intermediate", "advanced" |
| `estimatedHours`       | number        | Expected learning time                 |
| `description`          | string        | What is this skill?                    |
| `learningObjectives[]` | array<string> | What can you DO?                       |
| `relatedSkillIds[]`    | array<string> | Soft references                        |

**Critical Design**: Skills are GLOBAL and NOT owned by tracks. "Git" appears in all tracks. "ES6+" appears in React and Angular. This prevents duplication.

#### Resource

| Field              | Type          | Purpose                                                              |
| ------------------ | ------------- | -------------------------------------------------------------------- |
| `id`               | string        | "yt-react-hooks-1"                                                   |
| `title`            | string        | "React Hooks Explained"                                              |
| `type`             | enum          | "video", "article", "course", "book", "interactive", "documentation" |
| `url`              | string        | Link to resource                                                     |
| `durationMinutes`  | number        | Time to complete                                                     |
| `qualityRating`    | number 0–5    | Community consensus                                                  |
| `learningStyle[]`  | array<string> | ["visual", "hands-on", "reading"]                                    |
| `targetDifficulty` | enum          | "beginner", "intermediate", "advanced"                               |
| `accessibility`    | object        | `{ requiresPayment, requiresAccount, hasSubtitles, isOpenSource }`   |

**Critical Design**: Resources are separate entities. A Skill like "React Hooks" may have 10 associated Resources (videos, articles, courses). This is resolved at the UI level via ResourceSkill join mappings.

#### RoadmapTemplate

| Field                 | Type               | Purpose                                 |
| --------------------- | ------------------ | --------------------------------------- |
| `id`                  | string             | "frontend-react-v1"                     |
| `trackId`             | string             | Parent track                            |
| `version`             | string             | "1.0", "1.1", "2.0"                     |
| `skillGraph`          | DAG                | Directed acyclic graph of prerequisites |
| `nodes[]`             | array<RoadmapNode> | Ordered skills with metadata            |
| `totalEstimatedHours` | number             | Sum of all skills                       |
| `createdAt`           | timestamp          | When was this template created?         |

**RoadmapNode** (part of template):

```json
{
  "nodeId": "node-1",
  "skillId": "react-hooks",
  "skillName": "React Hooks",
  "category": "core",
  "estimatedHours": 20,
  "prerequisites": ["javascript-basics", "es6-features"], // skillIds
  "priority": "mandatory",
  "sequenceOrder": 1
}
```

**Critical Design**: Templates are versioned and immutable snapshots. Generation picks a template version and creates a UserRoadmapInstance from it. If skills change, a new version is created.

#### UserProfile

| Field                       | Type          | Purpose                                                                                |
| --------------------------- | ------------- | -------------------------------------------------------------------------------------- |
| `userId`                    | string        | Reference to User                                                                      |
| `experienceLevel`           | enum          | "beginner", "intermediate", "advanced"                                                 |
| `learningGoal`              | enum          | "job-hunting", "mastery", "quick-skills", "career-switch"                              |
| `timeAvailabilityPerDay`    | number        | 30–480 minutes                                                                         |
| `preferredLearningStyle[]`  | array<string> | ["video", "hands-on", "book", "interactive"]                                           |
| `timezone`                  | string        | "America/New_York"                                                                     |
| `targetRoles[]`             | array<string> | ["frontend-developer"]                                                                 |
| `backgroundSkillsByRole`    | object        | `{ "frontend-developer": { "javascript-basics": 3, "git": 2 } }`                       |
| `readyForRoadmapGeneration` | boolean       | True iff experienceLevel + learningGoal + timeAvailabilityPerDay + targetRoles are set |
| `createdAt`                 | timestamp     |                                                                                        |
| `lastUpdatedAt`             | timestamp     |                                                                                        |

**Critical Design**:

- `backgroundSkillsByRole` is keyed by roleId. User may have different skill levels in different roles!
- `readyForRoadmapGeneration` is TRUE iff 4 required fields are set. Skills (backgroundSkillsByRole) are NOT required.
- This is a **mutable** entity. User can update profile anytime in Settings.

#### UserRoadmapInstance

| Field                     | Type               | Purpose                                     |
| ------------------------- | ------------------ | ------------------------------------------- |
| `roadmapInstanceId`       | string             | Unique ID for this roadmap                  |
| `userId`                  | string             | Reference to User                           |
| `roleId`                  | string             | Which role?                                 |
| `trackId`                 | string             | Which track?                                |
| `templateId`              | string             | Which RoadmapTemplate version?              |
| `roadmapNodes[]`          | array<RoadmapNode> | Ordered skills (snapshot from template)     |
| `status`                  | enum               | "active", "paused", "completed", "archived" |
| `assumptionPolicyUsed`    | string             | "DEFAULT_BEGINNER" or null                  |
| `missingInputs[]`         | array<string>      | ["skills"] if DEFAULT_BEGINNER used         |
| `explainabilityData`      | object             | trackDecision + nodeReasons                 |
| `generatedAt`             | timestamp          | When was this roadmap created?              |
| `estimatedCompletionDate` | timestamp          | When will user finish?                      |

**Critical Design**:

- This is an **immutable snapshot**. Once created, it doesn't change.
- Progress updates are linked to this instance, not the template.
- `assumptionPolicyUsed` is an audit trail showing whether DEFAULT_BEGINNER was used.

---

## User Onboarding & Input Flow (PHASE 2)

### 4-Step Onboarding Journey

```
┌─────────────────────────────────────────────┐
│ STEP 1: Authentication (Existing System)    │
├─────────────────────────────────────────────┤
│ Google OAuth or Email/Password Sign-up      │
│ User created in Users collection            │
│ Timezone set                                │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ STEP 2: Basic Learning Profile             │
├─────────────────────────────────────────────┤
│ POST /api/v1/users/profile                 │
│ - experienceLevel                          │
│ - learningGoal                             │
│ - timeAvailabilityPerDay                   │
│ - preferredLearningStyle[]                 │
│ → readyForRoadmapGeneration becomes TRUE  │
│ → UserProfile created/updated              │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ STEP 3: Role & Track Selection             │
├─────────────────────────────────────────────┤
│ GET /api/v1/roles → List all roles        │
│ User picks targetRoles (e.g., ["frontend"])│
│ PUT /api/v1/users/profile                 │
│   { targetRoles: ["frontend-developer"] }  │
│ → User ready for generation!               │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│ STEP 4: Generate Roadmap (On-Demand)       │
├─────────────────────────────────────────────┤
│ User clicks "Generate Roadmap"             │
│ POST /api/v1/roadmaps/generate             │
│   { roleId, trackId }                      │
│ → Quick Skill Check modal may appear       │
│ → If user fills: Update profile BEFORE gen │
│ → If user skips: Use DEFAULT_BEGINNER      │
│ → Return UserRoadmapInstance               │
└─────────────────────────────────────────────┘
```

### Quick Skill Check Modal

**When Triggered**:

- User clicks "Generate Roadmap"
- System checks if `UserProfile.backgroundSkillsByRole[roleId]` exists
- If missing or <50% complete → show modal

**Skill Selection Logic** (3-Step Process):

1. **Fetch Role Core Skill IDs**

   ```
   roleCoreSkillIds = Role.coreSkillIds
   // Static array from Role entity, e.g., ["javascript-basics", "git", ...]
   ```

2. **Fetch Track Skill IDs from Template**

   ```
   selectedTemplate = RoadmapTemplate.find(
     trackId = selectedTrackId,
     version = latest
   )
   trackSkillIds = selectedTemplate.nodes.map(node => node.skillId)
   ```

3. **Intersection (Keep Role Order, Show Top 5–7)**

   ```javascript
   trackSkillIdSet = new Set(trackSkillIds);
   displaySkillIds = roleCoreSkillIds.filter((skillId) => trackSkillIdSet.has(skillId)).slice(0, 7);

   // Fetch full Skill objects for display
   displaySkills = Skill.find({ id: { $in: displaySkillIds } });
   ```

**Example**:

```
Role: Frontend Developer
  Core Skill IDs: [
    "javascript-basics", "html-css", "dom-manipulation",
    "es6-features", "git", "react-basics", "problem-solving"
  ]

Selected Track: React
  Template Skill IDs: [
    "javascript-basics", "es6-features", "react-basics", "dom-manipulation",
    "git", "jsx", "advanced-react"
  ]

Intersection (Role order preserved, top 7):
  ["javascript-basics", "dom-manipulation", "es6-features", "git", "react-basics"]
  → Show these 5 in Quick Skill Check modal
```

**Modal UI**:

```
┌─────────────────────────────────────────┐
│ Quick Skill Check                       │
│ (Before we generate your personalized   │
│  roadmap, let's check your experience) │
├─────────────────────────────────────────┤
│ For: Frontend Developer → React          │
│                                         │
│ ☐ JavaScript Basics [0][1][2][3][4][5] │
│ ☐ ES6+ Features     [0][1][2][3][4][5] │
│ ☐ DOM Manipulation  [0][1][2][3][4][5] │
│ ☐ Git               [0][1][2][3][4][5] │
│ ☐ React Basics      [0][1][2][3][4][5] │
│                                         │
│         [Skip]     [Continue]          │
└─────────────────────────────────────────┘
```

**Skill Levels** (0–5):

- 0 = Never heard of it
- 1 = Heard of it, no hands-on
- 2 = Basic hands-on, simple projects
- 3 = Intermediate, comfortable
- 4 = Advanced, can teach others
- 5 = Expert, contribute

### Two Outcomes

**Outcome A: User Fills Quick Skill Check**

```json
POST /api/v1/roadmaps/generate {
  roleId: "frontend-developer",
  trackId: "frontend-react",
  skillProvidedViaQuickCheck: true,
  skills: {
    "javascript-basics": 2,
    "es6-features": 1,
    "dom-manipulation": 2,
    "git": 3,
    "react-basics": 0
  }
}

Backend Logic:
1. Validate profile (experienceLevel, learningGoal, etc. must exist)
2. Update UserProfile.backgroundSkillsByRole["frontend-developer"] = { ... }
   (Skills PERSISTED BEFORE generation)
3. Fetch RoadmapTemplate for "frontend-react"
4. Generate roadmap using provided skills
5. Return:
{
  roadmapInstanceId: "rm-123",
  assumptionPolicyUsed: null,          // No fallback used
  missingInputs: [],
  roadmapNodes: [ ... ],
  explainabilityData: { trackDecision, nodeReasons }
}
```

**Outcome B: User Skips Quick Skill Check**

```json
POST /api/v1/roadmaps/generate {
  roleId: "frontend-developer",
  trackId: "frontend-react",
  skillProvidedViaQuickCheck: false
}

Backend Logic:
1. Validate profile (experienceLevel, learningGoal, etc. must exist)
2. Do NOT update UserProfile.backgroundSkillsByRole
   (Skills remain missing; user can fill later)
3. Fetch RoadmapTemplate for "frontend-react"
4. Generate roadmap assuming ALL skills = level 0 (DEFAULT_BEGINNER)
5. Return:
{
  roadmapInstanceId: "rm-124",
  assumptionPolicyUsed: "DEFAULT_BEGINNER",
  missingInputs: ["skills"],
  roadmapNodes: [ ... ],                // Longer; includes all basics
  explainabilityData: { ... }
}
```

**Frontend Display** (for DEFAULT_BEGINNER):

```
┌─────────────────────────────────────────────────┐
│ ⚠️  Assumed Beginner Level                      │
│ We assumed all skills are at beginner level.    │
│ The roadmap below includes all fundamentals.    │
│                                                 │
│ [Update Skills] ← Link to Quick Skill Check    │
└─────────────────────────────────────────────────┘

[Roadmap content...]
```

### Validation Rules

**NEED_MORE_INFO Returned Only If** (required fields missing):

- ❌ `experienceLevel` missing
- ❌ `learningGoal` missing
- ❌ `timeAvailabilityPerDay` missing
- ❌ `targetRoles` empty

**Skills Missing** → ✅ **NOT an error**; use DEFAULT_BEGINNER fallback

---

## Track Selection Engine (PHASE 3)

### Overview

Phase 3 defines a **deterministic, explainable scoring model** that selects a default track for a given role. If the same user submits the same inputs, they always get the same track and same scores.

### Scoring Model

**Base Weights** (Default):

```
W_ecosystem = 0.25  (quality of tooling, libraries, ecosystem)
W_hiring    = 0.25  (job market demand, hiring velocity)
W_ease      = 0.20  (learning curve, beginner-friendliness)
W_time      = 0.15  (speed to job-ready)
W_community = 0.10  (forums, mentorship, community size)
W_trend     = 0.05  (adoption growth, future relevance)
────────────────────
Total       = 1.00
```

### User-Adjusted Weights

Weights are deterministically modified based on user profile. **All adjustments are additive; then normalized to 1.0**.

**Experience Level Modifiers**:

| Level          | Adjustment                                     |
| -------------- | ---------------------------------------------- |
| Beginner       | W_ease +0.05, W_ecosystem −0.03, W_trend −0.02 |
| (Intermediate) | No change                                      |
| Advanced       | W_ecosystem +0.05, W_trend +0.02, W_ease −0.05 |

**Learning Goal Modifiers**:

| Goal            | Adjustment                                         |
| --------------- | -------------------------------------------------- |
| job-hunting     | W_hiring +0.05, W_community −0.03, W_trend −0.02   |
| quick-skills    | W_time +0.05, W_ease +0.03, W_ecosystem −0.08      |
| mastery         | W_ecosystem +0.05, W_community +0.03, W_time −0.08 |
| (career-switch) | No change                                          |

**Time Availability Modifiers**:

| Minutes/Day       | Adjustment                                     |
| ----------------- | ---------------------------------------------- |
| <60 (low)         | W_ease +0.04, W_time +0.02, W_ecosystem −0.06  |
| 60–180 (moderate) | No change                                      |
| >180 (high)       | W_ecosystem +0.04, W_trend +0.02, W_ease −0.06 |

### Example: Frontend Developer

**User Profile**:

```
experienceLevel: "beginner"
learningGoal: "job-hunting"
timeAvailabilityPerDay: 120  (moderate)
```

**Candidate Tracks** with metadata:

```
frontend-react:
  ecosystemScore: 0.95
  hiringValueScore: 0.92
  easeOfLearningScore: 0.75
  timeToJobReadyScore: 0.80
  communitySizeScore: 0.95
  marketTrendScore: 0.90

frontend-vue:
  ecosystemScore: 0.70
  hiringValueScore: 0.55
  easeOfLearningScore: 0.85
  timeToJobReadyScore: 0.85
  communitySizeScore: 0.70
  marketTrendScore: 0.60

frontend-angular:
  ecosystemScore: 0.80
  hiringValueScore: 0.75
  easeOfLearningScore: 0.60
  timeToJobReadyScore: 0.70
  communitySizeScore: 0.65
  marketTrendScore: 0.50
```

**Weight Adjustments**:

Starting weights: `[0.25, 0.25, 0.20, 0.15, 0.10, 0.05]`

Apply "beginner" modifiers:

```
W_ease +0.05      → 0.20 + 0.05 = 0.25
W_ecosystem −0.03 → 0.25 − 0.03 = 0.22
W_trend −0.02     → 0.05 − 0.02 = 0.03
```

Apply "job-hunting" modifiers:

```
W_hiring +0.05      → 0.25 + 0.05 = 0.30
W_community −0.03   → 0.10 − 0.03 = 0.07
W_trend −0.02       → 0.03 − 0.02 = 0.01  (cumulative with beginner)
```

Apply "120 min/day (moderate)" modifiers:

```
(No changes)
```

**Adjusted Weights**:

```
W_ecosystem = 0.22
W_hiring    = 0.30
W_ease      = 0.25
W_time      = 0.15
W_community = 0.07
W_trend     = 0.01
────────────────────
Sum         = 1.00 (already normalized)
```

### Scoring Calculation

**Formula for each track**:

```
Score(track) = Σ(W_k × Meta_k(track))
```

**React Score**:

```
= (0.95 × 0.22) + (0.92 × 0.30) + (0.75 × 0.25) + (0.80 × 0.15) + (0.95 × 0.07) + (0.90 × 0.01)
= 0.209 + 0.276 + 0.1875 + 0.12 + 0.0665 + 0.009
= 0.868
```

**Vue Score**:

```
= (0.70 × 0.22) + (0.55 × 0.30) + (0.85 × 0.25) + (0.85 × 0.15) + (0.70 × 0.07) + (0.60 × 0.01)
= 0.154 + 0.165 + 0.2125 + 0.1275 + 0.049 + 0.006
= 0.714
```

**Angular Score**:

```
= (0.80 × 0.22) + (0.75 × 0.30) + (0.60 × 0.25) + (0.70 × 0.15) + (0.65 × 0.07) + (0.50 × 0.01)
= 0.176 + 0.225 + 0.15 + 0.105 + 0.0455 + 0.005
= 0.707
```

**Ranking**: React (0.868) > Vue (0.714) > Angular (0.707)

**Chosen Track**: `frontend-react`

### TrackDecision Output

The scoring engine returns a complete `TrackDecision` object:

```json
{
  "chosenTrackId": "frontend-react",
  "rankedAlternatives": [
    {
      "trackId": "frontend-react",
      "rank": 1,
      "score": 0.868,
      "topReasons": [
        "Highest hiring value score (0.92)",
        "Strongest ecosystem (0.95)",
        "Largest community support (0.95)"
      ]
    },
    {
      "trackId": "frontend-vue",
      "rank": 2,
      "score": 0.714,
      "topReasons": [
        "Easiest to learn (0.85)",
        "Fastest time-to-job-ready (0.85)"
      ]
    },
    {
      "trackId": "frontend-angular",
      "rank": 3,
      "score": 0.707,
      "topReasons": [
        "Solid hiring value (0.75)",
        "Strong ecosystem (0.80)"
      ]
    }
  ],
  "scoresByTrack": {
    "frontend-react": {
      "score": 0.868,
      "metadata": {
        "ecosystemScore": 0.95,
        "hiringValueScore": 0.92,
        "easeOfLearningScore": 0.75,
        "timeToJobReadyScore": 0.80,
        "communitySizeScore": 0.95,
        "marketTrendScore": 0.90
      }
    },
    "frontend-vue": {
      "score": 0.714,
      "metadata": { ... }
    },
    "frontend-angular": {
      "score": 0.707,
      "metadata": { ... }
    }
  },
  "weightsUsed": {
    "ecosystem": 0.22,
    "hiring": 0.30,
    "ease": 0.25,
    "time": 0.15,
    "community": 0.07,
    "trend": 0.01
  }
}
```

### UI Usage

The `rankedAlternatives` array enables the frontend to:

1. Display the chosen track as the **primary recommendation**
2. Show 2–3 **alternative tracks** with scores and reasons
3. Allow users to **compare side-by-side** before confirming
4. Provide **explainability** ("Why not Vue?" — explain score gap)

### Determinism Rules

1. **No randomization** — No RNG, no sampling
2. **Same input → same output** — Idempotent scoring
3. **Stable tie-breaking**:
   - If scores tie within ±0.01, select track with highest `hiringValueScore`
   - If still tied, select alphabetically by `trackId`

---

## Complete End-to-End Data Flow

### Full User Journey

```
1. USER AUTHENTICATION (STEP 1)
   │
   ├─ POST /auth/signup (Google OAuth or email)
   ├─ User created in Users collection
   └─ JWT token issued

2. BASIC PROFILE (STEP 2)
   │
   ├─ POST /api/v1/users/profile
   │  {
   │    experienceLevel: "beginner",
   │    learningGoal: "job-hunting",
   │    timeAvailabilityPerDay: 120,
   │    preferredLearningStyle: ["video", "hands-on"],
   │    timezone: "America/New_York"
   │  }
   │
   └─ UserProfile created/updated
      readyForRoadmapGeneration = true IF all required fields exist

3. ROLE SELECTION (STEP 3)
   │
   ├─ GET /api/v1/roles
   │  → List all available roles
   │
   ├─ User selects target roles
   │
   └─ PUT /api/v1/users/profile
      { targetRoles: ["frontend-developer"] }
      readyForRoadmapGeneration = true (if steps 1–3 complete)

4. ROADMAP GENERATION (STEP 4)
   │
   ├─ User clicks "Generate Roadmap"
   │
   ├─ GET /api/v1/users/profile
   │  Check: readyForRoadmapGeneration = true?
   │         backgroundSkillsByRole["frontend-developer"] exists?
   │
   ├─ IF skills missing:
   │  │
   │  ├─ GET /api/v1/roles/frontend-developer/tracks
   │  │  → List candidate tracks
   │  │
   │  ├─ GET /api/v1/roles/frontend-developer/core-skills
   │  │  → Fetch role core skill IDs
   │  │
   │  ├─ GET /api/v1/roles/frontend-developer/tracks/frontend-react/core-skills
   │  │  → Fetch track core skill IDs
   │  │
   │  ├─ COMPUTE intersection (Role order, top 5–7)
   │  │
   │  └─ DISPLAY Quick Skill Check modal
   │
   ├─ IF user fills Quick Skill Check:
   │  │
   │  ├─ User provides skill levels for 5–7 skills
   │  │
   │  ├─ PUT /api/v1/users/profile
   │  │  {
   │  │    backgroundSkillsByRole: {
   │  │      "frontend-developer": {
   │  │        "javascript-basics": 2,
   │  │        "es6-features": 1,
   │  │        "dom-manipulation": 2,
   │  │        "git": 3,
   │  │        "react-basics": 0
   │  │      }
   │  │    }
   │  │  }
   │  │  (Skills PERSISTED BEFORE generation)
   │  │
   │  └─ PROCEED with full generation (Step 5A)
   │
   ├─ IF user skips Quick Skill Check:
   │  │
   │  ├─ Do NOT update UserProfile
   │  │
   │  └─ PROCEED with DEFAULT_BEGINNER (Step 5B)
   │
5A. GENERATION WITH PROVIDED SKILLS
   │
   ├─ POST /api/v1/roadmaps/generate
   │  {
   │    roleId: "frontend-developer",
   │    trackId: "frontend-react",
   │    skillProvidedViaQuickCheck: true
   │  }
   │
   ├─ VALIDATE profile (readyForRoadmapGeneration = true? roleId in targetRoles?)
   │
   ├─ TRACK SELECTION (Phase 3)
   │  Fetch Track metadata (6 scores)
   │  Apply weight adjustments based on UserProfile
   │  Score all candidate tracks
   │  Select track with highest score
   │  Return TrackDecision with ranked alternatives
   │
   ├─ FETCH RoadmapTemplate (for selected track)
   │
   ├─ COMPUTE effectiveSkills from UserProfile.backgroundSkillsByRole[roleId]
   │
   ├─ GENERATE roadmap (Phase 4 logic)
   │  Topographic sort of prerequisites
   │  Apply pacing algorithm (time availability)
   │  Assign priority (mandatory/recommended/optional)
   │  Computer explainability (why this skill? why this order?)
   │
   └─ CREATE UserRoadmapInstance
      {
        roadmapInstanceId: "rm-123",
        userId: "user-456",
        roleId: "frontend-developer",
        trackId: "frontend-react",
        status: "active",
        assumptionPolicyUsed: null,        // No fallback
        missingInputs: [],
        roadmapNodes: [ ... ],
        explainabilityData: { ... },
        generatedAt: "2026-02-20T10:00:00Z"
      }

5B. GENERATION WITH DEFAULT_BEGINNER
   │
   ├─ POST /api/v1/roadmaps/generate
   │  {
   │    roleId: "frontend-developer",
   │    trackId: "frontend-react",
   │    skillProvidedViaQuickCheck: false
   │  }
   │
   ├─ VALIDATE profile (readyForRoadmapGeneration = true? roleId in targetRoles?)
   │
   ├─ TRACK SELECTION (Phase 3) — same as 5A
   │
   ├─ FETCH RoadmapTemplate
   │
   ├─ COMPUTE effectiveSkills = all skills at level 0 (beginner)
   │
   ├─ GENERATE roadmap (Phase 4 logic)
   │  Results in longer roadmap (includes all fundamentals)
   │
   └─ CREATE UserRoadmapInstance
      {
        ...,
        assumptionPolicyUsed: "DEFAULT_BEGINNER",
        missingInputs: ["skills"],
        ...
      }
      + Display warning banner on roadmap
```

---

## Database Schema

### Collections

#### `users`

```javascript
{
  _id: ObjectId,
  googleId: string,          // or email/password hash
  email: string,
  name: string,
  createdAt: Date,
  lastLoginAt: Date
}
```

#### `userprofiles`

```javascript
{
  _id: ObjectId,
  userId: string (ObjectId → users),
  experienceLevel: string enum,
  learningGoal: string enum,
  timeAvailabilityPerDay: number,
  preferredLearningStyle: [string],
  targetRoles: [string],
  timezone: string,
  backgroundSkillsByRole: {
    "frontend-developer": {
      "javascript-basics": 2,
      "es6-features": 1,
      ...
    },
    ...
  },
  readyForRoadmapGeneration: boolean,
  createdAt: Date,
  lastUpdatedAt: Date
}
```

#### `roles`

```javascript
{
  _id: ObjectId,
  id: string unique,
  name: string,
  description: string,
  coreSkillIds: [string],      // Static array of Skill IDs
  averageTimeToHire: number,
  marketDemand: string enum,
  targetAudience: [string],
  tracks: [string]             // Track IDs
}
```

#### `tracks`

```javascript
{
  _id: ObjectId,
  id: string unique,
  name: string,
  roleId: string,
  primaryTech: string,
  supportingTechs: [string],
  ecosystemScore: number,
  hiringValueScore: number,
  easeOfLearningScore: number,
  timeToJobReadyScore: number,
  communitySizeScore: number,
  marketTrendScore: number,
  communitySize: string,
  trendingUp: boolean,
  lastReviewedAt: Date
}
```

#### `skills`

```javascript
{
  _id: ObjectId,
  id: string unique,
  name: string,
  category: string enum,
  difficulty: string enum,
  estimatedHours: number,
  description: string,
  learningObjectives: [string],
  relatedSkillIds: [string],
  lastUpdatedAt: Date
}
```

#### `resources`

```javascript
{
  _id: ObjectId,
  id: string unique,
  title: string,
  type: string enum,
  url: string,
  sourceTitle: string,
  durationMinutes: number,
  qualityRating: number,
  learningStyle: [string],
  targetDifficulty: string enum,
  language: string,
  accessibility: {
    requiresPayment: boolean,
    requiresAccount: boolean,
    hasSubtitles: boolean,
    isOpenSource: boolean
  },
  lastVerifiedAt: Date
}
```

#### `roadmaptemplates`

```javascript
{
  _id: ObjectId,
  id: string unique,
  trackId: string,
  version: string,
  skillGraph: {
    nodes: [{
      nodeId: string,
      skillId: string,
      skillName: string,
      category: string,
      estimatedHours: number,
      prerequisites: [string],   // skillIds
      priority: string enum,
      sequenceOrder: number
    }],
    edges: [{
      from: string,              // skillId
      to: string,                // skillId (prerequisite)
      strength: "hard" | "soft"
    }]
  },
  totalEstimatedHours: number,
  createdAt: Date,
  updatedAt: Date
}
```

#### `userroadmapinstances`

```javascript
{
  _id: ObjectId,
  roadmapInstanceId: string unique,
  userId: string,
  roleId: string,
  trackId: string,
  templateId: string,
  templateVersion: string,
  status: string enum,
  roadmapNodes: [{
    nodeId: string,
    skillId: string,
    skillName: string,
    milestoneId: string,
    sequenceOrder: number,
    estimatedHours: number,
    priority: string enum,
    status: string enum,
    skipped: boolean,
    startDate: Date,
    estimatedCompletionDate: Date,
    actualCompletionDate: Date
  }],
  estimatedCompletionDate: Date,
  selectedResourceIndices: {
    "node-1": ["resource-id-1", "resource-id-2"],
    ...
  },
  explainabilityData: {
    trackDecision: {
      chosenTrackId: string,
      scoresByTrack: { ... },
      rankedAlternatives: [ ... ],
      weightsUsed: { ... },
      topReasons: [string]
    },
    nodeReasons: {
      "node-1": {
        whyIncluded: [string],
        whyOrderedHere: [string]
      },
      ...
    }
  },
  assumptionPolicyUsed: string | null,
  missingInputs: [string],
  generatedAt: Date,
  lastReviewedAt: Date
}
```

#### `progress` (Future Phase 5)

```javascript
{
  _id: ObjectId,
  userId: string,
  roadmapInstanceId: string,
  roadmapNodeId: string,
  status: string enum,
  startedAt: Date,
  completedAt: Date,
  actualHoursSpent: number,
  resourcesUsed: [{
    resourceId: string,
    timeSpentMinutes: number,
    rating: number
  }],
  selfAssessment: { ... },
  notes: string,
  recordedAt: Date
}
```

---

## API Contract Summary

### User Profile APIs

| Method | Endpoint                | Purpose                                  |
| ------ | ----------------------- | ---------------------------------------- |
| POST   | `/api/v1/users/profile` | Create/initialize user profile           |
| GET    | `/api/v1/users/profile` | Fetch user's profile                     |
| PUT    | `/api/v1/users/profile` | Update profile (add skills, roles, etc.) |

### Role & Track APIs

| Method | Endpoint                                            | Purpose                      |
| ------ | --------------------------------------------------- | ---------------------------- |
| GET    | `/api/v1/roles`                                     | List all available roles     |
| GET    | `/api/v1/roles/:roleId/tracks`                      | List tracks for a role       |
| GET    | `/api/v1/roles/:roleId/core-skills`                 | Fetch role's core skill IDs  |
| GET    | `/api/v1/roles/:roleId/tracks/:trackId/core-skills` | Fetch track's core skill IDs |

### Roadmap Generation APIs

| Method | Endpoint                              | Purpose                     |
| ------ | ------------------------------------- | --------------------------- |
| POST   | `/api/v1/roadmaps/generate`           | Generate a new roadmap      |
| GET    | `/api/v1/roadmaps/:roadmapInstanceId` | Fetch a roadmap instance    |
| GET    | `/api/v1/roadmaps`                    | List user's roadmap history |

---

## Key Design Decisions

### 1. Skills Are Global

Skills like "Git", "ES6+", "REST API" appear in multiple tracks. Storing them once and referencing by ID prevents duplication and ensures consistency.

### 2. Default Track Selection Happens Dynamically

There's no `isDefault` flag on Track. Instead, when a user generates a roadmap, the Track Selection Engine (Phase 3) scores all candidate tracks and picks the best one based on the user's profile.

### 3. Role Core Skills Are Static

`Role.coreSkillIds` is a curated, static array stored in the database. The system does NOT derive core skills dynamically from skill graphs. This ensures stability and prevents surprises when graphs change.

### 4. Profile Update BEFORE Generation

When a user fills the Quick Skill Check modal, skills are persisted to `UserProfile.backgroundSkillsByRole[roleId]` **before** roadmap generation. This ensures skills are saved even if generation fails.

### 5. Skills Never Block Generation

If skills are missing, the system assumes `DEFAULT_BEGINNER` (all skills = level 0) and generates a roadmap. This prevents UX freezing and ensures the user always gets a roadmap.

### 6. Roadmaps Are Immutable Snapshots

`UserRoadmapInstance` is created once and never mutated. If the user's profile changes and they want re-personalization, they generate a **new** roadmap instance. Progress is linked to this immutable snapshot, allowing accurate tracking.

### 7. Deterministic Track Scoring

- No randomization
- Same inputs → Same outputs
- Weights adjusted deterministically based on user profile
- Tie-breaker rules are explicit (hiringValueScore, then alphabetical)

### 8. Explainability Is First-Class

Every roadmap includes `explainabilityData` explaining WHY the track was chosen and WHY each skill is included and ordered. This builds trust and enables adaptive reasoning.

### 9. Time Availability Is a First-Class Input

Different users have different time budgets (30 min/day vs 4 hours/day). Track adjustments and pacing algorithms respect this. A busy user might get a shorter, faster path; a dedicated learner gets a comprehensive path.

### 10. Roles Are Hierarchical

A user pursues a Role (Frontend Developer), which has multiple Tracks (React, Vue, Angular), each Track has a RoadmapTemplate (versioned), and the Template contains ordered Skills. This hierarchy enables flexible personalization.

---

## Summary

The Learning Path Optimizer is built on three pillars:

1. **Phase 1: Domain Model** — Well-defined entities (Role, Track, Skill, Resource, UserProfile, RoadmapTemplate, UserRoadmapInstance) with clear relationships and purposes.

2. **Phase 2: User Input** — A 4-step onboarding flow that gathers essential profile data, offers Quick Skill Check for proficiency measurement, and validates before generation. Missing skills trigger a graceful `DEFAULT_BEGINNER` fallback.

3. **Phase 3: Track Selection** — A deterministic scoring engine that ranks tracks based on curated metadata (6 scores) and personalizes weights based on user profile (experience, goal, time availability). Output includes ranked alternatives and full explainability.

**Phases 4–7** will define:

- Phase 4: Roadmap Generation Engine (topological sorting, pacing, priority)
- Phase 5: Progress Tracking & Adaptation
- Phase 6: Resource Selection & Integration
- Phase 7: Analytics & Insights

**Phases 8–9** will implement:

- Phase 8: Backend Code (Node.js + Express)
- Phase 9: Frontend Code (React + Vite + Tailwind)

---

**End of Complete System Architecture**

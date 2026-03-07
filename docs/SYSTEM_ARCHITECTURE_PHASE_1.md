# System Architecture: Core Logic Rebuild

## PHASE 1 — Core Domain Modeling (REVISED)

**Status**: ⛔ CHECKPOINT 1 — Awaiting Final Approval

---

## Overview

This document defines the core entities and domain model for the Learning Path Optimizer system (REVISED VERSION). The system enables users to generate personalized learning roadmaps for various roles (Frontend Developer, Backend Developer, etc.), with multiple track options per role (React vs Angular vs Vue for frontend).

This revision addresses critical design issues from the initial Phase 1 submission:

- Separated Resource as its own entity (avoiding embedded document bloat)
- Fixed relationship hierarchy (Role → Track → RoadmapTemplate, not Role → RoadmapTemplate)
- Made skills global and reusable (no trackId ownership)
- Removed static default track selection; moved to dynamic generation
- Structured explainability properly with trackDecision and nodeReasons
- Added Skill Input & Fallback Policy for robustness

No code implementation yet. This phase establishes the corrected conceptual foundation.

---

## Core Entities

### 1. Role

**Purpose**  
A professional or learning target that encompasses multiple possible learning paths. Examples: Frontend Developer, Backend Developer, Full-Stack Developer, DevOps Engineer, Data Engineer.

**Key Fields**

- `id` (string, unique): e.g., "frontend-developer"
- `name` (string): "Frontend Developer"
- `description` (string): High-level explanation of the role
- `targetAudience` (array of strings): ["college students", "self-learners", "career switchers"]
- `averageTimeToHire` (integer): Estimated weeks of focused learning until job-ready
- `marketDemand` (enum): "very-high", "high", "medium", "niche"
- `tracks` (array of Track IDs): Available learning paths within this role

**Relationships**

- One-to-many: A Role has many Tracks
- Many-to-many: A User can pursue multiple Roles

**Why It Exists**  
Roles abstract over implementation details. Two developers both need to "learn front-end", but one may choose React (industry standard, largest ecosystem) while another chooses Vue (smaller community, faster learning curve). The Role is the umbrella; Tracks are the specific paths within it.

---

### 2. Track

**Purpose**  
A specific technology-focused learning path within a Role. Represents a major technological choice that shapes the entire roadmap. Examples: "React + Redux", "Vue 3 + Pinia", "Angular + RxJS".

**Key Fields**

- `id` (string, unique): e.g., "frontend-react"
- `name` (string): "React & Modern Frontend"
- `roleId` (string): Reference to parent Role
- `primaryTech` (string): "React" (the hero technology)
- `supportingTechs` (array of strings): ["Redux", "Next.js", "Tailwind CSS"]
- `ecosystemScore` (number 0–1): How mature, large, and standardized the ecosystem is
- `hiringValueScore` (number 0–1): Job market demand for this track
- `easeOfLearningScore` (number 0–1): How easy to learn this track (1 = easiest, 0 = hardest)
  - **REVISED**: Replaced `learningCurveScore` with `easeOfLearningScore`
  - **SEMANTIC FIX**: Now consistently "higher = better" across all scoring metrics
- `timeToJobReadyScore` (number 0–1): Speed to employment-level competency (1 = fastest, 0 = slowest)
- `communitySize` (string): "huge", "large", "medium", "small"
- `trendingUp` (boolean): Is adoption increasing?
- `lastReviewedAt` (timestamp): When was this track's metadata last updated?
- `recommendedForTags` (array of strings): ["startups", "enterprises", "games", "data-viz"]

**Relationships**

- Many-to-one: A Track belongs to one Role
- One-to-many: A Track has many RoadmapTemplates (versioned baselines)
  - **REVISED RELATIONSHIP**: RoadmapTemplates are now owned by Track, not Role
- Implicit: A Track's RoadmapTemplate(s) contain Skills via the skill graph

**Why It Exists**  
Different tracks serve different career goals and learning preferences. React dominates the job market; Vue has a gentler learning curve. The system must represent both choices clearly and let users decide based on personalization. Track metadata (scores) enables deterministic track selection during roadmap generation.

**REVISED IN PHASE 1**:

- Removed `isDefault` field. Default track selection happens dynamically per user during generation.
- Renamed `learningCurveScore` to `easeOfLearningScore` for clarity.
- Fixed relationship: RoadmapTemplates now belong to Track, not Role.

---

### 3. Skill (aka Node)

**Purpose**  
An atomic, learnable unit of knowledge or capability. Global, reusable across multiple Tracks. Examples: "JavaScript Basics", "DOM Manipulation", "React Hooks", "REST API Design".

**Key Fields**

- `id` (string, unique): e.g., "react-hooks"
- `name` (string): "React Hooks"
- `category` (string): "core", "optional", "advanced"
- `difficulty` (enum): "beginner", "intermediate", "advanced"
- `estimatedHours` (number): How long to learn this skill, on average
- `description` (string): Brief explanation of what this skill entails
- `learningObjectives` (array of strings): What can you DO after learning this?
  - e.g., "Write stateful functional React components"
  - e.g., "Manage component lifecycles without class components"
- `relatedSkillIds` (array of Skill IDs): Skills that are related (soft dependencies)
  - This field is optional, for knowledge graph purposes
- `lastUpdatedAt` (timestamp)

**Relationships**

- Zero or more: A Skill may have related Skills (soft references)
- Implicit: Skills are connected via Prerequisite Graphs in RoadmapTemplates
- Implicit: Skills are linked to Resources via ResourceSkill join mappings

**Why It Exists**  
The Skill is the granular unit of the roadmap. Instead of saying "learn React" (vague), the system says "learn React Hooks" (specific). Skills are deliberately global and NOT owned by Tracks because:

- A skill like "Git" may appear in all tracks (Frontend, Backend, DevOps, etc.)
- A skill like "ES6+" appears in both React and Angular tracks
- Skill reuse prevents duplication and keeps the data model lean

Prerequisites are NOT stored in Skill. Instead, they live in RoadmapTemplate graphs. This allows different Tracks to define different prerequisite orders for the same Skill.

**REVISED IN PHASE 1**:

- Removed `trackId` field. Skills are now global.
- Removed embedded `resources` array. Resources are now in a separate Resource entity.
- Relationships to Tracks and Resources are now implicit (via RoadmapTemplate graphs and ResourceSkill join mappings).

---

### 4. Resource

**Purpose**  
A learning material or interactive tool. Examples: "Complete React Tutorial - YouTube", "MDN - React Hooks", "Building a Todo App - Interactive Course", "Eloquent JavaScript - Book".

**Key Fields**

- `id` (string, unique): e.g., "yt-react-hooks-1"
- `title` (string): "React Hooks Explained"
- `type` (enum): "video", "article", "interactive", "book", "course", "documentation"
- `url` (string): Link to the resource
- `sourceTitle` (string): "YouTube", "MDN", "Udemy", "Free Code Camp", etc.
- `durationMinutes` (number): Expected time to complete
- `qualityRating` (number 0–5): Community consensus on usefulness
- `learningStyle` (array of strings): ["visual", "hands-on", "reading", "listening"]
  - Helps filter resources by user preference
- `targetDifficulty` (enum): "beginner", "intermediate", "advanced"
  - Which learner level is this resource aimed at?
- `language` (string): "en", "es", "fr", etc.
- `accessibility` (object):
  - `requiresPayment` (boolean)
  - `requiresAccount` (boolean)
  - `hasSubtitles` (boolean)
  - `isOpenSource` (boolean)
- `lastVerifiedAt` (timestamp): When was this link last checked to ensure it still works?

**Relationships**

- Many-to-many: A Resource may be linked to many Skills (via ResourceSkill join table)
- Implicit: Resources are assigned to UserRoadmapInstance milestones during personalization

**Why It Exists**  
Resources are now first-class entities, not embedded documents. Benefits:

- **Reusability**: Same resource can be curated for multiple Skills without duplication
- **Leanness**: Skill documents are smaller; don't bloat with resource details
- **Analytics**: Easy to track which resources are most-used across users
- **Curation**: Curators can update a resource's rating or URL once, affecting all uses
- **Filtering**: Resources are now easily filterable by type, difficulty, learningStyle, cost, etc.

**NEW IN REVISED PHASE 1**:

- Separated into its own entity (previously embedded in Skill)

---

### 5. ResourceSkill (Join/Bridge Entity)

**Purpose**  
Maps Skills to Resources in a many-to-many relationship, with priority metadata.

**Key Fields**

- `id` (string, unique): e.g., "skill-react-hooks:resource-yt-tutorial"
- `skillId` (string): Which Skill?
- `resourceId` (string): Which Resource?
- `priority` (number 0–10): Curation ranking. Higher = more important or better fit.
  - Used to sort resources for a skill; top resources shown first
- `isOfficial` (boolean): Is this resource officially endorsed by the framework creators?
- `comments` (string, optional): Curation notes. e.g., "Best intro video for beginners"

**Relationships**

- Many-to-one: Many ResourceSkill rows reference one Skill
- Many-to-one: Many ResourceSkill rows reference one Resource
- Implicit: These enable the many-to-many link between Skill and Resource

**Why It Exists**  
Instead of embedding resources in Skills, we use a join table. This enables:

- Metadata per skill-resource pair (e.g., this video is "high priority" for beginners but "optional" for advanced learners)
- Efficient queries: "Get top 3 resources for React Hooks"
- Analytics: Track which resources are frequently used for which skills

**NEW IN REVISED PHASE 1**:

- Introduced to normalize Skill-Resource relationships

**Purpose**  
A directed acyclic graph (DAG) representing skill dependencies within a Track. Enables deterministic, optimal ordering of skills.

---

### 6. Prerequisite Graph

**Purpose**  
A directed acyclic graph (DAG) representing skill dependencies within a Track's RoadmapTemplate. Enables deterministic, optimal ordering of skills.

**Key Fields**

- `id` (string, unique): Embedded within RoadmapTemplate, identified by template + track
- `nodes` (array of Skill IDs): All skills in the graph
- `edges` (array of objects):
  - `fromSkillId` (Skill ID): Prerequisite skill
  - `toSkillId` (Skill ID): Dependent skill
  - `strength` (enum): "hard" (must learn first), "soft" (recommended but optional)
  - `reason` (string): Why is this dependency? e.g., "Hooks requires understanding functional components"

**Example Graph (Frontend React Track)**

```
JavaScript Basics
    ↓
ES6+ (arrow functions, destructuring)
    ↓
DOM Manipulation
    ↓
React Basics
    ↙         ↘
React Hooks    JSX
    ↓
State Management (Redux)
    ↓
Testing
```

**Why It Exists**  
Without prerequisites, the roadmap would be a flat list, and learners would make suboptimal ordering decisions. Prerequisites enable:

1. **Topological sorting**: Compute an optimal learning order automatically
2. **Validation**: Ensure recommended sequences make sense
3. **Skipping**: Advanced learners can skip basics if they know prerequisites
4. **Intelligent prioritization**: If a user struggles with Hooks, the system can suggest strengthening React Basics first

---

### 7. RoadmapTemplate

**Purpose**  
A versioned, baseline structure for generating personalized roadmaps. Encapsulates the skill graph, milestones, and learning progression for a specific Track. Not user-specific; shared across all users pursuing a given Track and version.

**Key Fields**

- `id` (string, unique): e.g., "frontend-react-v2"
- `trackId` (string): Which Track is this template for?
  - **REVISED RELATIONSHIP**: RoadmapTemplate now belongs to Track, not Role
- `version` (string): "v1.0", "v2.0" (incremented when skills, graph, or milestones change)
- `skillGraph` (Prerequisite Graph object): The DAG of skills for this track
  - Contains nodes (skill IDs), edges (prerequisites, strength, reason)
- `milestones` (array of objects): **Grouping/organizational only** (not ordering)
  - `id` (string): "milestone-1-basics"
  - `name` (string): "JavaScript & DOM Fundamentals"
  - `skillIds` (array of Skill IDs): Skills grouped in this milestone for UI/UX organization
  - `estimatedTotalHours` (number): Sum of all skill hours in milestone
  - `conceptualGate` (string): What can you build after this milestone?
    - e.g., "Interactive static web pages with vanilla JavaScript"
  - `isMandatory` (boolean): Is this milestone required to be job-ready?
  - Note: sequenceOrder is NOT here. Actual learning order comes from the prerequisite graph and topological sort.
- `createdAt` (timestamp)
- `lastUpdatedAt` (timestamp)
- `approvedBy` (string): Admin or curator who validated this template
- `changeLog` (array of strings): Record of updates ("v2.0: Added Next.js milestone")

**Relationships**

- Many-to-one: Many RoadmapTemplates can exist per Track (versions)
  - **REVISED RELATIONSHIP**: RoadmapTemplate now belongs to Track
- One-to-many: A RoadmapTemplate has many Milestones
- Implicit: References Skill IDs from the global Skill pool

**Why It Exists**  
Users don't need unique baseline structures; they need the same learning sequence with personalized pacing. RoadmapTemplate is the reusable skeleton. When the React ecosystem changes (e.g., Hooks become more important), curators update the template once, and all future user roadmaps reflect the change. Users generating roadmaps at different times get slightly different versions, which is intentional.

**REVISED IN PHASE 1**:

- Now explicitly owned by Track (not Role)
- Emphasizes that it's a deterministic, versioned graph structure

---

### 8. UserProfile

**Purpose**  
Stores user-specific learning attributes and preferences. Drives personalization. Separate from authentication.

**Key Fields**

- `userId` (string, unique): Reference to user account
- `experienceLevel` (enum): "beginner", "intermediate", "advanced"
  - Based on years of programming experience or self-assessment
- `backgroundSkills` (object, optional): Skills the user already knows
  - Structure: `{ skillId: proficiencyLevel }` where proficiencyLevel is 0–5
  - e.g., `{ "javascript-basics": 4, "html-css": 3 }`
  - If provided, the system can skip prerequisite skills
- `learningGoal` (enum): "job-hunting", "mastery", "quick-skills", "career-switch"
  - Influences pacing and optional-vs-mandatory skill prioritization
- `timeAvailabilityPerDay` (number): Minutes per day the user can dedicate
  - Ranges from 30 (very limited) to 480 (full-time learning)
- `preferredLearningStyle` (array of strings): ["video", "hands-on", "book", "interactive"]
  - Resource filtering; if user hates videos, system favors articles
- `targetRoles` (array of Role IDs): Which roles is the user pursuing?
  - e.g., ["frontend-developer", "full-stack-developer"]
- `readyForRoadmapGeneration` (boolean): Do we have enough info to generate roadmaps?
  - False if required fields are missing: experienceLevel, learningGoal, timeAvailabilityPerDay, targetRoles
- `timezone` (string): For future scheduling recommendations
- `createdAt` (timestamp)
- `lastUpdatedAt` (timestamp)

**Relationships**

- One-to-many: A User has many UserRoadmapInstances
- Reference: Imports Skills (if backgroundSkills provided) and Roles

**Why It Exists**  
Personalization happens here. Without user data, the system treats everyone equally. With UserProfile, the system can:

- Skip prerequisite skills the user already knows
- Prioritize mandatory skills over optional ones for job-seekers
- Adjust pacing: a user with 30 mins/day gets a 3-month roadmap; 240 mins/day gets a 1-month roadmap
- Filter resources: a visual learner sees videos; a reader sees articles

---

### 9. UserRoadmapInstance

**Purpose**  
A personalized, user-specific roadmap. Derived from RoadmapTemplate but tailored to UserProfile. One user can have multiple instances (one per role or track). Includes progress tracking and explainability data.

**Key Fields**

- `id` (string, unique)
- `userId` (string): Which user owns this roadmap?
- `roleId` (string): Which role is this roadmap for?
- `trackId` (string): Which track within the role?
- `templateId` (string): Which RoadmapTemplate was used to generate this?
- `templateVersion` (string): "v2.0" (recorded at generation time to prevent breaking changes)
- `status` (enum): "active", "paused", "completed", "archived"
- `roadmapNodes` (array of objects): Personalized, ordered learning sequence (the actual graph traversal)
  - `nodeId` (string, unique within roadmap): e.g., "node-1-js-basics"
  - `skillId` (string): Reference to global Skill
  - `skillName` (string): Denormalized for easy display
  - `milestoneId` (string): Which milestone grouping does this belong to? (stable reference to RoadmapTemplate milestone)
  - `sequenceOrder` (integer): Position in overall roadmap (1, 2, 3, ...)
  - `estimatedHours` (number): Personalized estimate (may differ from template if user has background)
  - `priority` (enum): "mandatory", "recommended", "optional" (determined at generation time)
  - `skipped` (boolean): Did the user confirm they already know this?
  - `startDate` (timestamp, nullable): When should user start this node?
  - `estimatedCompletionDate` (timestamp, nullable): When should user finish?
  - `actualCompletionDate` (timestamp, nullable): When did user finish? (if completed)
  - `status` (enum): "not-started", "in-progress", "completed", "reviewed"
- `estimatedCompletionDate` (timestamp): When will the full roadmap be done?
- `selectedResourceIndices` (object): Curated resources selected for this user
  - Structure: `{ roadmapNodeId: [resourceId1, resourceId2, ...] }`
  - e.g., `{ "node-1-js-basics": ["yt-js-basics", "mdn-js-docs"] }`
- `explainabilityData` (object):
  - `trackDecision` (object):
    - `chosenTrackId` (string): Which track was selected? e.g., "frontend-react"
    - `alternativeTracksConsidered` (array of Track IDs): e.g., ["frontend-vue", "frontend-angular"]
    - `scoresByTrack` (object): Scores used to select the default track
      - e.g., `{ "frontend-react": { ecosystemScore: 0.95, hiringValueScore: 0.92, ... }, ... }`
    - `topReasons` (array of strings): Why this track was chosen
      - e.g., "Largest job market (95% hiring value score)"
      - e.g., "Most mature ecosystem"
  - `nodeReasons` (object): Keyed by roadmapNodeId
    - Structure: `{ nodeId: { whyIncluded: [...], whyOrderedHere: [...] } }`
    - e.g., `{ "node-1-js-basics": { whyIncluded: ["Foundation for all frontend work"], whyOrderedHere: ["No prerequisites"] } }`
- `assumptionPolicyUsed` (string, optional): Which fallback policy was applied?
  - e.g., "DEFAULT_BEGINNER" (user didn't provide skills; assumed level 0 for all)
- `missingInputs` (array of strings, optional): Which user inputs were missing?
  - e.g., ["skills"]
- `generatedAt` (timestamp): When was this roadmap created?
- `lastReviewedAt` (timestamp): When was this last updated by user?

**Relationships**

- Many-to-one: Many UserRoadmapInstances belong to one User
- Many-to-one: Many UserRoadmapInstances reference one RoadmapTemplate
- Reference: Links to UserProfile, Role, Track
- One-to-many: One UserRoadmapInstance has many roadmapNodes
- One-to-many: One UserRoadmapInstance has one explainabilityData object

**Why It Exists**  
This is THE output of the roadmap generation engine. It's user-specific, personalized, versioned, and includes progress tracking. By separating Template (reusable) from Instance (user-specific), the system can:

- Update templates without affecting user roadmaps (version pinning)
- Track progress per user
- Support multiple roadmaps: a user learning React AND Vue has two instances
- Regenerate roadmaps on demand (e.g., if user updates availability, system recalculates pacing)
- Provide explainability: "Why this track?", "Why this order?"

**REVISED IN PHASE 1**:

- Renamed `milestones` to `roadmapNodes` for clarity (aligns with graph model)
- Restructured `explainabilityData` with `trackDecision` and `nodeReasons` keyed by nodeId
- Added `assumptionPolicyUsed` and `missingInputs` to track fallback behavior
- Changed progress from `milestoneIndex` to `roadmapNodes` (more granular, node-based tracking)

---

### 10. Progress (Node-based)

**Purpose**  
Tracks user's actual learning activity against roadmap nodes. Primary tracking is by roadmapNode.

**Key Fields**

- `id` (string, unique)
- `userId` (string)
- `roadmapInstanceId` (string)
- `roadmapNodeId` (string): Which node in the roadmap is this progress for?
  - **REVISED**: Now primary tracking key (was `skillId`)
- `status` (enum): "not-started", "in-progress", "completed", "reviewed"
- `startedAt` (timestamp, nullable)
- `completedAt` (timestamp, nullable)
- `actualHoursSpent` (number): How long did the user actually spend? (vs. estimated)
- `resourcesUsed` (array of objects):
  - `resourceId` (string)
  - `timeSpentMinutes` (number)
  - `rating` (number 0–5): Did the user find this resource helpful?
- `selfAssessment` (object, nullable):
  - `confidenceLevel` (enum): "not-confident", "somewhat", "confident", "very-confident"
  - `canExplain` (boolean): Can user explain this skill to someone else?
  - `canBuild` (boolean): Can user apply this in a real project?
- `notes` (string): User notes or blockers (e.g., "struggled with async/await")
- `nextRecommendedAction` (string): System-generated tip
- `recordedAt` (timestamp): When was this progress recorded?

**Relationships**

- Many-to-one: Many Progress records belong to one UserRoadmapInstance
- Reference: Links to roadmapNodeId (not directly to Skill, though Skill can be derived via the node)

**Why It Exists**  
Progress tracking enables:

1. **Adaptive recommendations**: If user takes 40 hours for a node estimated at 20, the system extends future estimates
2. **Confidence signals**: System identifies areas where user feels shaky and recommends reinforcement
3. **Accountability**: Users see tangible evidence of progress
4. **Analytics**: Over time, the system learns which resources are most effective across cohorts
5. **Graph-aware UI**: Tracking nodes (not skills) enables rich roadmap UIs with progress visualization

**KEY MODEL CHOICE**:

- Tracks `roadmapNodeId` (the node in the graph), not `skillId`
- Enables graph-aware UI and rich progress visualization

---

## Relationships Summary (REVISED)

```
Role (1) ──────────→ (many) Track
                       ↓
                    (many)
                       ↓
              RoadmapTemplate (v1, v2, v3, ...)
                       ↓
                  (many in template)
                       ↓
              Skill (global, reusable)
                       ↓
                  (many-to-many via)
                       ↓
                    Resource
                   (join via ResourceSkill)

UserProfile ─────────────────→ (1) User
                                    ↓
                                 (many)
                                    ↓
                       UserRoadmapInstance ──→ RoadmapTemplate (versioned ref)
                       (includes roadmapNodes)  ──→ Track
                                    ↓               ──→ Role
                                 (many)
                                    ↓
                               Progress
                               (tracks roadmapNode)
```

---

## Skill Input & Fallback Policy

**CRITICAL**: This policy ensures roadmap generation is ALWAYS POSSIBLE, even if user data is incomplete.

### Scenario 1: User Provides Full Skill Profile

**Trigger**: User has filled in `UserProfile.backgroundSkills` for the selected role/track.

**Behavior**:

- Backend uses provided skill levels directly.
- Roadmap is generated with all personalizations applied.
- `assumptionPolicyUsed` is NOT set (or set to null).
- Output note: "Roadmap personalized based on your skill profile."

---

### Scenario 2: User Has NOT Provided Skill Levels for This Role/Track

**Trigger**: UserProfile exists, but `backgroundSkills` is empty or doesn't cover the selected track's core skills.

**Behavior**:

1. **UI Step**: Present a short "Quick Skill Check" immediately before roadmap generation.
   - Show core role-required skills, filtered to the selected track.
   - e.g., For Frontend role + React track: JavaScript Basics, ES6+, React Basics, DOM Manipulation, etc.
   - Display 5–7 core skills (not optional/advanced skills).
   - Allow user to select their level (0–5) for each.
   - Include a "Skip" button.

2. **If User Completes the Check**:
   - Persist the skill levels in `UserProfile.backgroundSkills`.
   - Proceed to roadmap generation with full personalization.
   - Output note: "Roadmap personalized based on your skill profile."

3. **If User Skips the Check**:
   - **DO NOT BLOCK roadmap generation.**
   - Fall through to Scenario 3.

---

### Scenario 3: User Provides NO Skill Data (Skip or Missing)

**Trigger**: User skips Quick Skill Check or never provided backgroundSkills.

**Behavior**:

1. **Deterministic Fallback**: Assume user is a beginner in ALL core skills of the selected track.
   - Set all core skills to level 0 or 1 (beginner).
   - Optional skills default to level 0 (not applicable).

2. **Persist the Decision**:
   - Set `assumptionPolicyUsed = "DEFAULT_BEGINNER"` in UserRoadmapInstance.
   - Set `missingInputs = ["skills"]` in UserRoadmapInstance.

3. **Generate Roadmap**:
   - Proceed with full roadmap generation using the beginner assumption.
   - Roadmap will be longer (includes all prerequisites) and broader (includes all basics).

4. **Output Note**:
   - Display this message prominently on the generated roadmap:

   ```
   "ℹ️ Roadmap generated assuming beginner level (no skill data provided).
   Update your skills in settings to personalize and potentially shorten this roadmap.
   This will recalculate recommendations based on your actual experience."
   ```

5. **UI Affordance**:
   - Include a "Quick Skill Check" link in the note.
   - When clicked, user can fill in the Quick Skill Check.
   - System regenerates roadmap with updated skill profile.

---

### Example Flowchart

```
User selects Role & Track
        ↓
Backend checks: UserProfile.backgroundSkills has relevant skills?
        ↓                                               ↓
    YES                                               NO
        ↓                                               ↓
  Generate Roadmap                            Show "Quick Skill Check" UI
  with full                                   (5-7 core skills)
  personalization                                     ↓
  ("Roadmap personalized")                  User fills in levels?
        ↓                                     ↓             ↓
   Return to User                           YES           NO/SKIP
                                              ↓             ↓
                                         Save to          Fallback to
                                         UserProfile       DEFAULT_BEGINNER
                                              ↓             ↓
                                         Generate      Generate Roadmap
                                         Roadmap       with assumption
                                         ("Personalized")  policy
                                              ↓             ↓
                                         Return with  Return with
                                         "Update      warning note
                                         skills"      ("Update skills")
                                         option
```

---

### Implementation Notes

1. **Deterministic Default**: The DEFAULT_BEGINNER assumption is algorithmic, not random.
   - Same user, same track → same fallback roadmap every time.
   - This ensures predictability for testing and auditing.

2. **No Blocking**: Fallback MUST NOT prevent roadmap generation.
   - If user has no time to provide skills, they can still get a roadmap.
   - System gracefully degrades to a generic beginner path.

3. **Recovery Path**: User can always improve the roadmap later.
   - "Quick Skill Check" is always available in settings or roadmap detail.
   - When user updates skills, system regenerates the roadmap.
   - Previous progress/roadmap versions are archived (not lost).

4. **Audit Trail**: `assumptionPolicyUsed` and `missingInputs` enable system operators to:
   - Identify users who need reminders to complete profiling.
   - Measure impact of missing data on roadmap quality.
   - Trigger follow-up emails: "Complete your profile to get a better roadmap."

---

## Validation Rules (REVISED)

### UserProfile Completeness

- If any of these are missing, set `readyForRoadmapGeneration = false`:
  - `experienceLevel`
  - `learningGoal`
  - `timeAvailabilityPerDay`
  - `targetRoles` (non-empty array)

- Note: `backgroundSkills` is optional. Missing skills trigger the fallback policy, not a validation error.

### UserRoadmapInstance Validity

- Cannot be generated if required UserProfile fields are missing.
- CAN be generated even if `backgroundSkills` are missing (fallback applies).
- Must reference an existing Role and Track.
- Must reference an existing RoadmapTemplate version.
- `estimatedCompletionDate` cannot be before `generatedAt`.

### Progress Validity

- `roadmapNodeId` must belong to the RoadmapInstance.
- `completedAt` cannot be before `startedAt`.
- `actualHoursSpent` must be ≥ 0.

---

## Key Design Decisions (REVISED PHASE 1)

1. **Separation of Template vs. Instance** (MAINTAINED)
   - RoadmapTemplate is immutable and versioned (curated, reusable).
   - UserRoadmapInstance is mutable and personalized (per-user, including progress).
   - This prevents user roadmaps from breaking if the template changes.

2. **Prerequisite Graph over Flat List** (MAINTAINED)
   - Skills are nodes in a DAG, not a linear sequence.
   - Enables topological sorting for optimal ordering.
   - Allows skipping and intelligent prioritization.

3. **Multiple Tracks per Role** (MAINTAINED)
   - Roles are abstract (Frontend Developer).
   - Tracks are concrete (React, Vue, Angular).
   - This accommodates different career goals and learning preferences.

4. **Default Track Selection is Dynamic, Not Static** (NEW)
   - Removed `Track.isDefault` field.
   - Default track is chosen deterministically during roadmap generation.
   - System selects the track with the highest composite score for the user.
   - Selection logic lives in the generation engine, not in static metadata.

5. **Global, Reusable Skills** (REVISED)
   - Removed `skill.trackId` ownership.
   - Skills are linked to Tracks via RoadmapTemplate graphs and ResourceSkill mappings.
   - Enables skill reuse across multiple tracks and roles.

6. **Separate Resource Entity** (NEW)
   - Resources are no longer embedded in Skills.
   - Introduced Resource and ResourceSkill entities.
   - Enables resource reuse, curation, filtering, and analytics.

7. **Structured Explainability** (REVISED)
   - Replaced blob-style explainability with structured data.
   - `trackDecision` contains track selection reasoning with scores and top reasons.
   - `nodeReasons` are keyed by roadmapNodeId, containing why-included and why-ordered-here reasons.
   - Explainability is stored, not computed on-the-fly.

8. **Node-Based Progress Tracking** (REVISED)
   - Primary tracking is by `roadmapNodeId`, not `skillId`.
   - Aligns with graph-based roadmap UIs and enables rich progress visualization.

9. **Graceful Fallback for Missing Skill Data** (NEW)
   - If user doesn't provide skill levels, system assumes DEFAULT_BEGINNER.
   - Roadmap generation NEVER blocks; it always produces output.
   - Missing skill data is recorded for auditing and user follow-up.

10. **Consistent Scoring Semantics** (REVISED)
    - All Track scores follow "higher = better" semantics.
    - Renamed `learningCurveScore` to `easeOfLearningScore` for clarity.

---

## Summary of Changes from Initial Phase 1

| Change                                                                 | Reason                                         | Impact                                                                   |
| ---------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| Removed `Track.isDefault`                                              | Default selection is user-specific, not static | Track selection now dynamic; generation engine owns default logic        |
| Renamed `learningCurveScore` to `easeOfLearningScore`                  | Semantic clarity; higher = easier              | All scores now consistently "higher = better" across all scoring metrics |
| Separated Resource entity                                              | Avoid embedded document bloat; enable reuse    | Skills are leaner; resources more flexible                               |
| Fixed relationship: RoadmapTemplate → Track                            | Correct ownership hierarchy                    | Role → Track → RoadmapTemplate                                           |
| Made Skills global (removed `trackId`)                                 | Skills are reusable across tracks              | Resources and Tracks link to skills via mappings, not ownership          |
| Introduced ResourceSkill join table                                    | Many-to-many normalization                     | Resources decoupled from Skills                                          |
| Restructured `explainabilityData`                                      | Clear, auditable reasoning                     | `trackDecision` + `nodeReasons` keyed by nodeId                          |
| Changed Progress to track `roadmapNodeId`                              | Align with graph model; enable rich UI         | Progress is granular, graph-aware                                        |
| Added Skill Input & Fallback Policy                                    | Robustness; no blocking on missing data        | Generation always succeeds; fallback to DEFAULT_BEGINNER                 |
| Added `assumptionPolicyUsed` & `missingInputs` (product key: "skills") | Audit trail; user messaging                    | System records why assumptions were made                                 |

---

## Next Steps

**PHASE 2** will define how user data is collected via onboarding, implement the Quick Skill Check step, and detail the roadmap generation algorithm that applies the Skill Input & Fallback Policy.

---

## ✅ CHECKPOINT 1 (REVISED)

**Please confirm Phase 1 (REVISED) is complete and correct before proceeding to Phase 2.**

**Review Checklist**:

1. ✅ Track.isDefault removed; default selection is now dynamic?
2. ✅ learningCurveScore renamed to easeOfLearningScore; all scores are "higher = better"?
3. ✅ Resource entity separated; ResourceSkill join table introduced?
4. ✅ RoadmapTemplate relationship corrected to Track (not Role)?
5. ✅ Skills are global; no trackId ownership?
6. ✅ Explainability properly structured with trackDecision and nodeReasons?
7. ✅ Progress tracks roadmapNodeId (not just skillId)?
8. ✅ Skill Input & Fallback Policy documented with DEFAULT_BEGINNER behavior?
9. ✅ All relationships and data flows correct?
10. ✅ Ready for Phase 2 (User Input & Onboarding Logic)?

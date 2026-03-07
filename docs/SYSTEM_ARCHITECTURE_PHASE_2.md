# System Architecture: Core Logic Rebuild

## PHASE 2 — User Input & Onboarding Logic

**Status**: 🔄 IN PROGRESS — Design Phase

---

## Overview

Phase 2 defines how users enter the system, provide learning preferences, and trigger roadmap generation. This phase ensures that **skill data is optional** but **roadmap generation never blocks**. If skills are missing, the system falls back to DEFAULT_BEGINNER and generates a beginner-level roadmap.

Key outcomes:

- Onboarding flow (signup → profile → role selection)
- Quick Skill Check modal (role core skills → track filtered → 5-7 skills)
- Backend logic for incomplete profiles (NEED_MORE_INFO only for required non-skill fields)
- API contracts with examples
- Validation rules (Zod schemas)
- Data persistence strategy (UserProfile vs UserRoadmapInstance)
- End-to-end sequence diagrams

---

## 1. Onboarding Flow

### 1.1 User Journey Map

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Authentication                                     │
│ - Sign Up / Login (existing auth system)                   │
│ - Set timezone                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Basic Learning Profile                            │
│ - experienceLevel (beginner/intermediate/advanced)          │
│ - learningGoal (job-hunting/mastery/quick-skills/...)      │
│ - timeAvailabilityPerDay (30–480 minutes)                  │
│ - preferredLearningStyle (video/book/hands-on/interactive) │
│ - Optional: backgroundSkills (can defer)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Role Selection                                     │
│ - User picks target roles (e.g., "Frontend Developer")      │
│ - System stores: targetRoles = ["frontend-developer", ...]│
│ - readyForRoadmapGeneration = true (if phases 1–3 complete)│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Generate Roadmap (on-demand)                      │
│ - User clicks "Generate Roadmap" for a role                │
│ - System checks if backgroundSkills exist for that role     │
│ - If missing: Show Quick Skill Check modal                 │
│ - If user skips: Use DEFAULT_BEGINNER fallback             │
│ - Generate + return roadmap                                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 UserProfile Lifecycle

**Completion Status**:

- `readyForRoadmapGeneration` is TRUE only when these are provided:
  - `experienceLevel` ✓
  - `learningGoal` ✓
  - `timeAvailabilityPerDay` ✓
  - `targetRoles` (non-empty array) ✓

**Optional During Onboarding**:

- `backgroundSkills` — can be filled during onboarding OR Quick Skill Check OR skipped entirely

**Mutation Flow**:

1. User completes basic profile → `readyForRoadmapGeneration = true`
2. User selects role(s) and clicks "Generate Roadmap"
3. System checks if `backgroundSkills[selectedRole]` exists
4. If missing → Quick Skill Check is presented
5. User fills Quick Skill Check → skills persisted to `backgroundSkills`
6. User skips Quick Skill Check → roadmap generation uses DEFAULT_BEGINNER

---

## 2. Quick Skill Check Flow

### 2.1 When Quick Skill Check is Triggered

**Condition**:

```
IF user clicks "Generate Roadmap" for roleId:
  AND UserProfile.backgroundSkills[roleId] is missing or incomplete:
    THEN show Quick Skill Check modal
```

**Incomplete** means:

- No skills provided at all, OR
- Fewer than 50% of role-core skills provided

### 2.2 Skill Selection Logic (Role → Track Filter)

**Step 1: Fetch Role Core Skills**

```
roleCoreSkills = [
  { skillId: "javascript-basics", name: "JavaScript Basics" },
  { skillId: "problem-solving", name: "Problem Solving" },
  { skillId: "git", name: "Version Control (Git)" },
  ...
]
```

**Step 2: Fetch Track and Filter to Track-Specific Core Skills**

```
selectedTrackId = "frontend-react"  // user selected track
trackCoreSkills = skillGraph(selectedTrackId).coreSkills
  .filter(skill => roleCoreSkills.includes(skill))

// Result: 5–7 skills that are both role-required AND track-relevant
displaySkills = trackCoreSkills.slice(0, 7)
```

**Example**:

```
Role: Frontend Developer
  Core skills: JavaScript Basics, HTML/CSS, DOM, Git, Problem Solving, ...

Selected Track: React
  Track core skills: JavaScript Basics, ES6+, React Basics, DOM, JSX, Git, ...

Quick Skill Check displays:
  ✓ JavaScript Basics
  ✓ ES6+ Features
  ✓ DOM Manipulation
  ✓ React Basics
  ✓ Git
  (5 skills)
```

### 2.3 Quick Skill Check UI

**Modal Structure**:

```
┌──────────────────────────────────────────────┐
│ Quick Skill Check                            │
│ (Your experience before we generate your     │
│  personalized roadmap)                       │
├──────────────────────────────────────────────┤
│                                              │
│ For: Frontend Developer → React              │
│                                              │
│ □ JavaScript Basics          [0] [1] [2]... │
│ □ ES6+ Features              [0] [1] [2]... │
│ □ DOM Manipulation           [0] [1] [2]... │
│ □ React Basics               [0] [1] [2]... │
│ □ Git                        [0] [1] [2]... │
│                                              │
│         [Skip] [Continue]                    │
└──────────────────────────────────────────────┘
```

**Levels** (0–5):

- 0 = Never heard of it
- 1 = Heard of it, no hands-on experience
- 2 = Basic hands-on, can do simple projects
- 3 = Intermediate, comfortable with most tasks
- 4 = Advanced, can teach others
- 5 = Expert, actively contribute to ecosystem

### 2.4 Quick Skill Check Outcomes

**Outcome A: User Completes**

```
POST /api/v1/roadmaps/generate
{
  roleId: "frontend-developer",
  trackId: "frontend-react",
  skillProvidedViaQuickCheck: true,
  skills: {
    "javascript-basics": 2,
    "es6-features": 1,
    "dom-manipulation": 2,
    "react-basics": 0,
    "git": 3
  }
}

Behavior:
1. Merge skills into UserProfile.backgroundSkills
2. Generate roadmap with full personalization
3. Return: { roadmap, assumptionPolicyUsed: null }
```

**Outcome B: User Skips**

```
POST /api/v1/roadmaps/generate
{
  roleId: "frontend-developer",
  trackId: "frontend-react",
  skillProvidedViaQuickCheck: false
  // no skills field
}

Behavior:
1. Do NOT merge anything into UserProfile
2. Use DEFAULT_BEGINNER assumption
3. Generate roadmap (longer, includes all basics)
4. Return: { roadmap, assumptionPolicyUsed: "DEFAULT_BEGINNER", missingInputs: ["skills"] }
```

---

## 3. Backend Behavior for Incomplete Profiles

### 3.1 Profile Validation Rules

**Required for readyForRoadmapGeneration**:

- `experienceLevel` ✓ (non-null enum)
- `learningGoal` ✓ (non-null enum)
- `timeAvailabilityPerDay` ✓ (30–480 integer)
- `targetRoles` ✓ (non-empty array)

**Optional**:

- `backgroundSkills` — NOT required; missing triggers fallback

### 3.2 Roadmap Generation Validation

**Endpoint**: `POST /api/v1/roadmaps/generate`

**Validation Chain**:

```
1. Check UserProfile.readyForRoadmapGeneration
   → If false: Return { status: "NEED_MORE_INFO", missing: ["experienceLevel", "timeAvailabilityPerDay", ...] }

2. Check if selectedRole in UserProfile.targetRoles
   → If false: Return { status: "ERROR", message: "Role not in user's target roles" }

3. Check if UserProfile.backgroundSkills[selectedRole] exists
   → If missing: Proceed with DEFAULT_BEGINNER fallback (NO ERROR)

4. Generate roadmap with effective skill profile
   → If skills provided: Use provided levels
   → If not provided: Assume all skills = level 0 (beginner)

5. Return: { roadmap, assumptionPolicyUsed, missingInputs }
```

### 3.3 NEED_MORE_INFO Response Structure

Only returned if **required profile fields** are missing. Skills missing NEVER triggers this.

```typescript
{
  status: "NEED_MORE_INFO",
  missingFields: [
    {
      fieldName: "timeAvailabilityPerDay",
      displayMessage: "How many minutes per day can you dedicate?"
    },
    {
      fieldName: "learningGoal",
      displayMessage: "What's your primary learning goal?"
    }
  ],
  nextStep: "Complete profile in Settings → Learning Profile"
}
```

---

## 4. API Endpoints

### 4.1 Roles & Tracks

**GET /api/v1/roles**

```json
{
  "roles": [
    {
      "id": "frontend-developer",
      "name": "Frontend Developer",
      "description": "Build user interfaces with modern web technologies",
      "averageTimeToHire": 12,
      "marketDemand": "very-high"
    },
    {
      "id": "backend-developer",
      "name": "Backend Developer",
      "description": "Build robust server-side systems",
      "averageTimeToHire": 14,
      "marketDemand": "high"
    }
  ]
}
```

**GET /api/v1/roles/:roleId/tracks**

```json
{
  "roleId": "frontend-developer",
  "tracks": [
    {
      "id": "frontend-react",
      "name": "React & Modern Frontend",
      "primaryTech": "React",
      "ecosystemScore": 0.95,
      "hiringValueScore": 0.92,
      "easeOfLearningScore": 0.75,
      "timeToJobReadyScore": 0.8,
      "communitySize": "huge",
      "trendingUp": true
    },
    {
      "id": "frontend-vue",
      "name": "Vue & Minimalist Frontend",
      "primaryTech": "Vue",
      "ecosystemScore": 0.7,
      "hiringValueScore": 0.55,
      "easeOfLearningScore": 0.85,
      "timeToJobReadyScore": 0.85,
      "communitySize": "large",
      "trendingUp": false
    }
  ]
}
```

### 4.2 Quick Skill Check

**GET /api/v1/roles/:roleId/core-skills**

```json
{
  "roleId": "frontend-developer",
  "coreSkills": [
    { "skillId": "javascript-basics", "name": "JavaScript Basics", "category": "core" },
    { "skillId": "html-css", "name": "HTML & CSS", "category": "core" },
    { "skillId": "dom-manipulation", "name": "DOM Manipulation", "category": "core" },
    { "skillId": "git", "name": "Version Control (Git)", "category": "core" },
    { "skillId": "problem-solving", "name": "Problem Solving", "category": "core" }
  ]
}
```

**GET /api/v1/roles/:roleId/tracks/:trackId/core-skills**

```json
{
  "roleId": "frontend-developer",
  "trackId": "frontend-react",
  "coreSkillsForTrack": [
    { "skillId": "javascript-basics", "name": "JavaScript Basics", "displayOrder": 1 },
    { "skillId": "es6-features", "name": "ES6+ Features", "displayOrder": 2 },
    { "skillId": "react-basics", "name": "React Basics", "displayOrder": 3 },
    { "skillId": "dom-manipulation", "name": "DOM Manipulation", "displayOrder": 4 },
    { "skillId": "git", "name": "Version Control (Git)", "displayOrder": 5 }
  ]
}
```

### 4.3 User Profile

**POST /api/v1/users/profile**

```json
Request:
{
  "experienceLevel": "beginner",
  "learningGoal": "job-hunting",
  "timeAvailabilityPerDay": 120,
  "preferredLearningStyle": ["video", "hands-on"],
  "targetRoles": ["frontend-developer", "full-stack-developer"],
  "timezone": "America/New_York"
}

Response (201 Created):
{
  "userId": "user-123",
  "readyForRoadmapGeneration": true,
  "profile": {
    "experienceLevel": "beginner",
    "learningGoal": "job-hunting",
    "timeAvailabilityPerDay": 120,
    "preferredLearningStyle": ["video", "hands-on"],
    "targetRoles": ["frontend-developer", "full-stack-developer"],
    "backgroundSkills": {},
    "createdAt": "2026-02-05T10:00:00Z"
  }
}
```

**PUT /api/v1/users/profile**

```json
Request:
{
  "backgroundSkills": {
    "frontend-developer": {
      "javascript-basics": 3,
      "html-css": 2,
      "git": 2
    }
  }
}

Response (200 OK):
{
  "readyForRoadmapGeneration": true,
  "profile": { ... updated profile ... }
}
```

**GET /api/v1/users/profile**

```json
Response (200 OK):
{
  "userId": "user-123",
  "readyForRoadmapGeneration": true,
  "profile": { ... full profile ... }
}
```

### 4.4 Roadmap Generation

**POST /api/v1/roadmaps/generate**

```json
Request:
{
  "roleId": "frontend-developer",
  "trackId": "frontend-react",
  "skillProvidedViaQuickCheck": false
}

Response (with DEFAULT_BEGINNER fallback):
{
  "roadmapInstanceId": "roadmap-456",
  "userId": "user-123",
  "roleId": "frontend-developer",
  "trackId": "frontend-react",
  "status": "active",
  "generatedAt": "2026-02-05T10:15:00Z",
  "assumptionPolicyUsed": "DEFAULT_BEGINNER",
  "missingInputs": ["skills"],
  "estimatedCompletionDate": "2026-04-05T10:15:00Z",
  "roadmapNodes": [
    {
      "nodeId": "node-1",
      "skillId": "javascript-basics",
      "skillName": "JavaScript Basics",
      "milestoneId": "milestone-1",
      "sequenceOrder": 1,
      "estimatedHours": 20,
      "priority": "mandatory",
      "status": "not-started"
    },
    ...
  ],
  "explainabilityData": {
    "trackDecision": {
      "chosenTrackId": "frontend-react",
      "scoresByTrack": {
        "frontend-react": { "ecosystemScore": 0.95, "hiringValueScore": 0.92, ... },
        "frontend-vue": { "ecosystemScore": 0.70, "hiringValueScore": 0.55, ... }
      },
      "topReasons": [
        "Largest job market (92% hiring value)",
        "Most mature ecosystem and community"
      ]
    },
    "nodeReasons": {
      "node-1": {
        "whyIncluded": ["Foundation for all frontend work"],
        "whyOrderedHere": ["No prerequisites"]
      }
    }
  }
}
```

**POST /api/v1/roadmaps/generate with Profile Incomplete**

```json
Request: (valid, but missing required fields in profile)
{
  "roleId": "frontend-developer",
  "trackId": "frontend-react"
}

Response (400 Bad Request):
{
  "status": "NEED_MORE_INFO",
  "missingFields": [
    {
      "fieldName": "timeAvailabilityPerDay",
      "displayMessage": "How many minutes per day can you dedicate?"
    }
  ],
  "nextStep": "Complete profile in Settings"
}
```

**GET /api/v1/roadmaps/:roadmapInstanceId**

```json
Response (200 OK):
{
  "roadmapInstanceId": "roadmap-456",
  "userId": "user-123",
  "roleId": "frontend-developer",
  "trackId": "frontend-react",
  "status": "active",
  "roadmapNodes": [ ... ],
  "explainabilityData": { ... },
  "assumptionPolicyUsed": "DEFAULT_BEGINNER",
  "missingInputs": ["skills"],
  "generatedAt": "2026-02-05T10:15:00Z"
}
```

**GET /api/v1/roadmaps (history)**

```json
Response (200 OK):
{
  "roadmaps": [
    {
      "roadmapInstanceId": "roadmap-456",
      "roleId": "frontend-developer",
      "trackId": "frontend-react",
      "status": "active",
      "generatedAt": "2026-02-05T10:15:00Z",
      "assumptionPolicyUsed": "DEFAULT_BEGINNER"
    },
    {
      "roadmapInstanceId": "roadmap-457",
      "roleId": "full-stack-developer",
      "trackId": "mern-stack",
      "status": "completed",
      "generatedAt": "2026-01-15T10:15:00Z",
      "assumptionPolicyUsed": null
    }
  ]
}
```

---

## 5. Validation Rules (Zod Schemas)

### 5.1 UserProfile Schema

```typescript
// @/schemas/userProfile.schema.ts

import { z } from 'zod';

export const userProfileInputSchema = z.object({
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  learningGoal: z.enum(['job-hunting', 'mastery', 'quick-skills', 'career-switch']),
  timeAvailabilityPerDay: z.number().int().min(30).max(480),
  preferredLearningStyle: z.array(z.enum(['video', 'hands-on', 'book', 'interactive'])).min(1),
  targetRoles: z.array(z.string()).min(1),
  timezone: z.string().optional(),
});

export const backgroundSkillsSchema = z.record(
  z.string(), // roleId key
  z.record(
    z.string(), // skillId key
    z.number().int().min(0).max(5) // proficiency level
  )
);

export const userProfileSchema = userProfileInputSchema.extend({
  userId: z.string(),
  backgroundSkills: backgroundSkillsSchema.optional().default({}),
  readyForRoadmapGeneration: z.boolean(),
  createdAt: z.date(),
  lastUpdatedAt: z.date(),
});
```

### 5.2 Roadmap Generation Request Schema

```typescript
export const generateRoadmapRequestSchema = z.object({
  roleId: z.string(),
  trackId: z.string(),
  skillProvidedViaQuickCheck: z.boolean().optional().default(false),
  skills: z.record(z.string(), z.number().int().min(0).max(5)).optional(),
});

export const generateRoadmapResponseSchema = z.object({
  roadmapInstanceId: z.string(),
  userId: z.string(),
  roleId: z.string(),
  trackId: z.string(),
  status: z.enum(['active', 'paused', 'completed', 'archived']),
  generatedAt: z.date(),
  assumptionPolicyUsed: z.enum(['DEFAULT_BEGINNER']).optional().nullable(),
  missingInputs: z.array(z.string()).optional(),
  estimatedCompletionDate: z.date(),
  roadmapNodes: z.array(
    z.object({
      nodeId: z.string(),
      skillId: z.string(),
      skillName: z.string(),
      milestoneId: z.string(),
      sequenceOrder: z.number(),
      estimatedHours: z.number(),
      priority: z.enum(['mandatory', 'recommended', 'optional']),
      status: z.enum(['not-started', 'in-progress', 'completed', 'reviewed']),
    })
  ),
  explainabilityData: z.object({
    trackDecision: z.object({
      chosenTrackId: z.string(),
      scoresByTrack: z.record(z.string(), z.record(z.string(), z.number())),
      topReasons: z.array(z.string()),
    }),
    nodeReasons: z.record(
      z.string(),
      z.object({
        whyIncluded: z.array(z.string()),
        whyOrderedHere: z.array(z.string()),
      })
    ),
  }),
});
```

### 5.3 Profile Validation Helper

```typescript
export function validateProfileCompleteness(profile: UserProfile): {
  isComplete: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!profile.experienceLevel) missingFields.push('experienceLevel');
  if (!profile.learningGoal) missingFields.push('learningGoal');
  if (!profile.timeAvailabilityPerDay) missingFields.push('timeAvailabilityPerDay');
  if (!profile.targetRoles || profile.targetRoles.length === 0) missingFields.push('targetRoles');

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

export function checkRoadmapGenerationEligibility(
  profile: UserProfile,
  selectedRole: string
): {
  eligible: boolean;
  error?: { status: string; message: string };
} {
  const { isComplete, missingFields } = validateProfileCompleteness(profile);

  if (!isComplete) {
    return {
      eligible: false,
      error: {
        status: 'NEED_MORE_INFO',
        message: `Missing required fields: ${missingFields.join(', ')}`,
      },
    };
  }

  if (!profile.targetRoles.includes(selectedRole)) {
    return {
      eligible: false,
      error: {
        status: 'ERROR',
        message: "Selected role not in user's target roles",
      },
    };
  }

  // Skills missing is NOT an error; fallback will apply
  return { eligible: true };
}
```

---

## 6. Data Persistence Strategy

### 6.1 What Goes Where?

**UserProfile (Persistent across all roadmaps)**

- `userId`, `experienceLevel`, `learningGoal`, `timeAvailabilityPerDay`
- `preferredLearningStyle`, `targetRoles`, `timezone`
- `backgroundSkills` (optional, shared across roadmaps)
- Updated once during onboarding; can be updated anytime in Settings

**UserRoadmapInstance (Per-roadmap, immutable in essence)**

- `roadmapInstanceId`, `userId`, `roleId`, `trackId`
- `roadmapNodes`, `explainabilityData` (computed at generation time)
- `assumptionPolicyUsed`, `missingInputs` (audit trail)
- `status` (active/paused/completed/archived)
- Progress updates attached to this instance only

### 6.2 Skill Data Flow

**Scenario A: User Provides Skills During Onboarding**

```
UserProfile.backgroundSkills = {
  "frontend-developer": {
    "javascript-basics": 3,
    "html-css": 2
  }
}
↓ (persist to DB)
↓ (When generating roadmap, use these skills)
UserRoadmapInstance.assumptionPolicyUsed = null
```

**Scenario B: Quick Skill Check Filled**

```
User fills Quick Skill Check for Frontend + React
↓ (POST to update profile)
UserProfile.backgroundSkills["frontend-developer"] = { ... }
↓ (persist to DB)
↓ (Proceed to roadmap generation)
UserRoadmapInstance.assumptionPolicyUsed = null
```

**Scenario C: User Skips Quick Skill Check**

```
User skips Quick Skill Check
↓ (Do NOT update UserProfile)
↓ (Generate roadmap with DEFAULT_BEGINNER assumption)
UserRoadmapInstance.assumptionPolicyUsed = "DEFAULT_BEGINNER"
UserRoadmapInstance.missingInputs = ["skills"]
↓ (persist roadmap instance with assumption note)
```

### 6.3 Database Collections

**Users Collection** (existing)

```javascript
{
  _id: ObjectId,
  googleId: string,
  email: string,
  name: string,
  createdAt: Date,
  lastLoginAt: Date
}
```

**UserProfiles Collection** (new)

```javascript
{
  _id: ObjectId,
  userId: string (ref to Users._id),
  experienceLevel: enum,
  learningGoal: enum,
  timeAvailabilityPerDay: number,
  preferredLearningStyle: [string],
  targetRoles: [string],
  timezone: string,
  backgroundSkills: {
    "frontend-developer": {
      "javascript-basics": 3,
      "html-css": 2
    }
  },
  readyForRoadmapGeneration: boolean,
  createdAt: Date,
  lastUpdatedAt: Date
}
```

**UserRoadmapInstances Collection** (new)

```javascript
{
  _id: ObjectId,
  roadmapInstanceId: string (unique),
  userId: string (ref to Users._id),
  roleId: string,
  trackId: string,
  templateId: string,
  templateVersion: string,
  status: enum,
  roadmapNodes: [{
    nodeId: string,
    skillId: string,
    skillName: string,
    milestoneId: string,
    sequenceOrder: number,
    estimatedHours: number,
    priority: enum,
    skipped: boolean,
    startDate: Date,
    estimatedCompletionDate: Date,
    actualCompletionDate: Date,
    status: enum
  }],
  estimatedCompletionDate: Date,
  selectedResourceIndices: {
    "node-1": ["resource-1", "resource-2"]
  },
  explainabilityData: { ... },
  assumptionPolicyUsed: string,
  missingInputs: [string],
  generatedAt: Date,
  lastReviewedAt: Date
}
```

**Progress Collection** (new)

```javascript
{
  _id: ObjectId,
  userId: string,
  roadmapInstanceId: string,
  roadmapNodeId: string,
  status: enum,
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

## 7. End-to-End Sequence Diagrams

### 7.1 Generation with Skills Already Provided

```
User                    Frontend                      Backend
│                           │                           │
├─ Click "Generate"         │                           │
│─────────────────────────>│                           │
│                           │                           │
│                           ├─ GET profile              │
│                           ├─────────────────────────>│
│                           │<─────────────────────────┤
│                           │ (has backgroundSkills)   │
│                           │                           │
│                           ├─ POST /generate           │
│                           ├─────────────────────────>│
│                           │  (roleId, trackId)       │
│                           │                           │
│                           │                           ├─ Validate profile
│                           │                           ├─ Check skills exist
│                           │                           ├─ Get template
│                           │                           ├─ Topological sort
│                           │                           ├─ Compute scores
│                           │                           ├─ Save instance
│                           │                           │
│                           │<─────────────────────────┤
│                           │ (roadmap with           │
│                           │  assumptionPolicyUsed:  │
│                           │  null)                  │
│                           │                           │
│<──────────────────────────┤                           │
│ Display roadmap           │                           │
│ (fully personalized)      │                           │
```

### 7.2 Generation with Quick Skill Check

```
User                    Frontend                      Backend
│                           │                           │
├─ Click "Generate"         │                           │
│─────────────────────────>│                           │
│                           │                           │
│                           ├─ GET profile              │
│                           ├─────────────────────────>│
│                           │<─────────────────────────┤
│                           │ (NO backgroundSkills)    │
│                           │                           │
│                           ├─ GET core skills         │
│                           ├─────────────────────────>│
│                           │<─────────────────────────┤
│                           │ (5-7 core skills)        │
│                           │                           │
│<──────────────────────────┤                           │
│ Show Quick Skill Check    │                           │
│ modal                     │                           │
│                           │                           │
├─ User fills 5-7 skills    │                           │
│─────────────────────────>│                           │
│ (or clicks Skip)          │                           │
│                           │                           │
│                           ├─ POST /profile/update    │
│                           ├─────────────────────────>│
│                           │ (save skills to profile) │
│                           │<─────────────────────────┤
│                           │ (or skip updating)       │
│                           │                           │
│                           ├─ POST /generate          │
│                           ├─────────────────────────>│
│                           │ (roleId, trackId, skills)│
│                           │                           │
│                           │                           ├─ Validate
│                           │                           ├─ Generate
│                           │                           ├─ Save
│                           │                           │
│                           │<─────────────────────────┤
│                           │ (roadmap with            │
│                           │  assumptionPolicyUsed:   │
│                           │  null)                   │
│                           │                           │
│<──────────────────────────┤                           │
│ Display roadmap           │                           │
│ (personalized via QSC)    │                           │
```

### 7.3 Generation with DEFAULT_BEGINNER Fallback

```
User                    Frontend                      Backend
│                           │                           │
├─ Click "Generate"         │                           │
│─────────────────────────>│                           │
│                           │                           │
│                           ├─ GET profile              │
│                           ├─────────────────────────>│
│                           │<─────────────────────────┤
│                           │ (NO backgroundSkills)    │
│                           │                           │
│                           ├─ GET core skills         │
│                           ├─────────────────────────>│
│                           │<─────────────────────────┤
│                           │ (5-7 core skills)        │
│                           │                           │
│<──────────────────────────┤                           │
│ Show Quick Skill Check    │                           │
│ modal                     │                           │
│                           │                           │
├─ Click [Skip]             │                           │
│─────────────────────────>│                           │
│                           │                           │
│                           ├─ POST /generate          │
│                           ├─────────────────────────>│
│                           │ (roleId, trackId)        │
│                           │ (NO skills provided)     │
│                           │                           │
│                           │                           ├─ Validate profile
│                           │                           ├─ Check skills exist
│                           │                           │  → NO SKILLS FOUND
│                           │                           ├─ Use DEFAULT_BEGINNER
│                           │                           │   (all skills = 0)
│                           │                           ├─ Get template
│                           │                           ├─ Generate (longer)
│                           │                           ├─ Save:
│                           │                           │  assumptionPolicyUsed:
│                           │                           │  "DEFAULT_BEGINNER"
│                           │                           │  missingInputs: ["skills"]
│                           │                           │
│                           │<─────────────────────────┤
│                           │ (roadmap + warning note) │
│                           │                           │
│<──────────────────────────┤                           │
│ Display roadmap           │                           │
│ (beginner-level)          │                           │
│ + warning:                │                           │
│ "Assumed beginner...      │                           │
│  Update skills to         │                           │
│  personalize"             │                           │
│                           │                           │
│ [Update Skills] link      │                           │
```

---

## 8. Implementation Checklist

### Backend (Express)

- [ ] Create `UserProfile` model and collection
- [ ] Create `UserRoadmapInstance` model and collection
- [ ] Create `Progress` model and collection (optional for Phase 2)
- [ ] Implement validation schemas (Zod)
- [ ] Implement profile validation helper functions
- [ ] Create route: `POST /api/v1/users/profile` (create/update)
- [ ] Create route: `GET /api/v1/users/profile` (get)
- [ ] Create route: `GET /api/v1/roles`
- [ ] Create route: `GET /api/v1/roles/:roleId/tracks`
- [ ] Create route: `GET /api/v1/roles/:roleId/core-skills`
- [ ] Create route: `GET /api/v1/roles/:roleId/tracks/:trackId/core-skills`
- [ ] Create route: `POST /api/v1/roadmaps/generate` (with fallback logic)
- [ ] Create route: `GET /api/v1/roadmaps/:roadmapInstanceId`
- [ ] Create route: `GET /api/v1/roadmaps` (history)
- [ ] Implement roadmap generation engine (stub for Phase 2; full in Phase 4)
- [ ] Error handling and NEED_MORE_INFO response

### Frontend (React)

- [ ] Create `ProfileForm` component (onboarding)
- [ ] Create `QuickSkillCheck` modal component
- [ ] Create `RoleSelector` component
- [ ] Integrate role + track selection flow
- [ ] Call `POST /profile` when completing onboarding
- [ ] Call `GET /core-skills` when roadmap generation clicked
- [ ] Show Quick Skill Check modal
- [ ] Call `POST /generate` with or without skills
- [ ] Display roadmap with fallback warning (if applicable)
- [ ] Display roadmap history (`GET /roadmaps`)
- [ ] Link to update skills from warning message

### Tests

- [ ] Unit tests for profile validation
- [ ] Unit tests for completeness check
- [ ] API tests for profile endpoints
- [ ] API tests for generation (with/without skills)
- [ ] Integration test: signup → onboarding → generation flow

---

## 9. Key Decisions

1. **Skills NEVER Block Generation**: Missing skill data triggers fallback, not error. This ensures UX doesn't stall.

2. **Role-Core Skills First, Then Track Filter**: Quick Skill Check shows foundational skills first, then filters to track-specific. This respects the hierarchy.

3. **Assumption Audit Trail**: Recording `assumptionPolicyUsed` and `missingInputs` allows operators to measure impact and send follow-up emails.

4. **Profile Mutable, Roadmap Immutable**: UserProfile is updated during onboarding and can be changed anytime. UserRoadmapInstance is a snapshot; regenerating creates a new instance.

5. **Deterministic Fallback**: DEFAULT_BEGINNER is algorithmic (level 0 for all skills), not random, ensuring tests can predict behavior.

---

## Next Steps

**PHASE 3** will implement the **Track Selection Engine** — the deterministic scoring model that selects a default track for the user based on Track metadata and UserProfile data.

**PHASE 4** will implement the **Roadmap Generation Engine** — topological sorting of skills, pacing, priority assignment, and explainability.

---

## ✅ CHECKPOINT 2 — AWAITING APPROVAL

All Phase 2 deliverables are complete. Please review:

1. ✅ Onboarding flow (4 phases: auth → profile → roles → generate)
2. ✅ Quick Skill Check (role core skills → track filter → 5–7 skills)
3. ✅ Backend validation (required fields ≠ skills; skills use DEFAULT_BEGINNER fallback)
4. ✅ API endpoints (7 endpoints with examples)
5. ✅ Zod validation schemas
6. ✅ Data persistence strategy (UserProfile vs UserRoadmapInstance)
7. ✅ Sequence diagrams (3 end-to-end flows)

### Approval Questions (Max 3):

1. **Quick Skill Check Logic**: Should the "role core skills" be defined statically in the database, or dynamically derived from all tracks in the role?

2. **Profile Update Timing**: If a user fills the Quick Skill Check and then clicks "Generate," should the profile be updated BEFORE or AFTER roadmap generation completes?

3. **Fallback Messaging**: Should the DEFAULT_BEGINNER warning appear inline on the roadmap, as a toast notification, or both?

**Please confirm Phase 2 is correct, answer the 3 approval questions, and approve before I proceed to Phase 3.**

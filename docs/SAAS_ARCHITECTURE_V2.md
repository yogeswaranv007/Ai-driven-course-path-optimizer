# Learning Path Optimizer - SaaS Architecture V2

## Product Vision

Transform Learning Path Optimizer into a professional SaaS platform where users can:

- Store skills in their profile permanently
- Generate multiple roadmaps for different job roles
- Track progress across multiple learning paths
- Access historical roadmaps anytime

---

## 1. Database Schema Design

### 1.1 Users Collection

```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@example.com",
  password: "hashed_password",
  googleId: "optional_google_id",

  // NEW: Persistent user skills
  skills: [
    {
      name: "JavaScript",
      level: "intermediate", // beginner, intermediate, advanced
      addedAt: Date
    },
    {
      name: "React",
      level: "beginner",
      addedAt: Date
    }
  ],

  createdAt: Date,
  updatedAt: Date
}
```

**Purpose**: Store user authentication data and permanent skill profile.

---

### 1.2 RoadmapInstances Collection (NEW)

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("user_id"),

  // Roadmap Identity
  roleName: "Frontend Developer",
  trackChosen: "react-frontend-track",
  createdAt: Date,

  // Learning Configuration
  dailyLearningMinutes: 120, // 2 hours/day
  estimatedTotalHours: 180,
  estimatedCompletionDays: 90,

  // Skill Source Tracking
  skillSource: "profile", // "profile" or "custom"
  skillsUsed: [
    {
      name: "JavaScript",
      level: "intermediate"
    },
    {
      name: "HTML",
      level: "advanced"
    }
  ],

  // Weekly Structure
  weeks: [
    {
      weekNumber: 1,
      topic: "JavaScript Fundamentals",
      totalMinutes: 840, // 7 days × 120 min

      // AI-Generated Content
      aiContent: {
        why: "JavaScript is the foundation of modern web development...",
        keyTakeaways: [
          "Understanding variables and data types",
          "Mastering functions and scope",
          "Working with DOM manipulation"
        ]
      },

      // Structured Tasks
      tasks: [
        {
          taskId: "task_1_1",
          title: "Learn JavaScript Variables and Data Types",
          description: "Master the fundamentals of JavaScript variables...",
          skill: "JavaScript",
          estimatedMinutes: 180,
          dayNumber: 1,
          weekNumber: 1,

          status: "pending", // pending, in-progress, completed
          completedAt: null,

          reason: "Understanding variables is essential for any JavaScript developer",
          resources: [
            {
              title: "MDN JavaScript Basics",
              url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
              type: "documentation"
            },
            {
              title: "JavaScript.info - Variables",
              url: "https://javascript.info/variables",
              type: "tutorial"
            }
          ],

          // AI-Generated Exercise
          exercise: {
            description: "Create a simple calculator using variables",
            expectedOutcome: "Working calculator with basic operations",
            estimatedMinutes: 60
          }
        }
        // ... more tasks
      ]
    }
    // ... more weeks
  ],

  // Progress Tracking
  status: "active", // active, completed, abandoned
  completionPercentage: 0,
  lastAccessedAt: Date,

  // Metadata
  roadmapMetadata: {
    trackId: "react-frontend-track",
    selectedTrackName: "React Frontend Developer",
    totalSkills: 5,
    milestoneCount: 4,
    nodeCount: 12,
    metrics: {
      skillFitScore: 0.85,
      feasibilityScore: 0.90,
      marketScore: 0.95,
      finalScore: 0.90
    }
  },

  updatedAt: Date
}
```

**Purpose**: Store individual roadmap instances with complete task structure.

---

### 1.3 SkillsCatalog Collection (Optional - Future Enhancement)

```javascript
{
  _id: ObjectId("..."),
  name: "JavaScript",
  category: "Programming Language",
  description: "Modern web programming language",
  relatedSkills: ["TypeScript", "Node.js", "React"],
  marketDemand: 0.95,
  averageSalary: 85000,
  resources: [...]
}
```

---

## 2. Backend Architecture

### 2.1 Folder Structure

```
apps/api/src/
├── config/
│   ├── db.js
│   ├── env.js
│   └── passport.js
├── controllers/
│   ├── auth.controller.js
│   ├── profile.controller.js      ← NEW
│   └── roadmap.controller.js      ← REFACTORED (was plan.controller.js)
├── middleware/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── rateLimiter.middleware.js
│   └── validation.middleware.js
├── models/
│   ├── User.model.js              ← UPDATED (add skills)
│   ├── RoadmapInstance.model.js   ← NEW (replaces LearningPlan)
│   └── SkillProfile.model.js      ← DEPRECATED
├── repositories/
│   ├── user.repository.js         ← UPDATED
│   └── roadmap.repository.js      ← NEW (replaces learningPlan.repository.js)
├── routes/
│   ├── auth.routes.js
│   ├── profile.routes.js          ← NEW
│   ├── roadmap.routes.js          ← REFACTORED (was plan.routes.js)
│   └── index.js
├── services/
│   ├── ai.service.js
│   ├── auth.service.js
│   ├── groq.service.js          ← UPDATED
│   ├── profile.service.js         ← NEW
│   ├── roadmap.service.js         ← REFACTORED (was plan.service.js)
│   ├── roadmapGenerator.service.js
│   ├── resourceRecommender.service.js
│   ├── skillGapAnalyzer.service.js
│   └── trackSelector.service.js
├── utils/
│   ├── jwt.js
│   ├── logger.js
│   └── prerequisites.js
├── app.js
└── server.js
```

---

## 3. API Design

### 3.1 Profile Management APIs

#### GET /api/profile

**Purpose**: Fetch user profile with skills

**Request**: None (auth token in header)

**Response**:

```json
{
  "user": {
    "_id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "skills": [
      { "name": "JavaScript", "level": "intermediate", "addedAt": "2026-01-15" },
      { "name": "React", "level": "beginner", "addedAt": "2026-02-10" }
    ],
    "createdAt": "2025-12-01"
  }
}
```

---

#### PUT /api/profile/skills

**Purpose**: Update user's skill profile

**Request**:

```json
{
  "skills": [
    { "name": "JavaScript", "level": "advanced" },
    { "name": "TypeScript", "level": "intermediate" },
    { "name": "React", "level": "intermediate" }
  ]
}
```

**Response**:

```json
{
  "message": "Skills updated successfully",
  "skills": [...]
}
```

---

### 3.2 Roadmap Management APIs

#### POST /api/roadmaps/generate

**Purpose**: Generate a new roadmap instance

**Request**:

```json
{
  "roleName": "Frontend Developer",
  "dailyLearningMinutes": 120,
  "skillSource": "profile",
  "skills": [] // Only used if skillSource = "custom"
}
```

**OR** (custom skills):

```json
{
  "roleName": "Backend Developer",
  "dailyLearningMinutes": 180,
  "skillSource": "custom",
  "skills": [
    { "name": "Python", "level": "beginner" },
    { "name": "Django", "level": "beginner" }
  ]
}
```

**Response**:

```json
{
  "roadmap": {
    "_id": "roadmap123",
    "roleName": "Frontend Developer",
    "createdAt": "2026-03-07",
    "estimatedCompletionDays": 90,
    "status": "active"
  }
}
```

---

#### GET /api/roadmaps

**Purpose**: Fetch all roadmaps for logged-in user

**Request**: None

**Response**:

```json
{
  "roadmaps": [
    {
      "_id": "roadmap123",
      "roleName": "Frontend Developer",
      "createdAt": "2026-03-07",
      "status": "active",
      "completionPercentage": 25,
      "estimatedCompletionDays": 90
    },
    {
      "_id": "roadmap456",
      "roleName": "Full Stack Developer",
      "createdAt": "2026-04-01",
      "status": "active",
      "completionPercentage": 10,
      "estimatedCompletionDays": 120
    }
  ]
}
```

---

#### GET /api/roadmaps/:id

**Purpose**: Fetch detailed roadmap with all tasks

**Request**: None

**Response**:

```json
{
  "roadmap": {
    "_id": "roadmap123",
    "roleName": "Frontend Developer",
    "trackChosen": "react-frontend-track",
    "dailyLearningMinutes": 120,
    "estimatedTotalHours": 180,
    "estimatedCompletionDays": 90,
    "skillSource": "profile",
    "skillsUsed": [...],
    "weeks": [
      {
        "weekNumber": 1,
        "topic": "JavaScript Fundamentals",
        "aiContent": {...},
        "tasks": [...]
      }
    ],
    "status": "active",
    "completionPercentage": 25,
    "createdAt": "2026-03-07"
  }
}
```

---

#### PATCH /api/roadmaps/:id/tasks/:taskId

**Purpose**: Update task status (mark complete, in-progress, etc.)

**Request**:

```json
{
  "status": "completed"
}
```

**Response**:

```json
{
  "message": "Task updated successfully",
  "task": {
    "taskId": "task_1_1",
    "status": "completed",
    "completedAt": "2026-03-08"
  },
  "roadmapCompletionPercentage": 12
}
```

---

#### DELETE /api/roadmaps/:id

**Purpose**: Delete a roadmap (mark as abandoned)

**Request**: None

**Response**:

```json
{
  "message": "Roadmap deleted successfully"
}
```

---

## 4. Service Layer Design

### 4.1 ProfileService

```javascript
class ProfileService {
  async getProfile(userId)
  async updateSkills(userId, skills)
  async addSkill(userId, skill)
  async removeSkill(userId, skillName)
}
```

---

### 4.2 RoadmapService

```javascript
class RoadmapService {
  async generateRoadmap(userId, options)
  async getRoadmapsByUser(userId)
  async getRoadmapById(roadmapId)
  async updateTaskStatus(roadmapId, taskId, status)
  async deleteRoadmap(roadmapId)
  async calculateProgress(roadmapId)
}
```

---

### 4.3 GroqService (Updated)

```javascript
class GroqService {
  async generateRoadmapTasks(options)
  async generateTaskDetails(options)
  async generateResourceRecommendations(skill)
}
```

**Key Change**: Groq now generates structured tasks with:

- Clear descriptions
- Learning objectives
- Resource links
- Exercises
- Reasons for inclusion

---

## 5. Roadmap Generation Flow

### Step 1: User Initiates Generation

```
POST /api/roadmaps/generate
{
  roleName: "Frontend Developer",
  dailyLearningMinutes: 120,
  skillSource: "profile"
}
```

### Step 2: Backend Process

```
1. Authenticate user
2. Fetch skills (from profile OR custom input)
3. Select best track for roleName
4. Calculate timeline (deterministic)
   - Total hours needed
   - Days required (totalHours / (dailyMinutes/60))
   - Weeks required (days / 7)
5. Generate week structure (deterministic)
6. Call Groq AI to generate:
   - Task titles
   - Task descriptions
   - Learning objectives
   - Resources
   - Exercises
   - Reasons
7. Build RoadmapInstance document
8. Save to database
9. Return roadmap ID
```

### Step 3: What Groq Generates

**Input to Groq**:

```javascript
{
  roleName: "Frontend Developer",
  trackName: "React Frontend Track",
  weekNumber: 1,
  weekTopic: "JavaScript Fundamentals",
  dailyMinutes: 120,
  skillLevel: "intermediate",
  learningGoal: "Master JavaScript basics for React development"
}
```

**Output from Groq**:

```javascript
{
  weekSummary: "This week focuses on...",
  why: "JavaScript fundamentals are crucial because...",
  tasks: [
    {
      title: "Learn JavaScript Variables and Data Types",
      description: "Comprehensive guide to JavaScript variables...",
      estimatedMinutes: 180,
      reason: "Variables are the building blocks...",
      resources: [
        { title: "MDN", url: "...", type: "documentation" }
      ],
      exercise: {
        description: "Build a calculator",
        expectedOutcome: "Working calculator app"
      }
    }
  ]
}
```

---

## 6. Frontend UX Flow

### 6.1 Dashboard Page (`/dashboard`)

```
┌─────────────────────────────────────────┐
│  My Learning Roadmaps                   │
├─────────────────────────────────────────┤
│                                         │
│  [+ Create New Roadmap]                 │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Frontend Developer                │ │
│  │ Created: Mar 7, 2026              │ │
│  │ Progress: ███████░░░ 25%          │ │
│  │ Status: Active                    │ │
│  │ [View Details] [Continue]         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Full Stack Developer              │ │
│  │ Created: Apr 1, 2026              │ │
│  │ Progress: ███░░░░░░░ 10%          │ │
│  │ Status: Active                    │ │
│  │ [View Details] [Continue]         │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### 6.2 Create Roadmap Page (`/roadmaps/create`)

```
┌─────────────────────────────────────────┐
│  Create New Learning Roadmap            │
├─────────────────────────────────────────┤
│                                         │
│  Target Job Role:                       │
│  [Frontend Developer ▼]                 │
│                                         │
│  Daily Learning Time:                   │
│  [120] minutes (2 hours)                │
│  ────●──────────                        │
│     60   120   180   240                │
│                                         │
│  Skills Source:                         │
│  ● Use My Profile Skills                │
│    (JavaScript, React, HTML, CSS)       │
│                                         │
│  ○ Enter Custom Skills                  │
│    [Skill Name] [Level ▼] [+ Add]      │
│                                         │
│  [Cancel] [Generate Roadmap →]          │
└─────────────────────────────────────────┘
```

---

### 6.3 Roadmap Detail Page (`/roadmaps/:id`)

```
┌─────────────────────────────────────────┐
│  Frontend Developer Roadmap             │
│  Created: Mar 7, 2026                   │
│  Progress: 25% • 90 days estimated      │
├─────────────────────────────────────────┤
│                                         │
│  Week 1: JavaScript Fundamentals        │
│  ───────────────────────────────────    │
│  Why this week matters:                 │
│  "JavaScript is the foundation..."      │
│                                         │
│  Tasks:                                 │
│  ☑ Learn Variables (180 min) ✓         │
│  ☐ Master Functions (180 min)          │
│  ☐ DOM Manipulation (180 min)          │
│                                         │
│  [Expand Week] [Mark Week Complete]     │
│                                         │
│  Week 2: React Basics                   │
│  Week 3: State Management               │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

### 6.4 Profile Settings Page (`/profile`)

```
┌─────────────────────────────────────────┐
│  My Profile                             │
├─────────────────────────────────────────┤
│                                         │
│  Account Information                    │
│  Name: John Doe                         │
│  Email: john@example.com                │
│                                         │
│  My Skills                              │
│  ┌─────────────────────────────────┐   │
│  │ JavaScript    [Advanced ▼] [×]  │   │
│  │ React         [Intermediate ▼][×]   │
│  │ HTML          [Advanced ▼] [×]  │   │
│  │ CSS           [Intermediate ▼][×]   │
│  └─────────────────────────────────┘   │
│                                         │
│  [+ Add New Skill]                      │
│                                         │
│  [Save Changes]                         │
└─────────────────────────────────────────┘
```

---

## 7. Example MongoDB Documents

### User Document

```javascript
{
  "_id": ObjectId("65f1234567890abcdef12345"),
  "name": "Sarah Johnson",
  "email": "sarah@example.com",
  "password": "$2b$10$hashed...",
  "skills": [
    {
      "name": "JavaScript",
      "level": "intermediate",
      "addedAt": ISODate("2026-01-15T10:00:00Z")
    },
    {
      "name": "React",
      "level": "beginner",
      "addedAt": ISODate("2026-02-10T14:30:00Z")
    },
    {
      "name": "HTML",
      "level": "advanced",
      "addedAt": ISODate("2025-12-01T09:00:00Z")
    }
  ],
  "createdAt": ISODate("2025-12-01T09:00:00Z"),
  "updatedAt": ISODate("2026-02-10T14:30:00Z")
}
```

### RoadmapInstance Document

```javascript
{
  "_id": ObjectId("65f9876543210fedcba98765"),
  "userId": ObjectId("65f1234567890abcdef12345"),
  "roleName": "Frontend Developer",
  "trackChosen": "react-frontend-track",
  "createdAt": ISODate("2026-03-07T08:00:00Z"),

  "dailyLearningMinutes": 120,
  "estimatedTotalHours": 180,
  "estimatedCompletionDays": 90,

  "skillSource": "profile",
  "skillsUsed": [
    { "name": "JavaScript", "level": "intermediate" },
    { "name": "HTML", "level": "advanced" }
  ],

  "weeks": [
    {
      "weekNumber": 1,
      "topic": "JavaScript Fundamentals",
      "totalMinutes": 840,

      "aiContent": {
        "why": "JavaScript is the foundation of all modern web development. As a Frontend Developer, you'll use JavaScript daily to create interactive user interfaces, handle user events, and communicate with backend services.",
        "keyTakeaways": [
          "Understanding variables, data types, and operators",
          "Mastering functions, scope, and closures",
          "Working with DOM manipulation and events"
        ]
      },

      "tasks": [
        {
          "taskId": "task_1_1",
          "title": "Learn JavaScript Variables and Data Types",
          "description": "Master the fundamentals of JavaScript variables including var, let, and const. Understand primitive data types (string, number, boolean, undefined, null) and reference types (objects, arrays).",
          "skill": "JavaScript",
          "estimatedMinutes": 180,
          "dayNumber": 1,
          "weekNumber": 1,
          "status": "completed",
          "completedAt": ISODate("2026-03-08T19:30:00Z"),
          "reason": "Understanding variables is the absolute foundation of programming. You'll use variables in every single line of code you write.",
          "resources": [
            {
              "title": "MDN JavaScript Variables",
              "url": "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Variables",
              "type": "documentation"
            },
            {
              "title": "JavaScript.info - Variables",
              "url": "https://javascript.info/variables",
              "type": "tutorial"
            }
          ],
          "exercise": {
            "description": "Create a simple personal information form that stores user data (name, age, email) in variables and displays them on the page.",
            "expectedOutcome": "A working HTML page with JavaScript that captures and displays user information",
            "estimatedMinutes": 60
          }
        },
        {
          "taskId": "task_1_2",
          "title": "Master JavaScript Functions",
          "description": "Learn how to write and use functions in JavaScript. Understand function declarations, function expressions, arrow functions, parameters, return values, and scope.",
          "skill": "JavaScript",
          "estimatedMinutes": 180,
          "dayNumber": 2,
          "weekNumber": 1,
          "status": "in-progress",
          "completedAt": null,
          "reason": "Functions are the building blocks of JavaScript applications. They allow you to write reusable, organized, and maintainable code.",
          "resources": [
            {
              "title": "MDN Functions Guide",
              "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions",
              "type": "documentation"
            }
          ],
          "exercise": {
            "description": "Build a calculator with separate functions for add, subtract, multiply, and divide operations.",
            "expectedOutcome": "A functional calculator that uses JavaScript functions",
            "estimatedMinutes": 90
          }
        }
      ]
    }
  ],

  "status": "active",
  "completionPercentage": 12.5,
  "lastAccessedAt": ISODate("2026-03-08T20:00:00Z"),

  "roadmapMetadata": {
    "trackId": "react-frontend-track",
    "selectedTrackName": "React Frontend Developer",
    "totalSkills": 5,
    "milestoneCount": 3,
    "nodeCount": 8,
    "metrics": {
      "skillFitScore": 0.85,
      "feasibilityScore": 0.90,
      "marketScore": 0.95,
      "finalScore": 0.90
    }
  },

  "updatedAt": ISODate("2026-03-08T20:00:00Z")
}
```

---

## 8. Migration Strategy

### Phase 1: Backend (Week 1)

1. Update User model with skills array
2. Create RoadmapInstance model
3. Create profile controller/service/routes
4. Refactor plan → roadmap controller/service
5. Update Groq service for task generation
6. Test all APIs with Postman

### Phase 2: Frontend (Week 2)

1. Create Dashboard page
2. Update CreateRoadmap page
3. Create RoadmapDetail page
4. Create ProfileSettings page
5. Update navigation and routing

### Phase 3: Data Migration (Week 3)

1. Create migration script for existing LearningPlan → RoadmapInstance
2. Test migration on development data
3. Run production migration
4. Deprecate old LearningPlan model

---

## 9. Key Architectural Decisions

### 9.1 Why Separate RoadmapInstance from User?

- **Scalability**: Users can have unlimited roadmaps
- **Performance**: Query specific roadmap without loading all user data
- **Flexibility**: Different roadmaps can have different structures

### 9.2 Why Store Skills in User Profile?

- **UX**: Users don't re-enter skills every time
- **Consistency**: Same skill level across roadmaps
- **Tracking**: See how skills evolve over time

### 9.3 Why skillSource Field?

- **Flexibility**: Users can experiment with "what if" scenarios
- **Clarity**: Know which skills were used for each roadmap
- **Audit**: Track whether profile or custom skills were used

### 9.4 Groq's Role

- **Content Only**: Generate descriptions, explanations, resources
- **Not Math**: Backend calculates hours, days, weeks
- **Deterministic Timeline**: Predictable, testable, reliable

---

## 10. Success Metrics

### User Experience

- ✅ Users can create multiple roadmaps
- ✅ Skills are stored persistently
- ✅ Progress tracked per roadmap
- ✅ Historical roadmaps accessible

### Technical Quality

- ✅ Clean separation of concerns
- ✅ RESTful API design
- ✅ Proper data modeling
- ✅ Scalable architecture

### Business Value

- ✅ Multi-roadmap functionality (premium feature potential)
- ✅ User engagement tracking
- ✅ Skill evolution analytics
- ✅ Professional SaaS product

---

**Document Version**: 2.0  
**Last Updated**: March 2026  
**Author**: System Architect Team

# API Contracts - Learning Path Optimizer V2

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints (except `/auth/*`) require JWT token in header:

```
Authorization: Bearer <jwt_token>
```

---

## Profile Management APIs

### 1. Get User Profile

**Endpoint**: `GET /api/profile`

**Headers**:

```
Authorization: Bearer <token>
```

**Response**: `200 OK`

```json
{
  "user": {
    "_id": "65f123...",
    "name": "John Doe",
    "email": "john@example.com",
    "skills": [
      {
        "name": "JavaScript",
        "level": "intermediate",
        "addedAt": "2026-01-15T10:00:00.000Z"
      },
      {
        "name": "React",
        "level": "beginner",
        "addedAt": "2026-02-10T14:30:00.000Z"
      }
    ],
    "createdAt": "2025-12-01T09:00:00.000Z",
    "updatedAt": "2026-02-10T14:30:00.000Z"
  }
}
```

---

### 2. Update User Skills

**Endpoint**: `PUT /api/profile/skills`

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "skills": [
    { "name": "JavaScript", "level": "advanced" },
    { "name": "TypeScript", "level": "intermediate" },
    { "name": "React", "level": "intermediate" }
  ]
}
```

**Valid Levels**: `"beginner"`, `"intermediate"`, `"advanced"`

**Response**: `200 OK`

```json
{
  "message": "Skills updated successfully",
  "skills": [
    {
      "name": "JavaScript",
      "level": "advanced",
      "addedAt": "2026-03-07T08:00:00.000Z"
    }
  ]
}
```

---

### 3. Add Single Skill

**Endpoint**: `POST /api/profile/skills`

**Request Body**:

```json
{
  "name": "Python",
  "level": "beginner"
}
```

**Response**: `200 OK`

```json
{
  "message": "Skill added successfully",
  "skills": [...]
}
```

---

### 4. Remove Skill

**Endpoint**: `DELETE /api/profile/skills/:skillName`

**Example**: `DELETE /api/profile/skills/Python`

**Response**: `200 OK`

```json
{
  "message": "Skill removed successfully",
  "skills": [...]
}
```

---

## Roadmap Management APIs

### 5. Generate New Roadmap

**Endpoint**: `POST /api/roadmaps/generate`

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Option A: Use Profile Skills

**Request Body**:

```json
{
  "roleName": "Frontend Developer",
  "dailyLearningMinutes": 120,
  "skillSource": "profile"
}
```

#### Option B: Use Custom Skills

**Request Body**:

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

**Valid Role Names**:

- `"Frontend Developer"`
- `"Backend Developer"`
- `"Full Stack Developer"`
- `"React Developer"`
- `"Node.js Developer"`

**Daily Learning Minutes**: `30` to `480` (30 mins to 8 hours)

**Response**: `201 Created`

```json
{
  "message": "Roadmap generated successfully",
  "roadmap": {
    "_id": "65f987...",
    "roleName": "Frontend Developer",
    "trackChosen": "react-frontend-track",
    "createdAt": "2026-03-07T08:00:00.000Z",
    "estimatedCompletionDays": 90,
    "estimatedTotalHours": 180,
    "status": "active"
  }
}
```

---

### 6. Get All Roadmaps

**Endpoint**: `GET /api/roadmaps`

**Response**: `200 OK`

```json
{
  "roadmaps": [
    {
      "_id": "65f987...",
      "roleName": "Frontend Developer",
      "trackChosen": "react-frontend-track",
      "createdAt": "2026-03-07T08:00:00.000Z",
      "status": "active",
      "completionPercentage": 25,
      "estimatedCompletionDays": 90,
      "lastAccessedAt": "2026-03-08T20:00:00.000Z"
    },
    {
      "_id": "65f988...",
      "roleName": "Full Stack Developer",
      "trackChosen": "mern-full-stack",
      "createdAt": "2026-04-01T10:00:00.000Z",
      "status": "active",
      "completionPercentage": 10,
      "estimatedCompletionDays": 120,
      "lastAccessedAt": "2026-04-02T15:00:00.000Z"
    }
  ]
}
```

---

### 7. Get Specific Roadmap

**Endpoint**: `GET /api/roadmaps/:id`

**Example**: `GET /api/roadmaps/65f987654...`

**Response**: `200 OK`

```json
{
  "roadmap": {
    "_id": "65f987...",
    "roleName": "Frontend Developer",
    "trackChosen": "react-frontend-track",
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
          "why": "JavaScript is the foundation of modern web development...",
          "keyTakeaways": [
            "Understanding variables and data types",
            "Mastering functions and scope"
          ],
          "summary": "This week covers essential JavaScript basics"
        },
        "tasks": [
          {
            "taskId": "task_1_1",
            "title": "Learn JavaScript Variables and Data Types",
            "description": "Master the fundamentals of JavaScript variables...",
            "skill": "JavaScript",
            "estimatedMinutes": 180,
            "dayNumber": 1,
            "weekNumber": 1,
            "status": "completed",
            "completedAt": "2026-03-08T19:30:00.000Z",
            "reason": "Understanding variables is essential for programming",
            "resources": [
              {
                "title": "MDN JavaScript Variables",
                "url": "https://developer.mozilla.org/...",
                "type": "documentation"
              }
            ],
            "exercise": {
              "description": "Create a simple calculator",
              "expectedOutcome": "Working calculator app",
              "estimatedMinutes": 60
            }
          }
        ]
      }
    ],
    "status": "active",
    "completionPercentage": 12.5,
    "createdAt": "2026-03-07T08:00:00.000Z",
    "lastAccessedAt": "2026-03-08T20:00:00.000Z",
    "roadmapMetadata": {
      "trackId": "react-frontend-track",
      "selectedTrackName": "React Frontend Developer",
      "totalSkills": 5,
      "milestoneCount": 3,
      "nodeCount": 8,
      "metrics": {
        "skillFitScore": 0.85,
        "feasibilityScore": 0.9,
        "marketScore": 0.95,
        "finalScore": 0.9
      }
    }
  }
}
```

---

### 8. Update Task Status

**Endpoint**: `PATCH /api/roadmaps/:id/tasks/:taskId`

**Example**: `PATCH /api/roadmaps/65f987.../tasks/task_1_1`

**Request Body**:

```json
{
  "status": "completed"
}
```

**Valid Statuses**: `"pending"`, `"in-progress"`, `"completed"`, `"skipped"`

**Response**: `200 OK`

```json
{
  "message": "Task updated successfully",
  "task": {
    "taskId": "task_1_1",
    "title": "Learn JavaScript Variables",
    "status": "completed",
    "completedAt": "2026-03-08T19:30:00.000Z",
    "estimatedMinutes": 180
  },
  "roadmapCompletionPercentage": 12.5
}
```

---

### 9. Delete Roadmap

**Endpoint**: `DELETE /api/roadmaps/:id`

**Example**: `DELETE /api/roadmaps/65f987...`

**Response**: `200 OK`

```json
{
  "message": "Roadmap deleted successfully"
}
```

**Note**: This performs a soft delete (marks as `"abandoned"`), data is not physically removed.

---

### 10. Get Roadmap Statistics

**Endpoint**: `GET /api/roadmaps/stats`

**Response**: `200 OK`

```json
{
  "stats": {
    "total": 5,
    "active": 2,
    "completed": 1,
    "paused": 1,
    "abandoned": 1,
    "averageCompletion": 45
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Role name is required"
}
```

### 401 Unauthorized

```json
{
  "error": "Not authorized, token missing or invalid"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied"
}
```

### 404 Not Found

```json
{
  "error": "Roadmap not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Server error message"
}
```

---

## Example Usage Flow

### 1. User registers/logs in

```bash
POST /api/auth/register
POST /api/auth/login
# Receive JWT token
```

### 2. User adds skills to profile

```bash
PUT /api/profile/skills
{
  "skills": [
    { "name": "JavaScript", "level": "intermediate" },
    { "name": "React", "level": "beginner" }
  ]
}
```

### 3. User generates first roadmap

```bash
POST /api/roadmaps/generate
{
  "roleName": "Frontend Developer",
  "dailyLearningMinutes": 120,
  "skillSource": "profile"
}
```

### 4. User views roadmap

```bash
GET /api/roadmaps/{id}
```

### 5. User marks tasks complete

```bash
PATCH /api/roadmaps/{id}/tasks/task_1_1
{
  "status": "completed"
}
```

### 6. User creates another roadmap

```bash
POST /api/roadmaps/generate
{
  "roleName": "Full Stack Developer",
  "dailyLearningMinutes": 180,
  "skillSource": "custom",
  "skills": [
    { "name": "Node.js", "level": "beginner" },
    { "name": "MongoDB", "level": "beginner" }
  ]
}
```

### 7. User views all roadmaps

```bash
GET /api/roadmaps
```

---

## Task Status Workflow

```
pending → in-progress → completed
   ↓           ↓
skipped ← ← ← ← ←
```

**Status Meanings**:

- `pending`: Not started
- `in-progress`: Currently working on it
- `completed`: Finished successfully
- `skipped`: Decided not to complete

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

- **Auth endpoints**: 5 requests/minute
- **Other endpoints**: 100 requests/minute

---

**Version**: 2.0  
**Last Updated**: March 2026

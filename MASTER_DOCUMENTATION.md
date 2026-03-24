# Learning Path Optimizer - Complete Master Documentation

**Last Updated**: March 24, 2026  
**Status**: ✅ PRODUCTION READY  
**Version**: 1.0.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Tech Stack & Architecture](#tech-stack--architecture)
4. [Project Structure](#project-structure)
5. [Installation & Setup](#installation--setup)
6. [Environment Variables](#environment-variables)
7. [Core Features](#core-features)
8. [Database Models & Schema](#database-models--schema)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Authentication & Session Management](#authentication--session-management)
11. [Roadmap Generation System](#roadmap-generation-system)
12. [Backend Services Architecture](#backend-services-architecture)
13. [Frontend Architecture](#frontend-architecture)
14. [Workspace Scripts & Commands](#workspace-scripts--commands)
15. [Development Workflow](#development-workflow)
16. [Git Branching Strategy](#git-branching-strategy)
17. [Troubleshooting](#troubleshooting)
18. [Contributing Guidelines](#contributing-guidelines)
19. [Known Issues & Future Improvements](#known-issues--future-improvements)

---

## Project Overview

### Mission

**Learning Path Optimizer** is an AI-powered MERN web application that generates personalized, bootcamp-style learning roadmaps based on a user's role, existing skills, and available study time. The system provides day-level learning objectives, practice tasks, curated resources, and progress tracking.

### Core Goals

1. ✅ Generate role-based, day-level learning roadmaps
2. ✅ Personalize roadmap topics according to user-provided skills and levels
3. ✅ Provide rich learning content: objectives, practical tasks, curated resources, mini-projects
4. ✅ Track task/day progress and roadmap completion
5. ✅ Support secure authentication and multi-device session management
6. ✅ Support dynamic custom-skill roadmap generation (PHP, Go, Rust, etc.)
7. ✅ Graceful fallback when AI generation fails

### Key Features

- **Bootcamp-Style Roadmaps**: Multi-phase learning paths with 10-20+ day breakdowns per phase
- **Multiple Built-in Skills**: React, Node.js, Python, JavaScript, TypeScript, Rust, C++, Java
- **Custom Skill Support**: Generate roadmaps for any skill (PHP, Go, Kotlin, etc.) dynamically
- **Rich Day Content**: Learning objectives, why important, practice tasks, study materials
- **Resource Curation**: Integrated resources with deduplication and merging
- **JWT Authentication**: Secure dual-token system with httpOnly cookies
- **Multi-Device Sessions**: Track active sessions across devices
- **Role-Based Roadmaps**: Adapt content to job roles (Frontend Developer, Backend Developer, etc.)
- **Skill Levels**: Support beginner, intermediate, advanced proficiency levels
- **Groq AI Integration**: Dynamic content generation with fallback heuristic phases

---

## Quick Start

### For New Developers

```bash
# 1. Clone repository
git clone https://github.com/yogeswaranv007/learning-path-optimizer.git
cd learning-path-optimizer

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Copy server/.env.example to server/.env and fill in values:
#   - MONGO_URI (MongoDB connection)
#   - JWT_SECRET (random string for token signing)
#   - GROQ_API_KEY (from Groq console)
#   - CLIENT_URL (http://localhost:5173 for dev)

# 4. Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

### For Running Production Build

```bash
npm run build
npm run start
```

---

## Tech Stack & Architecture

### Frontend Stack

- **Framework**: React 18+ (with Vite build tool)
- **Routing**: React Router v6
- **State Management**: React Context API + hooks
- **HTTP Client**: Axios with interceptors
- **Styling**: Tailwind CSS
- **Validation**: Zod schemas (shared)

### Backend Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT + httpOnly cookies
- **AI Integration**: Groq SDK
- **Security**: Helmet, CORS, rate limiting, bcrypt
- **Package Manager**: npm (with workspaces)

### Database

- **MongoDB**: Document-based NoSQL database
- **Connection**: Mongoose ORM for schema definition
- **Collections**: User, RoadmapInstance, RefreshToken, Resource (curated)

### External Services

- **Groq AI API**: For day-level content generation and enhancement
- **Models**: llama-3.3-70b-versatile, llama-3.1-8b-instant, gemma2-9b-it (fallback chain)

### Architecture Pattern

- **Monorepo Structure**: Workspaces for client, server, shared packages
- **Layered Services**: Controllers → Services → Repositories → Models
- **Separation of Concerns**: Shared validation schemas, reusable utilities

---

## Project Structure

```
learning-path-optimizer/
├── client/                              # React Frontend
│   ├── src/
│   │   ├── components/                  # Reusable UI components
│   │   ├── pages/                       # Page components (Dashboard, GeneratePlan, etc.)
│   │   ├── services/                    # API client, auth service
│   │   ├── context/                     # Auth context, state management
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/                          # Static assets
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                              # Express Backend
│   ├── controllers/                     # HTTP request handlers
│   ├── routes/                          # API route definitions
│   ├── services/                        # Business logic
│   │   ├── roadmapGenerator.service.js  # Main roadmap generation
│   │   ├── groq.service.js              # AI API integration
│   │   ├── auth.service.js              # Authentication logic
│   │   ├── resource.service.js          # Resource management
│   │   └── tokenCleanup.service.js      # Token maintenance
│   ├── repositories/                    # Database access layer
│   ├── models/                          # Mongoose schemas
│   ├── middleware/                      # Auth, validation, error handling
│   ├── config/                          # Environment, database config
│   ├── utils/                           # Helper functions
│   ├── prompts/                         # Groq prompt templates
│   ├── server.js                        # Server entry point
│   ├── app.js                           # Express app setup
│   └── package.json
│
├── packages/
│   └── shared/                          # Shared utilities and schemas
│       └── src/
│           └── schemas/                 # Zod validation schemas
│
├── docs/                                # Project documentation
│   ├── API_CONTRACTS_V2.md
│   ├── COMPLETE_SYSTEM_ARCHITECTURE.md
│   ├── JWT_AUTHENTICATION.md
│   └── ADRs/                            # Architecture Decision Records
│
├── infra/                               # Infrastructure templates
│   ├── api.env.template
│   ├── web.env.template
│   └── deployment-notes.md
│
├── package.json                         # Root workspace config
├── MASTER_DOCUMENTATION.md              # THIS FILE
└── [Other]: Config files, git files, etc.
```

---

## Installation & Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or cloud via MongoDB Atlas)
- Groq API key (from https://console.groq.com)

### Step 1: Clone & Install

```bash
git clone https://github.com/yogeswaranv007/learning-path-optimizer.git
cd learning-path-optimizer
npm install
```

### Step 2: Configure Environment Variables

Create `server/.env` file based on `server/.env.example` (or available template):

```env
# Node environment
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/learning-path-optimizer?retryWrites=true&w=majority
# or for local: MONGO_URI=mongodb://localhost:27017/learning-path-optimizer

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Groq API
GROQ_API_KEY=gsk_your_groq_api_key_here

# Frontend URL
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Optional: Demo mode (uses fallback data if Groq unavailable)
DEMO_MODE=false
```

### Step 3: Initialize Database

## MongoDB Collections are auto-created by Mongoose. Ensure MongoDB service is running:

```bash
# If running MongoDB locally
mongod

# Or use MongoDB Atlas (cloud)
```

### Step 4: Start Development Servers

```bash
npm run dev
```

This runs both frontend and backend in parallel using npm workspaces.

**Access the app**:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Environment Variables

### Backend (`server/.env`)

| Variable                 | Description                          | Example                                             |
| ------------------------ | ------------------------------------ | --------------------------------------------------- |
| `NODE_ENV`               | Environment (development/production) | `development`                                       |
| `PORT`                   | Backend server port                  | `5000`                                              |
| `MONGO_URI`              | MongoDB connection string            | `mongodb://localhost:27017/learning-path-optimizer` |
| `JWT_SECRET`             | Secret for JWT signing               | `super_secret_key`                                  |
| `JWT_ACCESS_EXPIRES_IN`  | Access token expiry                  | `15m`                                               |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry                 | `30d`                                               |
| `GROQ_API_KEY`           | Groq API key                         | `gsk_...`                                           |
| `CLIENT_URL`             | Frontend URL (for CORS)              | `http://localhost:5173`                             |
| `CORS_ORIGINS`           | Allowed CORS origins                 | `http://localhost:5173`                             |
| `GOOGLE_CLIENT_ID`       | Google OAuth ID (optional)           | -                                                   |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth secret (optional)       | -                                                   |
| `DEMO_MODE`              | Enable fallback demo mode            | `false`                                             |

### Frontend (`client/.env.local`)

| Variable            | Description     | Example                 |
| ------------------- | --------------- | ----------------------- |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000` |

---

## Core Features

### 1. Bootcamp-Style Roadmaps

Instead of generic "Study React" tasks, the system generates detailed learning paths:

```
Phase 1: Web Foundations (20 days)
├─ Day 1: How the Web Works
│  ├─ Objectives: HTTP cycle, browser rendering, client/server architecture
│  ├─ Why Important: Foundation for debugging performance issues
│  ├─ Practice Task: Inspect network tab in browser DevTools
│  └─ Resources: Khan Academy video, MDN docs, DevTools guide
│
├─ Day 2: HTML Structure & Semantics
│  ├─ Objectives: Semantic tags, accessibility (a11y), SEO basics
│  ├─ Practice Task: Build semantic HTML page with proper structure
│  └─ Resources: Web Dev Simplified, MDN guide
│
└─ Days 3-20: Additional topics with mini-projects

Phase 2: JavaScript Fundamentals (20 days)
├─ Variables, scope, closures
├─ Functions, callbacks, promises, async/await
├─ DOM manipulation
└─ Mini-Project: Build interactive calculator with DOM

Phase 3-5: Advanced topics, React, projects
```

### 2. Multiple Built-in Skills

Supported skills with pre-built blueprints:

- JavaScript
- React
- Node.js
- Python
- TypeScript
- Rust
- C++
- Java

### 3. Custom Skill Support

Generate roadmaps for ANY skill dynamically via Groq:

```javascript
POST /api/roadmaps/generate
{
  "roleName": "Web Developer",
  "skillSource": "custom",
  "skills": [
    { "name": "PHP", "level": "beginner" },
    { "name": "Laravel", "level": "intermediate" }
  ]
}
```

### 4. Rich Day Content

Each day includes:

- **Learning Objectives**: Specific, measurable goals
- **Why Important**: Context for motivation
- **Practice Tasks**: Hands-on exercises
- **Study Materials**: Curated resources (YouTube, docs, tutorials)
- **Estimated Time**: Duration in minutes

### 5. JWT Authentication with Refresh Tokens

```
User Login
    ↓
Generate Access Token (15m) + Refresh Token (30d)
    ↓
Access Token stored in Authorization header or httpOnly cookie
Refresh Token stored in database + httpOnly cookie
    ↓
API calls use Access Token
    ↓
When Access Token expires, use Refresh Token to get new pair
    ↓
Old Refresh Token revoked, new one issued
```

### 6. Multi-Device Session Management

```
User Login from Device A
    ↓
Session created: Device type, browser, IP, timestamp
    ↓
User Login from Device B
    ↓
Two separate sessions tracked
    ↓
User can view all active sessions
    ↓
User can revoke specific session or logout from all
```

### 7. Role-Based Roadmaps

Supported roles adapt skill priorities:

- **Frontend Developer**: Emphasizes CSS, React, UX
- **Backend Developer**: Emphasizes Databases, APIs, Server
- **Full Stack Developer**: Balanced approach
- **DevOps Engineer**: Infrastructure, containerization
- **Mobile Developer**: React Native, Swift

### 8. Progress Tracking

- Track completion status for each day/phase
- View learning time spent
- Analytics dashboard (future)

---

## Database Models & Schema

### 1. User Model

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String (bcrypt),
  googleId: String (optional),
  skills: [
    {
      name: String,
      level: enum ['beginner', 'intermediate', 'advanced'],
      addedAt: Date
    }
  ],
  profile: {
    interests: [String],
    dailyMinutes: Number,
    goal: String,
    learningStyle: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. RoadmapInstance Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref User),
  roleName: String,
  skillSource: enum ['curated', 'custom'],
  skills: [
    {
      name: String,
      level: enum ['beginner', 'intermediate', 'advanced']
    }
  ],
  dailyLearningMinutes: Number,
  phases: [
    {
      _id: ObjectId,
      name: String,
      description: String,
      goal: String,
      estimatedDays: Number,
      days: [
        {
          _id: ObjectId,
          dayNumber: Number,
          topic: String,
          content: {
            learningObjectives: [String],
            whyImportant: String,
            practiceTask: {
              title: String,
              description: String,
              estimatedMinutes: Number
            },
            resources: [
              {
                title: String,
                type: enum ['video', 'article', 'documentation', 'course'],
                url: String,
                source: String,
                estimatedMinutes: Number
              }
            ]
          },
          contentStatus: enum ['not-generated', 'generated', 'failed'],
          completionStatus: enum ['not-started', 'in-progress', 'completed']
        }
      ]
    }
  ],
  generatedBy: enum ['groq', 'fallback', 'curated-only'],
  contentStatus: enum ['not-generated', 'generated', 'partial', 'failed'],
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date (optional)
}
```

### 3. RefreshToken Model (Sessions)

```javascript
{
  _id: ObjectId,
  token: String (hashed),
  userId: ObjectId (ref User),
  expiresAt: Date,
  revokedAt: Date (optional),
  deviceInfo: {
    deviceType: String,
    browserName: String,
    browserVersion: String,
    osName: String,
    ipAddress: String
  },
  createdAt: Date,
  lastUsedAt: Date
}
```

### 4. Resource Model (Optional)

```javascript
{
  _id: ObjectId,
  title: String,
  type: enum ['video', 'article', 'course', 'documentation'],
  url: String,
  source: String,
  category: String,
  estimatedMinutes: Number,
  difficulty: enum ['beginner', 'intermediate', 'advanced'],
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints Reference

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST /auth/register

Register new user

**Request**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response** (201):

```json
{
  "message": "User registered successfully",
  "user": {
    /* user object */
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /auth/login

Login user

**Request**:

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response** (200): Same as register

#### POST /auth/refresh

Refresh access token

**Response** (200):

```json
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

#### POST /auth/logout

Logout current session (requires auth)

**Response** (200):

```json
{
  "message": "Logged out successfully"
}
```

#### POST /auth/logout/all

Logout from all devices (requires auth)

**Response** (200):

```json
{
  "message": "Logged out from all devices"
}
```

#### GET /auth/me

Get current user info (requires auth)

**Response** (200):

```json
{
  "user": {
    /* user object */
  }
}
```

#### GET /auth/sessions

Get all active sessions (requires auth)

**Response** (200):

```json
{
  "sessions": [
    {
      "_id": "session_id",
      "deviceInfo": {
        /* device details */
      },
      "createdAt": "2026-03-24T10:00:00Z",
      "lastUsedAt": "2026-03-24T12:00:00Z",
      "isCurrentDevice": true
    }
  ]
}
```

#### DELETE /auth/sessions/:sessionId

Revoke specific session (requires auth)

**Response** (200):

```json
{
  "message": "Session revoked successfully"
}
```

### Profile Endpoints

#### GET /profile

Get user profile (requires auth)

**Response** (200):

```json
{
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "skills": [
      {
        "name": "JavaScript",
        "level": "intermediate",
        "addedAt": "2026-03-20T08:00:00Z"
      }
    ],
    "createdAt": "2026-03-01T08:00:00Z",
    "updatedAt": "2026-03-24T12:00:00Z"
  }
}
```

#### PUT /profile/skills

Update user skills (requires auth)

**Request**:

```json
{
  "skills": [
    { "name": "JavaScript", "level": "advanced" },
    { "name": "React", "level": "intermediate" }
  ]
}
```

**Response** (200): Updated skills

#### POST /profile/skills

Add single skill (requires auth)

**Request**:

```json
{
  "name": "Python",
  "level": "beginner"
}
```

**Response** (200): Updated skills

#### DELETE /profile/skills/:skillName

Remove skill (requires auth)

**Response** (200): Updated skills

### Roadmap Endpoints

#### POST /roadmaps/generate

Generate new roadmap (requires auth)

**Request**:

```json
{
  "roleName": "Frontend Developer",
  "dailyLearningMinutes": 120,
  "skillSource": "curated",
  "skills": [
    {
      "name": "React",
      "level": "beginner"
    }
  ]
}
```

**Response** (200):

```json
{
  "_id": "roadmap_id",
  "roleName": "Frontend Developer",
  "phases": [
    /* phases array */
  ],
  "generatedBy": "groq",
  "contentStatus": "generated",
  "createdAt": "2026-03-24T12:00:00Z"
}
```

#### GET /roadmaps

List all roadmaps for user (requires auth)

**Response** (200):

```json
{
  "roadmaps": [
    /* array of roadmap instances */
  ]
}
```

#### GET /roadmaps/:roadmapId

Get specific roadmap (requires auth)

**Response** (200): Roadmap object

#### POST /roadmaps/:roadmapId/days/:dayId/content

Generate day content (requires auth)

**Request** (optional):

```json
{
  "forceRegenerate": true
}
```

**Response** (200):

```json
{
  "day": {
    "dayNumber": 1,
    "topic": "How the Web Works",
    "content": {
      "learningObjectives": [ /* objectives */ ],
      "whyImportant": "..."
      "practiceTask": { /* task */ },
      "resources": [ /* resources */ ]
    },
    "contentStatus": "generated"
  }
}
```

#### PUT /roadmaps/:roadmapId/days/:dayId/status

Update day completion status (requires auth)

**Request**:

```json
{
  "completionStatus": "completed"
}
```

**Response** (200): Updated day

#### DELETE /roadmaps/:roadmapId

Delete roadmap (requires auth)

**Response** (200):

```json
{
  "message": "Roadmap deleted successfully"
}
```

### Health Check

#### GET /health

Health check endpoint (no auth required)

**Response** (200):

```json
{
  "status": "ok",
  "timestamp": "2026-03-24T12:00:00Z"
}
```

---

## Authentication & Session Management

### JWT Flow

```
1. User registers/logs in
   ↓
2. Server generates:
   - Access Token (15 min): Used for API calls
   - Refresh Token (30 days): Used to get new tokens
   ↓
3. Both tokens stored:
   - Frontend: Authorization header or localStorage
   - Backend: Refresh token in httpOnly cookie + database
   ↓
4. API calls include Authorization header:
   Authorization: Bearer <accessToken>
   ↓
5. When access token expires:
   - Frontend calls POST /auth/refresh
   - Server validates refresh token
   - Issues new token pair
   - Revokes old refresh token in database
   ↓
6. Multi-device: Each login creates new session record
   ↓
7. Logout: Revoke refresh token(s)
```

### Security Features

- ✅ **httpOnly Cookies**: Refresh tokens in httpOnly, secure cookies (not accessible to JavaScript)
- ✅ **Token Rotation**: New tokens issued on each refresh, old ones revoked
- ✅ **Secure Password**: Bcrypt hashing with salt rounds
- ✅ **CORS**: Limited to whitelist origins
- ✅ **Helmet**: Security headers enabled
- ✅ **Rate Limiting**: General rate limits on all requests
- ✅ **Session Tracking**: Device info captured for security audits
- ✅ **Token Cleanup**: Background service removes expired tokens hourly

### Multi-Device Sessions

Each login is tracked as separate session:

- Device type, browser, OS detected
- IP address captured
- Last used timestamp updated
- User can view all active sessions
- User can revoke specific session or all sessions

---

## Roadmap Generation System

### Generation Flow

```
User Request (Role + Skills)
    ↓
├─ Is skill in KNOWN_BLUEPRINT_SKILLS?
│  ├─ YES → Use static blueprint
│  │   ├─ Load phases from blueprint
│  │   ├─ Generate day content via Groq
│  │   └─ Normalize content structure
│  │
│  └─ NO → Generate dynamically
│     ├─ Call Groq to create phase structure
│     ├─ If Groq succeeds → Generate days for each phase
│     └─ If Groq fails → Use heuristic 4-phase fallback
│
├─ Generate Day Content (per phase)
│  ├─ Call Groq API with day topic
│  ├─ Parse response JSON
│  ├─ Extract objectives, why, practice, resources
│  ├─ Normalize to standard format
│  ├─ Apply rate limiting (120ms throttle)
│  ├─ Merge with curated resources
│  └─ Save to database
│
└─ Return complete roadmap
```

### Known Blueprint Skills

```javascript
const KNOWN_BLUEPRINT_SKILLS = [
  'javascript',
  'react',
  'node',
  'nodejs',
  'python',
  'typescript',
  'rust',
  'cpp',
  'c++',
  'java',
  'golang',
  'go',
];
```

For unknown custom skills: Dynamic generation via Groq with heuristic fallback.

### Groq Model Fallback Strategy

```
Try Models in Order:
  1. llama-3.3-70b-versatile (recommended)
  2. llama-3.1-8b-instant (faster)
  3. gemma2-9b-it (lightweight)

On Rate Limit (429):
  Wait extracted delay OR 1 second
  Retry with exponential backoff
  Max 3 retries

On Model Error:
  Try next model in list
  If all fail: Use heuristic fallback
```

### Content Structure Normalization

All day content normalized to:

```javascript
{
  contentStatus: 'generated',
  content: {
    learningObjectives: [
      'Understand HTTP request/response cycle',
      'Learn browser rendering process',
      'Know difference between client/server'
    ],
    whyImportant: 'Important for web development fundamentals...',
    practiceTask: {
      title: 'Inspect Network Tab',
      description: 'Open DevTools and inspect...',
      estimatedMinutes: 30
    },
    resources: [
      {
        title: 'How the Internet Works',
        type: 'video',
        url: 'https://...',
        source: 'Khan Academy',
        estimatedMinutes: 7
      },
      // More resources merged from curated + AI
    ]
  }
}
```

### Rate Limiting Strategy

- Sequential generation with 120ms throttle between days
- Prevents RPM/TPM quota exhaustion
- Falls back to heuristic phases if quota exceeded

### Custom Skill Detection

```javascript
// Custom skill = not in KNOWN_BLUEPRINT_SKILLS
if (skill === 'PHP') {
  // Custom: Generate via Groq
  const phases = await generateCustomPhaseStructure('PHP');
  const days = await generateDaysForPhases(phases);
} else if (skill === 'React') {
  // Known: Use static blueprint
  const phases = BLUEPRINTS['react'];
  const days = await generateDaysForPhases(phases);
}
```

---

## Backend Services Architecture

### Service Layer Organization

```
server/services/
├── roadmapGenerator.service.js      # Main orchestrator
│   ├─ generateRoadmap() - entry point
│   ├─ shouldUseDynamicCustomSkillFlow() - decision logic
│   ├─ buildHeuristicCustomPhases() - fallback 4-phase generator
│   ├─ generateStructuredDayContent() - normalize regular day content
│   ├─ generateStructuredCustomDayContent() - normalize custom day content
│   └─ mergeResources() - combine curated + AI resources
│
├── groq.service.js                 # AI API integration
│   ├─ chatCompletion() - multi-model with fallback
│   ├─ extractBalancedJson() - parse arrays/objects robustly
│   ├─ generateCustomPhaseStructure() - Groq: create phases
│   ├─ generateCustomDayContent() - Groq: create day content
│   ├─ Retry logic with exponential backoff
│   └─ Rate limit (429) handling
│
├── auth.service.js                 # Authentication
│   ├─ register()
│   ├─ login()
│   ├─ generateTokenPair()
│   └─ refreshTokens()
│
├── resource.service.js             # Resource management
│   ├─ getCuratedResourcesForTopic()
│   └─ searchResources()
│
└── tokenCleanup.service.js         # Background maintenance
    └─ cleanupExpiredTokens() - runs hourly
```

### Key Services in Detail

#### roadmapGenerator.service.js

**Purpose**: Orchestrate roadmap generation workflow

**Main Functions**:

- `generateRoadmap()`: Entry point
  - Validates input
  - Determines skill type (known vs custom)
  - Generates phases
  - Generates day content for each phase
  - Normalizes all content
  - Returns complete roadmap

- `shouldUseDynamicCustomSkillFlow()`: Detect custom skills
  - Returns true if skill not in KNOWN_BLUEPRINT_SKILLS
  - Used to route to Groq generation

- `buildHeuristicCustomPhases()`: Fallback phase builder
  - Creates 4-phase structure: Fundamentals, Core, Advanced, Projects
  - Ensures content relevance even when Groq unavailable
  - Includes role-specific companion topics

- `generateStructuredDayContent()`: Normalize regular day content
  - Ensures all required fields present
  - Applies defaults for missing fields
  - Merges resources

- `generateStructuredCustomDayContent()`: Normalize custom day content
  - Routes custom-skill days through same pipeline as regular days
  - Ensures objectives, why, practice, resources all normalized
  - Merges curated + AI resources

- `mergeResources()`: Combine resources
  - Combines curated resources with AI suggestions
  - Deduplicates by title
  - Preserves source information

#### groq.service.js

**Purpose**: AI content generation with resilience

**Key Functions**:

- `chatCompletion()`: Multi-model fallback
  - Tries models in order: llama-3.3-70b, llama-3.1-8b, gemma2-9b
  - On 429 (rate limit): extracts delay from response, retries
  - On model error: tries next model
  - Exponential backoff strategy
  - Max 3 total retries

- `extractBalancedJson()`: Robust JSON parsing
  - Handles both arrays and objects
  - Tracks bracket depth for proper extraction
  - Handles escaped quotes
  - Falls back to inline JSON if markdown blocks fail

- `generateCustomPhaseStructure()`: Generate phases for unknown skills
  - Call Groq with skill name and role
  - Returns array of 4-5 phases with descriptions
  - Optional: complementaryTechsOverride to avoid duplicate validation

- `generateCustomDayContent()`: Generate day content via AI
  - Calls Groq with day topic and context
  - Returns structured JSON with objectives, why, practice, resources
  - Normalizes generatedBy to 'groq' or 'fallback'

#### auth.service.js

**Purpose**: Authentication flow

**Key Functions**:

- `register()`: Create new user
  - Hash password with bcrypt
  - Create user document
  - Generate token pair

- `login()`: Authenticate user
  - Verify email/password
  - Generate token pair
  - Track session

- `generateTokenPair()`: Create access + refresh tokens
  - Access token: 15 minutes
  - Refresh token: 30 days

- `refreshTokens()`: Issue new token pair
  - Validate refresh token
  - Revoke old token
  - Issue new pair

---

## Frontend Architecture

### Component Structure

```
src/
├── pages/
│   ├── Dashboard.jsx             # Main dashboard, show roadmaps
│   ├── GeneratePlan.jsx          # Multi-step roadmap creation form
│   ├── RoadmapDetail.jsx         # Display roadmap with expandable days
│   ├── ProfileSettings.jsx       # User profile and skills
│   └── LoginRegister.jsx         # Auth pages
│
├── components/
│   ├── AuthForm.jsx              # Reusable login/register form
│   ├── RoadmapCard.jsx           # Roadmap summary card
│   ├── PhaseAccordion.jsx        # Phase expandable section
│   ├── DayContent.jsx            # Day details with content
│   ├── ResourceCard.jsx          # Individual resource display
│   └── Navbar.jsx                # Navigation header
│
├── context/
│   └── AuthContext.jsx           # Auth state and methods
│
├── hooks/
│   ├── useAuth.js                # Auth hook
│   ├── useFetch.js               # Generic fetch hook
│   └── useLocalStorage.js        # Persistent state
│
├── services/
│   └── api.js                    # Axios setup and API calls
│
├── App.jsx                       # Main app component
└── main.jsx                      # React root
```

### Key Components

#### Dashboard.jsx

**Purpose**: Show user's roadmaps and quick actions

**Features**:

- List all user's roadmaps
- Show progress on each roadmap
- Quick action buttons (view, edit, delete)
- New roadmap button

#### GeneratePlan.jsx

**Purpose**: Multi-step form to create roadmap

**Features**:

- Step 1: Select role (dropdown)
- Step 2: Daily learning minutes (number input)
- Step 3: Select skills (multi-select with levels)
- Skill source toggle: curated vs custom
- Custom skill input validation (level must be valid)
- Payload normalization before submit
- Error handling with validation details

#### RoadmapDetail.jsx

**Purpose**: Display complete roadmap with expandable sections

**Features**:

- Show all phases
- Expand/collapse phases
- Show days within each phase
- Expand individual day content
- Display learning objectives, why, practice, resources
- Mark day as complete/incomplete
- Generate day content if missing
- Content render condition: checks if ANY visible content exists

#### ProfileSettings.jsx

**Purpose**: User profile management

**Features**:

- Update profile information
- Manage skills (add, edit, delete)
- View active sessions
- Logout from specific devices

### State Management

**AuthContext**: Manages

- Current user
- Authentication token
- Login/logout/refresh methods

**Local State**: Component-specific state via useState/useReducer

### API Communication

**services/api.js**:

- Axios instance with base URL
- Automatic token refresh on 401
- Request interceptor: adds Authorization header
- Response interceptor: handles 401, retries with refresh token

**Authentication Flow**:

```
Login Form
    ↓
POST /auth/login
    ↓
Receive tokens
    ↓
Store in localStorage/state
    ↓
Set Authorization header in axios
    ↓
All subsequent requests include token
    ↓
If 401: Refresh token → Retry request
```

---

## Workspace Scripts & Commands

### Root Level (`npm run <command>`)

| Command        | Purpose                               |
| -------------- | ------------------------------------- |
| `dev`          | Run frontend + backend in parallel    |
| `dev:api`      | Run backend only                      |
| `dev:web`      | Run frontend only                     |
| `build`        | Build both frontend and backend       |
| `build:api`    | Build backend only                    |
| `build:web`    | Build frontend only                   |
| `lint`         | Lint all workspaces                   |
| `lint:fix`     | Lint and fix issues in all workspaces |
| `format`       | Format code (Prettier)                |
| `format:check` | Check formatting without changes      |
| `test`         | Run tests in all workspaces           |

### Backend (`npm run <command> --workspace=server`)

| Command | Purpose                          |
| ------- | -------------------------------- |
| `dev`   | Start with nodemon (auto-reload) |
| `start` | Start production server          |
| `lint`  | Lint backend code                |

### Frontend (`npm run <command> --workspace=client`)

| Command   | Purpose                  |
| --------- | ------------------------ |
| `dev`     | Start Vite dev server    |
| `build`   | Build for production     |
| `preview` | Preview production build |

### Common Development Tasks

```bash
# Start development
npm run dev

# Check code formatting
npm run format:check

# Fix formatting and lint issues
npm run lint:fix
npm run format

# Build production
npm run build

# Test
npm run test
```

---

## Development Workflow

### Creating a New Feature

1. **Create feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**:
   - Create new components/services as needed
   - Follow existing patterns
   - Maintain consistent naming

3. **Test locally**:

   ```bash
   npm run dev
   # Test in browser/API client
   ```

4. **Lint and format**:

   ```bash
   npm run lint:fix
   npm run format
   ```

5. **Commit**:

   ```bash
   git add .
   git commit -m "feat: description of feature"
   ```

6. **Push to GitHub**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**

### Debugging Tips

**Backend**:

- Check server logs in terminal
- Use `console.log` or debugger
- Check MongoDB data in database
- Inspect Groq API responses

**Frontend**:

- Use browser DevTools
- Check network tab for API calls
- Inspect React component state
- Check browser console for errors

**Groq Integration**:

- Verify `GROQ_API_KEY` is set
- Check rate limits: Groq limits are usually 7,000 requests/minute
- If rate limited: Wait and retry
- Check model availability: some models may be deprecated

---

## Git Branching Strategy

### Branch Types

**main**: Production-ready code

- Stable, tested, deployed
- Only merge from release branches
- Tag each release with version

**dev**: Active integration branch

- Contains latest features
- May be unstable
- Basis for feature branches

**feature/\***:

- Feature development branches
- Example: `feature/custom-skill-support`, `feature/jwt-auth`
- Branch from: `dev`
- Merge back to: `dev` (via PR)

**bugfix/\***:

- Bug fixes
- Example: `bugfix/groq-rate-limits`
- Branch from: `dev`
- Merge back to: `dev` (via PR)

### Workflow Example

```bash
# Start new feature
git checkout dev
git pull origin dev
git checkout -b feature/add-analytics

# Make changes, commit, push
git add .
git commit -m "feat: add analytics dashboard"
git push origin feature/add-analytics

# Create PR on GitHub
# After review and approval:

# Merge to dev
git checkout dev
git pull origin dev
git merge --no-ff feature/add-analytics
git push origin dev

# Delete feature branch
git branch -d feature/add-analytics
git push origin --delete feature/add-analytics
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Symptom**: `MongoServerError: connect ECONNREFUSED`

**Solutions**:

- Check MongoDB is running: `mongod` (local) or verify connection string
- Verify `MONGO_URI` in `.env`
- Check firewall/network connectivity for cloud databases
- Ensure database credentials are correct

#### 2. Groq API Rate Limited (429)

**Symptom**: HTTP 429, "Rate limit exceeded"

**Solutions**:

- System automatically retries with backoff
- Wait 1-2 minutes before trying again
- Reduce concurrent requests
- Use `DEMO_MODE=true` to use fallback data
- Check Groq pricing tier

#### 3. JWT Token Errors

**Symptom**: `401 Unauthorized`, `Invalid token`, etc.

**Solutions**:

- Ensure `JWT_SECRET` is set and consistent
- Check token expiry: access tokens expire after 15 minutes
- Use refresh endpoint to get new token
- Clear browser cookies and re-login

#### 4. CORS Errors

**Symptom**: `CORS error`, `no 'access-control-allow-origin'`

**Solutions**:

- Verify frontend URL matches `CLIENT_URL` in `.env`
- Check `CORS_ORIGINS` variable
- Ensure routes have CORS middleware enabled
- For development: `CORS_ORIGINS=http://localhost:5173`

#### 5. Port Already in Use

**Symptom**: `EADDRINUSE: address already in use :::5000`

**Solutions**:

```bash
# Kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in .env:
PORT=5001
```

#### 6. "Cannot find module" Errors

**Symptom**: `Error: Cannot find module 'X'`

**Solutions**:

- Install dependencies: `npm install`
- Check import paths are correct
- Verify workspaces are set up: `npm ls`

#### 7. Vite Port Conflicts

**Symptom**: Frontend won't start on port 5173

**Solutions**:

- Check if port in use: `lsof -i :5173`
- Kill the process or change port in `vite.config.js`

#### 8. Custom Skill Generation Fails

**Symptom**: Custom skills like PHP show generic content or error

**Solutions**:

- Verify `GROQ_API_KEY` is set
- Check Groq quota isn't exhausted
- System uses heuristic fallback if Groq fails
- For testing: `DEMO_MODE=true`

#### 9. Database Validation Errors

**Symptom**: `ValidationError`, `saved content failed validation`

**Solutions**:

- Check `generatedBy` field is one of: `['groq', 'fallback', 'curated-only']`
- Verify skill levels are: `['beginner', 'intermediate', 'advanced']`
- Ensure all required fields are populated
- Check Mongoose schema constraints

### Performance Issues

#### Slow Roadmap Generation

**Causes**:

- Groq API rate limiting
- Large number of days (many API calls)
- MongoDB query inefficiency

**Solutions**:

- Reduce daily learning minutes (fewer days)
- Increase delays between API calls
- Add MongoDB indexes on frequently queried fields
- Use caching for curated data

#### High Memory Usage

**Causes**:

- Large arrays in memory
- Unclosed database connections
- Memory leaks in components

**Solutions**:

- Monitor with `node --inspect`
- Check for memory leaks in development
- Implement pagination for large lists
- Clean up connections properly

---

## Contributing Guidelines

### Code Style

- **JavaScript**: Follow ESLint config
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Comments**: Explain WHY, not WHAT
- **Functions**: Keep them small and focused
- **Error Handling**: Use try-catch or promise .catch()

### Git Commit Messages

Follow conventional commits:

```bash
type(scope): subject

body

footer
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

```
feat(auth): add multi-device session management
fix(groq): handle 429 rate limit errors
docs(readme): update installation instructions
```

### Testing

- Write tests for new features
- Run tests before committing: `npm run test`
- Aim for >80% code coverage

### Code Review

- Respond to reviewer comments
- Keep PR focused on single feature/fix
- Explain complex logic in comments
- Wait for approval before merging

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update

## Testing

Describe testing performed

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

---

## Known Issues & Future Improvements

### Known Issues

#### 1. Groq Model Deprecation

**Issue**: Groq sometimes deprecates models without notice

**Status**: ⚠️ ONGOING

**Solution**: Maintain fallback model chain; monitor Groq API status

**Workaround**: Use `DEMO_MODE=true` if all models become unavailable

#### 2. Rate Limiting

**Issue**: High concurrent roadmap generation can hit Groq rate limits

**Status**: ✅ MITIGATED

**Solution**: Sequential generation with 120ms throttle, exponential backoff retry

#### 3. Custom Skill Content Structure

**Issue**: Custom skill day content sometimes displayed unformatted

**Status**: ✅ FIXED (March 24, 2026)

**Solution**: Added `generateStructuredCustomDayContent()` to normalize all day content

#### 4. Large Roadmaps

**Issue**: Generating 100+ day roadmaps can time out

**Status**: ⏳ PLANNED

**Solution**: Implement pagination, background generation with webhooks

### Future Improvements

#### Short Term (Next Sprint)

- [ ] Add analytics dashboard (time spent, progress tracking)
- [ ] Implement progress visualization (charts, graphs)
- [ ] Add more built-in skill blueprints
- [ ] Improve resource curation (user ratings, feedback)
- [ ] Add bookmarking/favoriting resources

#### Medium Term (Next Quarter)

- [ ] Mobile app (React Native)
- [ ] Offline mode support
- [ ] Spaced repetition system for review
- [ ] Community features (share roadmaps, forums)
- [ ] Advanced personalization (learning style detection)

#### Long Term (Next Year)

- [ ] Machine learning: predict completion times
- [ ] Adaptive difficulty based on performance
- [ ] Integration with other learning platforms (Udemy, Coursera)
- [ ] Certification tracking
- [ ] Employer partnerships for job placement
- [ ] Gamification (badges, leaderboards, streaks)

### Roadmap Features to Consider

- [ ] Save time by caching common roadmaps
- [ ] Background generation for large roadmaps
- [ ] Video tutorials integration (YouTube API)
- [ ] Code editor integration for practice tasks
- [ ] AI-powered code review for submissions
- [ ] Real-time collaboration (study groups)
- [ ] Notifications and reminders
- [ ] Export roadmap as PDF

---

## Additional Resources

### Documentation Files

- **[docs/COMPLETE_SYSTEM_ARCHITECTURE.md](docs/COMPLETE_SYSTEM_ARCHITECTURE.md)** - Detailed system design
- **[docs/JWT_AUTHENTICATION.md](docs/JWT_AUTHENTICATION.md)** - Auth implementation details
- **[docs/API_CONTRACTS_V2.md](docs/API_CONTRACTS_V2.md)** - Complete API reference
- **[infra/deployment-notes.md](infra/deployment-notes.md)** - Deployment guide

### External Links

- **MongoDB**: https://docs.mongodb.com
- **Express**: https://expressjs.com
- **React**: https://react.dev
- **Groq**: https://console.groq.com
- **Mongoose**: https://mongoosejs.com
- **Tailwind CSS**: https://tailwindcss.com

### Support

For issues or questions:

1. Check existing issues on GitHub
2. Create detailed bug report with steps to reproduce
3. Contact maintainers: yogeswaranv007@github.com

---

## Project Maintenance

### Monthly Tasks

- [ ] Review and update documentation
- [ ] Monitor Groq API changes
- [ ] Check dependency updates
- [ ] Review analytics (if implemented)

### Quarterly Tasks

- [ ] Security audit
- [ ] Performance profiling
- [ ] Database optimization
- [ ] User feedback review

### Annually

- [ ] Major version planning
- [ ] Technology stack review
- [ ] Scaling strategy assessment
- [ ] Team retrospective

---

**Last Updated**: March 24, 2026  
**Maintained By**: Development Team  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

For the latest information, visit the [GitHub repository](https://github.com/yogeswaranv007/learning-path-optimizer).

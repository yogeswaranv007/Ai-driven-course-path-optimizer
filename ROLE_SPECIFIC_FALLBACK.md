# Role-Specific Static Fallback Data

When Gemini API is unavailable (404 errors, quota exceeded, or not configured), the system now provides **comprehensive role-specific static content** instead of generic placeholders.

## ✅ Implementation Complete

**File Modified**: `apps/api/src/services/gemini.service.js`

**New Functions Added**:

- `generateRoleSpecificFallbackPlan()` - Generates comprehensive plans for each role
- `getRoleSpecificData()` - Contains detailed static data per job role

## 📋 Static Content for Each Role

### 1. Frontend Developer

**Sample Tasks**:

- Master HTML5 Semantic Elements (90 min, Beginner)
- CSS Flexbox & Grid Layouts (120 min, Intermediate)
- JavaScript DOM Manipulation (100 min, Intermediate)

**Sample Exercises**:

- Build a Responsive Navigation Bar (90 min)
- Interactive Form Validation (60 min)

**Sample Project**:

- Personal Portfolio Website (180 min)
- Design and build a fully responsive portfolio showcasing your projects

**Why This Matters**:

> "Frontend fundamentals form the foundation of user interface development. Mastering HTML, CSS, and JavaScript enables you to create engaging, accessible web experiences."

---

### 2. Backend Developer

**Sample Tasks**:

- Node.js Core Modules & NPM (100 min, Intermediate)
- Express.js RESTful API Design (130 min, Intermediate)
- MongoDB CRUD Operations (110 min, Intermediate)

**Sample Exercises**:

- Create Authentication Middleware (90 min)
- Database Schema Design (70 min)

**Sample Project**:

- Task Management REST API (200 min)
- Build a complete task management API with authentication, CRUD operations, and MongoDB

**Why This Matters**:

> "Backend development powers the logic and data management of applications. These skills enable you to build scalable, secure server-side systems."

---

### 3. Full Stack Developer

**Sample Tasks**:

- React Component Architecture (110 min, Intermediate)
- Node.js + Express Backend Setup (100 min, Intermediate)
- RESTful API Integration (120 min, Intermediate)

**Sample Exercises**:

- Build CRUD Application Flow (100 min)
- State Management with Context (80 min)

**Sample Project**:

- Full-Stack E-commerce App (240 min)
- Build a complete e-commerce platform with product catalog, cart, and checkout using MERN stack

**Why This Matters**:

> "Full-stack development combines frontend and backend skills, making you versatile and capable of building complete applications independently."

---

### 4. React Developer

**Sample Tasks**:

- React Hooks Deep Dive (100 min, Intermediate)
- State Management Patterns (120 min, Advanced)
- React Performance Optimization (90 min, Advanced)

**Sample Exercises**:

- Custom Hook Creation (80 min)
- Testing React Components (90 min)

**Sample Project**:

- Real-time Dashboard with React (200 min)
- Create an interactive dashboard with charts, filters, and real-time data updates

**Why This Matters**:

> "React specialization makes you an expert in building modern, performant user interfaces. These advanced skills are highly valued in the job market."

---

### 5. Node.js Developer

**Sample Tasks**:

- Async JavaScript & Promises (100 min, Intermediate)
- Express.js Advanced Middleware (110 min, Advanced)
- Database Optimization & Indexing (120 min, Advanced)

**Sample Exercises**:

- Build Microservices Architecture (100 min)
- WebSocket Real-time Features (90 min)

**Sample Project**:

- Scalable Node.js API Gateway (220 min)
- Build an API gateway with rate limiting, caching, load balancing, and service orchestration

**Why This Matters**:

> "Node.js specialization enables you to build high-performance, scalable backend systems. These skills are essential for modern server-side development."

---

## 🔧 How It Works

1. **Gemini API Attempt**: System first tries to generate AI content
2. **Quota/Error Detection**: If 404, 429, or any error occurs
3. **Role Detection**: System identifies the user's chosen job role
4. **Static Content Mapping**: Retrieves role-specific static data
5. **Roadmap Creation**: Builds complete roadmap with professional content
6. **Success**: User receives fully functional roadmap despite AI unavailability

## ✅ Benefits

- **No Broken Experience**: Users always get quality content
- **Role-Appropriate**: Content matches their chosen career path
- **Professional Quality**: Curated tasks, exercises, and projects
- **Actionable**: Specific durations, difficulty levels, and descriptions
- **Educational**: Includes "why this matters" context for motivation

## 🧪 Testing

Run the existing test suite:

```bash
node test-gemini-fixes.js
```

You'll see in server logs:

```
⚠️ Falling back to role-specific structured plan without AI enrichment.
✅ Roadmap created: [roadmap-id]
```

All tests pass with either:

- ✅ AI-generated content (when Gemini available)
- ✅ Role-specific static content (when Gemini unavailable)

---

## 📊 Summary

| Role               | Static Tasks | Exercises | Project Complexity  |
| ------------------ | ------------ | --------- | ------------------- |
| Frontend           | 3            | 2         | Medium (180 min)    |
| Backend            | 3            | 2         | High (200 min)      |
| Full Stack         | 3            | 2         | Very High (240 min) |
| React Specialist   | 3            | 2         | High (200 min)      |
| Node.js Specialist | 3            | 2         | Very High (220 min) |

**Result**: Every role gets professional, actionable learning content regardless of API availability.

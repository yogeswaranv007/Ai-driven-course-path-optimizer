# Learning Path Optimizer — System Design Blueprint

> AI-Driven Course Path Optimizer (MERN)

---

## 1) Problem Statement

### Real-world problem

Many students and self-learners don’t know what to learn next after seeing marks or identifying weak areas. They jump randomly between topics and waste time. They need a structured, personalized 4‑week plan based on skills, interests, marks, and time availability.

### Constraints

- Must finish in ≤ 1 month
- Web app only (not mobile)
- MERN stack
- Interview-ready, industry standard

### Target Users

- College students preparing for placements or semester exams
- Self-learners aiming to upskill fast

### Goals

- Generate a personalized roadmap (4 weeks)
- Track progress and completion
- Explain “why” each recommendation is suggested

### Non-goals

- Not a full LMS
- No video hosting
- No full ML training

---

## 2) Solution Overview

### Inputs

- Skills self‑rating (0–5)
- Marks (topic-wise)
- Interests (domains)
- Daily time available + target goal (placement/exam/skills)

### Outputs

- Skill‑gap analysis
- 4‑week learning plan (weekly goals + daily tasks)
- Recommended resources (YouTube/docs/practice)
- Explainability: why each topic is suggested

### Why this is valuable (even if ChatGPT can generate plans)

- Persistent personalization stored per user (history + progress)
- Consistent structure + tracking + revision reminders
- Explainable, repeatable logic (not random outputs)
- Measurable outcomes (progress %, skill‑gap chart changes)
- This is a workflow app, not just text generation

---

## 3) Features

### MVP

- Auth (Email/Password + Google OAuth)
- User profile (skills, interests, time availability)
- Generate 4‑week plan
- Save plan per user
- View “My Plans” history
- Progress tracking (mark tasks complete)
- Skill gap chart (simple visualization)
- Explain “why this” for each recommendation

### Nice‑to‑have

- Streaks + reminders
- Export plan to PDF
- Weekly review prompt (regenerate plan based on progress)

---

## 4) Difficulty Comparison (vs older projects)

- This project = **Easy–Medium**
- Similar to prior MERN CRUD + auth + dashboards
- Added complexity: recommendation logic + plan generation + charts + explainability
- Not heavy ML; mostly rules + small AI integration

---

## 5) Algorithm / Logic (No Complex ML)

### Why rule‑based instead of ML

- No large dataset to train ML
- Rule‑based + prerequisites is explainable and reliable for MVP
- Deterministic outputs
- Faster to implement in 1 month

### A) Topic taxonomy + prerequisites

Example chain:

```
JS Basics → DOM → React Basics → Hooks → State Management
```

### B) Skill gap scoring

$$\text{gapScore} = (\text{requiredLevel} - \text{currentLevel}) + \text{lowMarksPenalty}$$

### C) Plan generator

- Compute total minutes/week = dailyMinutes × 7
- Pick top gaps
- Allocate tasks per week

### D) Resource recommender

- Curated JSON by topic (YouTube/docs/practice)

### E) Explainability

Store reasons for each task:

- “Because rating=2 and marks=45% and it’s a prerequisite for React Hooks”

### Pseudocode

```js
function generatePlan(skills, marks, dailyMinutes, goal) {
	gaps = calculateGaps(skills, marks)
	topTopics = gaps.sort(desc).take(8)
	weeklyTime = dailyMinutes * 7
	weeks = []

	for week in 1..4:
		topics = topTopics.slice((week-1)*2, week*2)
		tasks = []
		for topic in topics:
			tasks.push({ title: `Study ${topic}`, estMinutes: weeklyTime / topics.length })
			tasks.push({ title: `Practice ${topic}`, estMinutes: (weeklyTime / topics.length) / 2 })

		weeks.push({ weekNo: week, goals, tasks })

	return { weeks, explainability }
}
```

### Data Structures

```js
skills = [{ topic: 'React Basics', level: 2 }];
marks = [{ topic: 'React Basics', scorePercent: 45 }];
plan = {
  weeks: [
    {
      weekNo: 1,
      goals: ['Improve React Basics'],
      tasks: [{ title: 'Study React Basics', estMinutes: 120, resourceLinks: [] }],
    },
  ],
  explainability: [{ taskId: '...', reasons: ['low marks', 'prerequisite for hooks'] }],
};
```

---

## 6) AI Usage (Correct + Safe)

### Use cases (1–2)

- Convert structured plan into nicely worded summary
- Suggest alternative resources for a topic
- Generate motivation tips weekly based on progress

### Why not use AI for everything

- Core logic must be deterministic & explainable
- Avoid hallucinations
- AI is assistant layer, not decision maker

### Implementation

- AI service module with prompt templates
- Fallback to rule‑based output if AI fails

---

## 7) System Design (High Level)

### Architecture (text diagram)

Client (React) → API (Express) → DB (MongoDB Atlas) → AI Service (optional)

### Auth flow

- Login/Register → JWT issued → stored in httpOnly cookie
- Protected routes read cookie on every request

### Platform & Ops

- Rate limiting on auth endpoints
- Validation using Zod
- Structured logging
- Centralized error handling
- Data privacy basics (minimal sensitive fields)

---

## 8) Database Design (Mongoose Models)

### User

- name
- email (unique)
- passwordHash
- googleId
- profile: interests[], dailyMinutes, goal
- createdAt

### SkillProfile

- userId (unique)
- skills: [{ topic, level }]
- marks: [{ topic, scorePercent }]

### LearningPlan

- userId
- createdAt
- planVersion
- weeks: [{ weekNo, goals, tasks }]
- tasks: [{ title, topic, estMinutes, resourceLinks[], status }]
- explainability: [{ taskId, reasons[] }]

### ProgressLog (optional)

- userId
- date
- completedTaskIds[]

### Indexes

- User: email, googleId
- LearningPlan: userId + createdAt
- SkillProfile: userId

---

## 9) API Design (REST)

### Auth

- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me
- GET /auth/google
- GET /auth/google/callback

### Plans

- POST /plans/generate
- GET /plans/my
- GET /plans/:id (future)
- PATCH /plans/:id/task/:taskId (future)

### Profile

- POST /profile/update (future)

### Validation

- Zod schemas shared in packages/shared

### Security

- JWT in httpOnly cookie
- No tokens stored in localStorage

---

## 10) Frontend Pages (React)

- Landing
- Login / Register (Google button)
- Dashboard
- Generate Plan (form)
- My Plan (progress + chart)
- Plan History

### State Management

- Context + custom hooks (no Redux)

### Charts

- Recharts (skill gap bar chart)

---

## 11) Tech Stack Choices + Why

### Frontend

- Vite React vs CRA vs Next.js
  - Vite is faster than CRA, lighter than Next.js for MVP

### Backend

- Express vs NestJS
  - Express is faster to build, less boilerplate

### DB

- MongoDB vs PostgreSQL
  - Flexible schema for nested plan data; faster iteration

### Auth

- JWT cookies vs localStorage
  - httpOnly cookies protect against XSS

### Validation

- Zod vs Joi
  - Better TypeScript integration and composability

### Deployment

- Vercel (frontend) vs Netlify
  - Simple Vite support, strong DX
- Render (backend) vs Railway
  - Stable free tier, easy Node deployment

---

## 12) Security & Best Practices

- httpOnly cookies, secure flag in production
- CORS allowlist (Vercel + local dev)
- Helmet
- Rate limiting on auth endpoints
- Input validation everywhere
- Password hashing with bcrypt
- Env secrets management
- Avoid storing access tokens in frontend

---

## 13) Deployment Plan (Vercel + Render)

### MongoDB Atlas

- Create cluster → user → IP allowlist → connection string

### Render (API)

- Build command: `npm install && npm run build --workspace=apps/api`
- Start command: `npm start --workspace=apps/api`
- Env vars from infra/api.env.template

### Vercel (Web)

- Root: apps/web
- Build: `npm run build`
- Output: `dist`
- Env vars from infra/web.env.template

### Cookies & CORS

- Set CLIENT_URL to Vercel domain
- Use sameSite=none + secure=true in production

---

## 14) Repo + Folder Structure (Industry Standard)

Monorepo:

- /apps/web (React Vite)
- /apps/api (Express)
- /packages/shared (schemas/constants)
- /docs (system design, API docs, ADRs)
- /infra (deployment notes, env templates)

**Why monorepo?**

- Shared schemas
- Consistent versioning
- Easier CI

---

## 15) Git Workflow (Company Style)

### Branch naming

- feat/...
- fix/...
- chore/...

### Conventional commits

- feat: ...
- fix: ...
- docs: ...

### PR workflow

- Small PRs
- Code review checklist

### Tags/releases

- v1.0.0 for MVP

### Suggested commit plan (1 month)

- Week 1: feat(auth), feat(db), feat(ui)
- Week 2: feat(plan-generator), feat(profile)
- Week 3: feat(progress), feat(charts)
- Week 4: feat(ai-layer), chore(deploy), docs(readme)

---

## 16) Development Roadmap (30 Days)

### Week 1

- Repo setup + auth + DB + base UI

### Week 2

- Profile + plan generation logic + save plan

### Week 3

- Progress tracking + charts + UI polish

### Week 4

- AI layer + deploy + testing + README + demo prep

---

## 17) Deliverables (Interview Ready)

- Live link (Vercel)
- API live link (Render)
- Clean README with screenshots
- Short demo script (2 mins)
- System design doc
- Postman collection / API docs

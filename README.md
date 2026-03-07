# Learning Path Optimizer

> **AI-Driven Course Path Optimizer** - A MERN stack web application that generates personalized 4-week learning plans based on your skills, marks, interests, and time availability.

![Tech Stack](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)

---

## 🎯 Problem Statement

Many college students and self-learners struggle with:

- **Lack of direction**: Don't know what to learn next after seeing marks or weak areas
- **Random learning**: Jump between topics without structure, wasting time
- **No personalization**: Generic roadmaps don't consider individual skill gaps, interests, or time constraints

**Target Users**: College students preparing for placements, semester exams, or self-learners upskilling.

**Goals**:

- Generate personalized 4-week learning roadmaps
- Track progress and provide accountability
- Explain "why" each topic is recommended (explainability)

**Constraints**:

- Must complete within ≤ 1 month
- Web app only (not mobile)
- MERN stack, interview-ready, production-quality code

---

## ✨ Solution Overview

### Inputs

- Skills self-rating (0–5 scale)
- Subject/topic-wise marks
- Interests (domains like web dev, ML, DSA)
- Daily time available + target goal (placement, exam prep, etc.)

### Outputs

- **Skill-gap analysis** (visual chart)
- **4-week learning plan** (weekly goals + daily tasks)
- **Recommended resources** (YouTube, docs, practice links)
- **Explainability**: Why each topic is suggested (weakness + dependency + goal alignment)

### Why This vs ChatGPT?

- **Persistent personalization**: History + progress tracked per user
- **Consistent structure**: Repeatable, deterministic logic
- **Measurable outcomes**: Progress %, skill-gap changes over time
- **Workflow integration**: Not just text generation—an app with tracking, charts, reminders

---

## 🚀 Features

### MVP (Must Build)

- ✅ Auth (Email/Password + Google OAuth)
- ✅ User profile (skills, interests, time availability)
- ✅ Generate Plan (4-week personalized plan)
- ✅ Save plan per user
- ✅ View "My Plans" history
- ✅ Progress tracking (mark tasks complete)
- ✅ Skill gap chart visualization
- ✅ Explainability ("Why this?" for each recommendation)

### Nice-to-Have (If Time Permits)

- Streaks + reminders
- Export plan to PDF
- Weekly review prompt (regenerate based on completed tasks)

---

## 🏗️ Tech Stack

| Layer                | Technology                  | Why?                                                         |
| -------------------- | --------------------------- | ------------------------------------------------------------ |
| **Frontend**         | React (Vite)                | Faster dev experience than CRA, simpler than Next.js for MVP |
| **Backend**          | Express.js                  | Lightweight, flexible, faster to build than NestJS           |
| **Database**         | MongoDB Atlas               | Flexible schema for evolving plan structures, free tier      |
| **Auth**             | JWT (httpOnly cookies)      | More secure than localStorage, prevents XSS                  |
| **Validation**       | Zod                         | Type-safe, composable, better DX than Joi                    |
| **Deployment**       | Vercel (web) + Render (api) | Free tiers, easy CI/CD, production-ready                     |
| **State Management** | Context API + hooks         | Sufficient for small app, no Redux overhead                  |
| **Charts**           | Recharts                    | Lightweight, composable, React-friendly                      |

---

## 📂 Project Structure (Monorepo)

```
learning-path-optimizer/
├── apps/
│   ├── api/          # Express backend
│   └── web/          # React frontend (Vite)
├── packages/
│   └── shared/       # Shared types, constants, validators (Zod)
├── docs/             # System design, API docs, ADRs
├── infra/            # Deployment notes, env templates
└── .github/          # CI/CD workflows, PR templates
```

**Why Monorepo?**

- Shared validation schemas (Zod) between frontend and backend
- Consistent versioning
- Easier CI/CD setup
- Single source of truth

---

## 🛠️ Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB Atlas account (free tier)
- Google OAuth credentials (for social login)

### Installation

```bash
# Clone the repo
git clone https://github.com/yogeswaranv007/learning-path-optimizer.git
cd learning-path-optimizer

# Install dependencies
npm install

# Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Fill in your MongoDB URI, JWT secret, Google OAuth credentials

# Run both frontend and backend
npm run dev
```

**API**: http://localhost:5000  
**Web**: http://localhost:5173

---

## 🧪 Available Scripts

```bash
npm run dev          # Run both frontend and backend
npm run dev:api      # Run backend only
npm run dev:web      # Run frontend only
npm run build        # Build both apps
npm run lint         # Lint all workspaces
npm run format       # Format code with Prettier
npm test             # Run tests (placeholder)
```

---

## 🔐 Security

- **JWT in httpOnly cookies** (secure flag in production)
- **CORS allowlist** (Vercel domain + localhost)
- **Helmet** for HTTP headers security
- **Rate limiting** on auth endpoints
- **Input validation** (Zod schemas)
- **Password hashing** (bcrypt, 10 rounds)
- **Environment secrets** (never committed)

---

## 📡 API Endpoints

### Auth

- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `GET /auth/google` - Start Google OAuth
- `GET /auth/google/callback` - OAuth callback

### Plans

- `POST /plans/generate` - Generate new learning plan (protected)
- `GET /plans/my` - Get user's plans (protected)
- `GET /plans/:id` - Get specific plan (protected)
- `PATCH /plans/:id/task/:taskId` - Mark task complete (protected)

### Profile

- `POST /profile/update` - Update skills/marks/interests (protected)

---

## 🎨 Frontend Pages

1. **Landing** (`/`) - What the app does
2. **Login** (`/login`) - Email/password + Google button
3. **Register** (`/register`) - Sign up form
4. **Dashboard** (`/dashboard`) - Profile summary + quick actions
5. **Generate Plan** (`/generate-plan`) - Form to input skills/marks/interests
6. **My Plan** (`/my-plan`) - View current plan + progress + chart
7. **Plan History** (`/history`) - Past plans

---

## 🧠 Algorithm Logic (Rule-Based, Not ML)

### Why Not ML?

- No large dataset to train on
- Rule-based + prerequisite graph is **explainable** and **reliable**
- Deterministic (consistent outputs)
- Faster to implement in 1 month

### Approach

#### 1. Topic Taxonomy + Prerequisites

```js
// Example: JavaScript learning path
{
  "JS Basics": { prereqs: [], level: 1 },
  "DOM Manipulation": { prereqs: ["JS Basics"], level: 2 },
  "React Basics": { prereqs: ["JS Basics", "DOM Manipulation"], level: 3 },
  "React Hooks": { prereqs: ["React Basics"], level: 4 },
  "State Management": { prereqs: ["React Hooks"], level: 5 }
}
```

#### 2. Skill Gap Scoring

```js
gap_score = required_level - current_level + (1 - marks_percent) * weight;
```

#### 3. Plan Generator

- Calculate total available hours per week
- Select top skill gaps (highest score)
- Allocate time based on topic complexity
- Generate weekly goals + daily tasks

#### 4. Resource Recommender

- Curated JSON list: `{ topic: "React Hooks", resources: [...] }`
- Filter by user's current level

#### 5. Explainability

```js
reasons: [
  'Your current rating for React Hooks is 2/5',
  'Your quiz score was 45% (below 60% threshold)',
  'This is a prerequisite for State Management (your target goal)',
  'Estimated time: 8 hours based on complexity',
];
```

---

## 🤖 AI Usage (Minimal & Safe)

**Use Cases** (choose 1–2):

- Convert structured plan data into friendly summary text
- Suggest alternative resources for a topic
- Generate weekly motivation tips based on progress

**Why Not Use AI Everywhere?**

- Core logic must be **deterministic & explainable**
- Avoid hallucinations (plan must be stable)
- AI is an "assistant layer", not the decision-maker

**Implementation**:

- AI service module with prompt templates
- Fallback to rule-based output if AI fails
- Rate limiting on AI endpoints

---

## 🚢 Deployment

### Backend (Render)

1. Create account on Render
2. Connect GitHub repo
3. Set build command: `npm install && npm run build --workspace=apps/api`
4. Set start command: `npm start --workspace=apps/api`
5. Add environment variables (see `infra/api.env.template`)

### Frontend (Vercel)

1. Import GitHub repo
2. Root directory: `apps/web`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables (see `infra/web.env.template`)

### Database (MongoDB Atlas)

1. Create free cluster
2. Whitelist Render IP + your local IP
3. Copy connection string to `.env`

---

## 📚 Documentation

- [System Design](docs/system-design.md) - High-level architecture
- [API Contract](docs/api-contract.md) - Request/response examples
- [ADRs](docs/ADRs/) - Architecture Decision Records
- [Deployment Notes](infra/deployment-notes.md) - Production setup

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Branch naming conventions
- Commit message format
- PR guidelines
- Code review checklist

---

## 🗓️ Development Roadmap (30 Days)

| Week       | Focus                                                  |
| ---------- | ------------------------------------------------------ |
| **Week 1** | Repo setup + auth + database + base UI                 |
| **Week 2** | Profile management + plan generation logic + save plan |
| **Week 3** | Progress tracking + charts + UI polish                 |
| **Week 4** | AI layer + deploy + testing + README + demo prep       |

---

## 📦 Deliverables (Interview-Ready)

- ✅ Live demo link (Vercel)
- ✅ API live link (Render)
- ✅ Clean README with screenshots
- ✅ 2-minute demo script
- ✅ System design doc
- ✅ Postman collection / API docs

---

## 📄 License

MIT © [Yogeswaran V](https://github.com/yogeswaranv007)

---

## 📧 Contact

- **Email**: yogeswaranv007@gmail.com
- **GitHub**: [@yogeswaranv007](https://github.com/yogeswaranv007)
- **LinkedIn**: [Add your LinkedIn]

---

**⭐ If you find this project helpful, please consider starring the repo!**

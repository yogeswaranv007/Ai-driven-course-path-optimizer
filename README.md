# AI-Driven Course Path Optimizer

AI-Driven Course Path Optimizer is a MERN web application that helps learners generate role-based study roadmaps, track progress, and explore personalized tasks/resources. The backend supports roadmap generation workflows with Gemini-assisted enrichment and DB-backed demo fallbacks.

## Tech Stack

- Frontend: React (Vite)
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- AI Integration: Gemini API (`@google/generative-ai`)
- Auth/Security: JWT, Cookies, Helmet, Rate Limiting

## Project Structure

```text
Ai-driven-course-path-optimizer
|
|-- client
|   |-- src
|   |   |-- components
|   |   |-- pages
|   |   |-- App.jsx
|   |   `-- main.jsx
|   |-- public
|   `-- package.json
|
|-- server
|   |-- controllers
|   |-- routes
|   |-- models
|   |-- middleware
|   |-- services
|   |-- config
|   |-- repositories
|   |-- utils
|   |-- server.js
|   `-- package.json
|
|-- .env.example
|-- .gitignore
|-- README.md
`-- package.json
```

## Installation

### 1. Clone and install dependencies

```bash
git clone https://github.com/yogeswaranv007/Ai-driven-course-path-optimizer.git
cd Ai-driven-course-path-optimizer
npm install
```

### 2. Configure environment variables

Create `.env` files based on examples:

- Root: optional shared env (`.env.example`)
- Server: `server/.env` (required)
- Client: `client/.env.local` (optional for frontend runtime vars)

Minimal server variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_api_key
CLIENT_URL=http://localhost:5173
```

### 3. Run in development

```bash
npm run dev
```

Or run separately:

```bash
npm run dev:api
npm run dev:web
```

## Build

```bash
npm run build
```

## Git Branching Strategy

Use a simple, review-friendly workflow:

- `main`: production-ready, stable code only
- `dev`: active integration branch
- `feature/*`: feature branches

Example branches:

- `feature/auth-system`
- `feature/roadmap-generator`
- `feature/dashboard-ui`

Recommended flow:

1. Create feature branch from `dev`
2. Commit with conventional commit messages
3. Open PR to `dev`
4. Merge `dev` to `main` for release

## Environment and Git Hygiene

The repository ignores:

- `node_modules`
- `.env` and `.env.*`
- `dist`
- `build`
- `logs`
- `.DS_Store`

## Future Improvements

- Add unit/integration test coverage for critical services
- Add CI pipeline (lint, test, build)
- Add API documentation (OpenAPI/Swagger)
- Add role-based analytics dashboard
- Add production deployment scripts (Docker + cloud)

# API Reference Documentation

## Learning Path Optimizer - v1.0

Base URL: `https://learning-path-optimizer-server.onrender.com/api` (Production) / `http://localhost:5000/api` (Local)
Authentication mode: Bearer Tokens (JWT). Most routes expect `Authorization: Bearer <token>`

---

### 1. Authentication

- **POST `/auth/register`**: Register a new user. Expects `name, email, password`.
- **POST `/auth/login`**: Authenticate and retrieve JWT token.

### 2. User Profile

- **GET `/users/profile`**: Fetch authenticated user's profile and tracked skills.
- **PUT `/users/profile`**: Update personal details.
- **POST `/users/skills`**: Append a new technical skill (e.g. React - Advanced) to profile for the AI to utilize.

### 3. Roadmaps (Core AI Engine)

- **GET `/roadmaps`**: Fetch all AI-generated roadmaps for the logged-in user.
- **POST `/roadmaps/generate`**: Start the AI roadmap generation. Requires `roleName, dailyLearningMinutes, skillSource`. Returns the structural phase data immediately.
- **GET `/roadmaps/:id/days/:dayNumber`**: Fetches the detailed internal content for a specific day. Triggers dynamic AI content generation if it hasn't been cached yet.
- **PATCH `/roadmaps/:id/tasks/:taskId`**: Update the status (Pending/Completed) of specific learning milestones.

### 4. Admin Domain (Role: Admin Only)

- **GET `/admin/stats`**: Aggregates all user metrics and global roadmap trends for the dashboard.
- **GET `/admin/users`**: Fetch directory of all users with analytical roadmap counts.
- **DELETE `/admin/users/:id`**: Cascade deletes a user and ALL their generated AI roadmaps securely.
- **POST `/admin/templates`**: Create a massive AI-driven base template roadmap structure natively leveraging Groq APIs based on a simple prompt.
- **POST `/admin/roadmaps/broadcast`**: Extremely complex AI algorithm. Takes an array of users, dynamically groups them by identical skillsets using deterministic hashing, triggers exactly **ONE** optimized AI request summarizing those skills via Groq, and maps the deeply personalized curriculum out to exactly the correct users efficiently limiting API costs.
- **GET `/admin/users/:id/roadmaps`**: Inspect any single user's assigned roadmap.

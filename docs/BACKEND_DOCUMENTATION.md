# Backend Documentation: AI-Driven Course Path Optimizer

## 1. Backend Overview

The backend is a REST API service that transforms raw user input (skills, academic performance, learning preferences) into a structured, prioritized 4-week learning roadmap. It acts as the intelligent core of the system, handling three primary responsibilities:

1. **User management** – securely authenticate users and maintain their learning profiles
2. **Plan generation** – apply rule-based logic to recommend topics and create a personalized learning sequence
3. **Data persistence** – store plans, progress, and metadata for long-term tracking and retrieval

The backend is built on Node.js with Express.js as the web framework, MongoDB as the database, and leverages JWT-based authentication with Google OAuth integration for secure user sessions.

---

## 2. Core Features

### Authentication & Authorization

Users authenticate through two methods:

- **Email/Password authentication**: Users register with name, email, and password. Passwords are hashed using bcrypt (10 rounds) before storage, ensuring plaintext credentials are never persisted. On login, the backend validates credentials and issues a JWT token.

- **Google OAuth 2.0**: Users can sign in via Google. The backend exchanges the OAuth code for user information, either creating a new user account or linking the Google identity to an existing email account. This provides a seamless single sign-on experience while maintaining user privacy.

Both authentication flows result in a JWT token that is stored in an httpOnly cookie. This approach prevents XSS attacks because the token cannot be accessed via JavaScript. In production, cookies are transmitted only over HTTPS with the secure flag enabled and sameSite restriction to prevent CSRF attacks.

Authorization is implemented per endpoint: protected routes (dashboard, plan management, history) verify the JWT token and attach the authenticated user to the request. Unauthenticated requests to protected routes receive a 401 Unauthorized response.

### User Profile and Input Handling

Once authenticated, each user maintains a profile containing:

- **Skills inventory**: A list of topics the user claims to know, rated on a scale of 0–5 (1 = beginner, 5 = expert). This self-assessment establishes the baseline for skill gap analysis.

- **Academic performance**: Exam marks for various topics, expressed as percentages (0–100). These marks indicate where the user struggled and where they performed well.

- **Learning preferences**: Interests (topics the user wants to pursue), daily time availability (15–480 minutes), and a learning goal (placement preparation, semester exam, skill upgrade, interview prep, general learning).

The backend validates all inputs before processing. Skills must have topics and valid levels; marks must have valid score ranges; time availability must fall within acceptable bounds. Validation errors are returned immediately with clear error messages, allowing the frontend to prompt users for corrections without wasting computational resources.

### Learning Plan Generation

The plan generation process is the core of the system. It operates on a rule-based foundation:

1. **Skill gap computation**: For each topic, the backend compares the user's self-assessed skill level with the marks they obtained. A large discrepancy indicates a gap—either overconfidence (high skill claim but low marks) or underestimation (low skill claim but high marks). The gap score quantifies this mismatch as a percentage (0–100).

2. **Topic prioritization**: Topics with larger skill gaps are prioritized because they represent areas where the user needs the most improvement. The algorithm also considers prerequisites—for example, "React Hooks" cannot be recommended before "React Basics" in the same week.

3. **4-week roadmap structure**: The backend distributes prioritized topics across four weeks, balancing daily workload with the user's available time. Each week contains multiple topics, and each topic is broken down into learning tasks. Task duration and difficulty are estimated based on topic complexity and the user's current skill level.

4. **Task assignment**: For each topic in a week, the backend generates specific, actionable learning tasks (e.g., "Complete DOM Manipulation exercises", "Build a React component project"). Tasks are annotated with estimated time, difficulty, and learning objectives.

### Skill Gap Analysis

Skill gaps are computed on two dimensions:

- **Performance gap**: If a user's exam mark is lower than expected for their claimed skill level, they have a performance gap. For example, claiming intermediate knowledge (level 3) but scoring 40% suggests areas of weakness within that topic.

- **Confidence gap**: If a user claims expert-level knowledge (level 5) but scores only 50%, they are overconfident. This gap also warrants targeted review.

The backend assigns a numerical gap score to each topic, where higher scores indicate more urgent need for improvement. This quantitative approach enables fair, consistent ranking across all topics and prevents biased selection based on subjective factors.

### Explainability Layer

For each recommended task, the backend attaches a natural language explanation answering "Why is this task important for you?" These explanations are generated using AI (GPT-based summarization) and consider:

- The user's gap score in the task's topic
- Prerequisites the user needs to complete first
- Alignment with the user's stated learning goal
- Sequencing logic (why this task is recommended in week 2 vs. week 4)

Explainability is critical for user engagement. When users understand the reasoning behind recommendations, they are more likely to follow the plan and trust the system. The backend ensures each task has 2–3 concise, context-aware reasons.

### Data Persistence

All user data is stored in MongoDB with the following structure:

- **User collection**: Stores authentication credentials, profile information, Google OAuth IDs, and learning preferences.

- **Learning plan collection**: Stores generated plans with full metadata: user reference, generated date, plan status (active, completed, archived), weeks, tasks, and skill gaps.

- **Progress collection** (optional): Tracks which tasks the user has completed, time spent, and performance on assessments. This enables future progress analytics.

Indexing on frequently queried fields (userId, planId, status) ensures fast retrieval of user plans and historical data. The schema is flexible to accommodate future extensions (e.g., collaborative plans, team learning).

### Security and Middleware

The backend implements multiple security layers:

- **CORS (Cross-Origin Resource Sharing)**: Only requests from the approved frontend domain are allowed, preventing unauthorized cross-site requests.

- **Rate limiting**: Authentication endpoints (login, register, OAuth callback) are rate-limited to prevent brute-force attacks and credential stuffing. General endpoints have looser limits to avoid blocking legitimate traffic.

- **Input validation**: All incoming data is validated against schema rules before processing. Invalid data is rejected with descriptive error messages. This prevents injection attacks and corrupts data from entering the system.

- **Error handling**: Errors are caught globally, logged with timestamps, and returned to the client with appropriate HTTP status codes and generic messages (avoiding information leakage).

- **Helmet integration**: HTTP headers are configured to prevent common vulnerabilities (XSS, clickjacking, MIME type sniffing).

---

## 3. End-to-End Workflow

### User Registration and Authentication

1. User submits registration details (name, email, password) via the frontend.
2. Backend validates the input format and checks if the email is already registered.
3. If valid, the password is hashed using bcrypt, and a new user document is created in MongoDB.
4. A JWT token is generated and stored in an httpOnly cookie.
5. The user is logged in and redirected to the dashboard.

Alternatively, the user clicks "Sign in with Google", which initiates an OAuth 2.0 flow. Google returns a verified user profile, which the backend uses to find or create the user account. The process results in the same JWT token and session cookie.

### Profile Input Phase

1. After authentication, the user lands on the profile or plan generation page.
2. User enters their skills (topics and self-assessed levels), exam marks (topics and percentages), interests, daily time available, and learning goal.
3. Frontend sends this data to the backend via a POST request.
4. Backend validates each field:
   - Skills: topic names must match known topics; levels must be 0–5.
   - Marks: scores must be 0–100.
   - Time: must be 15–480 minutes per day.
   - Goal: must be one of the predefined goals.
5. If any validation fails, the backend returns a 400 error with details on what went wrong.
6. If valid, the data is temporarily held in the request context (not yet persisted).

### Plan Generation Phase

1. Backend receives validated input and begins the plan generation algorithm.

2. **Skill gap computation**:
   - For each topic the user selected, the backend compares their self-assessed level with their exam mark.
   - If the user claimed level 3 (intermediate) but scored 40%, a significant gap exists.
   - The backend calculates a gap score (0–100) representing the magnitude of this discrepancy.

3. **Topic ranking**:
   - Topics are sorted by gap score in descending order (highest gaps first).
   - Prerequisite constraints are applied: if a user has a gap in "React Basics", "React Hooks" is automatically deprioritized until "React Basics" is covered.

4. **4-week schedule generation**:
   - The backend distributes prioritized topics across four weeks.
   - For each week, it estimates how many minutes are available (user's daily time × 7 days).
   - Topics are assigned to weeks such that each week's total task duration fits within the available time.
   - If a topic is too complex for one week, it is split across multiple weeks.

5. **Task creation**:
   - For each topic in each week, the backend generates 2–4 specific learning tasks.
   - Task types vary: watch videos, read articles, complete coding exercises, build projects, solve problems, take quizzes.
   - Each task is assigned an estimated duration (e.g., 45 minutes) and difficulty level.

6. **Explainability attachment**:
   - For each task, the backend generates 2–3 contextual reasons explaining why this task is important for the user.
   - Reasons reference the user's skill gap, their goal, and prerequisite requirements.
   - These explanations are stored alongside the task for frontend display.

7. **Plan persistence**:
   - The complete plan (all weeks, tasks, explanations, skill gaps) is saved to MongoDB with a reference to the user.
   - Any previous active plans for the user are marked as inactive.
   - The new plan is set as active.

8. **Response to frontend**:
   - Backend returns the full plan object, including weeks, tasks, skill gaps, and metadata.
   - Frontend parses this and displays the plan in a user-friendly UI.

### Plan Retrieval and Progress Tracking

1. User logs in and navigates to "My Plan" or "Plan History".
2. Frontend requests the user's active plan or historical plans.
3. Backend queries MongoDB for plans matching the user ID.
4. For the active plan, backend also retrieves any progress data (completed tasks, time spent).
5. Backend returns the plan and progress data to the frontend.
6. (Optional) When a user marks a task as complete, the backend updates the progress record and may trigger next-week suggestions.

### End-to-End Data Flow Summary

```
User Input (skills, marks, time, goal)
           ↓
Validation (format, range, consistency checks)
           ↓
Skill Gap Computation (mark vs. level comparison)
           ↓
Topic Ranking (by gap, with prerequisites)
           ↓
Weekly Distribution (fit topics into 4-week schedule)
           ↓
Task Generation (create specific learning actions)
           ↓
Explainability (attach reasons for each task)
           ↓
Persistence (save to MongoDB)
           ↓
Return Plan to Frontend (JSON response)
```

---

## 4. Input–Processing–Output Mapping

### Input Data

The backend accepts the following inputs from the authenticated user:

| Field         | Type             | Example                            | Purpose                                             |
| ------------- | ---------------- | ---------------------------------- | --------------------------------------------------- |
| Skills        | Array of objects | [{topic: "React", level: 3}, ...]  | User's current knowledge baseline                   |
| Marks         | Array of objects | [{topic: "React", score: 65}, ...] | Actual exam performance per topic                   |
| Interests     | Array of strings | ["Web Dev", "DSA"]                 | Learning preferences (used for tiebreaking)         |
| Daily Minutes | Integer          | 90                                 | Available time per day for learning                 |
| Goal          | String           | "Placement Preparation"            | Learning objective (placement, exam, upgrade, etc.) |

### Processing Logic

The backend applies the following transformations:

1. **Input Validation**: Checks data types, ranges, and consistency. Rejects invalid data immediately.

2. **Skill Gap Calculation**: For each topic, computes gap = |expected_performance - actual_performance|. Expected performance is derived from the user's self-assessed level.

3. **Ranking Algorithm**: Topics are sorted by gap (descending), with prerequisite constraints applied to ensure topic order makes sense.

4. **Schedule Optimization**: A greedy algorithm distributes topics across 4 weeks, ensuring each week's tasks fit within the daily time budget.

5. **Task Synthesis**: For each topic-week pair, generates 2–4 micro-tasks based on topic type and difficulty.

6. **Explanation Generation**: Uses AI to create human-readable justifications for each task based on the user's gaps and goals.

7. **Data Storage**: Persists the complete plan to the database with references to the user and timestamp.

### Output Data

The backend returns a structured plan object:

```
Plan:
  - userId (reference to user)
  - createdAt (timestamp)
  - status ("active", "completed", "archived")
  - skillGaps (array of topics with gap scores)
  - weeks (array of 4 weeks):
      - Week 1:
          - goals (array of learning objectives)
          - tasks (array of 5–7 tasks):
              - title (string)
              - topic (string)
              - estimatedMinutes (integer)
              - difficulty ("easy", "medium", "hard")
              - taskKey (unique identifier)
              - resourceLinks (array of URLs)
              - status ("not_started", "in_progress", "completed")
  - weeks 2, 3, 4 (same structure)
  - explainability (array of explanations):
      - taskKey (reference to task)
      - reasons (array of 2–3 strings explaining why this task matters)
```

This hierarchical structure mirrors the mental model of a learning roadmap: the user sees their overall gaps, then four weeks of structured tasks, with reasons explaining each step.

---

## 5. Outcome and Value

### Problem Solved

Without this backend, users face several challenges:

- **Analysis paralysis**: Too many learning resources exist; users don't know where to start.
- **Unfocused learning**: Users jump between topics without understanding how they connect.
- **Ignored weaknesses**: Users don't systematically address skill gaps; they learn what's easy.
- **No accountability**: Without a structured plan, users lose motivation and momentum.

### Solution Delivered

The backend converts raw input into actionable outcomes:

1. **Structured Roadmap**: From an unstructured list of skills and marks, the backend produces a week-by-week, day-by-day learning schedule. This removes guesswork and provides clarity.

2. **Prioritized Topics**: The skill gap analysis identifies exactly which topics need the most attention. Users focus effort where it matters most.

3. **Measurable Progress**: By breaking learning into discrete tasks with time estimates, the backend enables users to track completion and estimate time to mastery.

4. **Explainable Recommendations**: Each task includes reasoning ("Why is this important for you?"). This transparency builds trust and maintains motivation over the 4-week journey.

5. **Scalable Persistence**: Plans are stored and retrievable, enabling users to resume learning, review progress, or generate new plans based on updated input.

### Business Value

From a user perspective:

- Reduced learning friction and decision fatigue.
- Increased confidence that the recommended path aligns with their goals and gaps.
- Quantifiable progress tracking and accountability.

From a system perspective:

- Reusable plan generation logic that scales to thousands of users without modification.
- Data collection on which topics are most problematic across cohorts (useful for future curriculum insights).
- Foundation for future extensions (peer learning, adaptive difficulty, AI tutoring recommendations).

---

## 6. Design Rationale

### Rule-Based Plan Generation (Not Full ML)

The backend uses rule-based logic for plan generation rather than a black-box machine learning model. Why?

- **Explainability**: Rules are interpretable. The backend can explain to a user exactly why "React Hooks" is week 3 of their plan (because it depends on "React Basics" and has high priority).

- **Consistency**: Rule-based logic produces the same plan for identical inputs, making results predictable and fair.

- **Control**: The system owner can adjust rules (e.g., adjust time allocation per topic, add new prerequisites) without retraining models.

- **Efficiency**: Rules are deterministic and fast; they run in milliseconds even for complex inputs.

Machine learning is reserved for explanations (summarizing why a task matters), not for core planning logic. This hybrid approach gets the benefits of both: algorithmic fairness for plan generation and natural language fluency for user communication.

### JWT Cookies Over Tokens in LocalStorage

Authentication tokens are stored in httpOnly cookies rather than frontend localStorage. Why?

- **XSS Protection**: A malicious script cannot access httpOnly cookies, preventing token theft via JavaScript injection.

- **Session Management**: Cookies are automatically sent with every request, so the frontend doesn't need to manually manage token storage or expiration.

- **Production Ready**: In production, cookies are transmitted only over HTTPS with secure and sameSite flags, preventing man-in-the-middle and CSRF attacks.

- **OAuth Integration**: OAuth 2.0 naturally flows through cookies, making Google OAuth integration seamless.

### Layered Architecture

The backend follows a layered architecture:

- **Controllers**: Handle HTTP requests and responses.
- **Services**: Implement business logic (authentication, plan generation, skill analysis).
- **Repositories**: Abstract database access, allowing easy switching between MongoDB and other databases.
- **Middleware**: Apply cross-cutting concerns (validation, logging, error handling, authentication).

Why layers?

- **Separation of Concerns**: Each layer has a single responsibility.
- **Testability**: Business logic can be tested independently of HTTP mechanics.
- **Maintainability**: Changes to database schema require modifications only in the repository layer.
- **Scalability**: Logic can be extracted into services and reused by multiple endpoints or future workers (e.g., asynchronous plan generation).

### MongoDB for Flexible Schema

MongoDB is chosen over relational databases because learning plan structures are semi-structured:

- Plans have a core schema (weeks, tasks, explanations) but vary in complexity based on user input.
- New fields can be added (e.g., resource links, difficulty levels) without database migrations.
- Nested documents (weeks containing tasks containing explanations) map naturally to plan hierarchies.

A relational database would require many join operations and schema alterations as features evolve.

### Security-First Approach

From authentication to data validation, security is a core concern:

- Passwords are hashed; credentials are never logged.
- CORS restricts requests to approved origins.
- Rate limiting prevents brute-force attacks on authentication.
- Input validation prevents injection and data corruption.
- Errors are generic to avoid leaking system internals.

This approach assumes an adversarial environment where attackers may probe the API, attempt credential theft, or send malformed data. Defense in depth (multiple overlapping protections) ensures no single vulnerability is catastrophic.

---

## Summary

The backend is a rule-based intelligent routing system that transforms user input (skills, marks, goals) into personalized learning plans. It combines algorithmic fairness, transparent decision-making, and scalable data persistence to address a real problem: learning path confusion. The architecture prioritizes explainability, security, and extensibility, making it suitable for educational contexts and production deployment.

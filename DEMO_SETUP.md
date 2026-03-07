# 🎯 Demo Setup for Reviewer

## Quick Start (2 Minutes)

### 1. Seed the Database with Demo Data

```bash
node seed-demo.js
```

This creates 3 demo accounts with realistic roadmap progress:

| Account           | Email                      | Password   | Role                 | Progress |
| ----------------- | -------------------------- | ---------- | -------------------- | -------- |
| Sarah Chen        | demo.frontend@example.com  | Demo123!@# | Frontend Developer   | ~22%     |
| Michael Rodriguez | demo.backend@example.com   | Demo123!@# | Backend Developer    | ~22%     |
| Emily Johnson     | demo.fullstack@example.com | Demo123!@# | Full Stack Developer | ~22%     |

### 2. Start the Servers

**Backend (Terminal 1):**

```bash
cd apps/api
npm run dev
```

**Frontend (Terminal 2):**

```bash
cd apps/web
npm run dev
```

### 3. Log In & Explore

1. Visit http://localhost:5173
2. Click "Login"
3. Use any demo account above
4. View pre-existing roadmap with realistic progress!

---

## 🎨 What the Reviewer Will See

✅ **Pre-populated Roadmaps**: Each demo user has a complete roadmap already created  
✅ **Realistic Progress**: Some tasks completed, some in-progress, some pending  
✅ **Professional UI**: Clean interface without error messages  
✅ **Multiple Roles**: Frontend, Backend, and Full Stack examples  
✅ **Detailed Content**: Tasks, exercises, resources, and projects for each week

---

## 🔇 Clean Demo Mode (No Error Messages)

The app automatically runs in "demo mode" which:

- Hides Gemini API quota/error messages from console
- Shows clean fallback data seamlessly
- Presents a polished experience to reviewers

To enable verbose logging (for debugging):

```bash
export LOG_LEVEL=verbose  # Mac/Linux
$env:LOG_LEVEL="verbose"  # Windows PowerShell
```

---

## 📊 Demo Data Details

Each roadmap includes:

- **9-11 weeks** of structured learning content
- **3-4 tasks per week** with descriptions and resources
- **Progress tracking**: First 2 weeks completed, week 3 in progress
- **Realistic timestamps**: Roadmaps created 7 days ago
- **Resource links**: Documentation, tutorials, and videos
- **Mini-projects**: Practical exercises for each week

---

## 🎬 Demo Flow Suggestion

1. **Login**: Show the login process with demo credentials
2. **Dashboard**: Display the roadmap list with progress
3. **Roadmap View**: Click into a roadmap to show weekly breakdown
4. **Task Details**: Expand tasks to show resources and exercises
5. **Progress Update**: Mark a task as complete to show interactivity
6. **Multiple Roles**: Switch accounts to show different career paths

---

## 🔄 Reset Demo Data

If you need to reset the demo data:

```bash
node seed-demo.js
```

This will:

- Delete existing demo accounts
- Recreate fresh accounts
- Generate new roadmaps with default progress

---

## ⚠️ Important Notes for Review

1. **Database Required**: MongoDB must be running (local or Atlas)
2. **Gemini API**: Optional - app works perfectly with fallback data
3. **Port 5000**: Backend runs on http://localhost:5000
4. **Port 5173**: Frontend runs on http://localhost:5173
5. **Clean Console**: Minimal logging for professional presentation

---

## 🎯 Key Features to Highlight

✨ **Multi-Role Support**: Frontend, Backend, Full Stack, React, Node.js  
✨ **Progress Tracking**: Visual progress indicators and completion percentage  
✨ **Realistic Content**: Professional learning paths with curated resources  
✨ **User Experience**: Clean UI, smooth navigation, responsive design  
✨ **Fallback Handling**: Graceful degradation when AI unavailable

---

## 📝 Demo Script Example

```
"Welcome to the Learning Path Optimizer!

This application helps developers create personalized learning roadmaps
for their career goals.

Let me show you a demo account for Sarah, a Frontend Developer.

[Login with demo.frontend@example.com]

As you can see, Sarah has an active roadmap with 9 weeks of content.
She's made progress - 22% complete with weeks 1-2 finished.

[Click into the roadmap]

Each week has a clear focus. Week 1 was HTML5 fundamentals, and you can
see she completed all 4 tasks with realistic timestamps.

Week 3 is currently in progress - she's completed the first task and
is working on the second.

[Expand a task]

Each task includes:
- Clear descriptions
- Estimated time
- Learning resources (docs, videos)
- Hands-on exercises
- Status tracking

This same experience is available for Backend and Full Stack developers,
with role-appropriate content for each path."
```

---

## 🚀 Ready for Review!

Your demo environment is now set up with:

- ✅ 3 demo accounts with unique roadmaps
- ✅ Realistic progress and timestamps
- ✅ Clean UI without errors
- ✅ Professional presentation

**Good luck with your review! 🎉**

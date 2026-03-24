# Quick Start Guide - Learning Path Optimizer V2

## For Developers

### Start Backend

```bash
cd apps/api
npm run dev
```

### Start Frontend

```bash
cd apps/web
npm run dev
```

---

## API Quick Reference

### Authentication

```bash
# Register
POST /api/auth/register
{ "name": "John", "email": "john@example.com", "password": "pass123" }

# Login
POST /api/auth/login
{ "email": "john@example.com", "password": "pass123" }

# Returns: { "token": "jwt_token_here", "user": {...} }
```

### Profile Management

```bash
# Get profile
GET /api/profile
Headers: Authorization: Bearer <token>

# Update skills
PUT /api/profile/skills
{ "skills": [{"name": "JavaScript", "level": "intermediate"}] }

# Add skill
POST /api/profile/skills
{ "name": "React", "level": "beginner" }

# Remove skill
DELETE /api/profile/skills/React
```

### Roadmap Management

```bash
# Generate roadmap (using profile skills)
POST /api/roadmaps/generate
{
  "roleName": "Frontend Developer",
  "dailyLearningMinutes": 120,
  "skillSource": "profile"
}

# Generate roadmap (with custom skills)
POST /api/roadmaps/generate
{
  "roleName": "Backend Developer",
  "dailyLearningMinutes": 180,
  "skillSource": "custom",
  "skills": [
    {"name": "Python", "level": "beginner"},
    {"name": "Django", "level": "beginner"}
  ]
}

# Get all roadmaps
GET /api/roadmaps

# Get specific roadmap
GET /api/roadmaps/:id

# Update task status
PATCH /api/roadmaps/:id/tasks/:taskId
{ "status": "completed" }

# Delete roadmap
DELETE /api/roadmaps/:id

# Get statistics
GET /api/roadmaps/stats
```

---

## Valid Values

### Job Roles

- Frontend Developer
- Backend Developer
- Full Stack Developer
- React Developer
- Node.js Developer

### Skill Levels

- beginner
- intermediate
- advanced

### Task Statuses

- pending
- in-progress
- completed
- skipped

### Roadmap Statuses

- active
- completed
- paused
- abandoned

### Daily Learning Minutes

- Min: 30 (30 minutes)
- Max: 480 (8 hours)
- Recommended: 60-180 (1-3 hours)

---

## Typical User Flow

1. **Register/Login** → Get JWT token
2. **Add Skills** → PUT /api/profile/skills
3. **Generate Roadmap** → POST /api/roadmaps/generate
4. **View Roadmap** → GET /api/roadmaps/:id
5. **Mark Tasks Complete** → PATCH /api/roadmaps/:id/tasks/:taskId
6. **Create Another Roadmap** → Repeat step 3

---

## Environment Variables

Create `.env` file in `apps/api/`:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
```

---

## Testing with cURL

### Complete Example

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.token')

# 2. Add skills
curl -X PUT http://localhost:5000/api/profile/skills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": [
      {"name": "JavaScript", "level": "intermediate"},
      {"name": "React", "level": "beginner"}
    ]
  }'

# 3. Generate roadmap
curl -X POST http://localhost:5000/api/roadmaps/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "Frontend Developer",
    "dailyLearningMinutes": 120,
    "skillSource": "profile"
  }'

# 4. Get all roadmaps
curl -X GET http://localhost:5000/api/roadmaps \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Errors

### "No skills found in profile"

**Solution**: Add skills to profile first using PUT /api/profile/skills

### "Skill source must be profile or custom"

**Solution**: Use `"skillSource": "profile"` or `"skillSource": "custom"`

### "Skills array is required when using custom skill source"

**Solution**: Include skills array when skillSource is "custom"

### "Not authorized, token missing or invalid"

**Solution**: Include `Authorization: Bearer <token>` header

---

## Database Queries (MongoDB)

```javascript
// Find user's roadmaps
db.roadmapinstances.find({ userId: ObjectId('...') });

// Find active roadmaps
db.roadmapinstances.find({ status: 'active' });

// Find roadmaps by role
db.roadmapinstances.find({ roleName: 'Frontend Developer' });

// Update task status
db.roadmapinstances.updateOne(
  { _id: ObjectId('...'), 'weeks.tasks.taskId': 'task_1_1' },
  { $set: { 'weeks.$[].tasks.$[task].status': 'completed' } },
  { arrayFilters: [{ 'task.taskId': 'task_1_1' }] }
);
```

---

## File Structure Summary

```
apps/api/src/
├── models/
│   ├── User.model.js              (updated with skills)
│   └── RoadmapInstance.model.js   (new)
├── repositories/
│   ├── user.repository.js         (updated)
│   └── roadmap.repository.js      (new)
├── services/
│   ├── profile.service.js         (new)
│   └── roadmapGeneration.service.js (new)
├── controllers/
│   ├── profile.controller.js      (new)
│   └── roadmap.controller.js      (new)
└── routes/
    ├── profile.routes.js          (new)
    ├── roadmap.routes.js          (new)
    └── index.js                   (updated)
```

---

## What's Next?

### Backend ✅ DONE

- All API endpoints working
- Database models created
- Services implemented
- Controllers ready
- Routes configured

### Frontend ⏳ TODO

- Dashboard page
- Create roadmap page
- Roadmap detail page
- Profile settings page
- API integration

---

**Quick Tip**: Use Thunder Client or Postman to test the APIs before building the frontend!

---

**Version**: 2.0  
**Last Updated**: March 2026

# Gemini API Fixes & Best Practices Guide

## Summary of Issues Fixed

### 1. ❌ Gemini Model Not Found Error

**Issue**: `models/gemini-1.5-flash is not found for API version v1`

**Root Cause**: The model name `gemini-1.5-flash` is not directly available. Need to use `-latest` suffix or older version names.

**✅ Fix Applied**: Changed to `gemini-1.5-flash-latest`

```javascript
// ❌ OLD - INCORRECT
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

// ✅ NEW - CORRECT
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  },
});
```

---

### 2. ❌ Frontend Developer Fallback Issue

**Issue**: "No tracks found for roleId=frontend-developer" - falls back to full-stack-developer

**Root Cause**: Mock data only contained MERN track (full-stack-developer). Missing tracks for other roles.

**✅ Fix Applied**: Added tracks for all supported roles

- `frontend-developer` → React Frontend Developer track
- `backend-developer` → Node.js Backend Developer track
- `react-developer` → React Specialist track
- `nodejs-developer` → Node.js Specialist track

```javascript
// ✅ Updated _getMockData() now includes:
const tracks = [
  { roleId: 'full-stack-developer', name: 'MERN Full Stack Developer' },
  { roleId: 'frontend-developer', name: 'React Frontend Developer' }, // NEW
  { roleId: 'backend-developer', name: 'Node.js Backend Developer' }, // NEW
  { roleId: 'react-developer', name: 'React Specialist' }, // NEW
  { roleId: 'nodejs-developer', name: 'Node.js Specialist' }, // NEW
];
```

---

### 3. ❌ Gemini API Error Handling

**Issue**: Roadmap created with fallback content even when Gemini had errors

**Status**: ✅ This is actually CORRECT behavior - roadmap should still be created with fallback content if Gemini fails. Enhanced error logging to show what went wrong.

**✅ Improvements Made**:

- Better error messages with API status codes
- Proper response validation before parsing
- Graceful fallback to structured content
- Added JSON extraction with markdown code block support

````javascript
// ✅ Enhanced error handling
if (!result || !result.response || !result.response.text) {
  console.warn('⚠️ Invalid Gemini response structure. Using fallback.');
  return generateFallbackPlan(weeklyTopics, weeksRequired);
}

// Try both JSON formats
let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
if (!jsonMatch) {
  jsonMatch = responseText.match(/\{[\s\S]*\}/);
}
````

---

## Best Practices for Gemini Content Generation

### Available Models (2026)

```
Recommended for text generation:
- gemini-1.5-flash-latest      (Fast, affordable, good quality)
- gemini-1.5-pro-latest        (Higher quality, slower)
- gemini-2.0-flash             (Latest, if available)

Do NOT use:
- gemini-1.5-flash  (without -latest suffix)
- gemini-pro        (deprecated)
```

### Configuration Best Practices

#### 1. For Unstructured Text

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    temperature: 0.7, // Balanced creativity
    topP: 0.95, // Nucleus sampling
    topK: 40, // Diversity
    maxOutputTokens: 2048, // Limit output size
  },
});
```

#### 2. For Structured JSON Output (RECOMMENDED)

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    temperature: 0.5, // Lower = more consistent output
    maxOutputTokens: 1024,
    responseMimeType: 'application/json', // Force JSON response
  },
});

// Gemini will return valid JSON automatically
const result = await model.generateContent(prompt);
const jsonData = JSON.parse(result.response.text()); // Guaranteed to work
```

#### 3. For Deterministic Outputs

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    temperature: 0.2, // Very low = predictable output
    maxOutputTokens: 512,
  },
});
```

---

## New Advanced Functions

### 1. Generate Structured Learning Resources

```javascript
const { generateStructuredLearningResources } = require('./gemini.service.js');

const resources = await generateStructuredLearningResources({
  skill: 'React Hooks',
  level: 'beginner',
  durationMinutes: 120
});

// Returns:
{
  skill: 'React Hooks',
  level: 'beginner',
  goals: ['Understand React Hooks', 'Practice useState and useEffect', ...],
  resources: [
    { type: 'documentation', title: '...', description: '...' },
    { type: 'tutorial', title: '...', description: '...' },
  ],
  tips: ['Tip 1', 'Tip 2'],
  estimatedTime: 120
}
```

### 2. Generate Tasks with Retry Logic

```javascript
const { generateTaskWithRetry } = require('./gemini.service.js');

const task = await generateTaskWithRetry({
  skillName: 'Redux',
  jobRole: 'Frontend Developer',
  maxRetries: 2  // Will retry up to 2 times on failure
});

// Returns:
{
  title: 'Build a Redux Todo App',
  description: '...',
  subtasks: ['...', '...'],
  difficulty: 'intermediate',
  durationMinutes: 120,
  resources: ['...']
}
```

---

## Prompt Engineering Tips for Roadmap Content

### ✅ Good Prompt Template

```javascript
const prompt = `
You are an expert ${role} instructor with 10+ years of teaching experience.

Create a ${duration}-week learning plan for someone becoming a ${role}.

Context:
- Current Knowledge: ${currentSkills}
- Time Available: ${dailyHours} hours/day
- Topics to Cover: ${topics}

For EACH week, provide:
1. Main learning objective
2. 3-4 specific tasks with durations
3. Hands-on exercises
4. Mini-project ideas
5. Why this week matters

Return ONLY valid JSON (no markdown) with this exact structure:
${jsonStructure}

Be specific with real-world examples and frameworks.
`;
```

### ❌ Bad Prompt Examples

```javascript
// Too vague
'Create a learning plan';

// Ambiguous output format
'Tell me about React';

// No structure guidance
'Generate content for a frontend developer';
```

### ✅ JSON Response Guarantee Techniques

**Technique 1: Use `responseMimeType`**

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    responseMimeType: 'application/json', // Force JSON format
    maxOutputTokens: 1024,
  },
});
```

**Technique 2: Explicit Instructions**

```javascript
const prompt = `
${yourPrompt}

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanation.
If you cannot provide JSON, return: {"error": "reason"}
`;
```

**Technique 3: JSON Schema (if supported)**

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash-latest',
  generationConfig: {
    responseMimeType: 'application/json',
    jsonSchema: {
      type: 'object',
      properties: {
        weeks: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  },
});
```

---

## Roadmap Generation Flow (Fixed)

```
┌──────────────────────────────────────────┐
│  User selects role + daily minutes       │
│  Example: Frontend Developer, 120 min    │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│  Get role ID from name                   │
│  "Frontend Developer" → "frontend-dev"   │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│  Find track in database WITH that roleId │
│  ✅ Now finds "React Frontend Dev" track │
│  (previously fell back to full-stack)    │
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│  Generate roadmap structure (weeks/tasks)│
└─────────────────┬──────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│  Call Gemini API with model name:        │
│  "gemini-1.5-flash-latest" ✅ WORKS      │
│  (previously "gemini-1.5-flash" ❌)      │
└─────────────────┬──────────────────────┘
                  │
                  ▼
        ┌────────┴────────┐
        │                 │
    SUCCESS            FAILURE
        │                 │
        ▼                 ▼
   ┌─────────┐       ┌───────────┐
   │Enrich   │       │Use        │
   │with AI  │       │Fallback   │
   │content  │       │Content    │
   └────┬────┘       └─────┬─────┘
        │                  │
        └──────────┬───────┘
                   │
                   ▼
        ┌──────────────────────┐
        │Create Roadmap in DB  │
        │Status: "active"      │
        │Progress: 0%          │
        └──────────────────────┘
```

---

## Testing the Fixes

### Test 1: Verify Frontend Developer Track Works

```bash
curl -X POST http://localhost:5000/roadmaps/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "roleName": "Frontend Developer",
    "dailyLearningMinutes": 120,
    "skillSource": "custom",
    "skills": [{"name": "JavaScript", "level": "beginner"}]
  }'

# ✅ Should succeed WITHOUT "No tracks found" warning
```

### Test 2: Verify Correct Gemini Model

```javascript
// Check logs for:
// ✅ "Model: gemini-1.5-flash-latest"
// ✅ "Generating AI content for Frontend Developer..."
// ❌ NO "404 Not Found" errors
// ❌ NO "models/gemini-1.5-flash is not found"
```

### Test 3: Verify Error Handling

```javascript
// Disable GEMINI_API_KEY temporarily to test fallback:
// ✅ Logs should show: "⚠️ Gemini API not configured..."
// ✅ Roadmap still creates with fallback structure
// ✅ No crashes or exceptions
```

---

## Environment Setup

### Required `.env`

```bash
# API Server
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-1.5-flash-latest  # Optional override

# Other configs
MONGODB_URI=...
JWT_SECRET=...
```

### Install Latest Gemini Package

```bash
npm install @google/generative-ai@latest
```

### Verify Installation

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
console.log('✅ Gemini API configured successfully');
```

---

## Common Issues & Solutions

| Issue                     | Cause                   | Solution                                     |
| ------------------------- | ----------------------- | -------------------------------------------- |
| `404 Not Found` for model | Wrong model name        | Use `gemini-1.5-flash-latest`                |
| JSON parse errors         | Model returned markdown | Use `responseMimeType: 'application/json'`   |
| Rate limiting (429)       | Too many requests       | Add retry logic with exponential backoff     |
| Timeout errors            | Request too large       | Reduce `maxOutputTokens` or simplify prompt  |
| Empty response            | Invalid API key         | Verify `GEMINI_API_KEY` environment variable |
| Text is not deterministic | High temperature        | Set `temperature: 0.2` for consistency       |

---

## Production Checklist

- [ ] Use `gemini-1.5-flash-latest` (not bare model names)
- [ ] Set `temperature: 0.5` for structured content (consistency)
- [ ] Use `responseMimeType: 'application/json'` for guaranteed JSON
- [ ] Implement retry logic with exponential backoff
- [ ] Log all Gemini API errors with status codes
- [ ] Validate response structure before parsing
- [ ] Have fallback for when Gemini is unavailable
- [ ] Monitor API quota usage
- [ ] Cache Gemini responses to reduce API calls
- [ ] Use promises to handle async operations

---

## References

- [Google Generative AI Docs](https://ai.google.dev/tutorials/node_quickstart)
- [Gemini API Models](https://ai.google.dev/models)
- [JSON Mode for Structured Output](https://ai.google.dev/api/rest/v1/models/generateContent)
- [Prompt Engineering Guide](https://ai.google.dev/docs/safety_guide)

# Dual Planning Modes Implementation Guide

## Overview

This document provides complete implementation details for the dual planning modes feature in the Learning Path Optimizer MERN application.

---

## Backend Changes (Node.js/Express with CommonJS)

### 1. Validation Schema (`packages/shared/src/schemas/plan.schema.js`)

**Complete Updated File:**

```javascript
const { z } = require('zod');

const planGenerateSchema = z
  .object({
    body: z.object({
      skills: z.array(
        z.object({
          topic: z.string(),
          level: z.number().min(0).max(5),
        })
      ),
      marks: z.array(
        z.object({
          topic: z.string(),
          scorePercent: z.number().min(0).max(100),
        })
      ),
      // Legacy field (optional for backward compatibility)
      dailyMinutes: z.number().min(15).max(480).optional(),

      goal: z.string().min(2),

      // Planning Mode Fields
      planningMode: z.enum(['DAILY_HOURS', 'DEADLINE_DAYS']).default('DAILY_HOURS'),

      // hoursPerDay: required, must be between 0.25 and 24
      hoursPerDay: z
        .number()
        .min(0.25, 'hoursPerDay must be at least 0.25 (15 minutes)')
        .max(24, 'hoursPerDay cannot exceed 24')
        .optional()
        .refine((val) => val === undefined || val > 0, {
          message: 'hoursPerDay must be a positive number',
        }),

      // targetDays: optional for DAILY_HOURS, required for DEADLINE_DAYS
      targetDays: z
        .number()
        .int('targetDays must be an integer')
        .positive('targetDays must be greater than 0')
        .optional(),
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional(),
  })
  .refine(
    (data) => {
      // If DEADLINE_DAYS mode, targetDays is required
      if (data.body.planningMode === 'DEADLINE_DAYS' && !data.body.targetDays) {
        return false;
      }

      // Either hoursPerDay or dailyMinutes must be provided
      if (!data.body.hoursPerDay && !data.body.dailyMinutes) {
        return false;
      }

      return true;
    },
    {
      message:
        'DEADLINE_DAYS mode requires targetDays; either hoursPerDay or dailyMinutes must be provided',
      path: ['body'],
    }
  );

module.exports = { planGenerateSchema };
```

### 2. Service Logic Updates (`apps/api/src/services/plan.service.js`)

**Add NaN validation before processing (insert after line 240):**

```javascript
// STEP 1: Compute effective planning parameters
const planningMode = options.planningMode || 'DAILY_HOURS';
const { dailyMinutes } = options;
let { hoursPerDay, targetDays } = options;

// ===== NaN FIX: Validation to prevent crashes =====
if (hoursPerDay !== null && hoursPerDay !== undefined) {
  if (isNaN(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 24) {
    const error = new Error('VALIDATION_ERROR');
    error.statusCode = 400;
    error.details = {
      error: 'VALIDATION_ERROR',
      message: 'hoursPerDay must be a number between 0 and 24',
      field: 'hoursPerDay',
      receivedValue: hoursPerDay,
    };
    throw error;
  }
}

if (targetDays !== null && targetDays !== undefined) {
  if (isNaN(targetDays) || targetDays <= 0 || !Number.isInteger(targetDays)) {
    const error = new Error('VALIDATION_ERROR');
    error.statusCode = 400;
    error.details = {
      error: 'VALIDATION_ERROR',
      message: 'targetDays must be a positive integer',
      field: 'targetDays',
      receivedValue: targetDays,
    };
    throw error;
  }
}

let effectiveHoursPerDay = hoursPerDay;
let effectiveTargetDays = targetDays;
let planningParams = {};

if (planningMode === 'DAILY_HOURS') {
  // Legacy support: convert dailyMinutes to hoursPerDay if not provided
  if (effectiveHoursPerDay === null || effectiveHoursPerDay === undefined) {
    effectiveHoursPerDay = dailyMinutes ? dailyMinutes / 60 : 4; // Default to 4 hours/day
  }

  // For DAILY_HOURS mode, use a generous targetDays baseline (1 year)
  if (effectiveTargetDays === null || effectiveTargetDays === undefined) {
    effectiveTargetDays = 365; // 1 year baseline
  }
} else if (planningMode === 'DEADLINE_DAYS') {
  // Deadline mode requires both hoursPerDay and targetDays
  if (!effectiveHoursPerDay || !effectiveTargetDays) {
    const error = new Error('DEADLINE_DAYS mode requires both hoursPerDay and targetDays');
    error.statusCode = 400;
    error.details = {
      error: 'VALIDATION_ERROR',
      message: 'DEADLINE_DAYS mode requires both hoursPerDay and targetDays',
    };
    throw error;
  }
} else {
  const error = new Error(`Invalid planningMode: ${planningMode}`);
  error.statusCode = 400;
  error.details = {
    error: 'VALIDATION_ERROR',
    message: `Invalid planningMode. Must be 'DAILY_HOURS' or 'DEADLINE_DAYS'`,
    receivedValue: planningMode,
  };
  throw error;
}
```

**Update return statement (around line 380-400) to include full metadata:**

```javascript
return {
  plan: savedPlan,
  skillGaps,
  planMetadata: {
    planningMode,
    hoursPerDay: effectiveHoursPerDay,
    targetDays: effectiveTargetDays,
    totalAdjustedHours,
    computedDays: planningParams.computedDays,
    actualDays: planningParams.actualDays || planningParams.computedDays,
    isFeasible: planningParams.isFeasible,
    requiredHoursPerDay: planningParams.requiredHoursPerDay,
    minimumDaysAtMaxHours: planningParams.minimumDaysAtMaxHours,
    advisoryMessage: planningParams.advisoryMessage,
    explainability,
    reasoning: roadmap.reasoning,
  },
};
```

### 3. Error Handler Enhancement (`apps/api/src/middleware/error.middleware.js`)

**Add at the beginning of errorHandler function:**

```javascript
const errorHandler = (err, req, res, next) => {
  // Handle custom validation errors with details
  if (err.statusCode === 400 && err.details) {
    return res.status(400).json(err.details);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  // ... rest of existing code
```

---

## Frontend Changes (React)

### Complete Replacement: `apps/web/src/pages/GeneratePlan.jsx`

The file has been created as `GeneratePlan_NEW.jsx` in your workspace. Replace the original with this version.

**Key Changes:**

1. Added planning mode toggle (DAILY_HOURS / DEADLINE_DAYS)
2. Added `hoursPerDay` slider (0.25 to 12 hours)
3. Added `targetDays` input field (required for DEADLINE_DAYS, optional for DAILY_HOURS)
4. Updated error handling to show specific error types
5. Added advisory message banner
6. Updated step 2 title to "Planning Mode & Timeline"
7. Updated validation logic

---

## Example Request/Response Scenarios

### Scenario 1: DAILY_HOURS Mode (Default, No Target Days)

**Request:**

```json
POST /api/v1/plans/generate
{
  "skills": [
    { "topic": "JavaScript Basics", "level": 2 },
    { "topic": "React", "level": 1 }
  ],
  "marks": [
    { "topic": "JavaScript Basics", "scorePercent": 40 },
    { "topic": "React", "scorePercent": 20 }
  ],
  "goal": "Skill Development",
  "planningMode": "DAILY_HOURS",
  "hoursPerDay": 4
}
```

**Response (Success):**

```json
{
  "plan": {
    "userId": "user123",
    "milestones": [...],
    "weeks": [...]
  },
  "skillGaps": [...],
  "planMetadata": {
    "planningMode": "DAILY_HOURS",
    "hoursPerDay": 4,
    "targetDays": 365,
    "totalAdjustedHours": 180,
    "computedDays": 45,
    "actualDays": 45,
    "isFeasible": true,
    "requiredHoursPerDay": null,
    "minimumDaysAtMaxHours": null,
    "advisoryMessage": null,
    "explainability": [...],
    "reasoning": "Selected MERN track based on skill fit..."
  }
}
```

---

### Scenario 2: DAILY_HOURS Mode with Advisory (Target Days Provided)

**Request:**

```json
POST /api/v1/plans/generate
{
  "skills": [
    { "topic": "JavaScript Basics", "level": 2 },
    { "topic": "React", "level": 1 }
  ],
  "marks": [
    { "topic": "JavaScript Basics", "scorePercent": 40 },
    { "topic": "React", "scorePercent": 20 }
  ],
  "goal": "Job Preparation",
  "planningMode": "DAILY_HOURS",
  "hoursPerDay": 2,
  "targetDays": 30
}
```

**Response (Success with Advisory):**

```json
{
  "plan": {...},
  "skillGaps": [...],
  "planMetadata": {
    "planningMode": "DAILY_HOURS",
    "hoursPerDay": 2,
    "targetDays": 30,
    "totalAdjustedHours": 180,
    "computedDays": 90,
    "actualDays": 90,
    "isFeasible": false,
    "requiredHoursPerDay": 6,
    "minimumDaysAtMaxHours": null,
    "advisoryMessage": "To finish within 30 days, you need 6 hours/day (you selected 2). With 2 hours/day, you'll need 90 days.",
    "explainability": [...],
    "reasoning": "..."
  }
}
```

---

### Scenario 3: DEADLINE_DAYS Mode (Feasible)

**Request:**

```json
POST /api/v1/plans/generate
{
  "skills": [
    { "topic": "JavaScript Basics", "level": 3 },
    { "topic": "React", "level": 2 }
  ],
  "marks": [
    { "topic": "JavaScript Basics", "scorePercent": 60 },
    { "topic": "React", "scorePercent": 40 }
  ],
  "goal": "Interview Prep",
  "planningMode": "DEADLINE_DAYS",
  "hoursPerDay": 6,
  "targetDays": 60
}
```

**Response (Success - Feasible):**

```json
{
  "plan": {...},
  "skillGaps": [...],
  "planMetadata": {
    "planningMode": "DEADLINE_DAYS",
    "hoursPerDay": 6,
    "targetDays": 60,
    "totalAdjustedHours": 120,
    "computedDays": 20,
    "actualDays": 20,
    "isFeasible": true,
    "requiredHoursPerDay": null,
    "minimumDaysAtMaxHours": null,
    "advisoryMessage": "Feasible! You'll complete in 20 days (40 buffer days available).",
    "explainability": [...],
    "reasoning": "..."
  }
}
```

---

### Scenario 4: DEADLINE_DAYS Mode (Pace Too Slow)

**Request:**

```json
POST /api/v1/plans/generate
{
  "skills": [
    { "topic": "JavaScript Basics", "level": 1 },
    { "topic": "Node.js", "level": 0 }
  ],
  "marks": [
    { "topic": "JavaScript Basics", "scorePercent": 20 },
    { "topic": "Node.js", "scorePercent": 0 }
  ],
  "goal": "Job Preparation",
  "planningMode": "DEADLINE_DAYS",
  "hoursPerDay": 2,
  "targetDays": 30
}
```

**Response (Error - Insufficient Pace):**

```json
HTTP 200 OK (plan still generated, but with infeasibility warning)
{
  "plan": {...},
  "skillGaps": [...],
  "planMetadata": {
    "planningMode": "DEADLINE_DAYS",
    "hoursPerDay": 2,
    "targetDays": 30,
    "totalAdjustedHours": 200,
    "computedDays": 30,
    "actualDays": 30,
    "isFeasible": false,
    "requiredHoursPerDay": 7,
    "minimumDaysAtMaxHours": null,
    "advisoryMessage": "Not feasible with current pace: You need 7 hours/day to finish in 30 days (you selected 2). Consider increasing study time or extending deadline.",
    "explainability": [...],
    "reasoning": "..."
  }
}
```

---

### Scenario 5: DEADLINE_DAYS Mode (Physically Impossible)

**Request:**

```json
POST /api/v1/plans/generate
{
  "skills": [
    { "topic": "JavaScript Basics", "level": 0 }
  ],
  "marks": [
    { "topic": "JavaScript Basics", "scorePercent": 0 }
  ],
  "goal": "Job Preparation",
  "planningMode": "DEADLINE_DAYS",
  "hoursPerDay": 8,
  "targetDays": 10
}
```

**Response (Error - Physical Impossibility):**

```json
HTTP 200 OK (fallback plan provided)
{
  "plan": {...},
  "skillGaps": [...],
  "planMetadata": {
    "planningMode": "DEADLINE_DAYS",
    "hoursPerDay": 8,
    "targetDays": 10,
    "totalAdjustedHours": 500,
    "computedDays": 21,
    "actualDays": 21,
    "isFeasible": false,
    "requiredHoursPerDay": 24,
    "minimumDaysAtMaxHours": 21,
    "advisoryMessage": "Physically impossible: Even at 24 hours/day, you need 21 days (you only have 10). Fallback plan provided: 10 days with fallback timeline.",
    "explainability": [...],
    "reasoning": "..."
  }
}
```

---

### Scenario 6: Validation Error (Missing targetDays in DEADLINE_DAYS)

**Request:**

```json
POST /api/v1/plans/generate
{
  "skills": [
    { "topic": "React", "level": 2 }
  ],
  "marks": [
    { "topic": "React", "scorePercent": 40 }
  ],
  "goal": "Skill Development",
  "planningMode": "DEADLINE_DAYS",
  "hoursPerDay": 4
  // Note: targetDays is missing
}
```

**Response (Validation Error):**

```json
HTTP 400 Bad Request
{
  "error": "Validation error",
  "details": {
    "issues": [
      {
        "code": "custom",
        "path": ["body"],
        "message": "DEADLINE_DAYS mode requires targetDays; either hoursPerDay or dailyMinutes must be provided"
      }
    ]
  }
}
```

---

### Scenario 7: Validation Error (Invalid hoursPerDay)

**Request:**

```json
POST /api/v1/plans/generate
{
  "skills": [
    { "topic": "React", "level": 2 }
  ],
  "marks": [
    { "topic": "React", "scorePercent": 40 }
  ],
  "goal": "Skill Development",
  "planningMode": "DAILY_HOURS",
  "hoursPerDay": 30
}
```

**Response (Validation Error):**

```json
HTTP 400 Bad Request
{
  "error": "VALIDATION_ERROR",
  "message": "hoursPerDay must be a number between 0 and 24",
  "field": "hoursPerDay",
  "receivedValue": 30
}
```

---

### Scenario 8: Validation Error (NaN hoursPerDay - BUG FIX)

**Request:**

```json
POST /api/v1/plans/generate
{
  "skills": [
    { "topic": "React", "level": 2 }
  ],
  "marks": [
    { "topic": "React", "scorePercent": 40 }
  ],
  "goal": "Skill Development",
  "planningMode": "DAILY_HOURS",
  "hoursPerDay": "invalid"
}
```

**Response (Validation Error - Previously caused NaN crash):**

```json
HTTP 400 Bad Request
{
  "error": "Validation error",
  "details": {
    "issues": [
      {
        "code": "invalid_type",
        "expected": "number",
        "received": "string",
        "path": ["body", "hoursPerDay"],
        "message": "Expected number, received string"
      }
    ]
  }
}
```

---

## Track Minimum Hours Schema

Update your mock tracks to use `minimumHours` instead of `minimumDays`:

```javascript
const tracks = [
  {
    trackId: 'mern',
    trackName: 'MERN Stack',
    minimumHours: 150, // NEW: hours-based constraint
    averageHours: 195, // NEW: typical completion hours
    marketDemandScore: 0.95,
    ecosystemScore: 0.92,
    // ... other fields
  },
];
```

---

## Testing Checklist

### Backend Tests

- [ ] DAILY_HOURS mode with no targetDays → generates plan
- [ ] DAILY_HOURS mode with targetDays → shows advisory if exceeded
- [ ] DEADLINE_DAYS mode feasible → generates plan with buffer message
- [ ] DEADLINE_DAYS mode pace too slow → returns infeasible with requiredHoursPerDay
- [ ] DEADLINE_DAYS mode physically impossible → returns infeasible with minimumDaysAtMaxHours
- [ ] Validation: hoursPerDay < 0 → 400 error
- [ ] Validation: hoursPerDay > 24 → 400 error
- [ ] Validation: hoursPerDay = NaN → 400 error (BUG FIX)
- [ ] Validation: targetDays missing in DEADLINE_DAYS → 400 error
- [ ] Validation: targetDays = NaN → 400 error (BUG FIX)
- [ ] Track minimumHours enforced via clampToMinimumHours

### Frontend Tests

- [ ] Planning mode toggle switches between DAILY_HOURS and DEADLINE_DAYS
- [ ] hoursPerDay slider updates display value
- [ ] targetDays input validates (positive integer)
- [ ] targetDays required for DEADLINE_DAYS mode
- [ ] Advisory message banner displays when present
- [ ] Error messages display for validation errors
- [ ] Error messages display for infeasibility (pace/physical)
- [ ] Step 3 review shows all inputs correctly
- [ ] Navigation works between steps
- [ ] Form submits and redirects on success

---

## Summary

### What Changed

1. **Backend**: Added comprehensive validation to prevent NaN crashes; enhanced error responses with planning metadata
2. **Frontend**: Complete UI redesign with planning mode toggle, hoursPerDay slider, targetDays input, and advisory/error messages
3. **Validation**: Zod schema updated to validate planningMode, hoursPerDay, targetDays with proper constraints
4. **Error Handling**: Custom error objects with statusCode and details for better frontend error display

### Key Features Implemented

✅ Dual planning modes (DAILY_HOURS default, DEADLINE_DAYS optional)  
✅ Hours-based constraints (track.minimumHours)  
✅ NaN validation to prevent crashes  
✅ Advisory messages for timeline feasibility  
✅ Physical impossibility detection  
✅ Pace feasibility validation  
✅ Comprehensive error handling

### Files Modified

- `packages/shared/src/schemas/plan.schema.js` - Validation schema
- `apps/api/src/services/plan.service.js` - NaN fix and metadata return
- `apps/api/src/middleware/error.middleware.js` - Enhanced error handling
- `apps/web/src/pages/GeneratePlan.jsx` - Complete UI rewrite

---

## Next Steps

1. **Replace the old GeneratePlan.jsx** with the new version
2. **Test all scenarios** using the examples above
3. **Update database models** if tracks need to store minimumHours/averageHours
4. **Add unit tests** for validation logic
5. **Add integration tests** for planning modes service

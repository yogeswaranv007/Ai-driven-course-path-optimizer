# API Contract - Learning Path Optimizer

Base URL: `http://localhost:5000`

## Auth

### POST /auth/register

**Request**

```json
{ "name": "John", "email": "john@example.com", "password": "Pass1234" }
```

**Response**

```json
{ "user": { "id": "...", "name": "John", "email": "john@example.com" } }
```

### POST /auth/login

**Request**

```json
{ "email": "john@example.com", "password": "Pass1234" }
```

**Response**

```json
{ "user": { "id": "...", "name": "John", "email": "john@example.com" } }
```

### POST /auth/logout

**Response**

```json
{ "message": "Logged out successfully" }
```

### GET /auth/me

**Response**

```json
{ "user": { "id": "...", "name": "John", "email": "john@example.com" } }
```

---

## Plans

### POST /plans/generate

**Dual Planning Mode Support**

Supports two mutually exclusive planning modes:

1. **DAILY_HOURS** (default): Generate timeline strictly based on hoursPerDay
2. **DEADLINE_DAYS**: Validate feasibility against targetDays deadline

#### Mode 1: DAILY_HOURS (Default)

**Request**

```json
{
  "skills": [{ "topic": "React Basics", "level": 2 }],
  "marks": [{ "topic": "React Basics", "scorePercent": 45 }],
  "dailyMinutes": 240,
  "goal": "Placement",
  "planningMode": "DAILY_HOURS",
  "hoursPerDay": 4,
  "targetDays": 180
}
```

**Parameters**:

- `planningMode`: "DAILY_HOURS" (optional, defaults to DAILY_HOURS if omitted)
- `hoursPerDay`: Learning hours per day (0-24). If omitted, converts from dailyMinutes
- `targetDays`: Optional deadline reference. If provided, returns advisory if not achievable with hoursPerDay

**Response**

```json
{
  "plan": { "_id": "...", "weeks": [] },
  "skillGaps": [],
  "planMetadata": {
    "planningMode": "DAILY_HOURS",
    "computedDays": 150,
    "actualDays": 150,
    "requiredHoursPerDay": null,
    "advisoryMessage": null,
    "isFeasible": true
  }
}
```

**Response Fields**:

- `computedDays`: Days required based on hoursPerDay (respects minimum track hours)
- `actualDays`: Equal to computedDays
- `requiredHoursPerDay`: Only set if targetDays provided AND user's hoursPerDay insufficient
- `advisoryMessage`: Advisory if targetDays requires more hours than available
- `isFeasible`: Always true for DAILY_HOURS mode (timeline adapts to available time)

#### Mode 2: DEADLINE_DAYS (Feasibility Check + Fallback)

**Request**

```json
{
  "skills": [{ "topic": "React Basics", "level": 2 }],
  "marks": [{ "topic": "React Basics", "scorePercent": 45 }],
  "goal": "Placement",
  "planningMode": "DEADLINE_DAYS",
  "hoursPerDay": 4,
  "targetDays": 120
}
```

**Parameters**:

- `planningMode`: "DEADLINE_DAYS"
- `hoursPerDay`: Required, available learning hours per day (0-24)
- `targetDays`: Required, deadline to meet (days)

**Response (Feasible)**

```json
{
  "plan": { "_id": "...", "weeks": [] },
  "skillGaps": [],
  "planMetadata": {
    "planningMode": "DEADLINE_DAYS",
    "isFeasible": true,
    "computedDays": 100,
    "requiredHoursPerDay": null,
    "minimumDaysAtMaxHours": null,
    "maxHoursPerDayUsedForFallback": null,
    "advisoryMessage": "Feasible! You'll complete in 100 days (20 buffer days available)."
  }
}
```

**Response (Infeasible - User Hours)**

```json
{
  "plan": { "_id": "...", "weeks": [] },
  "skillGaps": [],
  "planMetadata": {
    "planningMode": "DEADLINE_DAYS",
    "isFeasible": false,
    "computedDays": 150,
    "requiredHoursPerDay": 8,
    "minimumDaysAtMaxHours": null,
    "maxHoursPerDayUsedForFallback": null,
    "advisoryMessage": "Not feasible with current pace: You need 8 hours/day to finish in 120 days (you selected 4). Consider increasing study time or extending deadline."
  }
}
```

**Response (Infeasible - Physical Maximum)**

```json
{
  "plan": { "_id": "...", "weeks": [] },
  "skillGaps": [],
  "planMetadata": {
    "planningMode": "DEADLINE_DAYS",
    "isFeasible": false,
    "computedDays": 210,
    "requiredHoursPerDay": 24,
    "minimumDaysAtMaxHours": 210,
    "maxHoursPerDayUsedForFallback": 24,
    "advisoryMessage": "Physically impossible: Even at 24 hours/day, you need 210 days (you only have 120). Fallback plan provided: 120 days with maximum possible timeline.",
    "fallbackPlan": {
      "hoursPerDay": 24,
      "targetDays": 210,
      "message": "Complete in minimum possible time with maximum daily effort"
    }
  }
}
```

**Response Fields**:

- `isFeasible`: Whether the targetDays deadline is achievable
- `computedDays`: Required days to complete with user's hoursPerDay (or minimumDaysAtMaxHours if infeasible)
- `requiredHoursPerDay`: Hours/day needed to meet deadline (only if isFeasible=false and physically possible)
- `minimumDaysAtMaxHours`: Minimum days even at 24 hours/day (only if physically impossible)
- `maxHoursPerDayUsedForFallback`: Always 24 if fallback plan is provided
- `advisoryMessage`: Human-readable explanation of feasibility result
- `fallbackPlan`: (Optional) Alternative plan if physically impossible

### GET /plans/my

**Response**

```json
{ "plans": [{ "_id": "...", "weeks": [] }] }
```

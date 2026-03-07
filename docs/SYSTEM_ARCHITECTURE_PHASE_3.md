# System Architecture: Core Logic Rebuild

## PHASE 3 — Deterministic Track Selection Engine

**Status**: ✅ READY FOR APPROVAL — All Fixes Applied

---

## Overview

Phase 3 defines a deterministic, explainable scoring engine that selects a default track for a given role. The engine uses **track metadata** and **user profile signals**, applies fixed weights, and outputs a stable `TrackDecision` object. If the same inputs are provided, the same output must always be produced.

Key outcomes:

- Formal scoring model and weights
- Track metadata fields required for scoring
- User profile modifiers
- Example scoring (React vs Vue vs Angular)
- Output schema: `TrackDecision`
- Determinism constraints and test cases

---

## 1. Inputs

### 1.1 Required Inputs

- `roleId`
- `candidateTrackIds[]` (tracks available for the role)
- `trackMetadataById` (all scoring fields per track)
- `userProfile` (experience level, learning goal, time availability)

### 1.2 Track Metadata Fields (per Track)

Each track must store these **static** fields:

- `ecosystemScore` (0–1) — Quality of tooling, libraries, packages, integrations, documentation
- `hiringValueScore` (0–1) — Job market demand, salary potential, hiring velocity
- `easeOfLearningScore` (0–1) — Learning curve, beginner-friendliness, complexity
- `timeToJobReadyScore` (0–1) — Speed to build job-ready portfolio projects
- `communitySizeScore` (0–1) — Active developers, forums, mentorship availability
- `marketTrendScore` (0–1) — Adoption growth, industry momentum, future relevance

### 1.3 User Profile Modifiers

These modify weights (not raw track scores):

- `experienceLevel`: beginner | intermediate | advanced
- `learningGoal`: job-hunting | mastery | quick-skills | career-switch
- `timeAvailabilityPerDay`: minutes (30–480)

---

## 2. Scoring Model

### 2.1 Base Weights (Default)

```
W_ecosystem = 0.25
W_hiring    = 0.25
W_ease      = 0.20
W_time      = 0.15
W_community = 0.10
W_trend     = 0.05
```

Sum = 1.00

### 2.2 User-Adjusted Weights

Weights are adjusted deterministically using a small delta matrix. Example rules:

**Experience Level: Beginner**

- Increase `W_ease` by +0.05
- Decrease `W_ecosystem` by −0.03
- Decrease `W_trend` by −0.02

**Experience Level: Advanced**

- Increase `W_ecosystem` by +0.05
- Increase `W_trend` by +0.02
- Decrease `W_ease` by −0.05

**Learning Goal: job-hunting**

- Increase `W_hiring` by +0.05
- Decrease `W_community` by −0.03
- Decrease `W_trend` by −0.02

**Learning Goal: quick-skills**

- Increase `W_time` by +0.05
- Increase `W_ease` by +0.03
- Decrease `W_ecosystem` by −0.08

**Learning Goal: mastery**

- Increase `W_ecosystem` by +0.05
- Increase `W_community` by +0.03
- Decrease `W_time` by −0.08

**Time Availability: <60 min/day (low commitment)**

- Increase `W_ease` by +0.04
- Increase `W_time` by +0.02
- Decrease `W_ecosystem` by −0.06

**Time Availability: 60–180 min/day (moderate)**

- No adjustments (neutral)

**Time Availability: >180 min/day (high commitment)**

- Increase `W_ecosystem` by +0.04
- Increase `W_trend` by +0.02
- Decrease `W_ease` by −0.06

After all adjustments, weights are normalized to sum to 1.00.

### 2.3 Track Score Formula

For each track $t$:

$Score(t) = \sum_{k \in K} W_k \times Meta_k(t)$

Where $K$ = {ecosystem, hiring, ease, time, community, trend}.

---

## 3. Example Scoring (Frontend Developer)

### 3.1 Tracks

Candidate tracks: `frontend-react`, `frontend-vue`, `frontend-angular`

### 3.2 Metadata

```
frontend-react:
  ecosystemScore: 0.95
  hiringValueScore: 0.92
  easeOfLearningScore: 0.75
  timeToJobReadyScore: 0.80
  communitySizeScore: 0.95
  marketTrendScore: 0.90

frontend-vue:
  ecosystemScore: 0.70
  hiringValueScore: 0.55
  easeOfLearningScore: 0.85
  timeToJobReadyScore: 0.85
  communitySizeScore: 0.70
  marketTrendScore: 0.60

frontend-angular:
  ecosystemScore: 0.80
  hiringValueScore: 0.75
  easeOfLearningScore: 0.60
  timeToJobReadyScore: 0.70
  communitySizeScore: 0.65
  marketTrendScore: 0.50
```

### 3.3 User Profile

```
experienceLevel: beginner
learningGoal: job-hunting
timeAvailabilityPerDay: 120
```

### 3.4 Adjusted Weights (Step-by-Step)

**Profile modifiers**:

- Experience: beginner → W_ease +0.05, W_ecosystem −0.03, W_trend −0.02
- Goal: job-hunting → W_hiring +0.05, W_community −0.03, W_trend −0.02
- Time: 120 min/day (moderate) → no adjustment

**Raw adjusted weights**:

```
W_ecosystem = 0.25 − 0.03 = 0.22
W_hiring    = 0.25 + 0.05 = 0.30
W_ease      = 0.20 + 0.05 = 0.25
W_time      = 0.15 (no change)
W_community = 0.10 − 0.03 = 0.07
W_trend     = 0.05 − 0.02 − 0.02 = 0.01
```

Sum = 1.00 (already normalized)

### 3.5 Result

**React Score**:

```
= (0.95 × 0.22) + (0.92 × 0.30) + (0.75 × 0.25) + (0.80 × 0.15) + (0.95 × 0.07) + (0.90 × 0.01)
= 0.209 + 0.276 + 0.1875 + 0.12 + 0.0665 + 0.009
= 0.868
```

**Vue Score**:

```
= (0.70 × 0.22) + (0.55 × 0.30) + (0.85 × 0.25) + (0.85 × 0.15) + (0.70 × 0.07) + (0.60 × 0.01)
= 0.154 + 0.165 + 0.2125 + 0.1275 + 0.049 + 0.006
= 0.714
```

**Angular Score**:

```
= (0.80 × 0.22) + (0.75 × 0.30) + (0.60 × 0.25) + (0.70 × 0.15) + (0.65 × 0.07) + (0.50 × 0.01)
= 0.176 + 0.225 + 0.15 + 0.105 + 0.0455 + 0.005
= 0.707
```

**Ranking**: React (0.868) > Vue (0.714) > Angular (0.707)

**Chosen Track**: `frontend-react` (highest score)

---

## 4. Output: TrackDecision

### 4.1 Schema

```json
{
  "chosenTrackId": "frontend-react",
  "rankedAlternatives": [
    {
      "trackId": "frontend-react",
      "rank": 1,
      "score": 0.868,
      "topReasons": [
        "Highest hiring value (0.92)",
        "Strongest ecosystem (0.95)",
        "Largest community support (0.95)"
      ]
    },
    {
      "trackId": "frontend-vue",
      "rank": 2,
      "score": 0.714,
      "topReasons": ["Easiest to learn (0.85)", "Fastest time-to-job-ready (0.85)"]
    },
    {
      "trackId": "frontend-angular",
      "rank": 3,
      "score": 0.707,
      "topReasons": ["Solid hiring value (0.75)", "Strong ecosystem (0.80)"]
    }
  ],
  "scoresByTrack": {
    "frontend-react": {
      "score": 0.868,
      "metadata": {
        "ecosystemScore": 0.95,
        "hiringValueScore": 0.92,
        "easeOfLearningScore": 0.75,
        "timeToJobReadyScore": 0.8,
        "communitySizeScore": 0.95,
        "marketTrendScore": 0.9
      }
    },
    "frontend-vue": {
      "score": 0.714,
      "metadata": {
        "ecosystemScore": 0.7,
        "hiringValueScore": 0.55,
        "easeOfLearningScore": 0.85,
        "timeToJobReadyScore": 0.85,
        "communitySizeScore": 0.7,
        "marketTrendScore": 0.6
      }
    },
    "frontend-angular": {
      "score": 0.707,
      "metadata": {
        "ecosystemScore": 0.8,
        "hiringValueScore": 0.75,
        "easeOfLearningScore": 0.6,
        "timeToJobReadyScore": 0.7,
        "communitySizeScore": 0.65,
        "marketTrendScore": 0.5
      }
    }
  },
  "weightsUsed": {
    "ecosystem": 0.22,
    "hiring": 0.3,
    "ease": 0.25,
    "time": 0.15,
    "community": 0.07,
    "trend": 0.01
  }
}
```

### 4.2 UI Usage

The `rankedAlternatives` array allows the UI to:

1. Display the chosen track as the primary recommendation
2. Show 2–3 alternative tracks with their scores and reasons
3. Let users compare tracks side-by-side before confirming
4. Enable "Why not Vue?" explanations using score differences

---

## 5. Determinism Rules

1. **No randomization** (no RNG, no sampling).
2. **Same input → same output** (idempotent scoring function).
3. **Stable ordering** for tie-breaks:
   - If scores tie within 0.01, select the track with the highest `hiringValueScore`.
   - If still tied, select by alphabetical `trackId`.
4. **Weight adjustments must be fixed** and formula-based only.

---

## 6. Test Cases

### 6.1 Determinism Test

```
Given identical inputs repeated 100 times:
- Same roleId, candidateTrackIds, userProfile
- Expect: chosenTrackId is identical every time
- Expect: All scores match to 3 decimal places
```

### 6.2 Tie-Break Test

```
Two tracks have equal final scores (±0.01).
Expect: higher hiringValueScore wins.
If still tied, alphabetical trackId wins.
Example: Vue (0.714) vs Angular (0.707) → within 0.01 threshold
  → Vue has lower hiringValueScore (0.55 < 0.75)
  → Angular wins tie-break
```

### 6.3 User Modifier Test

```
Input A: beginner + job-hunting + 120 min/day
  → W_hiring boosted, W_ease boosted
  → Expect React wins (0.868)

Input B: advanced + mastery + 240 min/day
  → W_ecosystem boosted, W_community boosted
  → Recalculate: React still wins but Vue score rises
```

### 6.4 Time Availability Test

```
User A: 45 min/day (low commitment)
  → W_ease +0.04, W_time +0.02, W_ecosystem −0.06
  → Expect Vue score rises (ease 0.85 benefits)

User B: 240 min/day (high commitment)
  → W_ecosystem +0.04, W_trend +0.02, W_ease −0.06
  → Expect React score rises (ecosystem 0.95 benefits)
```

---

## 7. Phase 3 Deliverables Checklist

- [x] Scoring model definition (base weights + formula)
- [x] Weight adjustment rules for user profile (experience, goal, time availability)
- [x] Track metadata field list (6 scores with clear definitions)
- [x] Differentiation of ecosystemScore vs communitySizeScore
- [x] Example scoring calculation with realistic math (React 0.868, Vue 0.714, Angular 0.707)
- [x] `TrackDecision` schema with ranked alternatives
- [x] UI usage guidance for alternatives
- [x] Determinism rules and 4 test cases

---

## Next Steps

After approval, Phase 4 will define the **Roadmap Generation Engine** (topological ordering, pacing, priority, explainability).

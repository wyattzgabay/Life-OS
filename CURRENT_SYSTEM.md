# Life OS Technical Documentation
## Current System vs. Planned Features

**Last Updated:** December 2025

---

## Table of Contents

1. [Current System Overview](#1-current-system-overview)
2. [Workout System (Current)](#2-workout-system-current)
3. [Volume Tracking (Current)](#3-volume-tracking-current)
4. [Progression System (Current)](#4-progression-system-current)
5. [Running System (Current)](#5-running-system-current)
6. [XP & Leveling (Current)](#6-xp--leveling-current)
7. [Nutrition System (Current)](#7-nutrition-system-current)
8. [Injury System (Current)](#8-injury-system-current)
9. [Planned Features (v2.0)](#9-planned-features-v20)

---

## 1. Current System Overview

### 1.1 What's Implemented

| Feature | Status | Location |
|---------|--------|----------|
| Weekly workout schedule |  Live | `config.js � WORKOUTS` |
| Volume tracking (MEV/MAV/MRV) |  Live | `utils.js � getVolumeAdjustments()` |
| Double progression model |  Live | `state.js � getProgressionSuggestion()` |
| Running program (5K-Marathon) |  Live | `config.js � RUNNING` |
| VDOT pace calculator |  Live | `config.js � VDOT_PACES` |
| AI food logging |  Live | `ai-nutrition.js` |
| XP & leveling |  Live | `config.js � LEVELS, XP_REWARDS` |
| Exercise swaps |  Live | `config.js � EXERCISE_ALTERNATIVES` |
| Deload recommendations |  Live | `utils.js � shouldDeload()` |
| Running injuries |  Live | `config.js � RUNNING.INJURIES` |
| Daily scoring |  Live | `daily.js � calculateDayScore()` |

### 1.2 What's NOT Implemented Yet

| Feature | Status | Planned Section |
|---------|--------|-----------------|
| Age-adjusted programming |  Planned | v2.0 |
| Chronic injury system |  Planned | v2.0 |
| TrainingState object |  Planned | v2.0 |
| Intra-workout RPE adjustments |  Planned | v2.0 |
| Cross-domain feedback (food�lifting) |  Planned | v2.0 |
| Personal MRV/MEV learning |  Planned | v2.0 |
| Fatigue modeling |  Planned | v2.0 |
| Goal-specific programming |  Planned | v2.0 |

---

## 2. Workout System (Current)

### 2.1 Weekly Schedule

```
CONFIG.WORKOUTS = {
  0: Sunday    � LONG RUN DAY (Mobility only for lifting)
  1: Monday    � UPPER STRENGTH + Optional Easy Run
  2: Tuesday   � LOWER POWER (NO running)
  3: Wednesday � UPPER HYPERTROPHY + Easy Run
  4: Thursday  � TEMPO RUN DAY (Core only for lifting)
  5: Friday    � LOWER HYPERTROPHY (NO running)
  6: Saturday  � RECOVERY + MOBILITY (NO running)
}
```

### 2.2 Workout Structure

Each day has:
```javascript
{
  name: 'UPPER STRENGTH',        // Display name
  type: 'lift' | 'cardio' | 'recovery',
  runType: 'long' | 'tempo' | 'easy' | 'rest',
  runOrder: 'run_first' | 'lift_first' | 'lift_only' | 'recovery_only',
  runOptional: boolean,          // For 10K+ training
  science: string,               // Citation for schedule
  exercises: [
    {
      name: string,
      detail: '4�6',             // Sets � Reps
      xp: number,
      muscle: string[],          // For volume tracking
      posture: boolean           // For posture tracking
    }
  ]
}
```

### 2.3 Exercise Count by Day

| Day | Workout | Exercises | XP Available |
|-----|---------|-----------|--------------|
| Sun | Long Run Day | 4 (mobility) | ~25 |
| Mon | Upper Strength | 7 | ~71 |
| Tue | Lower Power | 7 | ~77 |
| Wed | Upper Hypertrophy | 7 | ~68 |
| Thu | Tempo Run Day | 5 | ~39 |
| Fri | Lower Hypertrophy | 7 | ~76 |
| Sat | Recovery | 6 | ~40 |

### 2.4 Exercise Alternatives

Defined in `CONFIG.EXERCISE_ALTERNATIVES`:

```javascript
// Example swaps
'Flat Barbell Bench Press': ['Dumbbell Bench Press', 'Machine Chest Press', 'Smith Machine Bench'],
'Barbell Back Squat': ['Leg Press', 'Hack Squat', 'Goblet Squat', 'Smith Machine Squat'],
'Trap Bar Deadlift': ['Conventional Deadlift', 'Sumo Deadlift', 'Rack Pulls'],
// ... 17 exercises with alternatives
```

---

## 3. Volume Tracking (Current)

### 3.1 Volume Landmarks (Per Muscle Group)

From `CONFIG.VOLUME_LANDMARKS` (sets per week):

| Muscle | MEV | MAV | MRV | Notes |
|--------|-----|-----|-----|-------|
| Chest | 8 | 14 | 20 | Responds well to moderate volume |
| Back | 8 | 16 | 25 | Can handle high volume, many muscles |
| Shoulders | 6 | 14 | 22 | Delts recover well |
| Quads | 6 | 14 | 20 | High fatigue per set |
| Hamstrings | 4 | 10 | 16 | Lower volume needed |
| Glutes | 4 | 12 | 18 | Often hit by compounds |
| Biceps | 4 | 10 | 18 | Small muscle, recovers fast |
| Triceps | 4 | 10 | 18 | Small muscle, hit by pressing |
| Core | 4 | 10 | 16 | Stabilizers, recover fast |
| Default | 6 | 14 | 20 | Fallback for unlisted |

### 3.2 Volume Adjustment Logic

From `utils.js � getVolumeAdjustments()`:

```javascript
// Decision tree for volume adjustments
if (sets >= MRV) {
  // AT or OVER MRV - reduce by 2 sets
  return { action: 'reduce', amount: -2 };
}

if (sets >= MRV - 2) {
  // NEAR MRV (within 2) - reduce by 1 set
  return { action: 'reduce', amount: -1 };
}

if (sets < MEV && daysLeftInWeek >= 2) {
  // UNDER MEV with training days left - add up to 2 sets
  const deficit = MEV - sets;
  return { action: 'increase', amount: Math.min(2, deficit) };
}

if (sets < MEV && daysLeftInWeek < 2) {
  // UNDER MEV on last day - just note it for next week
  return { action: 'note', message: 'Plan for next week' };
}
```

### 3.3 Volume Counting Rules

Only counts exercises explicitly tagged for each muscle group:

```javascript
CONFIG.MUSCLE_GROUPS = {
  chest: ['Flat Barbell Bench Press', 'Dumbbell Bench Press', ...], // 9 exercises
  back: ['Lat Pulldown', 'Pull-ups', 'Seated Cable Row', ...],      // 15 exercises
  biceps: ['Barbell Curls', 'Dumbbell Curls', ...],                 // 5 exercises (direct only)
  triceps: ['Tricep Rope Pushdown', 'Cable Tricep Extension', ...], // 7 exercises (direct only)
  // ... etc
}
```

**Important:** Compound movements (bench, rows) do NOT count toward biceps/triceps volume. Only direct isolation work counts.

### 3.4 Deload Logic

From `utils.js � shouldDeload()`:

```javascript
// Deload triggers
- Weeks since last deload >= 4: "Consider deload"
- Weeks since last deload >= 5: "Recommend deload"
- User can manually trigger deload

// During deload week
- Reduce weights 40-50%
- Cut volume in half
- targetSets = Math.ceil(normalSets / 2)
```

---

## 4. Progression System (Current)

### 4.1 Double Progression Model

From `state.js � getProgressionSuggestion()`:

Uses 6-12 rep range:

```javascript
// Decision tree
if (nearMRV) {
  // At high volume - maintain, don't push
  return { weight: lastWeight, reps: avgReps, message: 'maintain' };
}

if (avgReps >= 12) {
  // Hit top of range - ADD WEIGHT, drop to 6-8
  return { weight: lastWeight + 5, reps: '6-8', message: 'Progress!' };
}

if (avgReps >= 10) {
  // Strong - same weight, push for +1 rep
  return { weight: lastWeight, reps: avgReps + 1 };
}

if (avgReps >= 8) {
  // Good range - keep building
  return { weight: lastWeight, reps: avgReps + 1 };
}

if (avgReps >= 6) {
  // Lower end - stay until 8+
  return { weight: lastWeight, reps: avgReps };
}

if (avgReps < 6) {
  // Struggling - DROP WEIGHT
  return { weight: lastWeight - 5, reps: 8 };
}
```

### 4.2 Estimated 1RM Calculation

From `state.js � calculateEstimated1RM()`:

```javascript
// Epley formula
estimated1RM = weight * (1 + (reps / 30))

// Example: 185 lbs � 6 reps
// e1RM = 185 * (1 + 6/30) = 185 * 1.2 = 222 lbs
```

### 4.3 PR Detection

```javascript
// PR is detected when:
const isPR = !previousPR || estimated1RM > previousPR.estimated1RM;

// PR awards XP_REWARDS.PR_BONUS = 30 XP
```

---

## 5. Running System (Current)

### 5.1 Running Goals

From `CONFIG.RUNNING.GOALS`:

| Goal | Distance | Weeks | Runs/Week |
|------|----------|-------|-----------|
| 5K | 3.1 mi | 8 | 3 |
| 10K | 6.2 mi | 12 | 4 |
| Half Marathon | 13.1 mi | 16 | 4 |
| Marathon | 26.2 mi | 20 | 5 |
| Casual | - | - | 3 |

### 5.2 Weekly Run Structure

From `CONFIG.RUNNING.WEEKLY_RUNS`:

```javascript
'5k':      ['long', 'easy', 'tempo'],                           // 3 runs
'10k':     ['long', 'easy_recovery', 'easy', 'tempo'],          // 4 runs
'half':    ['long', 'easy_recovery', 'easy', 'tempo'],          // 4 runs  
'marathon':['long', 'easy_recovery', 'easy', 'tempo', 'easy'], // 5 runs
```

### 5.3 Base Week Schedule

From `CONFIG.RUNNING.BASE_WEEK`:

| Day | Run Type | Lifting | Order | Why |
|-----|----------|---------|-------|-----|
| Sun | Long | Mobility only | Run first | 48hrs after Friday legs |
| Mon | Easy (optional) | Upper Strength | Lift first | Recovery blood flow |
| Tue | REST | Lower Power | Lift only | Heavy legs need no cardio |
| Wed | Easy | Upper Hypertrophy | Lift first | Upper day, legs can run |
| Thu | Tempo | Core | Run first | 48hrs post Tuesday legs |
| Fri | REST | Lower Hypertrophy | Lift only | Volume legs need no cardio |
| Sat | REST | Recovery | Recovery only | Prep for Sunday long run |

### 5.4 VDOT Pace Tables

From `CONFIG.RUNNING.VDOT_PACES`:

| VDOT | Easy | Marathon | Tempo | Interval | 5K Time |
|------|------|----------|-------|----------|---------|
| 30 | 12:40 | 11:30 | 10:30 | 9:30 | 32:00 |
| 35 | 11:15 | 10:10 | 9:15 | 8:20 | 27:30 |
| 40 | 10:05 | 9:05 | 8:15 | 7:25 | 24:00 |
| 45 | 9:10 | 8:15 | 7:30 | 6:45 | 21:15 |
| 50 | 8:25 | 7:30 | 6:55 | 6:10 | 19:00 |
| 55 | 7:50 | 7:00 | 6:25 | 5:45 | 17:15 |
| 60 | 7:20 | 6:35 | 6:00 | 5:20 | 15:45 |

### 5.5 Training Phases

From `CONFIG.RUNNING.PHASES`:

| Phase | Duration | Easy % | Focus |
|-------|----------|--------|-------|
| Base Building | 4 weeks | 90% | Aerobic foundation |
| Build | 4 weeks | 80% | Volume + tempo |
| Peak | 3 weeks | 75% | Race-specific |
| Taper | 2 weeks | 85% | Reduce volume, maintain intensity |

### 5.6 Running Injuries

From `CONFIG.RUNNING.INJURIES`:

| Injury | Distance Multiplier | Pre-Run | Post-Run |
|--------|---------------------|---------|----------|
| Tight Tibialis | 0.9 (90%) | Toe raises, ankle circles | Stretch, roll shins |
| Flat Feet | 0.85 (85%) | Towel scrunches, calf raises | Roll arches, toe stretches |
| Plantar Fasciitis | 0.75 (75%) | Frozen bottle roll, calf stretch | Eccentric calf drops |
| Shin Splints | 0.7 (70%) | Heel walks, toe walks | Ice, tibialis raises |
| Runner's Knee | 0.8 (80%) | Quad roll, glute activation | Terminal knee ext, ice |
| IT Band | 0.75 (75%) | Hip circles, leg raises | Foam roll, pigeon stretch |

---

## 6. XP & Leveling (Current)

### 6.1 Level Thresholds

From `CONFIG.LEVELS`:

| Level | Title | XP Required | Time to Reach* |
|-------|-------|-------------|----------------|
| 1 | INITIATE | 0 | - |
| 2 | NOVICE | 300 | ~3 days |
| 3 | APPRENTICE | 800 | ~1 week |
| 4 | ADEPT | 1,500 | ~2 weeks |
| 5 | EXPERT | 2,500 | ~3 weeks |
| 6 | VETERAN | 4,000 | ~5 weeks |
| 7 | MASTER | 6,000 | ~2 months |
| 8 | ELITE | 9,000 | ~3 months |
| 9 | CHAMPION | 13,000 | ~4.5 months |
| 10 | LEGEND | 20,000 | ~6-7 months |

*Assuming ~80-120 XP/day with consistent effort

### 6.2 XP Sources

From `CONFIG.XP_REWARDS`:

| Action | XP | Notes |
|--------|-----|-------|
| **Daily Tracking** | | |
| Log weight | 5 | Once per day |
| **Food Logging** | | |
| AI food log | 3 | Per meal |
| Leucine threshold hit | 2 | Per meal |
| Protein goal hit | 10 | Once per day |
| Calorie target hit | 5 | Once per day |
| **Running** | | |
| Run complete | 15 | Any run |
| Tempo run bonus | 25 | Hard runs |
| Long run bonus | 30 | Weekly long run |
| **Lifting** | | |
| PR bonus | 30 | New estimated 1RM |
| Workout complete | 15 | Full workout |
| Exercise XP | 6-18 | Per exercise in CONFIG |
| **Reading** | | |
| Reading session | 8 | Per session |
| Book complete | 40 | Finish a book |
| **Streaks** | | |
| 3-day streak | 10 | One-time |
| 7-day streak | 25 | One-time |
| 14-day streak | 50 | One-time |
| 30-day streak | 100 | One-time |
| **Penalties** | | |
| Alcohol | -20 | Per drink |
| Missed day | -25 | Per day |

### 6.3 Streak Multipliers

From `CONFIG.STREAK_MULTIPLIERS`:

| Streak Days | Multiplier |
|-------------|------------|
| 0 | 1.0x |
| 3+ | 1.1x |
| 7+ | 1.25x |
| 14+ | 1.5x |
| 30+ | 2.0x |

### 6.4 Skill Trees

From `CONFIG.SKILL_TREES`:

**STRENGTH (I)**
- Foundation � Compound (150) � Progressive (400) � Advanced (800) � Elite (1500)

**DISCIPLINE (II)**
- Beginner � Consistent (200) � Dedicated (500) � Relentless (1000) � Unstoppable (2000)

**NUTRITION (III)**
- Tracker � Aware (100) � Optimized (300) � Precision (600) � Master (1200)

**RECOVERY (IV)**
- Rest � Sleep (100) � Restore (250) � Optimize (500) � Peak (1000)

---

## 7. Nutrition System (Current)

### 7.1 AI Food Logging

- Uses Groq API (Llama model)
- Parses natural language food descriptions
- Returns: calories, protein, carbs, fats, leucine
- Checks leucine threshold (2.5g for MPS)

### 7.2 Meal Storage

```javascript
// Per-day meal log
localStorage.setItem(`meals_${dateKey}`, JSON.stringify([
  {
    items: [{ name, calories, protein }],
    totals: { calories, protein, carbs, fats },
    timestamp,
    source: 'ai' | 'saved_meal'
  }
]));
```

### 7.3 Saved Meals

- Stored in `State._data.savedMeals`
- Synced to Firebase
- Permanent (survive daily resets)

---

## 8. Injury System (Current)

### 8.1 Running Injuries (Implemented)

6 running-specific injuries with:
- Distance multiplier
- Pre-run routine
- Post-run routine
- Tips

### 8.2 Lifting Injuries (Limited)

Currently only `wrist` injury implemented:
- Reduces pressing volume
- Swaps to machine/neutral grip variations

### 8.3 What's Missing (v2.0 Scope)

- Comprehensive injury library (10+ injuries)
- Contraindication system
- Auto-swap based on injury
- PT/rehab exercises
- Age amplification
- Severity tracking

---

## 9. Planned Features (v2.0)

### 9.1 TrainingState Object

Central state that tracks:

```javascript
TrainingState = {
  muscleLoad: { /* per-muscle 7d/14d volume + trend */ },
  patternLoad: { /* squat/hinge/push/pull/carry/lunge fatigue */ },
  cardioLoad: { /* weekly running + non-running */ },
  recovery: { /* readiness, sleep, soreness, RPE avg */ },
  nutrition: { /* 7d calorie balance, protein adherence */ },
  injuries: { /* active injuries + severity + pain flags */ },
  context: { /* goal, ageBand, mrvMultiplier */ }
}
```

### 9.2 Age-Adjusted Programming

| Age Band | MRV Modifier | Warm-up | Risk Factor |
|----------|--------------|---------|-------------|
| 18-35 | 1.0x | Standard | 1.0x |
| 35-50 | 0.85x | +25% | 1.3x |
| 50-65 | 0.7x | +50% | 1.6x |
| 65+ | 0.55x | +75% | 2.0x |

### 9.3 Injury Intelligence

10+ injuries with:
- Red-flag movements
- Modifications/swaps
- Volume reductions per pattern
- PT exercises
- Intensity caps
- Age amplification

### 9.4 Intra-Workout Loop

Real-time adjustments based on:
- RPE/RIR delta from target
- Pain flags � immediate swap
- Fatigue accumulation � modify accessories

### 9.5 Cross-Domain Feedback

**Nutrition � Training:**
- Deep deficit � reduce volume 15%
- Low protein � bias toward intensity over volume

**Running � Lifting:**
- Long run � protect legs next day
- High leg fatigue � swap to machines

### 9.6 Personal MRV/MEV Learning

Weekly refit based on:
- Performance trend (up/flat/down)
- Recovery scores
- Volume vs current MRV
- Adjust �5-10% per muscle group

---

## Appendix: Key Functions Reference

### Volume System
- `Utils.getVolumeLandmarks(muscle)` � returns { MEV, MAV, MRV }
- `Utils.getVolumeAdjustments()` � returns adjustments for today
- `State.getWeeklyVolume(muscleGroup)` � returns { sets, exercises }
- `State.getAllWeeklyVolumes()` � returns all muscle volumes

### Progression System
- `State.getProgressionSuggestion(exerciseName)` � returns { weight, reps, message }
- `State.calculateEstimated1RM(weight, reps)` � returns e1RM
- `State.getLastLift(exerciseName)` � returns last session data

### Workout Generation
- `Utils.getTodaysWorkout()` � returns processed workout with adjustments
- `Utils.shouldDeload()` � returns { shouldDeload, weeksSince, nextDeload }
- `Utils.getCurrentBlock()` � returns 'accumulation' | 'intensification'

### Running System
- `RunningView.getTodaysRun(running)` � returns today's run prescription
- `RunningView.calculatePaces(vdot)` � returns pace table
- `RunningView.getPhase(running)` � returns current training phase

---

*This document reflects the system as of December 2025. See PRODUCT_SPEC.md for planned v2.0 features.*



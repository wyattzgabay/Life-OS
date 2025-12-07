# Life OS Product Specification
## Adaptive Training Operating System

**Version:** 2.0 Roadmap  
**Last Updated:** December 2025  
**Status:** Planning Phase

---

## Executive Summary

Life OS is evolving from a workout logger with adaptive features into a **full performance operating system** with modular layers capable of serving diverse demographics—from young athletes to seniors with chronic conditions.

**Core thesis:** The app is the trainer. Prescriptive, not permissive. Every recommendation grounded in sports science, not bro-science.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Age-Adjusted Programming](#2-age-adjusted-programming)
3. [Injury Intelligence System](#3-injury-intelligence-system)
4. [Exercise Database Schema](#4-exercise-database-schema)
5. [Goal-Driven Programming](#5-goal-driven-programming)
6. [Adaptive Engine](#6-adaptive-engine)
7. [Closed-Loop Training System](#7-closed-loop-training-system)
8. [Research Foundation](#8-research-foundation)
9. [Development Roadmap](#9-development-roadmap)
10. [Data Models](#10-data-models)

---

## 1. Architecture Overview

### 1.1 System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     OUTPUT LAYER                            │
│  Daily prescription, recovery recs, nutrition, summaries    │
├─────────────────────────────────────────────────────────────┤
│                   ADAPTIVE ENGINE                           │
│  Fatigue modeling, periodization, deload triggers, scaling  │
├─────────────────────────────────────────────────────────────┤
│                    CONTENT LAYER                            │
│  Exercises, PT modules, warm-ups, mobility, running zones   │
├─────────────────────────────────────────────────────────────┤
│                 USER PROFILE LAYER                          │
│  Age, sex, training age, injuries, goals, constraints       │
├─────────────────────────────────────────────────────────────┤
│                  ANALYTICS LAYER                            │
│  Adherence, fatigue responses, volume-to-progress data      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
User Input → Profile Layer → Adaptive Engine → Content Selection → Daily Output
                ↑                    ↓
            Analytics ←──── Performance Data
```

### 1.3 Current State vs. Target

| Component | Current (v1) | Target (v2) |
|-----------|--------------|-------------|
| User Profile | Basic (age, weight, goals) | Full (training age, injuries, constraints, RPE familiarity) |
| Adaptive Engine | Volume adjustments only | Fatigue modeling, auto-deload, age scaling |
| Content | ~50 exercises, minimal tags | 200+ exercises, full metadata |
| Output | Static daily workout | Dynamic prescription with alternatives |
| Analytics | Basic XP/streaks | ML-ready fatigue/progress correlations |

---

## 2. Age-Adjusted Programming

### 2.1 Scientific Basis

Age-related physiological changes that affect training:

| Factor | Impact | Programming Adjustment |
|--------|--------|------------------------|
| VO2 max decline | ~10% per decade after 30 | Reduced cardio intensity expectations |
| Tendon elasticity | Decreases with age | Longer warm-ups, controlled eccentrics |
| Sarcopenia onset | Begins ~40, accelerates 60+ | Prioritize strength maintenance |
| Recovery capacity | Reduced MRV, slower adaptation | Lower frequency, more rest days |
| Injury susceptibility | Higher with age | Joint-friendly variations, machine emphasis |

### 2.2 Age Bands

#### Band A: 18-35 (High Recoverability)
- **MRV modifier:** 1.0x (baseline)
- **Frequency:** Up to 6 days/week
- **Exercise selection:** Full compound library, barbell emphasis
- **Warm-up volume:** Standard
- **Injury risk factor:** 1.0x

#### Band B: 35-50 (Moderate Adjustment)
- **MRV modifier:** 0.85x
- **Frequency:** 4-5 days/week recommended
- **Exercise selection:** Emphasize posterior chain, add unilateral work
- **Warm-up volume:** +25%
- **Injury risk factor:** 1.3x

#### Band C: 50-65 (Conservative)
- **MRV modifier:** 0.7x
- **Frequency:** 3-4 days/week
- **Exercise selection:** Machine emphasis, joint-friendly variations
- **Warm-up volume:** +50%
- **Injury risk factor:** 1.6x
- **Additional:** Balance work, flexibility focus

#### Band D: 65+ (Protective)
- **MRV modifier:** 0.55x
- **Frequency:** 2-3 days/week
- **Exercise selection:** Machines, bodyweight, stability focus
- **Warm-up volume:** +75%
- **Injury risk factor:** 2.0x
- **Additional:** Fall prevention, gait mechanics, daily mobility

### 2.3 Implementation

```javascript
// Pseudocode for age adjustment
function getAgeModifiers(age) {
  if (age < 35) return { mrvMod: 1.0, warmupMod: 1.0, riskFactor: 1.0, band: 'A' };
  if (age < 50) return { mrvMod: 0.85, warmupMod: 1.25, riskFactor: 1.3, band: 'B' };
  if (age < 65) return { mrvMod: 0.7, warmupMod: 1.5, riskFactor: 1.6, band: 'C' };
  return { mrvMod: 0.55, warmupMod: 1.75, riskFactor: 2.0, band: 'D' };
}
```

---

## 3. Injury Intelligence System

### 3.1 Injury Library (Priority Order)

| # | Injury | Prevalence | Affected Patterns | Age Correlation |
|---|--------|------------|-------------------|-----------------|
| 1 | Low back pain | Very High | Hinge, squat, carry | All ages |
| 2 | Patellofemoral pain (knee) | High | Squat, lunge | All ages |
| 3 | Rotator cuff irritation | High | Push, pull (overhead) | 35+ |
| 4 | Tennis/golfer's elbow | Moderate | Pull, grip | 35+ |
| 5 | Plantar fasciitis | Moderate | Running, jumping | All ages |
| 6 | Achilles tendinopathy | Moderate | Running, calf work | 30+ |
| 7 | Hip labrum/flexor pain | Moderate | Squat, hinge | 40+ |
| 8 | Neck pain | Moderate | Overhead, trap work | All ages |
| 9 | Wrist tendinopathy | Lower | Push, pull | All ages |
| 10 | Arthritis (knee/hip/hands) | Age-dependent | Varies | 50+ |

### 3.2 Injury Profile Schema

Each injury includes:

```javascript
{
  id: 'rotator_cuff',
  name: 'Rotator Cuff Irritation',
  affectedJoints: ['shoulder'],
  affectedPatterns: ['horizontal_push', 'vertical_push', 'vertical_pull'],
  
  // Red flags - exercises to avoid entirely
  contraindicated: [
    'Behind Neck Press',
    'Upright Row',
    'Dips (if painful)'
  ],
  
  // Exercises requiring modification
  modifications: {
    'Barbell Bench Press': 'Dumbbell Floor Press',
    'Overhead Press': 'Landmine Press',
    'Pull-ups': 'Lat Pulldown (neutral grip)'
  },
  
  // Volume adjustments
  volumeReduction: {
    'horizontal_push': 0.5,  // 50% reduction
    'vertical_push': 0.3,    // 70% reduction
    'vertical_pull': 0.7     // 30% reduction
  },
  
  // PT/Prehab exercises to add
  rehabExercises: [
    { name: 'Face Pulls', sets: 3, reps: 15, frequency: 'daily' },
    { name: 'External Rotation', sets: 2, reps: 15, frequency: 'pre-workout' },
    { name: 'Band Pull-Aparts', sets: 3, reps: 20, frequency: 'daily' }
  ],
  
  // Intensity caps
  intensityCap: 0.75,  // Max 75% of normal intensity
  
  // Age amplification
  ageAmplification: {
    '35-50': 1.2,  // 20% more conservative
    '50-65': 1.5,  // 50% more conservative
    '65+': 2.0    // Twice as conservative
  }
}
```

### 3.3 Injury-Aware Workout Generation

**Logic flow:**

1. Load user's active injuries
2. For each exercise in template:
   - Check if contraindicated → remove
   - Check if needs modification → swap
   - Apply volume reduction for affected patterns
3. Insert rehab exercises into warm-up/cooldown
4. Apply age amplification to all adjustments
5. Cap intensity if needed

### 3.4 Multiple Injury Handling

When user has multiple injuries:
- Stack volume reductions (multiplicative, not additive)
- Use most conservative modification
- Aggregate all rehab exercises (cap at 4-5 total)
- Flag if too many restrictions make workout ineffective

---

## 4. Exercise Database Schema

### 4.1 Required Fields

Every exercise must have:

```javascript
{
  id: 'barbell_bench_press',
  name: 'Barbell Bench Press',
  
  // Muscle targeting
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps', 'anterior_deltoid'],
  
  // Movement classification
  movementPattern: 'horizontal_push',  // push, pull, hinge, squat, carry, isolation
  plane: 'sagittal',                    // sagittal, frontal, transverse
  
  // Equipment
  equipment: ['barbell', 'bench'],
  gymFriendly: true,                    // Available in most gyms
  homeFriendly: false,
  
  // Stress classification
  jointStress: {
    shoulder: 'high',
    elbow: 'moderate',
    wrist: 'low'
  },
  spinalLoad: 'low',
  
  // Injury contraindications
  contraindications: ['rotator_cuff', 'shoulder_impingement'],
  
  // Progression/regression
  regression: 'machine_chest_press',
  progression: 'incline_barbell_bench',
  alternatives: ['dumbbell_bench_press', 'push_ups'],
  
  // Age suitability
  ageBands: ['A', 'B'],  // Not recommended for C, D without modification
  ageModification: {
    'C': 'dumbbell_bench_press',
    'D': 'machine_chest_press'
  },
  
  // Training characteristics
  fatigueCost: 'high',          // low, moderate, high, very_high
  skillRequirement: 'moderate', // low, moderate, high
  stabilityDemand: 'moderate',
  
  // Optional advanced
  forceCurve: 'ascending',      // ascending, descending, bell
  eccentricEmphasis: false,
  unilateral: false,
  
  // Default prescription
  defaultSets: 4,
  defaultRepRange: [6, 10],
  defaultRPE: 7
}
```

### 4.2 Movement Pattern Categories

| Pattern | Description | Examples |
|---------|-------------|----------|
| `horizontal_push` | Pushing away from body | Bench press, push-ups |
| `horizontal_pull` | Pulling toward body | Rows, face pulls |
| `vertical_push` | Pressing overhead | OHP, landmine press |
| `vertical_pull` | Pulling down/up | Pull-ups, lat pulldown |
| `hip_hinge` | Hip-dominant, knee-light | Deadlift, RDL, good morning |
| `squat` | Knee-dominant, bilateral | Back squat, front squat |
| `lunge` | Knee-dominant, unilateral | Lunges, split squats, step-ups |
| `carry` | Loaded locomotion | Farmer walks, suitcase carry |
| `isolation_upper` | Single-joint upper | Curls, tricep extensions |
| `isolation_lower` | Single-joint lower | Leg extension, leg curl |
| `core` | Trunk stability/movement | Planks, crunches, pallof press |

### 4.3 Exercise Count Targets

| Category | Current | Target v2 |
|----------|---------|-----------|
| Chest | 8 | 15 |
| Back | 10 | 25 |
| Shoulders | 6 | 15 |
| Biceps | 4 | 10 |
| Triceps | 4 | 10 |
| Quads | 8 | 20 |
| Hamstrings | 6 | 15 |
| Glutes | 6 | 15 |
| Calves | 4 | 8 |
| Core | 8 | 20 |
| Compound/Full Body | 10 | 20 |
| Mobility/Prehab | 5 | 30 |
| **Total** | **~79** | **~203** |

---

## 5. Goal-Driven Programming

### 5.1 Goal Categories

| Goal | Primary Outcome | Training Emphasis |
|------|-----------------|-------------------|
| `strength` | 1RM improvement | Low reps, high intensity, long rest |
| `muscle_growth` | Hypertrophy | Moderate reps, high volume, metabolic stress |
| `weight_loss` | Fat loss + muscle retention | Resistance + conditioning, calorie awareness |
| `maintenance` | Preserve current fitness | Moderate everything, minimum effective dose |
| `mobility` | Joint health, flexibility | Tempo work, ROM focus, low fatigue |
| `return_to_training` | Safe reintroduction | Conservative progression, movement quality |

### 5.2 Programming Differences

#### Strength Focus
```javascript
{
  repRange: [1, 6],
  setsPerMuscle: 'low',      // 10-12 sets/week
  intensity: 'high',          // 80-95% 1RM
  restPeriods: 'long',        // 3-5 min
  exerciseVariety: 'low',     // Stick to main lifts
  frequency: 'moderate',      // 3-4x/week per lift
  progressionModel: 'linear'  // Add weight when reps hit
}
```

#### Muscle Growth
```javascript
{
  repRange: [8, 15],
  setsPerMuscle: 'high',      // 15-20 sets/week
  intensity: 'moderate',       // 65-80% 1RM
  restPeriods: 'moderate',     // 90-120 sec
  exerciseVariety: 'high',     // Multiple angles/exercises
  frequency: 'high',           // 2x/week per muscle
  progressionModel: 'double'   // Reps then weight
}
```

#### Weight Loss
```javascript
{
  repRange: [10, 15],
  setsPerMuscle: 'moderate',
  intensity: 'moderate',
  restPeriods: 'short',        // 60-90 sec
  exerciseVariety: 'moderate',
  frequency: 'moderate',
  conditioningEmphasis: true,  // Add cardio/circuits
  progressionModel: 'maintenance'
}
```

#### Mobility/Joint Health
```javascript
{
  repRange: [12, 20],
  setsPerMuscle: 'low',
  intensity: 'low',            // 50-65% 1RM
  restPeriods: 'short',
  exerciseVariety: 'high',
  frequency: 'high',           // Daily mobility okay
  tempoEmphasis: true,         // Controlled eccentrics
  progressionModel: 'rom'      // Increase range of motion
}
```

### 5.3 Goal + Age + Injury Matrix

The system must handle combinations:

**Example: 60-year-old, hip pain, weight loss goal**

```javascript
// Resulting prescription:
{
  cardio: ['walking', 'cycling', 'swimming'],  // No running
  exercises: filterForHip(filterForAge('C', exercises)),
  volume: baseVolume * 0.7 * 0.8,  // Age + injury reductions
  frequency: 3,  // days/week
  addons: ['daily_hip_mobility', 'balance_work'],
  avoid: ['running', 'jumping', 'deep_squats', 'heavy_deadlifts']
}
```

---

## 6. Adaptive Engine

### 6.1 Current Capabilities

- MEV/MAV/MRV volume tracking per muscle group
- Weekly volume adjustments (+/- sets)
- Exercise cycling (weekly rotation)
- Basic deload recommendation

### 6.2 Target Capabilities

#### Fatigue Modeling
```javascript
{
  // Inputs
  sleepQuality: 1-5,
  perceivedSoreness: 1-5,
  lifeStress: 1-5,
  missedWorkouts: count,
  
  // Calculated
  acuteFatigue: rollingAverage(7),
  chronicFatigue: rollingAverage(28),
  fatigueRatio: acute / chronic,  // >1.3 = overreaching
  
  // Outputs
  volumeModifier: calculateFromFatigue(),
  deloadRecommendation: fatigueRatio > 1.5,
  intensityCap: fatigueRatio > 1.3 ? 0.85 : 1.0
}
```

#### Daily Readiness Score
```javascript
function calculateReadiness(user) {
  const sleepScore = user.lastNightSleep / user.sleepGoal;
  const recoveryScore = 1 - (user.soreness / 5);
  const stressScore = 1 - (user.stress / 5);
  const streakBonus = user.streak > 7 ? 1.05 : 1.0;
  
  return (sleepScore * 0.4 + recoveryScore * 0.35 + stressScore * 0.25) * streakBonus;
}

// Readiness affects:
// < 0.6: Suggest rest or light day
// 0.6-0.8: Reduce volume 20%
// 0.8-1.0: Normal programming
// > 1.0: Allow intensity increase
```

#### Auto-Deload Triggers

Deload recommended when ANY:
- Fatigue ratio > 1.5 for 3+ days
- Performance declining 2+ consecutive sessions
- User reports illness/injury
- 4-6 weeks since last deload (depending on age)
- Readiness score < 0.6 for 3+ consecutive days

### 6.3 Block Periodization

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│ Accumulation │ → │ Intensification │ → │   Realization  │ → │  Deload  │
│   3-4 weeks  │    │    2-3 weeks    │    │    1-2 weeks   │    │  1 week  │
│  High volume │    │  Moderate vol   │    │   Low volume   │    │  50% vol │
│  Mod intensity│    │ High intensity  │    │  Peak intensity │    │ Low int  │
└──────────────┘    └──────────────────┘    └────────────────┘    └──────────┘
```

---

## 7. Closed-Loop Training System

### 7.1 Core Concept: The TrainingState Object

Everything updates a single internal `TrainingState` for each user. This object is what the engine reads from and writes to. Every log (exercise, run, food) updates internal state and changes the next prescription.

```javascript
TrainingState = {
  // Per-muscle-group training load
  muscleLoad: {
    chest: { volume7d: number, volume14d: number, trend: 'up'|'flat'|'down' },
    back: { ... },
    // ... all muscle groups
  },
  
  // Per-movement-pattern load
  patternLoad: {
    squat: { volume7d: number, fatigue: number },
    hinge: { ... },
    horizontal_push: { ... },
    vertical_push: { ... },
    pull: { ... },
    carry: { ... },
    lunge: { ... }
  },
  
  // Cardio load
  cardioLoad: {
    running: { weeklyVolume: number, avgIntensity: number, terrain: string },
    nonRunning: { type: string, volume: number }
  },
  
  // Recovery / fatigue proxies
  recovery: {
    dailyReadiness: number,      // 0-100
    sleepQuality: number,        // 1-5
    soreness: number,            // 1-5
    subjectiveFatigue: number,   // 1-5
    rpe7dAvg: number             // Rolling average RPE
  },
  
  // Nutrition state
  nutrition: {
    calorieBalance7d: number,    // Actual vs target (negative = deficit)
    proteinAdherence7d: number,  // % of target hit
    targetDeficit: number        // Planned deficit/surplus
  },
  
  // Injury flags
  injuries: {
    active: [{ id: string, severity: 'mild'|'moderate'|'severe', daysSinceFlare: number }],
    recentPainFlags: [{ joint: string, exercise: string, date: timestamp }]
  },
  
  // Goal + age context
  context: {
    goal: 'cut' | 'gain' | 'performance' | 'mobility' | 'maintenance',
    ageBand: 'A' | 'B' | 'C' | 'D',
    mrvMultiplier: number,
    mevMultiplier: number
  },
  
  // Timestamps
  lastUpdated: timestamp,
  lastWorkout: timestamp,
  lastDeload: timestamp
}
```

**Every time the user logs anything, update this object, then re-compute what "good" training looks like over the next few days.**

### 7.2 Intra-Workout Loop (Real-Time)

The session should be intelligent in real-time, not just day-to-day.

#### 7.2.1 Per-Set Logging

For each exercise performed, log:
- Planned reps, load, RIR/RPE target
- Actual reps, load, achieved RIR/RPE
- Set completion or failure
- Pain flags (e.g., "shoulder discomfort")

#### 7.2.2 Real-Time Decision Rules

```javascript
// Example decision logic during workout
function evaluateSet(planned, actual) {
  const rirDelta = actual.rir - planned.rir;
  
  if (rirDelta >= 3) {
    // User found it too easy (target 3 RIR, actual ~6 RIR)
    return {
      action: 'increase_load',
      modifier: 1.05,  // +5% next set
      note: 'Under-stimulated, adding intensity',
      updateState: { muscleGroup: 'under_mrv' }
    };
  }
  
  if (rirDelta <= -2 || actual.failed) {
    // User struggled (target 3 RIR, actual 0-1 RIR or failure)
    return {
      action: 'reduce_load_or_cut_set',
      modifier: 0.9,  // -10% or drop a set
      note: 'Approaching/exceeding MRV',
      updateState: { muscleGroup: 'at_mrv' }
    };
  }
  
  if (actual.painFlag) {
    // Pain reported
    return {
      action: 'swap_exercise',
      swapTo: findLowStressAlternative(actual.exercise, actual.painJoint),
      note: 'Pain flag - swapping to safer variant',
      updateState: { injury: 'increase_probability' }
    };
  }
  
  return { action: 'continue', note: 'On track' };
}
```

#### 7.2.3 Exercise Selection Within Workout

Define exercise blocks with varying flexibility:

| Block | Examples | Flexibility |
|-------|----------|-------------|
| **Primary** | Bench, Squat, Deadlift | Fixed in session |
| **Secondary** | Assistance movements | Flexible by slot |
| **Tertiary** | Accessories | Highly flexible |

Engine chooses next exercise based on:
- Muscle group fatigue (from earlier sets + TrainingState)
- Joint tolerance (injury data)
- Variety constraints (avoid repeating exact patterns)

**Example:** If bench performance tanks early and RPE is high:
- Keep main bench sets
- Switch accessories from heavy incline DB press to lighter cable fly + triceps pushdown
- Reduces joint stress and accumulated fatigue

### 7.3 Inter-Day / Inter-Week Loop

This is where MRV/MEV learning happens.

#### 7.3.1 Daily Aggregation

Each day:

1. **Aggregate yesterday's training:**
   - Volume per muscle group (sets × difficulty)
   - Cardio load (distance, pace, TRIMP-like metric)

2. **Compare planned vs actual:**
   - Were sets missed?
   - Did RPE run higher than expected?

3. **Update per-muscle MRV/MEV estimates:**
   - Consistently recovers well + progresses → slowly raise MRV
   - Frequently feels wrecked / underperforms → lower MRV

```javascript
function updateMRVEstimate(muscleGroup, weekData) {
  const performance = weekData.performanceTrend;  // 'up', 'flat', 'down'
  const recovery = weekData.avgRecoveryScore;      // 0-100
  const volumeVsMRV = weekData.volume / muscleGroup.currentMRV;
  
  if (performance === 'up' && recovery > 70 && volumeVsMRV > 0.9) {
    // Progressing, recovering well at near-MRV volume
    muscleGroup.currentMRV *= 1.05;  // Raise MRV 5%
  }
  
  if (performance === 'down' && recovery < 50) {
    // Regressing, not recovering
    muscleGroup.currentMRV *= 0.9;   // Lower MRV 10%
  }
  
  // Clamp to reasonable bounds
  muscleGroup.currentMRV = clamp(muscleGroup.currentMRV, muscleGroup.mevFloor, muscleGroup.mrvCeiling);
}
```

#### 7.3.2 Next-Week Planning

When building next microcycle, engine:

**Prioritizes muscles with:**
- Good performance trend
- No pain flags
- Lower cumulative fatigue

**De-emphasizes muscles with:**
- Plateau or regression at same/higher volume
- Pain or persistent soreness

**Each week becomes a "small experiment" that refines personal MRV/MEV, not just generic tables.**

### 7.4 Cross-Domain Feedback

Runs + Food affect lifting + cardio prescription. No silos.

#### 7.4.1 Nutrition → Training

Use 7-10 day rolling window:

```javascript
function adjustForNutrition(trainingState) {
  const calorieBalance = trainingState.nutrition.calorieBalance7d;
  const targetDeficit = trainingState.nutrition.targetDeficit;
  const proteinAdherence = trainingState.nutrition.proteinAdherence7d;
  
  // Deeper deficit than planned
  if (calorieBalance < targetDeficit - 300) {
    return {
      volumeModifier: 0.85,      // Reduce volume 15%
      intensityCap: 0.9,         // Cap intensity at 90%
      deloadThreshold: 'lower',  // Earlier deload if fatigued
      note: 'Deep deficit detected - conserving recovery'
    };
  }
  
  // In surplus and hitting protein
  if (calorieBalance > 0 && proteinAdherence > 0.9) {
    return {
      volumeModifier: 1.05,      // Can push volume slightly
      note: 'Surplus + protein adherence - supporting growth'
    };
  }
  
  // Consistent low protein
  if (proteinAdherence < 0.7) {
    return {
      volumeModifier: 0.9,
      intensityBias: 'higher',   // Maintain strength, lower volume
      note: 'Low protein - reducing volume, maintaining intensity'
    };
  }
  
  return { volumeModifier: 1.0 };
}
```

#### 7.4.2 Running / Cardio → Lifting

For each day with running:

```javascript
function calculateLegFatigueFromRun(run) {
  // Simple point system (can evolve to TRIMP)
  let fatigue = 0;
  
  fatigue += run.distance * 10;                    // Base distance load
  fatigue += (run.pace < 8) ? run.distance * 5 : 0; // Fast pace penalty
  fatigue += (run.type === 'tempo' || run.type === 'interval') ? 20 : 0;
  fatigue += (run.type === 'long') ? 15 : 0;
  
  return fatigue;
}

function adjustLiftingForCardio(trainingState, todaysRun) {
  const legFatigue = calculateLegFatigueFromRun(todaysRun);
  
  if (legFatigue > 50) {
    return {
      lowerBodyVolume: 0.7,      // Reduce 30%
      swapHighImpact: true,       // No plyos, heavy eccentrics
      preferMachines: true,       // Machines over free weights
      addMobility: true,
      note: 'High run fatigue - protecting legs'
    };
  }
  
  // Unplanned long run
  if (todaysRun.unplanned && todaysRun.type === 'long') {
    return {
      removeHeavySquats: true,
      removeHeavyLunges: true,
      insertMobility: true,
      insertLightPosteriorChain: true,
      note: 'Unplanned long run - adjusting session'
    };
  }
  
  return {};
}

// Reverse: no cardio but weight loss goal
function checkCardioDeficit(trainingState) {
  if (trainingState.context.goal === 'cut' && 
      trainingState.cardioLoad.running.weeklyVolume < 5) {
    return {
      prescribeCardio: true,
      type: 'low_intensity',  // Walks, incline treadmill
      frequency: 3,
      note: 'Weight loss goal with low cardio - adding LISS'
    };
  }
}
```

### 7.5 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER LOGS                                │
│  • Workout sets + RPE/RIR                                      │
│  • Runs / cardio                                               │
│  • Food (calories + protein)                                   │
│  • Readiness / soreness                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   UPDATE TrainingState                          │
│  • Muscle-level volume and fatigue                             │
│  • Run-induced leg fatigue                                     │
│  • Nutrition-induced recovery capacity                         │
│  • Injury probability and severity                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ENGINE RE-COMPUTES                           │
│  • Next session's exercises, sets, loads                       │
│  • Decision: push volume / maintain / deload / swap            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORKOUT SESSION                              │
│  • Intra-session adjustments based on actual performance       │
│  • Real-time pain/fatigue responses                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WEEKLY REFIT                               │
│  • Refit personal MRV/MEV estimates per muscle group           │
│  • Refit per energy system                                     │
│  • Adjust templates for following week                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              └──────────────► Back to USER LOGS
```

**This forms the closed loop:** log → update state → change prescription

Strength, cardio, and nutrition all feed the same decision engine.

### 7.6 Implementation Priority

| Component | Priority | Complexity | Dependencies |
|-----------|----------|------------|--------------|
| TrainingState object | P0 | Medium | User profile |
| Daily aggregation | P0 | Low | TrainingState |
| Volume → MRV/MEV update | P1 | Medium | Aggregation |
| Intra-workout RPE checks | P1 | Medium | Set logging |
| Nutrition → training mods | P2 | Low | Food logging |
| Running → lifting mods | P2 | Low | Run logging |
| Weekly refit algorithm | P2 | High | 2+ weeks data |
| Pain flag → swap | P1 | Medium | Injury system |

---

## 8. Research Foundation

### 7.1 Core References

**Volume/Intensity:**
- Schoenfeld, B. J. (2010). The mechanisms of muscle hypertrophy. *Journal of Strength and Conditioning Research*
- Israetel, M., Hoffmann, J., & Smith, C. W. (2015). *Scientific Principles of Strength Training*
- Zourdos, M. C., et al. (2016). RPE and velocity-based training. *Journal of Strength and Conditioning Research*

**Age-Related Training:**
- Peterson, M. D., et al. (2010). Resistance exercise for muscular strength in older adults. *Ageing Research Reviews*
- Fragala, M. S., et al. (2019). Resistance training for older adults. *Journal of Strength and Conditioning Research*

**Injury Rehabilitation:**
- Littlewood, C., et al. (2015). Exercise for rotator cuff tendinopathy. *British Journal of Sports Medicine*
- Rio, E., et al. (2015). Tendon neuroplastic training. *British Journal of Sports Medicine*

**Nutrition/Protein:**
- Morton, R. W., et al. (2018). Protein intake for optimal muscle. *British Journal of Sports Medicine*
- Schoenfeld, B. J., & Aragon, A. A. (2018). Protein timing relevance. *Journal of the International Society of Sports Nutrition*

### 7.2 Internal Standards

Every recommendation must reference:
1. A known accepted training principle
2. A validated volume range (MEV/MAV/MRV)
3. A published rehab guideline or physio consensus
4. Age-appropriate modifications from literature

**No bro-science. No unsubstantiated claims.**

---

## 9. Development Roadmap

### Phase 1: Foundation (Weeks 1-3)
**Goal:** Build the data structures everything else depends on.

- [ ] Define complete exercise tagging schema in config
- [ ] Add 150-200 exercises with full metadata
- [ ] Create injury profile system (top 10 injuries)
- [ ] Implement age band logic with MRV/MEV modifiers
- [ ] Build exercise substitution engine

**Deliverable:** Can ask "give me a bench press alternative for a 55-year-old with shoulder issues" and get a valid answer.

### Phase 2: Adaptive Engine (Weeks 4-5)
**Goal:** Make the engine actually adaptive.

- [ ] Implement fatigue modeling (acute/chronic)
- [ ] Build daily readiness scoring
- [ ] Create auto-deload trigger system
- [ ] Add age-weighted volume scaling
- [ ] Implement injury-aware workout generation

**Deliverable:** Workouts automatically adjust based on user state, age, and injuries.

### Phase 3: Goal Integration (Weeks 6-7)
**Goal:** Different goals produce meaningfully different programs.

- [ ] Implement goal-specific programming templates
- [ ] Build goal + age + injury matrix logic
- [ ] Add conditioning protocols for weight loss
- [ ] Create mobility-focused programming
- [ ] Implement progressive overload models per goal

**Deliverable:** A 28-year-old strength athlete and a 58-year-old focusing on mobility get completely different experiences.

### Phase 4: Testing & Refinement (Weeks 8-10)
**Goal:** Validate with real users.

- [ ] Alpha test with 3-5 diverse users
- [ ] Log all engine decisions for debugging
- [ ] Track where prescriptions break down
- [ ] Refine injury/age logic based on feedback
- [ ] Performance optimization

**Deliverable:** Confident the system works across demographics.

### Phase 5: Advanced Features (Future)
**Goal:** ML-ready, clinic-ready.

- [ ] Machine learning layer for personalization
- [ ] Doctor/PT onboarding flow
- [ ] Wearable integration (HRV, sleep)
- [ ] Progress photos with body composition estimates
- [ ] Multi-language support

---

## 10. Data Models

### 9.1 User Profile (Extended)

```javascript
{
  // Basic
  id: string,
  email: string,
  createdAt: timestamp,
  
  // Demographics
  age: number,
  sex: 'male' | 'female' | 'other',
  weight: number,
  height: number,
  
  // Training background
  trainingAge: number,  // Years of consistent training
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  rpeFamiliarity: boolean,
  
  // Goals
  primaryGoal: 'strength' | 'muscle_growth' | 'weight_loss' | 'maintenance' | 'mobility',
  secondaryGoal: string | null,
  
  // Injuries
  activeInjuries: [
    { id: string, severity: 'mild' | 'moderate' | 'severe', startDate: date }
  ],
  injuryHistory: [...],
  
  // Constraints
  availableDays: number,
  sessionDuration: number,  // minutes
  equipment: ['barbell', 'dumbbell', 'machines', 'cables', 'bodyweight'],
  
  // Calculated
  ageBand: 'A' | 'B' | 'C' | 'D',
  mrvModifier: number,
  currentBlock: 'accumulation' | 'intensification' | 'realization' | 'deload'
}
```

### 9.2 Workout Prescription

```javascript
{
  date: string,
  userId: string,
  
  // Context
  dayType: 'upper_strength' | 'lower_power' | etc,
  blockPhase: string,
  readinessScore: number,
  
  // Prescription
  exercises: [
    {
      id: string,
      name: string,
      sets: number,
      reps: [min, max],
      rpe: number,
      restSeconds: number,
      notes: string,  // e.g., "Slow eccentric", "Pause at bottom"
      
      // Why this exercise
      reasoning: {
        original: string | null,  // If swapped, what was it
        swapReason: string | null,  // Why swapped
        ageAdjusted: boolean,
        injuryAdjusted: boolean
      }
    }
  ],
  
  // Warmup
  warmup: [...],
  
  // Rehab/prehab
  rehabExercises: [...],
  
  // Metadata
  estimatedDuration: number,
  totalVolume: number,
  fatigueScore: number
}
```

---

## Open Questions

1. **Training age estimation:** How do we assess this without asking "how many years have you trained?" (users lie/misestimate)

2. **Injury severity:** Self-reported severity is unreliable. Should we use movement screens?

3. **Equipment detection:** Can we infer available equipment from exercise history?

4. **Feedback loops:** How quickly should the engine adjust? Daily? Weekly?

5. **Edge cases:** What if someone has 4+ injuries? At what point do we recommend PT instead?

---

## Success Metrics

| Metric | Current | Target v2 |
|--------|---------|-----------|
| D7 retention | Unknown | 50% |
| D30 retention | Unknown | 35% |
| Workout completion rate | Unknown | 80% |
| User-reported satisfaction | Unknown | 4.5/5 |
| Injury-related complaints | Unknown | <5% of feedback |
| Age 50+ usability | Not tested | Equal satisfaction to younger users |

---

*This document is a living specification. Update as decisions are made.*


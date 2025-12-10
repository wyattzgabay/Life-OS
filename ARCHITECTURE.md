# Life OS - Architecture & Systems Report

## Table of Contents
1. [System Overview](#system-overview)
2. [Data Architecture](#data-architecture)
3. [Running Engine](#running-engine)
4. [Injury Intelligence System](#injury-intelligence-system)
5. [Strength Training Engine](#strength-training-engine)
6. [Nutrition System](#nutrition-system)
7. [XP & Gamification](#xp--gamification)
8. [Edge Cases & Known Issues](#edge-cases--known-issues)
9. [Gaps & Recommended Fixes](#gaps--recommended-fixes)

---

## System Overview

### File Structure
```
js/
├── config.js          # Static configuration (workouts, levels, multipliers)
├── state.js           # Data persistence (localStorage → IndexedDB → Firebase)
├── app.js             # Main application controller
├── utils.js           # Helper functions
├── components/
│   ├── cardio-logger.js    # Run logging + pain tracking
│   ├── lift-logger.js      # Strength exercise logging
│   ├── recovery-logger.js  # Mobility/recovery logging
│   └── workout.js          # Workout rendering
├── engines/
│   ├── injury-intelligence.js  # Pain analysis → injury detection → adjustments
│   └── injury-database.js      # Pain regions + injury definitions
├── ui/
│   ├── daily.js       # Today view
│   ├── running.js     # Running dashboard + prescription
│   ├── stats.js       # Analytics
│   └── ...
└── state/
    ├── running.js     # Running-specific state methods
    └── workouts.js    # Workout-specific state methods
```

### Data Flow
```
User Action → Logger Component → State.js → Save Pipeline
                                              ↓
                            localStorage (immediate)
                                              ↓
                            IndexedDB (500ms debounce)
                                              ↓
                            Firebase Cloud (5s debounce)
```

---

## Data Architecture

### State._data Structure
```javascript
{
  version: 1,
  profile: { startWeight, height, age },
  goals: { targetWeight, dailyProtein, dailyCalories, tdee },
  stats: { totalXP, skillXP: {strength, discipline, nutrition, recovery}, bestStreak },
  
  // Daily data
  dayData: { [dateKey]: { weight, calories, protein, exercises, runDistance, ... } },
  
  // Running
  running: { goal, injuries, weekNumber, startDate, baseline, vdot, currentPhase },
  runLog: [{ date, distance, time, pace, effort, type, pain, painDetails }],
  
  // Cardio (includes cycling, swimming, etc.)
  cardioLog: [{ type, date, distance, duration, effort, pain, painDetails }],
  
  // Strength
  liftHistory: { [exerciseName]: [{ date, sets, volume, estimated1RM }] },
  personalRecords: { [exerciseName]: { weight, reps, estimated1RM, date } },
  
  // Nutrition
  meals: { [dateKey]: [{ time, foods, macros, quality }] },
  alcoholLog: [{ date, drinks, type }],
  
  // Reading
  reading: { library: [], completedBooks: [], yearlyGoal },
  
  // Misc
  exerciseWeek: 0,  // Cycles 0-3 for exercise variations
  lockedWorkouts: { [dateKey]: { exercises, timestamp } },
}
```

### Data Protection (NEW)
```javascript
// Weighted score system prevents overwriting valuable data
getDataScore(data) {
  score += data.stats.totalXP;              // 1 point per XP
  score += liftSessions * 100;               // 100 points per lift session
  score += runEntries * 50;                  // 50 points per run
  score += daysWithData * 10;                // 10 points per day
  score += hasProfile ? 50 : 0;              // 50 points for profile
  return score;
}

// Cloud sync only overwrites if cloud has 100+ more points
if (cloudScore > localScore + 100) { /* accept cloud */ }
```

---

## Running Engine

### Distance Calculation Pipeline
```
Base Distance → Goal Multiplier → Week Progression → Injury Reduction → Final
    2.5mi    ×      0.65 (5K)  ×       1.1        ×     0.7 (mod PF)   = 1.24mi
```

### Goal Multipliers
| Goal | Multiplier | Easy Run | Long Run |
|------|------------|----------|----------|
| 5K | 0.65 | 1.6mi | 3.3mi |
| 10K | 1.0 | 2.5mi | 5.0mi |
| Half | 1.3 | 3.3mi | 6.5mi |
| Marathon | 1.6 | 4.0mi | 8.0mi |
| Casual | 0.8 | 2.0mi | 4.0mi |

### Weekly Progression
- Week 1-2: 1.0x base
- Week 3-4: 1.1x
- Week 5-6: 1.2x
- Week 7+: 1.3x (capped)

### Run Type Schedule (BASE_WEEK)
| Day | Run Type | Lift Type | Science |
|-----|----------|-----------|---------|
| Sun | Long | Rest/Mobility | 48hrs post-Friday legs |
| Mon | Easy (opt) | Upper Strength | Recovery blood flow |
| Tue | REST | Lower Power | Heavy squats need full energy |
| Wed | Easy | Upper Hypertrophy | Upper day, easy run OK |
| Thu | Tempo | Core/Mobility | 48hrs post-Tuesday legs |
| Fri | REST | Lower Hypertrophy | Volume legs, no running |
| Sat | REST | Recovery | Prep for Sunday long run |

### Edge Cases
1. **No goal set**: `running.goal === null` → No runs prescribed, shows setup prompt
2. **Rest day with unscheduled run**: Run still logs, shows in stats, but no prescription
3. **Goal change**: Resets weekNumber to 1, creates backup first
4. **VDOT not calculated**: Falls back to time-based paces from VDOT_PACES table

---

## Injury Intelligence System

### Two Systems (⚠️ ISSUE: Currently separate)

#### 1. Old System (CONFIG.RUNNING.INJURIES)
```javascript
// Simple injury list with distance multipliers
{ id: 'plantar', name: 'Plantar Fasciitis', distanceMultiplier: 0.75 }
```
- Stored in: `running.injuries[]`
- Used by: Old injury protocol display
- **NOT connected to pain tracking**

#### 2. New System (InjuryIntelligence)
```javascript
// Comprehensive injury detection from pain patterns
{
  plantar_fasciitis: {
    severity: { mild, moderate, severe },
    mileageReduction: 0.1 / 0.3 / 0.5,
    exercises: ['plantar_roll', 'calf_stretch', ...],
    avoidTypes: ['tempo', 'intervals']
  }
}
```
- Detected from: `cardioLog[].painDetails`
- Uses: Pattern matching + frequency analysis
- **NOW connected to distance calculation** (fixed this session)

### Pain Detection Flow
```
User logs run → Selects "Pain during run" → Drill-down:
  Body Part (foot, ankle, knee, hip...)
    → Sub-region (heel, arch, front, back...)
      → Timing (morning, during run, after run, sudden sharp...)
        → Severity (mild, moderate, severe)
          → Maps to injury via InjuryDatabase.PAIN_REGIONS
```

### Injury Detection Algorithm
```javascript
analyzeInjuries() {
  1. Get all cardioLog entries with pain
  2. Group by pain location (e.g., 'foot_heel')
  3. For each location, find matching injuries from KNOWN_INJURIES
  4. Calculate severity based on:
     - Frequency (>3 occurrences = escalate)
     - User-reported severity
     - Progression signals (spreading to related areas)
  5. Return array sorted by severity (worst first)
}
```

### Mileage Reduction by Severity
| Injury | Mild | Moderate | Severe |
|--------|------|----------|--------|
| Plantar Fasciitis | 10% | 30% | 50% |
| Achilles Tendinitis | 15% | 40% | 70% |
| Shin Splints | 20% | 40% | 60% |
| Runner's Knee | 10% | 30% | 50% |
| IT Band Syndrome | 20% | 40% | 60% |
| Hamstring Strain | 15% | 40% | 70% |

### Recovery Exercise Prescription
```javascript
getTodaysRecoveryExercises() {
  // Caps based on severity (prevents overwhelm with multiple injuries)
  mild: 3 exercises max
  moderate: 4 exercises max  
  severe: 5 exercises max
  
  // Prioritization
  1. Highest XP exercises first
  2. Priority badge for first 2 if severe
  3. Filter out duplicates across injuries
  4. Skip "See a Professional" from daily list
}
```

---

## Strength Training Engine

### Weekly Structure
- **4 lift days**: Mon (Upper Str), Tue (Lower Power), Wed (Upper Hyp), Fri (Lower Hyp)
- **2 cardio focus**: Sun (Long Run), Thu (Tempo Run)
- **1 recovery**: Sat (Mobility)

### Exercise Cycling
```javascript
exerciseWeek: 0-3  // Increments weekly
// Week 0: Base exercises
// Week 1: Variation set 1
// Week 2: Variation set 2
// Week 3: Variation set 3
// Week 4: Back to 0
```

### Volume Tracking (Renaissance Periodization)
| Muscle | MEV | MAV | MRV |
|--------|-----|-----|-----|
| Chest | 8 | 14 | 20 |
| Back | 8 | 16 | 25 |
| Shoulders | 6 | 14 | 22 |
| Quads | 6 | 14 | 20 |
| Hamstrings | 4 | 10 | 16 |

### PR Detection
```javascript
// Estimated 1RM = weight × (1 + 0.0333 × reps)
if (new1RM > personalRecords[exercise].estimated1RM) {
  // Award PR bonus XP
  // Show celebration animation
  // Store new PR
}
```

### Locked Workouts (prevents exercise switching)
```javascript
// When workout first viewed, exercises are "locked" for the day
lockedWorkouts: {
  '2024-12-10': {
    exercises: [...],
    timestamp: 1702234567890
  }
}
// Prevents: Different exercises showing on different devices
```

---

## Nutrition System

### AI Food Logging
```javascript
// User describes meal in natural language
"Had a chicken breast, rice, and broccoli for lunch"
  → AI parses to: { protein: 45g, carbs: 55g, fat: 5g, calories: 445 }
  → Quality assessment: "Whole food"
  → Leucine estimate: ~3.2g
```

### Macro Calculations
```javascript
TDEE = BMR × Activity Factor
Deficit/Surplus = TDEE - targetCalories
Protein = 0.8-1g per lb bodyweight (adjustable)
```

### Food Quality Ratings
- **Whole**: Fresh/unprocessed (guacamole, grilled chicken)
- **Moderate**: Some processing (whole wheat bread)
- **Processed**: High processing (chips, candy)

---

## XP & Gamification

### Daily XP Breakdown (target: 80-120 XP/day)
| Action | XP | Max/Day |
|--------|-----|---------|
| Log weight | 5 | 5 |
| AI food log | 3/meal | 15 |
| Protein goal | 10 | 10 |
| Run complete | 15-30 | 30 |
| Workout exercises | 5-18 each | ~80 |
| Reading session | 8 | 15 |
| Recovery exercises | 5-10 each | ~30 |
| **TOTAL** | | ~185 max |

### Streak System
| Days | Multiplier |
|------|------------|
| 0-2 | 1.0x |
| 3-6 | 1.1x |
| 7-13 | 1.25x |
| 14-29 | 1.5x |
| 30+ | 2.0x |

### Level Progression
| Level | XP | Title | ~Days to Reach |
|-------|-----|-------|----------------|
| 1 | 0 | Initiate | 0 |
| 2 | 300 | Novice | 3-4 |
| 3 | 800 | Apprentice | 8-10 |
| 5 | 2,500 | Expert | ~25 |
| 10 | 20,000 | Legend | ~200 |

---

## Edge Cases & Known Issues

### ⚠️ Critical
1. **Data loss on goal change**: Previously could trigger cloud sync that overwrote local data. **FIXED** this session with data score protection.

2. **Dual injury systems**: Old `running.injuries[]` and new `InjuryIntelligence` were not connected. **PARTIALLY FIXED** - now `getRunInfo()` checks InjuryIntelligence first.

### ⚠️ Moderate
3. **Modal scroll lock not released**: Clicking backdrop to close modal didn't restore body scroll. **FIXED** this session.

4. **Run distance not updating on goal change**: Goal multiplier wasn't being recalculated. **FIXED** this session.

5. **Exercise variation switching mid-day**: If exerciseWeek changes while workout open, exercises could change. **FIXED** with lockedWorkouts system.

### ⚠️ Minor
6. **No VDOT recalculation**: VDOT is set once and never updated based on recent runs.

7. **Alcohol recovery timer**: Shows "48 hours until full recovery" but doesn't account for multiple drinks.

8. **Reading library empty state**: No visual guidance when library is empty.

---

## Gaps & Recommended Fixes

### High Priority

#### 1. Unify Injury Systems
```javascript
// CURRENT: Two separate injury tracking systems
running.injuries[]  // Old CONFIG-based
InjuryIntelligence  // New pain-pattern based

// RECOMMENDED: Deprecate old system entirely
// - Remove running.injuries from state
// - Always use InjuryIntelligence
// - Migrate old CONFIG.RUNNING.INJURIES protocols into InjuryIntelligence
```

#### 2. VDOT Auto-Update
```javascript
// CURRENT: VDOT set once during onboarding
// RECOMMENDED: Recalculate after every run
recalculateVDOT() {
  const recentRuns = runLog.slice(-10);
  const bestEffort = findBestEffort(recentRuns);
  if (newVDOT > current VDOT) {
    running.vdot = newVDOT;
    notify("Your fitness improved! New VDOT: " + newVDOT);
  }
}
```

#### 3. Training Phase Auto-Progression
```javascript
// CURRENT: Phase is static
// RECOMMENDED: Auto-progress based on weeks
getPhase(weekNumber, totalWeeks) {
  const percent = weekNumber / totalWeeks;
  if (percent < 0.35) return 'base';
  if (percent < 0.7) return 'build';
  if (percent < 0.9) return 'peak';
  return 'taper';
}
```

### Medium Priority

#### 4. Run Type Blocking
```javascript
// CURRENT: Injury avoidTypes is calculated but not enforced
// RECOMMENDED: Actually block/swap run types
if (adjustments.avoidTypes.includes(todaysRun.type)) {
  // Convert tempo → easy
  // Show warning: "Tempo run converted to easy due to [injury]"
}
```

#### 5. Progressive Overload Suggestions
```javascript
// CURRENT: Just tracks history
// RECOMMENDED: Suggest weight increases
if (lastSession.allSetsComplete && effort < 8) {
  suggest: "Increase weight by 5lbs next session"
}
```

#### 6. Week-over-Week Mileage Cap
```javascript
// CURRENT: No 10% rule enforcement
// RECOMMENDED: Warn if weekly mileage increases >10%
const lastWeekMiles = getWeeklyMileage(weekAgo);
const thisWeekTarget = getTotalWeeklyPrescription();
if (thisWeekTarget > lastWeekMiles * 1.1) {
  warn("Mileage increase exceeds 10% rule - injury risk elevated");
}
```

### Low Priority

#### 7. Rest Day Detection
```javascript
// CURRENT: Hardcoded rest days (Tue, Fri, Sat)
// RECOMMENDED: Dynamic based on fatigue/sleep/HRV
```

#### 8. Nutrition-Training Integration
```javascript
// CURRENT: Separate systems
// RECOMMENDED: 
// - Pre-workout carb timing suggestions
// - Post-workout protein reminders
// - Deficit warning before hard run days
```

#### 9. Social/Accountability Features
- Workout sharing
- Friend challenges
- Leaderboards

---

## Science Citations

### Running
- **Hickson (1980)**: Interference effect - concurrent training reduces strength gains
- **Wilson et al. (2012)**: Meta-analysis on concurrent training interference
- **Bishop et al. (2008)**: Training order effects - run before lift for endurance focus
- **Bompa & Haff (2009)**: Periodization theory, 48hr recovery principle

### Strength
- **Schoenfeld et al. (2017)**: 10-20 sets/week optimal for hypertrophy
- **Israetel et al. (2019)**: MEV/MAV/MRV volume landmarks
- **Brzycki (1993)**: 1RM estimation formula

### Injury
- **DiGiovanni et al. (2003)**: Plantar fascia stretching protocols
- **Alfredson (1998)**: Eccentric heel drops for Achilles
- **Fredericson et al. (2000)**: Hip strengthening for IT band

### Nutrition
- **Parr et al. (2014)**: Alcohol reduces MPS by 37%
- **Morton et al. (2018)**: Protein requirements for athletes
- **Phillips & Van Loon (2011)**: Leucine threshold for MPS

---

## Quick Reference: Key Functions

| What | Where | Function |
|------|-------|----------|
| Get today's run | ui/running.js | `getTodaysRun(running)` |
| Calculate run distance | ui/running.js | `getRunInfo(run, running)` |
| Detect injuries | engines/injury-intelligence.js | `analyzeInjuries()` |
| Get training adjustments | engines/injury-intelligence.js | `getTrainingAdjustments()` |
| Get recovery exercises | engines/injury-intelligence.js | `getTodaysRecoveryExercises()` |
| Log a run | components/cardio-logger.js | `save()` |
| Log a lift | components/lift-logger.js | `save()` |
| Calculate XP | state.js | `addXP(amount, skill)` |
| Save all data | state.js | `save()` |
| Get workout | utils.js | `getTodaysWorkout()` |

---

*Last updated: December 10, 2024*


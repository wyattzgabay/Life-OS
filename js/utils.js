/**
 * UTILS.JS
 * Calculation utilities - TDEE, predictions, streaks, levels
 * Pure functions, no state modification
 */

const Utils = {
    // ==========================================
    // NUTRITION CALCULATIONS
    // ==========================================

    /**
     * Calculate TDEE using Mifflin-St Jeor equation
     * @param {number} weightLbs - Weight in pounds
     * @param {number} heightInches - Height in inches
     * @param {number} age - Age in years
     * @param {string} activity - Activity level
     * @returns {number} TDEE in calories
     */
    calculateTDEE(weightLbs, heightInches, age, activity = 'moderate') {
        // Convert to metric
        const weightKg = weightLbs * 0.453592;
        const heightCm = heightInches * 2.54;
        
        // Mifflin-St Jeor (for men)
        const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        
        // Activity multipliers
        const multipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55, // Our program (4 lift + 2 cardio)
            active: 1.725,
            veryActive: 1.9,
        };
        
        return Math.round(bmr * (multipliers[activity] || 1.55));
    },

    /**
     * Calculate nutrition targets based on goals
     * Science-based macro split:
     * - Protein: 1g per lb target weight (for muscle retention during cut)
     * - Fats: 0.3-0.4g per lb bodyweight (hormone health minimum)
     * - Carbs: Fill remaining calories (fuel for training)
     * 
     * @param {number} currentWeight - Current weight in lbs
     * @param {number} targetWeight - Target weight in lbs
     * @param {number} heightInches - Height in inches
     * @param {number} age - Age in years
     * @returns {object} { tdee, calories, protein, carbs, fats, deficit, explanation }
     */
    calculateTargets(currentWeight, targetWeight, heightInches, age) {
        // Validate inputs - use sensible defaults if values seem wrong
        currentWeight = (currentWeight && currentWeight > 80 && currentWeight < 400) ? currentWeight : 180;
        targetWeight = (targetWeight && targetWeight > 80 && targetWeight < 400) ? targetWeight : 175;
        heightInches = (heightInches && heightInches > 48 && heightInches < 96) ? heightInches : 70;
        age = (age && age > 14 && age < 100) ? age : 28;
        
        const tdee = this.calculateTDEE(currentWeight, heightInches, age, 'moderate');
        const weightDiff = currentWeight - targetWeight;
        
        let calories, deficit, explanation, fatMultiplier;
        
        if (weightDiff > 5) {
            // Cutting - 500 cal deficit for ~1 lb/week
            deficit = 500;
            calories = tdee - deficit;
            explanation = `${deficit} cal deficit for ~1 lb/week loss`;
            fatMultiplier = 0.35; // Lower fats during cut (0.35g per lb)
        } else if (weightDiff < -5) {
            // Bulking - 300 cal surplus
            deficit = -300;
            calories = tdee + 300;
            explanation = `300 cal surplus for lean gains`;
            fatMultiplier = 0.4; // Higher fats during bulk
        } else {
            // Recomp - small deficit
            deficit = 200;
            calories = tdee - 200;
            explanation = `Small deficit for body recomposition`;
            fatMultiplier = 0.35;
        }
        
        // Don't go below 1500 calories
        calories = Math.max(1500, calories);
        
        // PROTEIN: 1g per lb of target weight (evidence-based for muscle retention)
        const protein = Math.round(targetWeight);
        const proteinCals = protein * 4;
        
        // FATS: 0.3-0.4g per lb bodyweight (minimum for hormones)
        const fats = Math.round(currentWeight * fatMultiplier);
        const fatCals = fats * 9;
        
        // CARBS: Fill remaining calories (fuel for training)
        const remainingCals = calories - proteinCals - fatCals;
        const carbs = Math.max(50, Math.round(remainingCals / 4)); // Minimum 50g carbs
        
        // Recalculate actual calories based on macros
        const actualCalories = proteinCals + fatCals + (carbs * 4);
        
        return { 
            tdee, 
            calories: actualCalories, 
            protein, 
            carbs, 
            fats, 
            deficit, 
            explanation,
            breakdown: `${protein}g P (${Math.round(proteinCals/actualCalories*100)}%) / ${carbs}g C (${Math.round(carbs*4/actualCalories*100)}%) / ${fats}g F (${Math.round(fatCals/actualCalories*100)}%)`
        };
    },

    // ==========================================
    // LEVEL CALCULATIONS
    // ==========================================

    /**
     * Get current level based on XP
     * @param {number} totalXP - Total XP earned
     * @returns {object} Level object { level, title, xp }
     */
    getLevel(totalXP) {
        let current = CONFIG.LEVELS[0];
        for (const level of CONFIG.LEVELS) {
            if (totalXP >= level.xp) {
                current = level;
            } else {
                break;
            }
        }
        return current;
    },

    /**
     * Get next level
     * @param {number} totalXP - Total XP earned
     * @returns {object} Next level object
     */
    getNextLevel(totalXP) {
        const current = this.getLevel(totalXP);
        const idx = CONFIG.LEVELS.findIndex(l => l.level === current.level) + 1;
        return CONFIG.LEVELS[idx] || CONFIG.LEVELS[CONFIG.LEVELS.length - 1];
    },

    /**
     * Get progress to next level (0-100)
     * @param {number} totalXP - Total XP earned
     * @returns {number} Progress percentage
     */
    getLevelProgress(totalXP) {
        const current = this.getLevel(totalXP);
        const next = this.getNextLevel(totalXP);
        
        if (current.level === next.level) return 100;
        
        const xpInLevel = totalXP - current.xp;
        const xpNeeded = next.xp - current.xp;
        
        return Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
    },

    // ==========================================
    // STREAK CALCULATIONS
    // ==========================================

    /**
     * Calculate streak based on a condition function
     * @param {function} checkFn - Function that takes dayData and returns boolean
     * @returns {number} Streak count
     */
    calculateStreak(checkFn) {
        const days = State.getAllDayKeys().reverse();
        let streak = 0;
        const today = State.getTodayKey();
        const yesterday = State.getDateKey(1);
        
        for (const day of days) {
            const dayData = State.getDayData(day);
            if (!dayData) continue;
            
            if (checkFn(dayData)) {
                // Count if it's today, yesterday, or we're already in a streak
                if (day === today || day === yesterday || streak > 0) {
                    streak++;
                }
            } else if (day !== today) {
                // Break the streak (but don't break on incomplete today)
                break;
            }
        }
        
        return streak;
    },

    /**
     * Get daily completion streak
     */
    getDailyStreak() {
        const minHabits = Math.ceil(CONFIG.HABITS.length / 2);
        return this.calculateStreak(day => {
            const habitsDone = Object.values(day.habits || {}).filter(Boolean).length;
            return habitsDone >= minHabits;
        });
    },

    /**
     * Get workout streak
     */
    getWorkoutStreak() {
        return this.calculateStreak(day => {
            return Object.values(day.exercises || {}).some(Boolean);
        });
    },

    /**
     * Get protein goal streak
     */
    getProteinStreak() {
        const goals = State.getGoals();
        const target = goals?.dailyProtein || 180;
        return this.calculateStreak(day => day.protein >= target);
    },

    /**
     * Get streak multiplier based on current streak
     * @param {number} streak - Current streak
     * @returns {number} Multiplier (1.0 - 2.0)
     */
    getStreakMultiplier(streak) {
        let mult = 1.0;
        for (const s of CONFIG.STREAK_MULTIPLIERS) {
            if (streak >= s.days) {
                mult = s.multiplier;
            }
        }
        return mult;
    },

    // ==========================================
    // ACCOUNTABILITY CALCULATIONS
    // ==========================================

    /**
     * Calculate accountability score (% of last N days completed)
     * @returns {number} Score 0-100
     */
    getAccountabilityScore() {
        const lookback = CONFIG.ACCOUNTABILITY.SCORE_LOOKBACK_DAYS;
        const days = State.getAllDayKeys().slice(-lookback);
        
        if (days.length === 0) return 100;
        
        let completed = 0;
        for (const day of days) {
            const dayData = State.getDayData(day);
            if (dayData?.completed) {
                completed++;
            }
        }
        
        return Math.round((completed / days.length) * 100);
    },

    /**
     * Check and process missed days
     * Should be called on app load
     */
    processMissedDays() {
        const today = State.getTodayKey();
        
        // Get user's start date - don't penalize days before they started
        let startDate = today;
        try {
            const createdAt = State._data?.createdAt;
            startDate = createdAt ? createdAt.split('T')[0] : today;
        } catch (e) {
            console.error('Error getting start date in processMissedDays:', e);
            return; // Don't process if we can't get start date
        }
        
        // Check last 7 days
        for (let i = 1; i <= 7; i++) {
            const dateKey = State.getDateKey(i);
            
            // Skip if this day is before the user started using the app
            if (dateKey < startDate) {
                continue;
            }
            
            const dayData = State.getDayData(dateKey);
            
            // Skip if no data, already processed, or is today
            if (!dayData || dayData.completed || dayData.failed || dateKey === today) {
                continue;
            }
            
            // Check if day was successful
            const habitsDone = Object.values(dayData.habits || {}).filter(Boolean).length;
            const exercisesDone = Object.values(dayData.exercises || {}).filter(Boolean).length;
            const minHabits = Math.ceil(CONFIG.HABITS.length / 2);
            
            const dayOfWeek = new Date(dateKey).getDay();
            const workout = CONFIG.WORKOUTS[dayOfWeek];
            const minExercises = Math.ceil(workout.exercises.length / 2);
            
            if (habitsDone >= minHabits && exercisesDone >= minExercises) {
                // Day was successful
                State.markDayCompleted(dateKey);
            } else {
                // Day failed
                State.markDayFailed(dateKey);
                
                // XP Decay
                State.removeXP(CONFIG.ACCOUNTABILITY.XP_DECAY_PER_MISSED_DAY);
                
                // Add debt if workout was missed
                if (exercisesDone < minExercises && workout.type === 'lift') {
                    State.addDebt(
                        workout.name,
                        dateKey,
                        workout.exercises.length - exercisesDone
                    );
                }
            }
        }
    },

    // ==========================================
    // PREDICTION CALCULATIONS
    // ==========================================

    /**
     * Calculate predicted weight based on logged data
     * @returns {object|null} { predicted, weeklyChange, avgCalories, tdee } or null if insufficient data
     */
    calculatePrediction() {
        const profile = State.getProfile();
        const goals = State.getGoals();
        const days = State.getAllDayKeys();
        
        if (days.length < 3 || !profile?.startWeight) return null;
        
        // Get recent data (last 14 days)
        const recentDays = days.slice(-14);
        let totalCalories = 0;
        let calorieCount = 0;
        let workoutCount = 0;
        
        for (const day of recentDays) {
            const dayData = State.getDayData(day);
            if (!dayData) continue;
            
            if (dayData.calories) {
                totalCalories += dayData.calories;
                calorieCount++;
            }
            if (Object.values(dayData.exercises || {}).some(Boolean)) {
                workoutCount++;
            }
        }
        
        if (calorieCount === 0) return null;
        
        const avgCalories = totalCalories / calorieCount;
        const workoutFreq = workoutCount / recentDays.length;
        
        // Estimate TDEE based on activity
        const estimatedTDEE = 1800 + (workoutFreq * 400) + 200;
        const dailyDeficit = estimatedTDEE - avgCalories;
        const weeklyChange = (dailyDeficit * 7) / 3500; // 3500 cal = 1 lb
        
        // Calculate expected weight
        const firstWeightDay = days.find(d => State.getDayData(d)?.weight);
        if (!firstWeightDay) return null;
        
        const startDate = new Date(firstWeightDay);
        const weeksPassed = (Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000);
        const predicted = profile.startWeight - (weeklyChange * weeksPassed);
        
        return {
            predicted: predicted.toFixed(1),
            weeklyChange: weeklyChange.toFixed(2),
            avgCalories: Math.round(avgCalories),
            estimatedTDEE: Math.round(estimatedTDEE),
        };
    },

    /**
     * Get current weight (most recent logged)
     * @returns {number|null}
     */
    getCurrentWeight() {
        const days = State.getAllDayKeys().reverse();
        for (const day of days) {
            const dayData = State.getDayData(day);
            if (dayData?.weight) return dayData.weight;
        }
        return null;
    },

    // ==========================================
    // SKILL LEVEL CALCULATIONS
    // ==========================================

    /**
     * Get skill level based on XP
     * @param {string} skillKey - Skill tree key
     * @returns {number} Level (1-5)
     */
    getSkillLevel(skillKey) {
        const tree = CONFIG.SKILL_TREES[skillKey];
        if (!tree) return 1;
        
        const xp = State.getSkillXP(skillKey);
        let level = 1;
        
        tree.nodes.forEach((node, idx) => {
            if (xp >= node.xpRequired) {
                level = idx + 1;
            }
        });
        
        return level;
    },

    // ==========================================
    // DATE UTILITIES
    // ==========================================

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @returns {object} { dayName, monthName, dayNum }
     */
    formatDate(date = new Date()) {
        if (typeof date === 'string') date = new Date(date);
        
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
        
        return {
            dayName: days[date.getDay()],
            monthName: months[date.getMonth()],
            dayNum: date.getDate(),
            dayOfWeek: date.getDay(),
        };
    },

    /**
     * Get today's workout from config (with exercise cycling AND volume adjustments)
     * @returns {object} Workout object with cycled exercises and smart volume adjustments
     */
    getTodaysWorkout() {
        const dayOfWeek = new Date().getDay();
        const baseWorkout = CONFIG.WORKOUTS[dayOfWeek];
        const todayKey = State.getTodayKey();
        
        if (!baseWorkout) {
            console.error('No workout found for day:', dayOfWeek);
            return { name: 'REST', type: 'rest', exercises: [] };
        }
        
        // Rest or cardio days don't need adjustments
        if (baseWorkout.type === 'rest' || baseWorkout.type === 'cardio') {
            return baseWorkout;
        }
        
        // Check if in deload week
        if (State._data?.isDeloadWeek) {
            return {
                ...baseWorkout,
                isDeload: true,
                deloadNote: 'DELOAD WEEK: Reduce weights 40-50%, cut volume in half',
                exercises: baseWorkout.exercises.map(ex => ({
                    ...ex,
                    targetSets: Math.ceil((ex.targetSets || 3) / 2),
                    deloadAdjusted: true
                }))
            };
        }
        
        // Get exercise week for cycling - LOCK IT for this day
        // This prevents exercises from changing mid-day
        let exerciseWeek = State.getExerciseWeek() || 0;
        
        // Check if we've already locked exercises for today
        const lockedWeek = State._data?.lockedExerciseWeek?.[todayKey];
        if (lockedWeek !== undefined) {
            exerciseWeek = lockedWeek;
        } else {
            // Lock the current exercise week for today
            if (!State._data.lockedExerciseWeek) {
                State._data.lockedExerciseWeek = {};
            }
            State._data.lockedExerciseWeek[todayKey] = exerciseWeek;
            State.save();
        }
        
        // Get volume adjustments
        const volumeAdjustments = this.getVolumeAdjustments();
        
        // Cycle through exercises if variations exist AND apply volume adjustments
        const cycledExercises = baseWorkout.exercises.map(exercise => {
            // Exercise is an object with name, detail, xp
            const exerciseName = exercise.name;
            const variations = CONFIG.EXERCISE_VARIATIONS?.[exerciseName];
            
            let resultExercise = exercise;
            
            // Apply cycling
            if (variations && variations.length > 0) {
                const cycleIndex = exerciseWeek % (variations.length + 1);
                if (cycleIndex !== 0) {
                    resultExercise = {
                        ...exercise,
                        name: variations[cycleIndex - 1],
                        originalName: exerciseName
                    };
                }
            }
            
            // Apply volume adjustments based on muscle group
            let exerciseMuscle = null;
            for (const [muscle, exercises] of Object.entries(CONFIG.MUSCLE_GROUPS || {})) {
                if (exercises.some(ex => ex.toLowerCase() === resultExercise.name.toLowerCase())) {
                    exerciseMuscle = muscle;
                    break;
                }
            }
            
            if (exerciseMuscle && volumeAdjustments.muscleAdjustments[exerciseMuscle]) {
                const adj = volumeAdjustments.muscleAdjustments[exerciseMuscle];
                const baseSets = resultExercise.targetSets || 3;
                const newSets = Math.max(2, Math.min(5, baseSets + adj.amount));
                
                resultExercise = {
                    ...resultExercise,
                    targetSets: newSets,
                    originalSets: baseSets,
                    volumeAdjusted: true,
                    adjustmentReason: adj.reason,
                    adjustmentType: adj.action
                };
            }
            
            return resultExercise;
        });
        
        // Generate adjustment notes for display
        const adjustmentNotes = [];
        for (const [muscle, adj] of Object.entries(volumeAdjustments.muscleAdjustments)) {
            if (adj.action === 'reduce') {
                adjustmentNotes.push(`${muscle}: ${adj.amount} sets (recovery)`);
            } else if (adj.action === 'increase') {
                adjustmentNotes.push(`${muscle}: +${adj.amount} sets (catch-up)`);
            }
        }
        
        return {
            ...baseWorkout,
            exercises: cycledExercises,
            isVariation: exerciseWeek > 0,
            volumeAdjusted: adjustmentNotes.length > 0,
            adjustmentNotes,
            volumeAlerts: volumeAdjustments.alerts
        };
    },

    /**
     * Check and advance exercise week if needed
     * Should be called weekly (e.g., on Monday)
     */
    checkExerciseCycling() {
        const today = new Date();
        if (today.getDay() === 1) { // Monday
            const lastAdvance = localStorage.getItem('lastExerciseCycleDate');
            const todayStr = today.toISOString().split('T')[0];
            
            if (lastAdvance !== todayStr) {
                State.advanceExerciseWeek();
                localStorage.setItem('lastExerciseCycleDate', todayStr);
            }
        }
    },

    // ==========================================
    // INSIGHT GENERATION
    // ==========================================

    /**
     * Generate insight message - dynamic and contextual
     * Based on time of day, progress, and history
     * @returns {string} Insight text
     */
    generateInsight() {
        const days = State.getAllDayKeys();
        const todayData = State.getDayData();
        const goals = State.getGoals();
        const debt = State.getDebt();
        const streak = this.getDailyStreak();
        const mult = this.getStreakMultiplier(streak);
        const hour = new Date().getHours();
        const workout = this.getTodaysWorkout();
        
        // Calculate today's exercise progress
        const exercisesDone = todayData?.exercises 
            ? Object.values(todayData.exercises).filter(Boolean).length 
            : 0;
        const totalExercises = workout?.exercises?.length || 0;
        
        // Priority 1: Debt - needs attention
        if (debt.length > 0) {
            return `${debt.length} workout debt. Clear it today to reset your accountability score.`;
        }
        
        // Priority 2: Morning insights (before noon)
        if (hour < 12) {
            if (streak > 0) {
                return `${streak} day streak on the line. ${workout.name} today. Make it count.`;
            }
            return `New day. ${workout.name} scheduled. Execute.`;
        }
        
        // Priority 3: Afternoon insights - haven't trained
        // Also check if they've logged lifts or runs
        let hasLoggedLifts = false;
        let hasLoggedRun = false;
        
        try {
            hasLoggedLifts = State._data?.liftHistory && Object.values(State._data.liftHistory).some(entries => 
                entries && entries.some(e => e.date === State.getTodayKey())
            );
            hasLoggedRun = todayData?.runDistance > 0;
        } catch (e) {
            console.error('Error checking lift/run status:', e);
        }
        
        if (hour < 18 && exercisesDone === 0 && totalExercises > 0 && !hasLoggedLifts && !hasLoggedRun) {
            return `Afternoon. Haven't trained yet. The longer you wait, the harder it gets.`;
        }
        
        // Priority 4: Partially done workout
        if (exercisesDone > 0 && exercisesDone < totalExercises) {
            return `${exercisesDone}/${totalExercises} exercises done. Finish what you started.`;
        }
        
        // Priority 5: Evening protein check
        if (hour >= 18) {
            const protein = todayData?.protein || 0;
            const proteinGoal = goals?.dailyProtein || 150;
            const proteinPercent = Math.round((protein / proteinGoal) * 100);
            
            if (proteinPercent < 80 && exercisesDone > 0) {
                return `${proteinPercent}% protein. ${proteinGoal - protein}g left. Don't go to bed under target.`;
            }
        }
        
        // Priority 6: Streak milestone approaching
        if (streak === 6) return `6 days. Tomorrow is 7 - unlock 1.25x XP. Don't break now.`;
        if (streak === 13) return `13 days. Tomorrow hits 2 weeks. Push through.`;
        if (streak === 29) return `29 days. Tomorrow is 30. Ultimate multiplier. One more day.`;
        
        // Priority 7: Workout completed
        if (exercisesDone >= totalExercises && totalExercises > 0) {
            const protein = todayData?.protein || 0;
            const proteinGoal = goals?.dailyProtein || 150;
            if (protein >= proteinGoal) {
                return `Workout done. Protein hit. This is discipline. Keep stacking.`;
            }
            return `Training complete. Now fuel the recovery - hit your protein.`;
        }
        
        // Default based on streak
        if (mult > 1) {
            return `${streak} day streak = ${mult}x XP. Consistency compounds.`;
        }
        
        return `${workout.name}. ${totalExercises} exercises. Show up.`;
    },

    // ==========================================
    // 7-DAY AVERAGES
    // ==========================================

    /**
     * Get 7-day averages for macros
     * @returns {object} { protein, calories, sleep }
     */
    getWeeklyAverages() {
        const days = State.getRecentDayKeys(7);
        let pSum = 0, pCount = 0;
        let cSum = 0, cCount = 0;
        let sSum = 0, sCount = 0;
        
        for (const day of days) {
            const data = State.getDayData(day);
            if (!data) continue;
            
            if (data.protein) { pSum += data.protein; pCount++; }
            if (data.calories) { cSum += data.calories; cCount++; }
            if (data.sleep) { sSum += data.sleep; sCount++; }
        }
        
        return {
            protein: pCount ? Math.round(pSum / pCount) : null,
            calories: cCount ? Math.round(cSum / cCount) : null,
            sleep: sCount ? (sSum / sCount).toFixed(1) : null,
        };
    },

    // ==========================================
    // AUTO-PERIODIZATION ENGINE
    // ==========================================

    /**
     * Detect weight plateau (2+ weeks without significant change)
     * @returns {object|null} Plateau info or null
     */
    detectWeightPlateau() {
        const days = State.getAllDayKeys();
        // Need at least 21 days of app usage
        if (days.length < 21) return null;
        
        // Get weights from last 21 days
        const recentWeights = [];
        for (let i = days.length - 1; i >= 0 && recentWeights.length < 21; i--) {
            const data = State.getDayData(days[i]);
            if (data?.weight) {
                recentWeights.push({ date: days[i], weight: data.weight });
            }
        }
        
        // Need at least 10 weight logs over 2 weeks
        if (recentWeights.length < 10) return null;
        
        // Calculate change in last 14 days
        const firstHalf = recentWeights.slice(recentWeights.length - 7).map(w => w.weight);
        const secondHalf = recentWeights.slice(0, 7).map(w => w.weight);
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const change = secondAvg - firstAvg;
        
        // Plateau if change is less than 0.5 lbs in 2 weeks
        if (Math.abs(change) < 0.5) {
            const goals = State.getGoals();
            const isOnDeficit = goals?.dailyCalories < (goals?.tdee || 0);
            
            return {
                isPlateaued: true,
                weeksStalled: 2,
                avgChange: change.toFixed(1),
                isOnDeficit,
                message: isOnDeficit 
                    ? 'Weight stalled despite deficit. Consider a diet break or adjusting calories.'
                    : 'Weight is stable. Evaluate if this aligns with your goals.',
            };
        }
        
        return null;
    },

    /**
     * Detect lift plateau (3+ weeks without progression)
     * @returns {object|null} Lift plateau info
     */
    detectLiftPlateau() {
        const prs = State.getAllPRs();
        const plateauedLifts = [];
        
        for (const [exercise, pr] of Object.entries(prs)) {
            if (!pr?.date) continue;
            
            const prDate = new Date(pr.date);
            const daysSincePR = Math.floor((Date.now() - prDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // If no PR in 21+ days (3 weeks) and they've been training
            if (daysSincePR >= 21) {
                const history = State.getLiftHistory(exercise, 6);
                if (history.length >= 3) { // They've been training this lift
                    plateauedLifts.push({
                        exercise,
                        daysSincePR,
                        lastPR: pr,
                    });
                }
            }
        }
        
        if (plateauedLifts.length === 0) return null;
        
        return {
            lifts: plateauedLifts,
            count: plateauedLifts.length,
            message: `${plateauedLifts.length} lift(s) plateaued. Consider a deload or program change.`,
        };
    },

    /**
     * Get periodization recommendations
     * @returns {object} Recommendations based on current status
     */
    getPeriodizationRecommendations() {
        const weightPlateau = this.detectWeightPlateau();
        const liftPlateau = this.detectLiftPlateau();
        const deload = State.shouldDeload();
        const cuttingStatus = this.getCuttingStatus();
        
        const recommendations = [];
        
        // Weight plateau recommendation
        if (weightPlateau?.isPlateaued && weightPlateau.isOnDeficit) {
            recommendations.push({
                type: 'diet-break',
                priority: 'high',
                title: 'CONSIDER DIET BREAK',
                description: 'Weight stalled for 2+ weeks despite calorie deficit. A 1-2 week diet break at maintenance can reset metabolic adaptation.',
                action: 'Return to maintenance calories for 1-2 weeks',
            });
        }
        
        // Deload recommendation
        if (deload.recommended) {
            recommendations.push({
                type: 'deload',
                priority: deload.weeksSinceDeload >= 6 ? 'high' : 'medium',
                title: 'DELOAD WEEK RECOMMENDED',
                description: deload.reason,
                action: 'Reduce weight by 40-50%, cut volume in half',
            });
        }
        
        // Lift plateau recommendation
        if (liftPlateau && liftPlateau.count >= 2) {
            recommendations.push({
                type: 'program-change',
                priority: 'medium',
                title: 'LIFT PLATEAU DETECTED',
                description: `${liftPlateau.count} lifts haven't improved in 3+ weeks.`,
                action: 'Consider changing rep ranges or exercise variations',
            });
        }
        
        // Cutting phase warnings
        if (cuttingStatus.weeksInDeficit >= 12) {
            recommendations.push({
                type: 'metabolic-adaptation',
                priority: 'high',
                title: 'METABOLIC ADAPTATION RISK',
                description: `${cuttingStatus.weeksInDeficit} weeks in deficit. Extended cutting reduces metabolic rate.`,
                action: 'Take a 2-4 week diet break before continuing',
            });
        } else if (cuttingStatus.weeksInDeficit >= 8) {
            recommendations.push({
                type: 'refeed',
                priority: 'medium',
                title: 'CONSIDER REFEED DAY',
                description: `${cuttingStatus.weeksInDeficit} weeks of dieting. A refeed can boost leptin and metabolism.`,
                action: 'Add 1 high-carb day at maintenance this week',
            });
        }
        
        return {
            recommendations,
            hasHighPriority: recommendations.some(r => r.priority === 'high'),
            count: recommendations.length,
        };
    },

    /**
     * Get cutting (deficit) status
     * @returns {object} Cutting phase info
     */
    getCuttingStatus() {
        const goals = State.getGoals();
        const days = State.getAllDayKeys();
        
        // Need at least 14 days of data before showing cutting warnings
        if (days.length < 14) {
            return { isOnDeficit: false, weeksInDeficit: 0, hasEnoughData: false };
        }
        
        const isOnDeficit = goals?.dailyCalories < (goals?.tdee || 0);
        
        if (!isOnDeficit) {
            return { isOnDeficit: false, weeksInDeficit: 0, hasEnoughData: true };
        }
        
        // Count weeks based on actual logged days, not just time since signup
        const weeksInDeficit = Math.floor(days.length / 7);
        
        return {
            isOnDeficit: true,
            weeksInDeficit,
            dailyDeficit: (goals.tdee || 0) - goals.dailyCalories,
            hasEnoughData: true,
        };
    },

    /**
     * Calculate progress forecasts
     * @returns {object} Forecasted milestones
     */
    calculateForecasts() {
        const currentWeight = this.getCurrentWeight();
        const goals = State.getGoals();
        const profile = State.getProfile();
        
        if (!currentWeight || !goals?.targetWeight) return null;
        
        // Calculate weekly rate of change
        const days = State.getAllDayKeys();
        const weights = [];
        
        for (let i = days.length - 1; i >= 0 && weights.length < 14; i--) {
            const data = State.getDayData(days[i]);
            if (data?.weight) weights.push(data.weight);
        }
        
        if (weights.length < 7) return null;
        
        const weeklyChange = (weights[weights.length - 1] - weights[0]) / (weights.length / 7);
        
        if (Math.abs(weeklyChange) < 0.1) {
            return { message: 'Weight stable - no forecast available', weeklyChange: 0 };
        }
        
        const weightToGo = currentWeight - goals.targetWeight;
        const weeksToGoal = Math.abs(weightToGo / weeklyChange);
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + (weeksToGoal * 7));
        
        // Format date
        const options = { month: 'short', day: 'numeric' };
        
        // Forecast for specific dates
        const oneMonth = new Date();
        oneMonth.setMonth(oneMonth.getMonth() + 1);
        const weightIn1Month = currentWeight + (weeklyChange * 4);
        
        const threeMonths = new Date();
        threeMonths.setMonth(threeMonths.getMonth() + 3);
        const weightIn3Months = currentWeight + (weeklyChange * 12);
        
        return {
            weeklyChange: weeklyChange.toFixed(1),
            direction: weeklyChange < 0 ? 'losing' : 'gaining',
            targetDate: targetDate.toLocaleDateString('en-US', options),
            targetWeight: goals.targetWeight,
            weeksToGoal: Math.round(weeksToGoal),
            forecasts: [
                { label: '1 Month', weight: Math.round(weightIn1Month) },
                { label: '3 Months', weight: Math.round(weightIn3Months) },
            ],
            message: `At ${Math.abs(weeklyChange).toFixed(1)} lbs/week, you'll reach ${goals.targetWeight} lbs by ${targetDate.toLocaleDateString('en-US', options)}`,
        };
    },

    /**
     * Get current training phase based on data
     * @returns {string} Current phase
     */
    getCurrentTrainingPhase() {
        const deload = State.shouldDeload();
        const volume = State.getWeeklyTrainingStats();
        
        // Check if in deload
        if (State._data?.isDeloadWeek) {
            return 'deload';
        }
        
        // Simple phase detection based on volume trend
        // Would need more historical data for accurate detection
        return deload.weeksSinceDeload >= 4 ? 'accumulation' : 'intensification';
    },

    // ==========================================
    // SMART VOLUME ADJUSTMENT
    // ==========================================

    /**
     * Get volume landmarks for a specific muscle group
     * @param {string} muscle - Muscle group name
     * @returns {object} { MEV, MAV, MRV }
     */
    getVolumeLandmarks(muscle) {
        const landmarks = CONFIG.VOLUME_LANDMARKS || {};
        return landmarks[muscle] || landmarks.default || { MEV: 6, MAV: 14, MRV: 20 };
    },

    /**
     * Get volume-based workout adjustments
     * Analyzes weekly volume and suggests set modifications
     * Uses per-muscle-group volume landmarks (science-based)
     * @returns {object} { muscleAdjustments, reason, alerts }
     */
    getVolumeAdjustments() {
        const volumes = State.getAllWeeklyVolumes();
        const dayOfWeek = new Date().getDay(); // 0=Sunday, 6=Saturday
        const daysLeftInWeek = 6 - dayOfWeek; // Saturday is end of training week
        
        const adjustments = {
            muscleAdjustments: {},
            alerts: [],
            summary: []
        };
        
        // Don't make adjustments on first 2 days of week - not enough data
        if (dayOfWeek <= 1) {
            return adjustments;
        }
        
        // IMPORTANT: Don't make adjustments until user has completed at least one full week
        // We don't know what they were doing before they started using the app
        const createdAt = State._data?.createdAt;
        if (createdAt) {
            const startDate = new Date(createdAt);
            const now = new Date();
            const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
            
            // Need at least 7 days of app usage before volume adjustments kick in
            if (daysSinceStart < 7) {
                return adjustments;
            }
        }
        
        // Check if user has enough training history to make adjustments
        const totalSetsThisWeek = Object.values(volumes).reduce((sum, v) => sum + (v?.sets || 0), 0);
        if (totalSetsThisWeek === 0) {
            // No training this week yet - don't panic, just normal workout
            return adjustments;
        }
        
        for (const [muscle, data] of Object.entries(volumes)) {
            const sets = data?.sets || 0;
            
            // Get per-muscle-group landmarks
            const { MEV, MAV, MRV } = this.getVolumeLandmarks(muscle);
            
            // AT or OVER MRV - need to reduce
            if (sets >= MRV) {
                adjustments.muscleAdjustments[muscle] = {
                    action: 'reduce',
                    amount: -2, // Drop 2 sets
                    reason: `${muscle.toUpperCase()} at MRV (${sets}/${MRV}). Reducing to aid recovery.`
                };
                adjustments.alerts.push({
                    type: 'warning',
                    message: `${muscle.toUpperCase()}: Reducing volume - at max recoverable`
                });
            }
            // NEAR MRV (within 2) - flag but small reduction
            else if (sets >= MRV - 2) {
                adjustments.muscleAdjustments[muscle] = {
                    action: 'reduce',
                    amount: -1, // Drop 1 set
                    reason: `${muscle.toUpperCase()} approaching MRV (${sets}/${MRV}). Slight reduction.`
                };
            }
            // UNDER MEV with days left - suggest adding (but cap at +2)
            else if (sets < MEV && sets > 0 && daysLeftInWeek >= 2) {
                const deficit = MEV - sets;
                const addSets = Math.min(2, deficit); // Never add more than 2 sets
                
                adjustments.muscleAdjustments[muscle] = {
                    action: 'increase',
                    amount: addSets,
                    reason: `${muscle.toUpperCase()} under MEV (${sets}/${MEV}). Adding ${addSets} sets.`
                };
                adjustments.summary.push(`+${addSets} ${muscle}`);
            }
            // UNDER MEV on last day - just note it
            else if (sets < MEV && sets > 0 && daysLeftInWeek < 2) {
                adjustments.alerts.push({
                    type: 'info',
                    message: `${muscle.toUpperCase()} under MEV this week (${sets}/${MEV}). Plan for next week.`
                });
            }
        }
        
        return adjustments;
    },

    /**
     * Get today's workout with smart volume adjustments applied
     * @returns {object} Modified workout object
     */
    getAdjustedWorkout() {
        const dayOfWeek = new Date().getDay();
        const baseWorkout = CONFIG.WORKOUTS[dayOfWeek];
        
        if (!baseWorkout || baseWorkout.type === 'rest' || baseWorkout.type === 'cardio') {
            return baseWorkout;
        }
        
        // Check if in deload week
        if (State._data?.isDeloadWeek) {
            return {
                ...baseWorkout,
                isDeload: true,
                deloadNote: 'DELOAD WEEK: Reduce weights 40-50%, cut volume in half',
                exercises: baseWorkout.exercises.map(ex => ({
                    ...ex,
                    targetSets: Math.ceil((ex.targetSets || 3) / 2),
                    deloadAdjusted: true
                }))
            };
        }
        
        const adjustments = this.getVolumeAdjustments();
        
        // If no adjustments needed, return base workout
        if (Object.keys(adjustments.muscleAdjustments).length === 0) {
            return {
                ...baseWorkout,
                volumeAdjusted: false,
                adjustmentNotes: []
            };
        }
        
        // Apply adjustments to exercises
        const adjustedExercises = baseWorkout.exercises.map(exercise => {
            // Find which muscle group this exercise belongs to
            let exerciseMuscle = null;
            for (const [muscle, exercises] of Object.entries(CONFIG.MUSCLE_GROUPS || {})) {
                if (exercises.some(ex => ex.toLowerCase() === exercise.name.toLowerCase())) {
                    exerciseMuscle = muscle;
                    break;
                }
            }
            
            if (!exerciseMuscle || !adjustments.muscleAdjustments[exerciseMuscle]) {
                return exercise;
            }
            
            const adj = adjustments.muscleAdjustments[exerciseMuscle];
            const baseSets = exercise.targetSets || 3;
            const newSets = Math.max(2, Math.min(5, baseSets + adj.amount)); // Keep between 2-5 sets
            
            return {
                ...exercise,
                targetSets: newSets,
                originalSets: baseSets,
                volumeAdjusted: true,
                adjustmentReason: adj.reason,
                adjustmentType: adj.action
            };
        });
        
        // Generate adjustment notes for display
        const adjustmentNotes = [];
        for (const [muscle, adj] of Object.entries(adjustments.muscleAdjustments)) {
            if (adj.action === 'reduce') {
                adjustmentNotes.push(`↓ ${muscle}: ${adj.amount} sets (recovery)`);
            } else if (adj.action === 'increase') {
                adjustmentNotes.push(`↑ ${muscle}: +${adj.amount} sets (volume catch-up)`);
            }
        }
        
        return {
            ...baseWorkout,
            exercises: adjustedExercises,
            volumeAdjusted: true,
            adjustmentNotes,
            alerts: adjustments.alerts
        };
    },
};

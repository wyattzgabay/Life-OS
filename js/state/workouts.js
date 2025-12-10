/**
 * STATE/WORKOUTS.JS
 * Lift History, Progressive Overload, Volume Tracking, PRs
 * 
 * This module handles:
 * - Logging lifts with sets/reps/weight
 * - Personal records (PRs) tracking
 * - Volume calculations per muscle group
 * - Science-based progression suggestions
 * - Deload recommendations
 * - Exercise cycling and swaps
 */

const StateWorkouts = {
    // ==========================================
    // LIFT LOGGING
    // ==========================================

    /**
     * Log a lift with sets
     * Updates existing entry for the date or creates new one
     * @param {string} exerciseName - Name of exercise
     * @param {array} sets - Array of { weight, reps }
     * @param {string} dateKey - Optional date key (defaults to today)
     * @returns {object} { isPR, estimated1RM, volume, previousBest }
     */
    logLift(exerciseName, sets, dateKey = null) {
        if (!this._data.liftHistory) this._data.liftHistory = {};
        if (!this._data.personalRecords) this._data.personalRecords = {};
        if (!this._data.liftHistory[exerciseName]) this._data.liftHistory[exerciseName] = [];
        
        const targetDateKey = dateKey || this.getTodayKey();
        
        // Calculate metrics
        const volume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        const bestSet = sets.reduce((best, set) => {
            const e1rm = this.calculateEstimated1RM(set.weight, set.reps);
            return e1rm > (best?.e1rm || 0) ? { ...set, e1rm } : best;
        }, null);
        
        const estimated1RM = bestSet?.e1rm || 0;
        
        // Check for PR
        const previousPR = this._data.personalRecords[exerciseName];
        const isPR = !previousPR || estimated1RM > previousPR.estimated1RM;
        
        // Check if entry exists for this date - UPDATE instead of creating new
        const existingIndex = this._data.liftHistory[exerciseName].findIndex(
            entry => entry.date === targetDateKey
        );
        
        const entry = {
            date: targetDateKey,
            timestamp: new Date().toISOString(),
            sets: sets,
            volume: volume,
            estimated1RM: estimated1RM,
            bestSet: bestSet
        };
        
        if (existingIndex >= 0) {
            this._data.liftHistory[exerciseName][existingIndex] = entry;
        } else {
            this._data.liftHistory[exerciseName].push(entry);
        }
        
        // Keep only last 100 entries per exercise
        if (this._data.liftHistory[exerciseName].length > 100) {
            this._data.liftHistory[exerciseName] = 
                this._data.liftHistory[exerciseName].slice(-100);
        }
        
        // Update PR if new
        if (isPR) {
            this._data.personalRecords[exerciseName] = {
                weight: bestSet.weight,
                reps: bestSet.reps,
                estimated1RM: estimated1RM,
                date: targetDateKey
            };
        }
        
        this.save();
        
        return { isPR, estimated1RM, volume, previousBest: previousPR };
    },

    /**
     * Remove a lift entry for a specific date
     */
    removeLiftEntry(exerciseName, dateKey) {
        if (!this._data.liftHistory?.[exerciseName]) return;
        
        const index = this._data.liftHistory[exerciseName].findIndex(
            entry => entry.date === dateKey
        );
        
        if (index >= 0) {
            this._data.liftHistory[exerciseName].splice(index, 1);
            this.save();
        }
    },

    // ==========================================
    // EXERCISE SWAPS
    // ==========================================

    /**
     * Save an exercise swap for today
     */
    saveExerciseSwap(originalExercise, newExercise) {
        const todayKey = this.getTodayKey();
        
        if (!this._data.exerciseSwaps) {
            this._data.exerciseSwaps = {};
        }
        
        if (!this._data.exerciseSwaps[todayKey]) {
            this._data.exerciseSwaps[todayKey] = {};
        }
        
        this._data.exerciseSwaps[todayKey][originalExercise] = newExercise;
        this.save();
    },
    
    /**
     * Get swapped exercise for today (if any)
     */
    getExerciseSwap(originalExercise) {
        const todayKey = this.getTodayKey();
        return this._data?.exerciseSwaps?.[todayKey]?.[originalExercise] || null;
    },
    
    /**
     * Get all exercise swaps for today
     */
    getTodaySwaps() {
        const todayKey = this.getTodayKey();
        return this._data?.exerciseSwaps?.[todayKey] || {};
    },

    // ==========================================
    // CALCULATIONS
    // ==========================================

    /**
     * Calculate estimated 1RM using Brzycki formula
     * @param {number} weight - Weight lifted
     * @param {number} reps - Reps performed
     * @returns {number} Estimated 1RM
     */
    calculateEstimated1RM(weight, reps) {
        if (reps === 1) return weight;
        if (reps > 12) reps = 12; // Formula less accurate above 12 reps
        return Math.round(weight * (36 / (37 - reps)));
    },

    // ==========================================
    // HISTORY & LOOKUPS
    // ==========================================

    /**
     * Get last lift entry for an exercise
     */
    getLastLift(exerciseName) {
        const history = this._data?.liftHistory?.[exerciseName];
        if (!history || history.length === 0) return null;
        return history[history.length - 1];
    },

    /**
     * Get lift history for an exercise
     */
    getLiftHistory(exerciseName, limit = 10) {
        const history = this._data?.liftHistory?.[exerciseName];
        if (!history) return [];
        return history.slice(-limit);
    },
    
    /**
     * Get today's sets for an exercise (or specific date)
     */
    getTodaySets(exerciseName, dateKey = null) {
        const targetDate = dateKey || this.getTodayKey();
        const history = this._data?.liftHistory?.[exerciseName];
        if (!history) return [];
        
        const todayEntry = history.find(entry => entry.date === targetDate);
        return todayEntry?.sets || [];
    },

    /**
     * Get PR for an exercise
     */
    getPR(exerciseName) {
        return this._data?.personalRecords?.[exerciseName] || null;
    },

    /**
     * Get all PRs
     */
    getAllPRs() {
        return this._data?.personalRecords ? { ...this._data.personalRecords } : {};
    },

    // ==========================================
    // PROGRESSION SYSTEM
    // ==========================================

    /**
     * Get science-based progression suggestion for an exercise
     * Uses double progression (6-12 rep range) and considers volume status
     * 
     * Science: Double progression model
     * - Stay at weight until you hit 12 reps
     * - Add 5lbs, drop to 6-8 reps
     * - Build back up to 12 reps
     * - Repeat
     */
    getProgressionSuggestion(exerciseName) {
        const lastLift = this.getLastLift(exerciseName);
        if (!lastLift || !lastLift.bestSet) return null;
        
        const lastWeight = lastLift.bestSet.weight;
        const lastReps = lastLift.bestSet.reps;
        const avgReps = Math.round(lastLift.sets.reduce((sum, s) => sum + s.reps, 0) / lastLift.sets.length);
        
        // Find which muscle group this exercise belongs to
        let muscleGroup = null;
        for (const [muscle, exercises] of Object.entries(CONFIG.MUSCLE_GROUPS || {})) {
            if (exercises.some(ex => ex.toLowerCase() === exerciseName.toLowerCase())) {
                muscleGroup = muscle;
                break;
            }
        }
        
        // Check volume status for this muscle group
        let nearMRV = false;
        if (muscleGroup) {
            const volume = this.getWeeklyVolume(muscleGroup);
            const landmarks = CONFIG.VOLUME_LANDMARKS?.[muscleGroup] || CONFIG.VOLUME_LANDMARKS?.default || { MRV: 20 };
            nearMRV = volume.sets >= landmarks.MRV - 3;
        }
        
        // PROGRESSION LOGIC
        if (nearMRV) {
            return {
                weight: lastWeight,
                reps: avgReps,
                message: `High volume week - maintain ${lastWeight} lbs, focus on form`
            };
        }
        
        if (avgReps >= 12) {
            const newWeight = lastWeight + 5;
            return {
                weight: newWeight,
                reps: '6-8',
                message: `${avgReps} reps = time to progress. Add 5 lbs.`
            };
        } else if (avgReps >= 10) {
            return {
                weight: lastWeight,
                reps: avgReps + 1,
                message: `${avgReps} reps last time. Push for ${avgReps + 1} today.`
            };
        } else if (avgReps >= 8) {
            return {
                weight: lastWeight,
                reps: avgReps + 1,
                message: `${avgReps} reps - keep building at ${lastWeight} lbs`
            };
        } else if (avgReps >= 6) {
            return {
                weight: lastWeight,
                reps: 8,
                message: `Build to 8+ reps at ${lastWeight} lbs before adding weight`
            };
        } else {
            const newWeight = Math.max(lastWeight - 5, 5);
            return {
                weight: newWeight,
                reps: 8,
                message: `Only ${avgReps} reps - drop to ${newWeight} lbs, aim for 8`
            };
        }
    },

    // ==========================================
    // VOLUME TRACKING
    // ==========================================

    /**
     * Get weekly volume for a muscle group
     * @param {string} muscleGroup - Muscle group name from CONFIG.MUSCLE_GROUPS
     * @returns {object} { sets, volume }
     */
    getWeeklyVolume(muscleGroup) {
        const exercises = CONFIG.MUSCLE_GROUPS?.[muscleGroup] || [];
        let totalSets = 0;
        let totalVolume = 0;
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        for (const exercise of exercises) {
            const history = this._data?.liftHistory?.[exercise] || [];
            for (const entry of history) {
                if (entry.date >= weekAgoStr) {
                    totalSets += entry.sets.length;
                    totalVolume += entry.volume;
                }
            }
        }
        
        return { sets: totalSets, volume: totalVolume };
    },

    /**
     * Get all muscle group volumes for the week
     */
    getAllWeeklyVolumes() {
        const volumes = {};
        const muscleGroups = Object.keys(CONFIG.MUSCLE_GROUPS || {});
        
        for (const group of muscleGroups) {
            volumes[group] = this.getWeeklyVolume(group);
        }
        
        return volumes;
    },

    /**
     * Get total weekly training volume and stats
     */
    getWeeklyTrainingStats() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        let totalSets = 0;
        let totalVolume = 0;
        let sessionsThisWeek = 0;
        const sessionDates = new Set();
        
        const history = this._data?.liftHistory || {};
        
        for (const exercise in history) {
            const entries = history[exercise] || [];
            for (const entry of entries) {
                if (entry.date >= weekAgoStr) {
                    totalSets += entry.sets.length;
                    totalVolume += entry.volume;
                    sessionDates.add(entry.date);
                }
            }
        }
        
        sessionsThisWeek = sessionDates.size;
        
        return {
            totalSets,
            totalVolume,
            sessionsThisWeek,
            avgSetsPerSession: sessionsThisWeek > 0 ? Math.round(totalSets / sessionsThisWeek) : 0
        };
    },

    // ==========================================
    // DELOAD SYSTEM
    // ==========================================

    /**
     * Check if deload is recommended
     * Based on: 4+ weeks of training without a deload
     * 
     * Science: Accumulated fatigue needs periodic dissipation
     * - Deload every 4-6 weeks
     * - Reduce volume 40-50%, maintain intensity
     */
    shouldDeload() {
        const history = this._data?.liftHistory || {};
        const allDates = [];
        
        for (const exercise in history) {
            const entries = history[exercise] || [];
            for (const entry of entries) {
                allDates.push(entry.date);
            }
        }
        
        if (allDates.length === 0) return { recommended: false };
        
        const uniqueDates = [...new Set(allDates)].sort();
        const firstDate = new Date(uniqueDates[0]);
        const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
        const weeksTraining = Math.floor((lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000));
        
        const weeksSinceStart = weeksTraining;
        const lastDeload = this._data?.lastDeloadDate;
        const weeksSinceDeload = lastDeload 
            ? Math.floor((Date.now() - new Date(lastDeload).getTime()) / (7 * 24 * 60 * 60 * 1000))
            : weeksSinceStart;
        
        return {
            recommended: weeksSinceDeload >= 4,
            weeksSinceDeload,
            reason: weeksSinceDeload >= 6 
                ? 'Over 6 weeks without deload - fatigue likely accumulated'
                : weeksSinceDeload >= 4 
                    ? 'Consider a deload week to optimize recovery'
                    : null
        };
    },

    /**
     * Mark deload week completed
     */
    markDeloadComplete() {
        this._data.lastDeloadDate = new Date().toISOString();
        this.save();
    },

    // ==========================================
    // EXERCISE CYCLING
    // ==========================================

    /**
     * Get current exercise week for cycling
     */
    getExerciseWeek() {
        return this._data?.exerciseWeek || 0;
    },

    /**
     * Advance exercise week
     */
    advanceExerciseWeek() {
        if (!this._data.exerciseWeek) {
            this._data.exerciseWeek = 0;
        }
        this._data.exerciseWeek++;
        
        // Also update last exercise rotation date
        this._data.lastExerciseRotation = this.getTodayKey();
        this.save();
    },
};

// Mixin pattern: These methods will be added to the main State object
if (typeof window !== 'undefined') {
    window.StateWorkouts = StateWorkouts;
}



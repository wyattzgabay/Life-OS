/**
 * STATE/RUNNING.JS
 * Running Program Management
 * 
 * This module handles:
 * - Running goals (5K, 10K, Half, Marathon)
 * - VDOT calculations and training paces
 * - Run logging and history
 * - Training phases (Base, Build, Peak, Taper)
 * - Injury tracking for running
 */

const StateRunning = {
    // ==========================================
    // RUNNING CONFIGURATION
    // ==========================================

    /**
     * Set running goal
     * @param {string} goalId - One of: '5k', '10k', 'half', 'marathon', 'casual'
     */
    setRunningGoal(goalId) {
        this._data.running.goal = goalId;
        this._data.running.startDate = new Date().toISOString();
        this._data.running.weekNumber = 1;
        this.save();
    },

    /**
     * Set running injuries
     * @param {array} injuries - Array of injury IDs from CONFIG.RUNNING.INJURIES
     */
    setRunningInjuries(injuries) {
        this._data.running.injuries = injuries;
        this.save();
    },

    /**
     * Get running data
     */
    getRunningData() {
        return this._data?.running ? { ...this._data.running } : null;
    },
    
    /**
     * Update running data (partial update)
     */
    updateRunningData(updates) {
        this._data.running = { ...this._data.running, ...updates };
        this.save();
    },

    /**
     * Advance running week
     */
    advanceRunningWeek() {
        this._data.running.weekNumber++;
        this.save();
    },

    // ==========================================
    // BASELINE & VDOT
    // ==========================================

    /**
     * Set running baseline assessment
     * Calculates VDOT from recent race time
     */
    setRunningBaseline(baseline) {
        this._data.running.baseline = { ...this._data.running.baseline, ...baseline };
        
        // Calculate VDOT if we have race time
        if (baseline.recentRaceTime) {
            const vdot = this.calculateVDOT(baseline.recentRaceTime);
            this._data.running.vdot = vdot;
            
            // Store start VDOT for progress tracking
            if (!this._data.running.startVdot) {
                this._data.running.startVdot = vdot;
            }
        }
        this.save();
    },

    /**
     * Set running target
     */
    setRunningTarget(target) {
        this._data.running.target = { ...this._data.running.target, ...target };
        this.save();
    },

    /**
     * Calculate VDOT from race time
     * Based on Jack Daniels' Running Formula
     * 
     * @param {object} raceTime - { distance: '5k', time: 'mm:ss' }
     * @returns {number} VDOT score (30-60 typical range)
     */
    calculateVDOT(raceTime) {
        const { distance, time } = raceTime;
        const parts = time.split(':');
        const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
        
        // Simplified VDOT estimation based on 5K time
        if (distance === '5k') {
            if (totalSeconds <= 900) return 60;  // sub 15:00
            if (totalSeconds <= 1020) return 55; // sub 17:00
            if (totalSeconds <= 1140) return 50; // sub 19:00
            if (totalSeconds <= 1275) return 45; // sub 21:15
            if (totalSeconds <= 1440) return 40; // sub 24:00
            if (totalSeconds <= 1650) return 35; // sub 27:30
            return 30;
        }
        
        // Default estimate
        return 40;
    },

    // ==========================================
    // RUN LOGGING
    // ==========================================

    /**
     * Log a run
     * @param {object} runData - { distance, time, effort, type, notes }
     * @returns {object} Logged entry
     */
    logRun(runData) {
        if (!this._data.runLog) this._data.runLog = [];
        
        const entry = {
            date: this.getTodayKey(),
            timestamp: new Date().toISOString(),
            distance: runData.distance, // miles
            time: runData.time, // "mm:ss" or total minutes
            pace: runData.pace || this.calculatePace(runData.distance, runData.time),
            effort: runData.effort, // 1-10
            type: runData.type, // easy, tempo, intervals, long, recovery
            notes: runData.notes || '',
        };
        
        this._data.runLog.push(entry);
        
        // Keep last 200 runs
        if (this._data.runLog.length > 200) {
            this._data.runLog = this._data.runLog.slice(-200);
        }
        
        // Update today's runDistance for day score calculation
        this.updateToday({ runDistance: runData.distance });
        
        this.save();
        return entry;
    },

    /**
     * Calculate pace from distance and time
     * @param {number} distance - Miles
     * @param {string} timeStr - "mm:ss" format or total minutes
     * @returns {string} Pace in "mm:ss" per mile
     */
    calculatePace(distance, timeStr) {
        if (!distance || !timeStr) return null;
        
        let totalMinutes;
        if (typeof timeStr === 'string' && timeStr.includes(':')) {
            const parts = timeStr.split(':');
            totalMinutes = parseInt(parts[0]) + (parseInt(parts[1] || 0) / 60);
        } else {
            totalMinutes = parseFloat(timeStr);
        }
        
        const paceMinutes = totalMinutes / distance;
        const mins = Math.floor(paceMinutes);
        const secs = Math.round((paceMinutes - mins) * 60);
        
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // ==========================================
    // RUN HISTORY & STATS
    // ==========================================

    /**
     * Get run log
     */
    getRunLog(limit = 50) {
        return (this._data?.runLog || []).slice(-limit);
    },

    /**
     * Get weekly mileage
     */
    getWeeklyMileage() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        const runs = (this._data?.runLog || []).filter(r => r.date >= weekAgoStr);
        return runs.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0);
    },

    /**
     * Get running stats
     */
    getRunningStats() {
        const runs = this._data?.runLog || [];
        if (runs.length === 0) return null;
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        const thisWeekRuns = runs.filter(r => r.date >= weekAgoStr);
        const totalMileage = runs.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0);
        const weeklyMileage = thisWeekRuns.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0);
        
        // Calculate average pace
        let totalPaceMinutes = 0;
        let paceCount = 0;
        for (const run of thisWeekRuns) {
            if (run.pace) {
                const parts = run.pace.split(':');
                totalPaceMinutes += parseInt(parts[0]) + (parseInt(parts[1] || 0) / 60);
                paceCount++;
            }
        }
        const avgPace = paceCount > 0 ? totalPaceMinutes / paceCount : null;
        
        return {
            totalRuns: runs.length,
            totalMileage: totalMileage.toFixed(1),
            weeklyMileage: weeklyMileage.toFixed(1),
            weeklyRuns: thisWeekRuns.length,
            avgPace: avgPace ? `${Math.floor(avgPace)}:${Math.round((avgPace % 1) * 60).toString().padStart(2, '0')}` : null,
        };
    },

    /**
     * Get today's run distance (checks both todayData and runLog)
     */
    getTodayRunDistance(dateKey = null) {
        const targetDate = dateKey || this.getTodayKey();
        
        // First check today's data
        const dayData = this.getDayData(targetDate);
        if (dayData?.runDistance > 0) {
            return dayData.runDistance;
        }
        
        // Then check runLog
        const runLog = this._data?.runLog || [];
        let todayRun = runLog.find(r => r.date === targetDate);
        
        // Check if any run's date STARTS with today (handles timezone issues)
        if (!todayRun) {
            todayRun = runLog.find(r => r.date && r.date.startsWith(targetDate.substring(0, 10)));
        }
        
        // Check if the run's timestamp is from today
        if (!todayRun) {
            const todayStart = new Date(targetDate).setHours(0, 0, 0, 0);
            const todayEnd = new Date(targetDate).setHours(23, 59, 59, 999);
            todayRun = runLog.find(r => {
                if (r.timestamp) {
                    const runTime = new Date(r.timestamp).getTime();
                    return runTime >= todayStart && runTime <= todayEnd;
                }
                return false;
            });
        }
        
        if (todayRun?.distance > 0) {
            return todayRun.distance;
        }
        
        return 0;
    },

    // ==========================================
    // TRAINING PACES & PHASES
    // ==========================================

    /**
     * Get training paces based on VDOT
     * Returns paces from CONFIG.RUNNING.VDOT_PACES
     */
    getTrainingPaces() {
        const vdot = this._data?.running?.vdot || 40;
        return CONFIG.RUNNING.VDOT_PACES[vdot] || CONFIG.RUNNING.VDOT_PACES[40];
    },

    /**
     * Get current training phase
     * 
     * Phases:
     * - Base (weeks 1-4): Build aerobic foundation
     * - Build (weeks 5 to -5 from goal): Increase volume + tempo
     * - Peak (weeks -5 to -2 from goal): Race-specific workouts
     * - Taper (last 2 weeks): Reduce volume, maintain intensity
     */
    getCurrentPhase() {
        const running = this._data?.running;
        if (!running?.startDate || !running?.goal) return null;
        
        const goal = CONFIG.RUNNING.GOALS.find(g => g.id === running.goal);
        if (!goal?.weeks) return null;
        
        const weekNum = running.weekNumber;
        const totalWeeks = goal.weeks;
        
        if (weekNum <= 4) return 'base';
        if (weekNum <= totalWeeks - 5) return 'build';
        if (weekNum <= totalWeeks - 2) return 'peak';
        return 'taper';
    },
};

// Mixin pattern: These methods will be added to the main State object
if (typeof window !== 'undefined') {
    window.StateRunning = StateRunning;
}


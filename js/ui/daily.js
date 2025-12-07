/**
 * DAILY.JS
 * Daily view - main screen with workouts, habits, logging
 */

const DailyView = {
    /**
     * Render the entire daily view
     */
    render() {
        const container = document.getElementById('daily-view');
        
        // Get workout order to display in correct sequence
        const workoutOrder = this.getTodaysWorkoutOrder();
        
        // Organized by priority: Status → Actions → Progress
        container.innerHTML = `
            ${Header.render()}
            
            <!-- DAY SCORE - Gamification -->
            ${this.renderDayScore()}
            
            <!-- SECTION 1: TODAY'S STATUS (High Priority Alerts) -->
            ${this.renderDebt()}
            ${AlcoholTracker.renderDailyStatus()}
            ${this.renderVolumeAlerts()}
            
            <!-- SECTION 2: TODAY'S PLAN (Dynamic order based on science) -->
            ${this.renderWorkoutOrder()}
            
            <!-- Recovery exercises BEFORE run if pre-run required -->
            ${this.shouldShowRecoveryBeforeRun() ? this.renderRecoverySection('pre') : ''}
            
            ${workoutOrder === 'run_first' ? RunningView.renderDailyRunning() : Workout.renderWorkoutSection()}
            ${workoutOrder === 'run_first' ? Workout.renderWorkoutSection() : RunningView.renderDailyRunning()}
            
            <!-- Recovery exercises AFTER run or on rest days -->
            ${!this.shouldShowRecoveryBeforeRun() ? this.renderRecoverySection('post') : ''}
            
            <!-- SECTION 3: PROGRESS TRACKING -->
            ${this.renderWeightInput()}
            ${this.renderNutritionSummary()}
            ${ReadingView.renderDailyReading()}
            
            
            <!-- Bottom spacer for tab bar -->
            <div class="tab-spacer"></div>
        `;
    },
    
    /**
     * Get today's workout order (run_first, lift_first, or lift_only)
     */
    getTodaysWorkoutOrder() {
        const running = State.getRunningData();
        if (!running?.goal) return 'lift_only';
        
        // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
        // BASE_WEEK array: [0]=Sunday, [1]=Monday, ..., [6]=Saturday
        // They match directly - no mapping needed
        const dayOfWeek = new Date().getDay();
        const todaysSchedule = CONFIG.RUNNING.BASE_WEEK[dayOfWeek];
        
        return todaysSchedule?.order || 'lift_first';
    },
    
    /**
     * Check if recovery exercises should show BEFORE run (for pre-run exercises)
     */
    shouldShowRecoveryBeforeRun() {
        // Get today's run type
        const running = State.getRunningData();
        if (!running?.goal) return false;
        
        const dayOfWeek = new Date().getDay();
        const todaysSchedule = CONFIG.RUNNING?.BASE_WEEK?.[dayOfWeek];
        const runType = todaysSchedule?.type;
        
        // For hard runs (long, tempo, intervals), show pre-run exercises first
        const hardRuns = ['long', 'tempo', 'intervals'];
        if (hardRuns.includes(runType)) {
            // Check if user has an active injury that needs pre-run work
            const adjustments = typeof InjuryIntelligence !== 'undefined' 
                ? InjuryIntelligence.getTrainingAdjustments() 
                : null;
            return adjustments && adjustments.exercises && adjustments.exercises.length > 0;
        }
        
        return false;
    },
    
    /**
     * Render recovery section with context-aware exercises
     */
    renderRecoverySection(timing = 'post') {
        console.log('renderRecoverySection called, timing:', timing);
        
        if (typeof InjuryDatabase === 'undefined') {
            console.log('InjuryDatabase not defined');
            return '';
        }
        if (typeof InjuryIntelligence === 'undefined') {
            console.log('InjuryIntelligence not defined');
            return '';
        }
        
        // Get active injury from InjuryIntelligence
        const adjustments = InjuryIntelligence.getTrainingAdjustments();
        console.log('InjuryIntelligence adjustments:', adjustments);
        
        if (!adjustments || !adjustments.injuries || adjustments.injuries.length === 0) {
            console.log('No injuries detected');
            return '';
        }
        
        const activeInjury = adjustments.injuries[0];
        // Use 'key' not 'id' - that's what analyzeInjuries returns
        const injuryId = activeInjury.key || activeInjury.id;
        console.log('Active injury:', activeInjury.name, 'key:', injuryId);
        
        // Determine today's cardio type for context
        const running = State.getRunningData();
        let cardioType = null;
        if (running?.goal) {
            const dayOfWeek = new Date().getDay();
            const todaysSchedule = CONFIG.RUNNING?.BASE_WEEK?.[dayOfWeek];
            cardioType = todaysSchedule?.type || null;
        }
        
        // Get exercises from InjuryDatabase
        const exercises = InjuryDatabase.getTodaysRecoveryExercises(injuryId, cardioType);
        if (!exercises || exercises.length === 0) {
            return '';
        }
        
        // Filter by timing
        const todayKey = State.getTodayKey();
        const completedToday = State._data?.recoveryExercisesCompleted?.[todayKey] || [];
        const timingLabel = timing === 'pre' ? 'PRE-RUN' : (cardioType === 'rest' || !cardioType) ? 'REST DAY' : 'POST-RUN';
        
        return `
            <section class="section recovery-section">
                <div class="section-header">
                    <span class="section-title">${timingLabel} RECOVERY</span>
                    <span class="section-badge warning">${activeInjury.name}</span>
                </div>
                <div class="recovery-exercises-list">
                    ${exercises.map(ex => {
                        const isComplete = completedToday.includes(ex.name);
                        return `
                            <div class="recovery-exercise-item ${isComplete ? 'completed' : ''}"
                                 onclick="DailyView.completeRecoveryExercise('${ex.name.replace(/'/g, "\\'")}')">
                                <div class="recovery-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <div class="recovery-info">
                                    <div class="recovery-name">${ex.name}</div>
                                    <div class="recovery-desc">${ex.description}</div>
                                    <div class="recovery-freq">${ex.reps}</div>
                                </div>
                                <div class="recovery-xp">+${ex.xp || 5}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="recovery-progress">
                    ${completedToday.length}/${exercises.length} complete
                </div>
            </section>
        `;
    },
    
    /**
     * Mark a recovery exercise as complete
     */
    completeRecoveryExercise(exerciseName) {
        const todayKey = State.getTodayKey();
        
        if (!State._data.recoveryExercisesCompleted) {
            State._data.recoveryExercisesCompleted = {};
        }
        
        if (!State._data.recoveryExercisesCompleted[todayKey]) {
            State._data.recoveryExercisesCompleted[todayKey] = [];
        }
        
        const completed = State._data.recoveryExercisesCompleted[todayKey];
        
        if (!completed.includes(exerciseName)) {
            completed.push(exerciseName);
            
            // Award XP
            const exercise = InjuryDatabase?.EXERCISES ? 
                Object.values(InjuryDatabase.EXERCISES).find(e => e.name === exerciseName) : null;
            const xp = exercise?.xp || 5;
            App.awardXP(xp, 'discipline');
            
            State.save();
        }
        
        // Re-render
        App.render();
    },
    
    /**
     * Render Day Score card - gamification to keep users engaged
     */
    renderDayScore() {
        const score = this.calculateDayScore();
        
        // Get letter grade
        let grade = 'F';
        let gradeClass = 'poor';
        if (score >= 90) { grade = 'A'; gradeClass = 'excellent'; }
        else if (score >= 80) { grade = 'B'; gradeClass = 'good'; }
        else if (score >= 70) { grade = 'C'; gradeClass = 'ok'; }
        else if (score >= 60) { grade = 'D'; gradeClass = 'low'; }
        
        // Store the grade for stats view
        State.updateToday({ dayScore: score, dayGrade: grade });
        
        // Get motivational message
        let message = 'Start logging to build your score!';
        if (score >= 90) message = 'Crushing it! Perfect day incoming.';
        else if (score >= 80) message = 'Strong day. Push for that A!';
        else if (score >= 70) message = 'Good progress. Keep going!';
        else if (score >= 50) message = 'Room to improve. You got this.';
        else if (score > 0) message = 'Day is young. Make moves.';
        
        return `
            <div class="day-score-card">
                <div class="day-score-main">
                    <div class="day-score-grade ${gradeClass}">${grade}</div>
                    <div class="day-score-info">
                        <div class="day-score-label">TODAY'S SCORE</div>
                        <div class="day-score-value">${score}<span class="score-max">/100</span></div>
                        <div class="day-score-msg">${message}</div>
                    </div>
                </div>
                <div class="day-score-breakdown">
                    ${this.renderScoreBreakdown()}
                </div>
            </div>
        `;
    },
    
    /**
     * Calculate day score (0-100)
     */
    calculateDayScore() {
        const todayData = State.getDayData();
        const goals = State.getGoals();
        const workout = Utils.getTodaysWorkout();
        const running = State.getRunningData();
        const todayKey = State.getTodayKey();
        
        let score = 0;
        let maxScore = 0;
        
        // 1. Workout completion (30 points max)
        // Check BOTH todayData.exercises AND liftHistory for today
        let exercisesDone = 0;
        const totalExercises = workout?.exercises?.length || 1;
        
        // Count from lift history (actual logged sets)
        // Also check swapped exercises
        if (workout?.exercises) {
            workout.exercises.forEach(ex => {
                // Check original exercise
                let todaySets = State.getTodaySets(ex.name, todayKey);
                
                // If no sets for original, check if there's a swap
                if (!todaySets || todaySets.length === 0) {
                    const swappedExercise = State.getExerciseSwap(ex.name);
                    if (swappedExercise) {
                        todaySets = State.getTodaySets(swappedExercise, todayKey);
                    }
                }
                
                if (todaySets && todaySets.length > 0) {
                    exercisesDone++;
                }
            });
        }
        
        // Also check boolean exercises (fallback)
        const booleanDone = todayData?.exercises 
            ? Object.values(todayData.exercises).filter(Boolean).length 
            : 0;
        exercisesDone = Math.max(exercisesDone, booleanDone);
        
        const workoutPercent = Math.min(1, exercisesDone / totalExercises);
        score += Math.round(workoutPercent * 30);
        maxScore += 30;
        
        // 2. Protein goal (25 points max)
        const protein = todayData?.protein || 0;
        const proteinGoal = goals?.dailyProtein || 150;
        const proteinPercent = Math.min(1, protein / proteinGoal);
        score += Math.round(proteinPercent * 25);
        maxScore += 25;
        
        // 3. Calorie adherence (20 points max) - within 10% of goal is perfect
        const calories = todayData?.calories || 0;
        const calorieGoal = goals?.dailyCalories || 2000;
        if (calories > 0) {
            const calorieDiff = Math.abs(calories - calorieGoal) / calorieGoal;
            const calorieScore = Math.max(0, 1 - calorieDiff);
            score += Math.round(calorieScore * 20);
        }
        maxScore += 20;
        
        // 4. Weight logged (10 points)
        if (todayData?.weight) {
            score += 10;
        }
        maxScore += 10;
        
        // 5. Running (if applicable, 15 points)
        if (running?.goal) {
            // Use helper to get run distance from either source
            const runDistance = State.getTodayRunDistance(todayKey);
            // Get today's scheduled run from the running view
            const todaysRun = typeof RunningView !== 'undefined' ? RunningView.getTodaysRun(running) : null;
            if (todaysRun && todaysRun.distance > 0 && todaysRun.type !== 'rest') {
                const runPercent = Math.min(1, runDistance / todaysRun.distance);
                score += Math.round(runPercent * 15);
                maxScore += 15;
            } else if (todaysRun?.type === 'rest' && runDistance > 0) {
                score += 15; // Bonus run on rest day
                maxScore += 15;
            }
            // If rest day and no run, don't add to maxScore
        }
        
        // Normalize to 100
        return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    },
    
    /**
     * Render score breakdown
     */
    renderScoreBreakdown() {
        const todayData = State.getDayData();
        const goals = State.getGoals();
        const workout = Utils.getTodaysWorkout();
        const todayKey = State.getTodayKey();
        
        // Count exercises from lift history (including swaps)
        let exercisesDone = 0;
        if (workout?.exercises) {
            workout.exercises.forEach(ex => {
                let todaySets = State.getTodaySets(ex.name, todayKey);
                
                // Check swapped exercise if original has no sets
                if (!todaySets || todaySets.length === 0) {
                    const swappedExercise = State.getExerciseSwap(ex.name);
                    if (swappedExercise) {
                        todaySets = State.getTodaySets(swappedExercise, todayKey);
                    }
                }
                
                if (todaySets && todaySets.length > 0) {
                    exercisesDone++;
                }
            });
        }
        // Fallback to boolean
        const booleanDone = todayData?.exercises 
            ? Object.values(todayData.exercises).filter(Boolean).length 
            : 0;
        exercisesDone = Math.max(exercisesDone, booleanDone);
        const totalExercises = workout?.exercises?.length || 0;
        
        const protein = todayData?.protein || 0;
        const proteinGoal = goals?.dailyProtein || 150;
        
        const calories = todayData?.calories || 0;
        const calorieGoal = goals?.dailyCalories || 2000;
        
        const weightLogged = !!todayData?.weight;
        
        // Running status - use helper to get from either source
        const running = State.getRunningData();
        const runDistance = State.getTodayRunDistance(todayKey);
        const todaysRun = running?.goal && typeof RunningView !== 'undefined' 
            ? RunningView.getTodaysRun(running) : null;
        const isRestDay = !todaysRun || todaysRun.type === 'rest' || todaysRun.distance === 0;
        const prescribedDistance = todaysRun?.distance || 0;
        const runPercent = prescribedDistance > 0 ? Math.round((runDistance / prescribedDistance) * 100) : 0;
        
        // Build running display
        let runDisplay = '--';
        let runDone = false;
        if (isRestDay) {
            runDisplay = 'REST';
            runDone = true; // Rest day counts as done
        } else if (runDistance > 0) {
            runDisplay = `${runPercent}%`;
            runDone = runPercent >= 50;
        } else {
            runDisplay = `0/${prescribedDistance.toFixed(1)}mi`;
        }
        
        return `
            <div class="score-item ${exercisesDone > 0 ? 'done' : ''}">
                <span class="score-dot"></span>
                <span>Workout</span>
                <span class="score-detail">${exercisesDone}/${totalExercises}</span>
            </div>
            ${running?.goal ? `
            <div class="score-item ${runDone ? 'done' : ''}">
                <span class="score-dot"></span>
                <span>Run</span>
                <span class="score-detail">${runDisplay}</span>
            </div>
            ` : ''}
            <div class="score-item ${protein >= proteinGoal * 0.5 ? 'done' : ''}">
                <span class="score-dot"></span>
                <span>Protein</span>
                <span class="score-detail">${Math.round(protein / proteinGoal * 100)}%</span>
            </div>
            <div class="score-item ${calories > 0 ? 'done' : ''}">
                <span class="score-dot"></span>
                <span>Calories</span>
                <span class="score-detail">${calories > 0 ? Math.round(calories / calorieGoal * 100) + '%' : '--'}</span>
            </div>
            <div class="score-item ${weightLogged ? 'done' : ''}">
                <span class="score-dot"></span>
                <span>Weight</span>
                <span class="score-detail">${weightLogged ? '✓' : '--'}</span>
            </div>
        `;
    },
    
    /**
     * Render workout order recommendation
     */
    renderWorkoutOrder() {
        const running = State.getRunningData();
        if (!running?.goal) return ''; // No running goal = no order needed
        
        // Direct mapping - getDay() matches BASE_WEEK index
        const dayOfWeek = new Date().getDay();
        const todaysSchedule = CONFIG.RUNNING.BASE_WEEK[dayOfWeek];
        
        if (!todaysSchedule || todaysSchedule.type === 'rest') return '';
        
        const workout = Utils.getTodaysWorkout();
        const orderLabels = {
            'lift_first': { order: ['LIFT', 'RUN'], icon: '1', color: 'strength' },
            'run_first': { order: ['RUN', 'LIFT'], icon: '1', color: 'cardio' },
            'lift_only': { order: ['LIFT'], icon: '!', color: 'strength' },
            'either': { order: ['EITHER'], icon: '~', color: 'neutral' },
        };
        
        const orderInfo = orderLabels[todaysSchedule.order] || orderLabels['either'];
        
        // Don't show if it's lift only day
        if (todaysSchedule.order === 'lift_only') {
            return '';
        }
        
        return `
            <div class="workout-order-card ${orderInfo.color}">
                <div class="order-header">
                    <span class="order-label">TODAY'S ORDER</span>
                </div>
                <div class="order-sequence">
                    ${orderInfo.order.map((item, i) => `
                        <span class="order-item ${item.toLowerCase()}">${i + 1}. ${item}</span>
                        ${i < orderInfo.order.length - 1 ? '<span class="order-arrow">→</span>' : ''}
                    `).join('')}
                </div>
                <div class="order-reason">${todaysSchedule.orderReason}</div>
                <details class="order-science">
                    <summary>Why?</summary>
                    <p>${todaysSchedule.science}</p>
                </details>
            </div>
        `;
    },
    
    /**
     * Render quick weight input
     */
    renderWeightInput() {
        const todayData = State.getDayData();
        const weight = todayData?.weight;
        const goals = State.getGoals();
        const targetWeight = goals?.targetWeight;
        
        return `
            <div class="quick-weight-card">
                <div class="weight-header">
                    <span class="weight-label">TODAY'S WEIGHT</span>
                    ${targetWeight ? `<span class="weight-target">Goal: ${targetWeight} lbs</span>` : ''}
                </div>
                <div class="weight-input-row">
                    <input type="number" 
                           class="weight-quick-input" 
                           id="quick-weight-input"
                           placeholder="${weight || '---'}"
                           value="${weight || ''}"
                           inputmode="decimal"
                           step="0.1">
                    <button class="weight-save-btn" onclick="DailyView.saveQuickWeight()">
                        ${weight ? 'UPDATE' : 'LOG'}
                    </button>
                </div>
                ${weight ? `<div class="weight-logged">Logged: ${weight} lbs</div>` : ''}
            </div>
        `;
    },
    
    /**
     * Save quick weight input
     */
    saveQuickWeight() {
        const input = document.getElementById('quick-weight-input');
        const weight = parseFloat(input.value);
        
        if (!weight || weight < 50 || weight > 500) {
            App.showNotification('Enter a valid weight');
            return;
        }
        
        State.logWeight(weight);
        App.awardXP(CONFIG.XP_REWARDS.LOG_WEIGHT, 'health');
        App.showNotification(`Weight logged: ${weight} lbs`);
        this.render();
    },

    /**
     * Render nutrition summary (display only, no logging)
     */
    renderNutritionSummary() {
        const todayData = State.getDayData();
        const goals = State.getGoals();
        
        const calories = todayData?.calories || 0;
        const protein = todayData?.protein || 0;
        const calGoal = goals?.dailyCalories || 2000;
        const protGoal = goals?.dailyProtein || 150;
        
        const calPercent = Math.min(100, Math.round((calories / calGoal) * 100));
        const protPercent = Math.min(100, Math.round((protein / protGoal) * 100));
        
        return `
            <div class="nutrition-summary-card" onclick="App.navigateTo('food')">
                <div class="nutri-row">
                    <div class="nutri-item">
                        <span class="nutri-label">CALORIES</span>
                        <span class="nutri-value">${calories} <span class="nutri-goal">/ ${calGoal}</span></span>
                        <div class="nutri-bar"><div class="nutri-fill ${calPercent > 100 ? 'over' : ''}" style="width: ${calPercent}%"></div></div>
                    </div>
                    <div class="nutri-item">
                        <span class="nutri-label">PROTEIN</span>
                        <span class="nutri-value">${protein}g <span class="nutri-goal">/ ${protGoal}g</span></span>
                        <div class="nutri-bar"><div class="nutri-fill protein ${protPercent >= 100 ? 'hit' : ''}" style="width: ${protPercent}%"></div></div>
                    </div>
                </div>
                <div class="nutri-hint">Tap to log food</div>
            </div>
        `;
    },

    /**
     * Render debt section (only if has debt)
     */
    renderDebt() {
        const debt = State.getDebt();
        
        if (debt.length === 0) return '';

        return `
            <div class="debt-section">
                <div class="debt-header">WORKOUT DEBT</div>
                ${debt.map((d, idx) => `
                    <div class="debt-item">
                        <div>
                            <div class="debt-type">${d.type}</div>
                            <div class="debt-date">Missed ${d.date}</div>
                        </div>
                        <button class="debt-clear-btn" onclick="App.clearDebt(${idx})">CLEAR</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render volume alerts (under MEV or at MRV warnings)
     * Uses per-muscle-group volume landmarks
     */
    renderVolumeAlerts() {
        // Check if there's enough lift history (need at least 2 weeks of data)
        const liftHistory = State._data?.liftHistory || {};
        const allEntries = Object.values(liftHistory).flat();
        
        // Need at least 10 lift entries before showing volume warnings
        if (allEntries.length < 10) return '';
        
        // Check if user has been training for at least 2 weeks
        const days = State.getAllDayKeys();
        if (days.length < 14) return '';
        
        const volumes = State.getAllWeeklyVolumes();
        
        const alerts = [];
        
        // Check each tracked muscle group
        const mainGroups = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'biceps', 'triceps', 'glutes', 'core'];
        
        for (const group of mainGroups) {
            const vol = volumes[group] || { sets: 0 };
            const sets = vol.sets;
            
            // Get per-muscle-group landmarks
            const { MEV, MRV } = Utils.getVolumeLandmarks(group);
            
            // Check if this muscle group has been trained in any previous week
            const muscleExercises = CONFIG.MUSCLE_GROUPS[group] || [];
            const hasHistoryForMuscle = muscleExercises.some(ex => (liftHistory[ex]?.length || 0) > 2);
            
            if (sets >= MRV) {
                // At or over MRV - recovery risk
                alerts.push({
                    type: 'high',
                    muscle: group,
                    message: `${group.toUpperCase()} at MRV (${sets}/${MRV} sets). Consider reducing volume to recover.`
                });
            } else if (sets >= MRV - 2 && sets < MRV) {
                // Approaching MRV
                alerts.push({
                    type: 'warning',
                    muscle: group,
                    message: `${group.toUpperCase()} approaching MRV (${sets}/${MRV} sets). Monitor recovery.`
                });
            } else if (sets < MEV && sets > 0 && hasHistoryForMuscle) {
                // Under MEV - but only if they've trained this muscle group before
                const needed = MEV - sets;
                alerts.push({
                    type: 'low',
                    muscle: group,
                    message: `${group.toUpperCase()} under MEV (${sets}/${MEV} sets). Add ${needed} more sets this week.`
                });
            }
        }

        if (alerts.length === 0) return '';

        // Show max 2 alerts to keep it concise
        const displayAlerts = alerts.slice(0, 2);

        return `
            <div class="volume-alerts">
                ${displayAlerts.map(alert => `
                    <div class="volume-alert ${alert.type}">
                        <span class="alert-icon">${alert.type === 'low' ? '!' : alert.type === 'high' ? '!!' : '!'}</span>
                        <span class="alert-text">${alert.message}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
};


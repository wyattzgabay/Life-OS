/**
 * WORKOUT.JS
 * Workout list and habit list components
 */

const Workout = {
    /**
     * Check if an exercise is a recovery/mobility exercise
     * These get intelligent logging based on training state
     */
    isRecoveryExercise(exerciseName) {
        const recoveryKeywords = [
            'foam roll', 'stretch', 'mobility', 'pigeon', '90/90',
            'hip flexor', 'dead hang', 'wall slide', 'thoracic',
            'lacrosse ball', 'massage', 'recovery'
        ];
        const name = exerciseName.toLowerCase();
        return recoveryKeywords.some(keyword => name.includes(keyword));
    },

    /**
     * Render today's workout section
     */
    renderWorkoutSection() {
        const workout = Utils.getTodaysWorkout();
        const todayData = State.getDayData();
        const exercisesDone = Object.values(todayData?.exercises || {}).filter(Boolean).length;

        // Build adjustment banner if needed
        let adjustmentBanner = '';
        if (workout.isDeload) {
            adjustmentBanner = `
                <div class="workout-adjustment deload">
                    <span class="adjustment-icon">⟳</span>
                    <span class="adjustment-text">${workout.deloadNote}</span>
                </div>
            `;
        } else if (workout.volumeAdjusted && workout.adjustmentNotes?.length > 0) {
            adjustmentBanner = `
                <div class="workout-adjustment volume">
                    <span class="adjustment-icon">◆</span>
                    <span class="adjustment-text">VOLUME ADJUSTED: ${workout.adjustmentNotes.join(' | ')}</span>
                </div>
            `;
        }

        // Build alerts if any
        let alertsHtml = '';
        if (workout.volumeAlerts?.length > 0) {
            alertsHtml = workout.volumeAlerts.map(alert => `
                <div class="workout-alert ${alert.type}">
                    ${alert.message}
                </div>
            `).join('');
        }

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">TODAY'S TRAINING</span>
                    <span class="section-badge">${workout.name}</span>
                </div>
                ${adjustmentBanner}
                ${alertsHtml}
                <div class="workout-list">
                    ${workout.exercises.map((ex, idx) => this.renderWorkoutItem(ex, idx, todayData)).join('')}
                </div>
            </section>
        `;
    },

    /**
     * Render a single workout item
     */
    renderWorkoutItem(exercise, index, todayData) {
        const completed = todayData?.exercises?.[index] || false;
        const workout = Utils.getTodaysWorkout();
        const isLift = workout.type === 'lift';
        const isPosture = exercise.posture || false;
        
        // Check if this exercise has been swapped today
        const swappedName = State.getExerciseSwap(exercise.name);
        const displayName = swappedName || exercise.name;
        const wasSwapped = swappedName !== null;
        
        // For lift exercises, check today's logged sets (use swapped name if applicable)
        const todayKey = State.getTodayKey();
        const liftHistory = State._data?.liftHistory?.[displayName] || [];
        const todayEntry = liftHistory.find(e => e.date === todayKey);
        const todaySets = todayEntry?.sets?.length || 0;
        
        // Parse target sets from detail string (e.g., "4×10" → 4, "3×12 each" → 3)
        let targetSets = exercise.targetSets || 3;
        if (exercise.detail) {
            const match = exercise.detail.match(/^(\d+)[×x]/i);
            if (match) {
                targetSets = parseInt(match[1]);
            }
        }
        // Apply volume adjustment if present
        if (exercise.volumeAdjusted && exercise.targetSets) {
            targetSets = exercise.targetSets;
        }
        
        // Determine status: LOG, PARTIAL, COMPLETE
        let status = 'log';
        let statusText = 'LOG';
        let statusClass = '';
        
        if (isLift) {
            if (todaySets >= targetSets) {
                status = 'complete';
                statusText = 'DONE';
                statusClass = 'status-complete';
            } else if (todaySets > 0) {
                status = 'partial';
                statusText = `${todaySets}/${targetSets}`;
                statusClass = 'status-partial';
            } else {
                status = 'log';
                statusText = 'LOG';
                statusClass = '';
            }
        }
        
        // Volume adjustment indicator - show +1, +2, -1, -2 (change amount, not target)
        let volumeIndicator = '';
        if (exercise.volumeAdjusted && exercise.adjustmentType) {
            const amount = exercise.targetSets - (exercise.originalSets || 3);
            if (amount !== 0) {
                const sign = amount > 0 ? '+' : '';
                const color = amount < 0 ? 'reduce' : 'increase';
                volumeIndicator = `<span class="volume-adj ${color}" title="${exercise.adjustmentReason}">${sign}${amount}</span>`;
            }
        }
        
        // Deload indicator
        let deloadIndicator = '';
        if (exercise.deloadAdjusted) {
            deloadIndicator = `<span class="deload-badge">DELOAD</span>`;
        }
        
        // Swapped indicator
        let swappedIndicator = '';
        if (wasSwapped) {
            swappedIndicator = `<span class="swapped-badge">SWAPPED</span>`;
        }
        
        // Determine click action based on exercise type
        let clickAction;
        if (isLift) {
            clickAction = `LiftLogger.open('${displayName.replace(/'/g, "\\'")}')`;
        } else if (this.isRecoveryExercise(exercise.name)) {
            // Recovery/mobility exercises get intelligent logging
            clickAction = `RecoveryLogger.open('${exercise.name.replace(/'/g, "\\'")}', ${index})`;
        } else {
            // Simple toggle for other exercises
            clickAction = `App.toggleExercise(${index})`;
        }
        
        // Item classes
        const itemClasses = [
            'workout-item',
            isLift ? 'lift-item' : '',
            isPosture ? 'posture-item' : '',
            status === 'complete' ? 'completed' : '',
            status === 'partial' ? 'partial' : '',
            wasSwapped ? 'swapped' : ''
        ].filter(Boolean).join(' ');

        return `
            <div class="${itemClasses}" onclick="${clickAction}">
                <div class="workout-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <div class="workout-info">
                    <div class="workout-name">
                        ${displayName}
                        ${isPosture ? '<span class="posture-badge">POSTURE</span>' : ''}
                        ${swappedIndicator}
                        ${volumeIndicator}
                        ${deloadIndicator}
                    </div>
                    <div class="workout-detail">
                        ${exercise.detail}
                    </div>
                </div>
                ${isLift ? `
                    <div class="workout-log-btn ${statusClass}">${statusText}</div>
                ` : `
                    <div class="workout-xp">+${exercise.xp}</div>
                `}
            </div>
        `;
    },

    /**
     * Render habits section
     */
    renderHabitsSection() {
        const todayData = State.getDayData();
        const habitsDone = Object.values(todayData?.habits || {}).filter(Boolean).length;

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">DAILY HABITS</span>
                    <span class="section-count">${habitsDone}/${CONFIG.HABITS.length}</span>
                </div>
                <div class="habit-list">
                    ${CONFIG.HABITS.map(habit => this.renderHabitItem(habit, todayData)).join('')}
                </div>
            </section>
        `;
    },

    /**
     * Render a single habit item
     */
    renderHabitItem(habit, todayData) {
        const completed = todayData?.habits?.[habit.id] || false;

        return `
            <div class="habit-item ${completed ? 'completed' : ''}" 
                 onclick="App.toggleHabit('${habit.id}')">
                <div class="habit-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <span class="habit-name">${habit.name}</span>
                <span class="habit-xp">+${habit.xp}</span>
            </div>
        `;
    },

    /**
     * Render streaks bar
     */
    renderStreaksBar() {
        const dailyStreak = Utils.getDailyStreak();
        const workoutStreak = Utils.getWorkoutStreak();
        const proteinStreak = Utils.getProteinStreak();

        return `
            <section class="section">
                <div class="streaks-bar">
                    <div class="streak-item">
                        <div class="streak-count">${dailyStreak}</div>
                        <div class="streak-label">STREAK</div>
                    </div>
                    <div class="streak-divider"></div>
                    <div class="streak-item">
                        <div class="streak-count">${workoutStreak}</div>
                        <div class="streak-label">TRAIN</div>
                    </div>
                    <div class="streak-divider"></div>
                    <div class="streak-item">
                        <div class="streak-count">${proteinStreak}</div>
                        <div class="streak-label">PROTEIN</div>
                    </div>
                </div>
            </section>
        `;
    }
};


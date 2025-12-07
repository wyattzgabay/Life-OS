/**
 * RECOVERY-LOGGER.JS
 * Intelligent mobility/recovery tracking
 * 
 * Turns static "Foam Roll Full Body" into smart recommendations
 * based on training state and MRV proximity
 */

const RecoveryLogger = {
    currentExercise: null,
    exerciseIndex: null,
    selectedAreas: new Set(),

    // Body areas and their associated muscle groups
    BODY_AREAS: {
        'Upper Back': ['back', 'shoulders'],
        'Lower Back': ['back', 'glutes'],
        'Chest': ['chest'],
        'Shoulders': ['shoulders'],
        'Quads': ['quads'],
        'Hamstrings': ['hamstrings'],
        'Glutes': ['glutes'],
        'Calves': ['calves'],
        'Hip Flexors': ['quads', 'glutes'],
        'IT Band': ['quads', 'glutes'],
        'Lats': ['back'],
        'Triceps': ['triceps'],
        'Biceps': ['biceps'],
    },

    /**
     * Open the recovery logger modal
     * @param {string} exerciseName - Name of the exercise
     * @param {number} index - Exercise index in today's workout
     */
    open(exerciseName, index) {
        this.currentExercise = exerciseName;
        this.exerciseIndex = index;
        this.selectedAreas = new Set();

        const modal = document.getElementById('logger-modal');
        if (!modal) return;

        modal.innerHTML = this.render();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    /**
     * Close the modal
     */
    close() {
        const modal = document.getElementById('logger-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.innerHTML = '';
        }
        document.body.style.overflow = '';
        this.currentExercise = null;
        this.exerciseIndex = null;
        this.selectedAreas.clear();
    },

    /**
     * Get prioritized body areas based on training fatigue
     * Areas with higher volume relative to MRV should be prioritized
     */
    getPrioritizedAreas() {
        const volumes = State.getAllWeeklyVolumes();
        const areaScores = [];

        for (const [area, muscles] of Object.entries(this.BODY_AREAS)) {
            let maxScore = 0;
            let maxMuscle = null;
            let reason = '';

            for (const muscle of muscles) {
                const volume = volumes[muscle] || { sets: 0 };
                const landmarks = CONFIG.VOLUME_LANDMARKS?.[muscle] || CONFIG.VOLUME_LANDMARKS?.default || { MEV: 6, MAV: 14, MRV: 20 };
                
                // Calculate fatigue score (% of MRV used)
                const score = volume.sets / landmarks.MRV;
                
                if (score > maxScore) {
                    maxScore = score;
                    maxMuscle = muscle;
                    
                    if (score >= 0.9) {
                        reason = `${muscle.toUpperCase()} at ${Math.round(score * 100)}% MRV - needs recovery`;
                    } else if (score >= 0.7) {
                        reason = `${muscle.toUpperCase()} at ${Math.round(score * 100)}% MRV - moderate fatigue`;
                    } else if (score >= 0.5) {
                        reason = `${muscle.toUpperCase()} trained this week`;
                    } else {
                        reason = `${muscle.toUpperCase()} - light recovery`;
                    }
                }
            }

            areaScores.push({
                area,
                score: maxScore,
                muscle: maxMuscle,
                reason,
                sets: volumes[maxMuscle]?.sets || 0
            });
        }

        // Sort by score (highest fatigue first)
        return areaScores.sort((a, b) => b.score - a.score);
    },

    /**
     * Get exercise-specific instructions
     */
    getExerciseInstructions() {
        const exerciseName = this.currentExercise?.toLowerCase() || '';
        
        if (exerciseName.includes('foam roll')) {
            return {
                title: 'FOAM ROLLING',
                instruction: 'Roll each area for 60-90 seconds. Focus on tender spots.',
                science: 'Foam rolling reduces muscle soreness and improves range of motion (Cheatham et al. 2015)'
            };
        } else if (exerciseName.includes('stretch')) {
            return {
                title: 'STRETCHING',
                instruction: 'Hold each stretch for 30-60 seconds. Breathe deeply.',
                science: 'Static stretching post-workout improves flexibility (Page 2012)'
            };
        } else if (exerciseName.includes('mobility')) {
            return {
                title: 'MOBILITY WORK',
                instruction: 'Move through full range of motion with control.',
                science: 'Active mobility improves joint health and movement quality'
            };
        }
        
        return {
            title: 'RECOVERY',
            instruction: 'Focus on areas that feel tight or fatigued.',
            science: 'Targeted recovery accelerates adaptation'
        };
    },

    /**
     * Toggle selection of a body area
     */
    toggleArea(area) {
        if (this.selectedAreas.has(area)) {
            this.selectedAreas.delete(area);
        } else {
            this.selectedAreas.add(area);
        }
        this.updateUI();
    },

    /**
     * Select all recommended areas (top 5 by fatigue)
     */
    selectRecommended() {
        const prioritized = this.getPrioritizedAreas();
        this.selectedAreas.clear();
        prioritized.slice(0, 5).forEach(item => {
            this.selectedAreas.add(item.area);
        });
        this.updateUI();
    },

    /**
     * Update UI after selection change
     */
    updateUI() {
        document.querySelectorAll('.recovery-area-item').forEach(item => {
            const area = item.dataset.area;
            if (this.selectedAreas.has(area)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });

        const completeBtn = document.querySelector('.recovery-complete-btn');
        if (completeBtn) {
            completeBtn.textContent = this.selectedAreas.size > 0 
                ? `COMPLETE (${this.selectedAreas.size} AREAS)` 
                : 'SKIP';
        }
    },

    /**
     * Complete the exercise
     */
    complete() {
        // Log the recovery work
        if (this.selectedAreas.size > 0) {
            this.logRecovery();
        }

        // Mark exercise as done
        if (this.exerciseIndex !== null) {
            App.toggleExercise(this.exerciseIndex);
        }

        this.close();
        App.render();
    },

    /**
     * Log recovery work to state
     */
    logRecovery() {
        const todayKey = State.getTodayKey();
        
        if (!State._data.recoveryLog) {
            State._data.recoveryLog = [];
        }

        State._data.recoveryLog.push({
            date: todayKey,
            timestamp: new Date().toISOString(),
            exercise: this.currentExercise,
            areas: Array.from(this.selectedAreas),
            areaCount: this.selectedAreas.size
        });

        // Keep last 100 entries
        if (State._data.recoveryLog.length > 100) {
            State._data.recoveryLog = State._data.recoveryLog.slice(-100);
        }

        State.save();
    },

    /**
     * Render the recovery logger modal
     */
    render() {
        const prioritizedAreas = this.getPrioritizedAreas();
        const instructions = this.getExerciseInstructions();
        
        // Split into recommended (top 5) and other
        const recommended = prioritizedAreas.filter(a => a.score > 0.3).slice(0, 5);
        const other = prioritizedAreas.filter(a => !recommended.includes(a));

        return `
            <div class="modal-overlay" onclick="RecoveryLogger.close()">
                <div class="modal-sheet" onclick="event.stopPropagation()">
                    <div class="modal-handle"></div>
                    
                    <div class="recovery-header">
                        <div class="recovery-title">${instructions.title}</div>
                        <div class="recovery-exercise">${this.currentExercise}</div>
                    </div>
                    
                    <div class="recovery-instruction">
                        ${instructions.instruction}
                    </div>
                    
                    ${recommended.length > 0 ? `
                        <div class="recovery-section">
                            <div class="recovery-section-header">
                                <span class="recovery-section-title">RECOMMENDED (Based on Training)</span>
                                <button class="recovery-select-all" onclick="RecoveryLogger.selectRecommended()">
                                    SELECT ALL
                                </button>
                            </div>
                            <div class="recovery-areas">
                                ${recommended.map(item => this.renderAreaItem(item, true)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${other.length > 0 ? `
                        <div class="recovery-section">
                            <div class="recovery-section-header">
                                <span class="recovery-section-title">OTHER AREAS</span>
                            </div>
                            <div class="recovery-areas">
                                ${other.map(item => this.renderAreaItem(item, false)).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="recovery-science">
                        ${instructions.science}
                    </div>
                    
                    <div class="recovery-actions">
                        <button class="recovery-complete-btn" onclick="RecoveryLogger.complete()">
                            SKIP
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render a single area item
     */
    renderAreaItem(item, isRecommended) {
        const selected = this.selectedAreas.has(item.area);
        const fatigueLevel = item.score >= 0.9 ? 'high' : item.score >= 0.6 ? 'medium' : 'low';
        
        return `
            <div class="recovery-area-item ${selected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}" 
                 data-area="${item.area}"
                 onclick="RecoveryLogger.toggleArea('${item.area}')">
                <div class="area-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <div class="area-info">
                    <div class="area-name">${item.area}</div>
                    ${item.sets > 0 ? `
                        <div class="area-reason">${item.reason}</div>
                    ` : ''}
                </div>
                ${item.sets > 0 ? `
                    <div class="area-fatigue ${fatigueLevel}">
                        ${Math.round(item.score * 100)}%
                    </div>
                ` : ''}
            </div>
        `;
    }
};

// Make globally available
if (typeof window !== 'undefined') {
    window.RecoveryLogger = RecoveryLogger;
}


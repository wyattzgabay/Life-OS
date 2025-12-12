/**
 * LIFT-LOGGER.JS
 * Progressive overload logging modal
 * Shows last performance, suggestions, logs sets/reps/weight
 */

const LiftLogger = {
    currentExercise: null,
    originalExercise: null, // Track original for swapping
    currentSets: [],
    lastWeight: null,
    lastReps: null,
    workoutStartTime: null,
    lastSetTime: null,
    restTimerInterval: null,
    restSeconds: 0,
    sessionDateKey: null, // Capture date when opening to handle midnight edge case

    /**
     * Open lift logger for an exercise
     */
    open(exerciseName) {
        this.currentExercise = exerciseName;
        this.originalExercise = exerciseName;
        this.lastSetTime = null;
        this.restSeconds = 0;
        
        // IMPORTANT: Capture date NOW so midnight doesn't mess things up
        this.sessionDateKey = State.getTodayKey();
        
        // Load any sets already logged for this date/exercise
        this.currentSets = this.getSessionSets(exerciseName);
        
        // Pre-fill with last weight/reps from today's sets or previous session
        if (this.currentSets.length > 0) {
            const lastSet = this.currentSets[this.currentSets.length - 1];
            this.lastWeight = lastSet.weight;
            this.lastReps = lastSet.reps;
        } else {
            const lastLift = State.getLastLift(exerciseName);
            this.lastWeight = lastLift?.bestSet?.weight || null;
            this.lastReps = lastLift?.bestSet?.reps || null;
        }
        
        // Start workout timer if not already started
        if (!this.workoutStartTime) {
            this.workoutStartTime = Date.now();
        }
        
        const modal = document.getElementById('logger-modal');
        modal.innerHTML = this.renderModal(exerciseName);
        modal.classList.add('active');
        
        // Prevent body scroll when modal is open
        // Don't lock body scroll - let iOS handle keyboard naturally
        this._scrollY = window.scrollY;
        
        // Enable pull-down-to-dismiss
        if (typeof ModalGestures !== 'undefined') {
            ModalGestures.init(modal, () => this.close());
        }
        
        // Prevent close on outside click - require explicit close
        modal.onclick = (e) => {
            if (e.target === modal) {
                // Don't close, show hint instead
                App.showNotification('Tap SAVE or use X to close');
            }
        };
    },
    
    /**
     * Get sets for the session date (captured when opened)
     */
    getSessionSets(exerciseName) {
        const history = State._data?.liftHistory?.[exerciseName] || [];
        const dateKey = this.sessionDateKey || State.getTodayKey();
        
        // Find entry for this date
        const entry = history.find(entry => entry.date === dateKey);
        return entry?.sets ? [...entry.sets] : []; // Return copy to avoid mutation
    },

    /**
     * Render the lift logger modal
     */
    renderModal(exerciseName) {
        const lastLift = State.getLastLift(exerciseName);
        const pr = State.getPR(exerciseName);
        const suggestion = State.getProgressionSuggestion(exerciseName);
        const alternatives = CONFIG.EXERCISE_ALTERNATIVES[this.originalExercise] || [];

        return `
            <div class="modal-sheet lift-logger" onclick="event.stopPropagation()">
                <div class="modal-header-row">
                    <button class="modal-close" onclick="LiftLogger.close()">×</button>
                    <div class="modal-title">${exerciseName.toUpperCase()}</div>
                    ${alternatives.length > 0 ? `
                        <button class="swap-exercise-btn" onclick="LiftLogger.showAlternatives()">SWAP</button>
                    ` : '<div></div>'}
                </div>
                
                ${this.renderRestTimer()}
                ${this.renderLastPerformance(lastLift)}
                ${this.renderPR(pr)}
                ${this.renderSetInputs()}
                ${this.renderSetList()}
                
                <div class="lift-actions">
                    <button class="add-set-btn" onclick="LiftLogger.addSet()">
                        + ADD SET
                    </button>
                    <button class="save-btn" onclick="LiftLogger.save()" 
                            ${this.currentSets.length === 0 ? 'disabled' : ''}>
                        SAVE LIFT
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Render rest timer between sets
     */
    renderRestTimer() {
        if (this.currentSets.length === 0) return '';
        
        const mins = Math.floor(this.restSeconds / 60);
        const secs = this.restSeconds % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        let restClass = 'rest-ok';
        if (this.restSeconds > 180) restClass = 'rest-long';
        else if (this.restSeconds > 90) restClass = 'rest-ready';
        
        return `
            <div class="rest-timer ${restClass}">
                <span class="rest-label">REST</span>
                <span class="rest-time">${timeStr}</span>
                <button class="rest-reset" onclick="LiftLogger.resetRestTimer()">RESET</button>
            </div>
        `;
    },
    
    /**
     * Start rest timer
     */
    startRestTimer() {
        this.restSeconds = 0;
        this.lastSetTime = Date.now();
        
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
        }
        
        this.restTimerInterval = setInterval(() => {
            this.restSeconds++;
            const timerEl = document.querySelector('.rest-time');
            if (timerEl) {
                const mins = Math.floor(this.restSeconds / 60);
                const secs = this.restSeconds % 60;
                timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
                
                // Update class
                const container = document.querySelector('.rest-timer');
                if (container) {
                    container.classList.remove('rest-ok', 'rest-ready', 'rest-long');
                    if (this.restSeconds > 180) container.classList.add('rest-long');
                    else if (this.restSeconds > 90) container.classList.add('rest-ready');
                    else container.classList.add('rest-ok');
                }
            }
        }, 1000);
    },
    
    /**
     * Reset rest timer
     */
    resetRestTimer() {
        this.restSeconds = 0;
        this.startRestTimer();
    },
    
    /**
     * Show exercise alternatives
     */
    showAlternatives() {
        const alternatives = CONFIG.EXERCISE_ALTERNATIVES[this.originalExercise] || [];
        if (alternatives.length === 0) return;
        
        const modal = document.getElementById('logger-modal');
        modal.innerHTML = `
            <div class="modal-sheet lift-logger" onclick="event.stopPropagation()">
                <div class="modal-header-row">
                    <button class="modal-close" onclick="LiftLogger.open('${this.currentExercise}')">&larr;</button>
                    <div class="modal-title">SWAP EXERCISE</div>
                    <div></div>
                </div>
                
                <div class="alternatives-list">
                    <div class="alt-current">Current: ${this.currentExercise}</div>
                    ${alternatives.map(alt => `
                        <button class="alt-option" onclick="LiftLogger.swapTo('${alt.replace(/'/g, "\\'")}')">
                            ${alt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Swap to alternative exercise and save the swap
     */
    swapTo(newExercise) {
        // Save the swap to state so it persists
        State.saveExerciseSwap(this.originalExercise, newExercise);
        
        this.currentExercise = newExercise;
        this.open(this.currentExercise);
        // Keep originalExercise so swap button still works
        this.originalExercise = this.originalExercise; 
        App.showNotification(`Swapped to ${newExercise}`);
    },
    
    /**
     * Close - warns only if there are UNSAVED changes
     */
    close() {
        const savedSets = this.getSessionSets(this.currentExercise);
        const hasUnsavedChanges = this.currentSets.length !== savedSets.length ||
            JSON.stringify(this.currentSets) !== JSON.stringify(savedSets);
        
        if (hasUnsavedChanges) {
            this.showCustomConfirm('You have unsaved changes. Discard them?', () => {
                this.forceClose();
            });
            return;
        }
        
        this.forceClose();
    },
    
    /**
     * Force close without checking
     */
    forceClose() {
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
            this.restTimerInterval = null;
        }
        
        // Restore body scroll and close modal
        this.restoreBodyScroll();
        document.getElementById('logger-modal').classList.remove('active');
    },
    
    /**
     * Restore body scroll after modal closes
     */
    restoreBodyScroll() {
        // Scroll back to where user was
        window.scrollTo(0, this._scrollY || 0);
    },
    
    /**
     * Scroll modal to show inputs above keyboard
     */
    scrollToInputs() {
        setTimeout(() => {
            const inputRow = document.getElementById('set-input-row');
            const modalSheet = document.querySelector('.lift-logger');
            if (inputRow && modalSheet) {
                // Scroll the modal sheet to show inputs near top
                const inputTop = inputRow.offsetTop;
                modalSheet.scrollTo({ top: Math.max(0, inputTop - 100), behavior: 'smooth' });
            }
        }, 350);
    },
    
    /**
     * Show custom alert dialog (matches app style)
     */
    showCustomAlert(message) {
        const modal = document.getElementById('logger-modal');
        const alertHtml = `
            <div class="custom-dialog-overlay" onclick="LiftLogger.hideCustomDialog()">
                <div class="custom-dialog" onclick="event.stopPropagation()">
                    <div class="dialog-message">${message}</div>
                    <div class="dialog-buttons">
                        <button class="dialog-btn dialog-btn-primary" onclick="LiftLogger.hideCustomDialog()">OK</button>
                    </div>
                </div>
            </div>
        `;
        
        const dialogContainer = document.createElement('div');
        dialogContainer.id = 'custom-dialog-container';
        dialogContainer.innerHTML = alertHtml;
        modal.appendChild(dialogContainer);
    },
    
    /**
     * Show custom confirm dialog (matches app style)
     */
    showCustomConfirm(message, onConfirm) {
        const modal = document.getElementById('logger-modal');
        this._confirmCallback = onConfirm;
        
        const confirmHtml = `
            <div class="custom-dialog-overlay">
                <div class="custom-dialog" onclick="event.stopPropagation()">
                    <div class="dialog-message">${message}</div>
                    <div class="dialog-buttons">
                        <button class="dialog-btn dialog-btn-cancel" onclick="LiftLogger.hideCustomDialog()">CANCEL</button>
                        <button class="dialog-btn dialog-btn-confirm" onclick="LiftLogger.confirmDialog()">DISCARD</button>
                    </div>
                </div>
            </div>
        `;
        
        const dialogContainer = document.createElement('div');
        dialogContainer.id = 'custom-dialog-container';
        dialogContainer.innerHTML = confirmHtml;
        modal.appendChild(dialogContainer);
    },
    
    /**
     * Confirm the dialog action
     */
    confirmDialog() {
        this.hideCustomDialog();
        if (this._confirmCallback) {
            this._confirmCallback();
            this._confirmCallback = null;
        }
    },
    
    /**
     * Hide custom dialog
     */
    hideCustomDialog() {
        const container = document.getElementById('custom-dialog-container');
        if (container) {
            container.remove();
        }
    },

    /**
     * Render last performance section - cleaner summary
     */
    renderLastPerformance(lastLift) {
        if (!lastLift) {
            return `
                <div class="last-performance empty">
                    <span class="perf-label">LAST SESSION</span>
                    <span class="perf-value">First time - find your working weight</span>
                </div>
            `;
        }

        const daysAgo = this.getDaysAgo(lastLift.date);
        const numSets = lastLift.sets.length;
        
        // Find min and max weight used
        const weights = lastLift.sets.map(s => s.weight);
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);
        const maxReps = Math.max(...lastLift.sets.map(s => s.reps));
        
        // Summary: "4 sets @ 60-65 lbs, best: 10 reps"
        const weightRange = minWeight === maxWeight 
            ? `${minWeight} lbs` 
            : `${minWeight}-${maxWeight} lbs`;
        
        return `
            <div class="last-performance">
                <span class="perf-label">LAST SESSION (${daysAgo})</span>
                <div class="perf-summary">
                    ${numSets} sets @ ${weightRange}
                </div>
                <div class="perf-best">
                    Best: ${maxReps} reps @ ${maxWeight} lbs
                </div>
            </div>
        `;
    },

    /**
     * Render PR section - all-time best
     */
    renderPR(pr) {
        if (!pr) return '';

        return `
            <div class="pr-display">
                <span class="pr-label">ALL-TIME BEST</span>
                <span class="pr-value">${pr.reps} reps @ ${pr.weight} lbs</span>
                <span class="pr-e1rm">(~${pr.estimated1RM} est. 1RM)</span>
            </div>
        `;
    },

    /**
     * Render suggestion section - only show before completing target sets
     */
    renderSuggestion(suggestion) {
        if (!suggestion) return '';
        
        // Get target sets from exercise config
        const workout = Utils.getTodaysWorkout();
        const exercise = workout.exercises.find(e => e.name === this.currentExercise);
        let targetSets = 3;
        if (exercise?.detail) {
            const match = exercise.detail.match(/^(\d+)[×x]/i);
            if (match) targetSets = parseInt(match[1]);
        }
        
        // Don't show suggestion if we've already hit target
        if (this.currentSets.length >= targetSets) {
            return '';
        }

        return `
            <div class="suggestion-card">
                <span class="suggestion-label">SUGGESTED</span>
                <span class="suggestion-target">${suggestion.weight} lbs × ${suggestion.reps} reps</span>
                <span class="suggestion-reason">${suggestion.message}</span>
            </div>
        `;
    },

    /**
     * Render set input fields - simplified, no clutter
     */
    renderSetInputs() {
        // Use last entered values if available
        const defaultWeight = this.lastWeight || '';
        const defaultReps = this.lastReps || '';
        
        // Set guidance based on current set count
        const nextSetNum = this.currentSets.length + 1;
        const setGuidance = this.getSetGuidance(nextSetNum);
        
        // Check if bodyweight exercise
        const isBodyweight = this.isBodyweightExercise();
        const canWeight = this.canAddWeight();
        
        // For pure bodyweight (band pull aparts, etc), hide weight entirely
        // For weighted bodyweight (pull-ups, dips), show optional weight
        const showWeight = !isBodyweight || canWeight;
        const weightLabel = isBodyweight && canWeight ? 'ADDED WEIGHT' : 'WEIGHT';
        const weightPlaceholder = isBodyweight && canWeight ? '+lbs (optional)' : 'lbs';

        return `
            <div class="set-inputs">
                <div class="set-guidance">
                    <span class="set-number">SET ${nextSetNum}</span>
                    <span class="set-tip">${setGuidance}</span>
                </div>
                <div class="input-row ${!showWeight ? 'reps-only' : ''}" id="set-input-row">
                    ${showWeight ? `
                        <div class="input-col">
                            <label>${weightLabel}</label>
                            <input type="number" id="lift-weight" class="lift-input dark-input" 
                                   value="${isBodyweight ? '' : defaultWeight}" 
                                   placeholder="${weightPlaceholder}" inputmode="decimal"
                                   onfocus="this.select(); LiftLogger.scrollToInputs()"
                                   style="color-scheme: dark;">
                        </div>
                    ` : ''}
                    <div class="input-col ${!showWeight ? 'full-width' : ''}">
                        <label>REPS</label>
                        <input type="number" id="lift-reps" class="lift-input dark-input" 
                               value="${defaultReps}" placeholder="reps" inputmode="numeric"
                               onfocus="this.select(); LiftLogger.scrollToInputs()"
                               style="color-scheme: dark;">
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get guidance text for current set
     * Dynamically based on target sets and current session performance
     */
    /**
     * Get target reps for current exercise from workout detail
     */
    getTargetReps() {
        const workout = Utils.getTodaysWorkout();
        const exercise = workout?.exercises?.find(e => e.name === this.currentExercise);
        if (exercise?.detail) {
            // Parse "4x6" or "3×8-12" format
            const match = exercise.detail.match(/\d+[×x](\d+)(?:-(\d+))?/i);
            if (match) {
                // Return lower end of range if range exists, otherwise exact number
                return parseInt(match[1]);
            }
        }
        return 8; // Default
    },
    
    /**
     * Check if exercise is bodyweight (no external weight needed)
     */
    isBodyweightExercise() {
        const bodyweightExercises = [
            'Pull-ups', 'Pull-Ups', 'Chin-ups', 'Chin-Ups', 'Dips', 
            'Push-ups', 'Push-Ups', 'Assisted Pull-ups', 'Assisted Pull-Ups',
            'Band Pull-Aparts', 'Hanging Leg Raises', 'Planks', 'Plank Hold',
            'Dead Hang', 'Inverted Rows'
        ];
        return bodyweightExercises.some(bw => 
            this.currentExercise?.toLowerCase().includes(bw.toLowerCase())
        );
    },
    
    /**
     * Check if exercise can have added weight (weighted bodyweight)
     */
    canAddWeight() {
        const weightableBodyweight = [
            'Pull-ups', 'Pull-Ups', 'Chin-ups', 'Chin-Ups', 'Dips'
        ];
        return weightableBodyweight.some(ex => 
            this.currentExercise?.toLowerCase().includes(ex.toLowerCase())
        );
    },

    getSetGuidance(setNum) {
        const suggestion = State.getProgressionSuggestion(this.currentExercise);
        
        // Get target sets from exercise config
        const workout = Utils.getTodaysWorkout();
        const exercise = workout?.exercises?.find(e => e.name === this.currentExercise);
        let targetSets = 3;
        if (exercise?.detail) {
            const match = exercise.detail.match(/^(\d+)[×x]/i);
            if (match) targetSets = parseInt(match[1]);
        }
        
        // Calculate current session stats
        const avgWeight = this.currentSets.length > 0 
            ? Math.round(this.currentSets.reduce((sum, s) => sum + s.weight, 0) / this.currentSets.length)
            : null;
        const avgReps = this.currentSets.length > 0
            ? Math.round(this.currentSets.reduce((sum, s) => sum + s.reps, 0) / this.currentSets.length)
            : null;
        
        // PAST TARGET - suggest moving on
        if (setNum > targetSets) {
            return `Target complete (${targetSets} sets) - move to next exercise`;
        }
        
        // FINAL SET
        if (setNum === targetSets) {
            if (avgReps && avgReps >= 10) {
                return `Final set - you're strong today, push for max reps`;
            }
            return `Final set (${setNum}/${targetSets}) - leave nothing in the tank`;
        }
        
        // First set
        if (setNum === 1) {
            if (suggestion) {
                return `Target: ${suggestion.weight} × ${suggestion.reps}`;
            }
            return 'First set - find your working weight';
        }
        
        // Middle sets - dynamic based on performance
        if (this.currentSets.length > 0) {
            const lastSet = this.currentSets[this.currentSets.length - 1];
            const targetReps = this.getTargetReps();
            
            if (lastSet.reps >= 12) {
                return `Strong ${lastSet.reps} reps - consider +5 lbs`;
            } else if (lastSet.reps < targetReps - 1) {
                // Only suggest dropping weight if significantly below target
                return `Only ${lastSet.reps} reps - stay at this weight or drop 5`;
            }
            return `Set ${setNum}/${targetSets} - match ${lastSet.weight} × ${lastSet.reps}`;
        }
        
        return `Set ${setNum}/${targetSets}`;
    },

    /**
     * Render logged sets list
     */
    renderSetList() {
        if (this.currentSets.length === 0) {
            return `<div class="sets-list empty">No sets logged yet</div>`;
        }
        
        const isBodyweight = this.isBodyweightExercise();

        return `
            <div class="sets-list">
                ${this.currentSets.map((set, i) => `
                    <div class="logged-set">
                        <span class="set-num">SET ${i + 1}</span>
                        <span class="set-data">${set.weight > 0 ? `${set.weight} × ` : ''}${set.reps}${set.weight === 0 && isBodyweight ? ' reps' : ''}</span>
                        <button class="set-remove" onclick="LiftLogger.removeSet(${i})">×</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Add a set
     */
    addSet() {
        const weightEl = document.getElementById('lift-weight');
        const weight = weightEl ? parseFloat(weightEl.value) || 0 : 0;
        const reps = parseInt(document.getElementById('lift-reps').value);
        
        const isBodyweight = this.isBodyweightExercise();
        const showWeight = !isBodyweight || this.canAddWeight();

        // For bodyweight exercises, only require reps
        if (showWeight && !weight && !isBodyweight) {
            this.showCustomAlert('Enter weight and reps');
            return;
        }
        if (!reps) {
            this.showCustomAlert('Enter reps');
            return;
        }

        this.currentSets.push({ weight, reps });
        
        // Save last values so they persist for next set
        this.lastWeight = weight;
        this.lastReps = reps;
        
        // Start rest timer after adding set
        this.startRestTimer();
        
        // Preserve scroll position
        const modalSheet = document.querySelector('.modal-sheet.lift-logger');
        const scrollTop = modalSheet ? modalSheet.scrollTop : 0;
        
        // Re-render modal
        const modal = document.getElementById('logger-modal');
        modal.innerHTML = this.renderModal(this.currentExercise);
        
        // Restore scroll position
        const newModalSheet = document.querySelector('.modal-sheet.lift-logger');
        if (newModalSheet) {
            newModalSheet.scrollTop = scrollTop;
        }
        
        // Show feedback
        App.showNotification(`Set ${this.currentSets.length}: ${weight} × ${reps}`);
    },

    /**
     * Remove a set
     */
    removeSet(index) {
        // Preserve scroll position
        const modalSheet = document.querySelector('.modal-sheet.lift-logger');
        const scrollTop = modalSheet ? modalSheet.scrollTop : 0;
        
        this.currentSets.splice(index, 1);
        
        // Re-render modal
        const modal = document.getElementById('logger-modal');
        modal.innerHTML = this.renderModal(this.currentExercise);
        
        // Restore scroll position
        const newModalSheet = document.querySelector('.modal-sheet.lift-logger');
        if (newModalSheet) {
            newModalSheet.scrollTop = scrollTop;
        }
    },

    /**
     * Save the lift - updates session date's entry or creates new one
     * Uses sessionDateKey captured when opened (handles midnight edge case)
     */
    save() {
        // Check how many sets we had before (to calculate XP for new sets only)
        const previousSets = this.getSessionSets(this.currentExercise);
        const newSetsCount = this.currentSets.length - previousSets.length;

        // If no sets left (all deleted), remove the entry
        if (this.currentSets.length === 0) {
            State.removeLiftEntry(this.currentExercise, this.sessionDateKey);
            
            // Stop rest timer
            if (this.restTimerInterval) {
                clearInterval(this.restTimerInterval);
                this.restTimerInterval = null;
            }
            
            // Restore body scroll and close modal
            this.restoreBodyScroll();
            document.getElementById('logger-modal').classList.remove('active');
            App.render();
            return;
        }

        // Log the lift using the captured session date
        const result = State.logLift(this.currentExercise, this.currentSets, this.sessionDateKey);
        
        // Stop rest timer
        if (this.restTimerInterval) {
            clearInterval(this.restTimerInterval);
            this.restTimerInterval = null;
        }
        
        // Restore body scroll and close modal
        this.restoreBodyScroll();
        document.getElementById('logger-modal').classList.remove('active');

        // Only award XP for NEW sets added this session (not for edits/deletions)
        if (newSetsCount > 0) {
            const baseXP = 4 + (newSetsCount * 2); // New sets only
            const prBonus = result.isPR ? 25 : 0;
            const totalXP = baseXP + prBonus;
            App.awardXP(totalXP, 'strength');
        }

        // Show PR celebration if hit
        if (result.isPR) {
            this.showPRCelebration(result);
        }

        // Re-render (exercise status will update based on current sets)
        App.render();
    },

    /**
     * Show PR celebration
     */
    showPRCelebration(result) {
        const overlay = document.getElementById('completion-overlay');
        
        overlay.innerHTML = `
            <div class="pr-celebration">
                <div class="pr-icon">PR</div>
                <div class="pr-title">NEW PERSONAL RECORD!</div>
                <div class="pr-lift">${this.currentExercise}</div>
                <div class="pr-stats">
                    <div class="pr-new">~${result.estimated1RM} 1RM</div>
                    ${result.previousBest ? `
                        <div class="pr-old">Previous: ~${result.previousBest.estimated1RM}</div>
                        <div class="pr-gain">+${result.estimated1RM - result.previousBest.estimated1RM} lbs!</div>
                    ` : ''}
                </div>
                <div class="pr-bonus">+25 BONUS XP</div>
            </div>
        `;

        overlay.classList.add('active');

        setTimeout(() => {
            overlay.classList.remove('active');
        }, 3000);
    },

    /**
     * Get days ago text
     */
    getDaysAgo(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        return `${diffDays} days ago`;
    }
};


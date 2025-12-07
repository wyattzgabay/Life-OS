/**
 * RECOVERY-LOGGER.JS
 * Intelligent mobility/recovery tracking
 * 
 * Each exercise has specific data:
 * - type: 'foam_roll' (select areas), 'stretch' (fixed target), 'posture' (explains correction)
 * - targets: muscles/areas it works
 * - postureBenefit: for posture exercises, what it corrects
 * - technique: brief form cue
 * - science: research backing
 */

const RecoveryLogger = {
    currentExercise: null,
    exerciseIndex: null,
    selectedAreas: new Set(),
    loggedSets: [], // Track sets/reps/duration

    // Exercise database - each exercise analyzed independently
    EXERCISE_DATA: {
        // FOAM ROLLING - User selects which areas to roll
        'Foam Roll Full Body': {
            type: 'foam_roll',
            instruction: 'Roll each area 60-90 seconds. Pause on tender spots.',
            science: 'Self-myofascial release reduces DOMS and improves ROM (Cheatham et al. 2015)',
            selectAreas: true
        },

        // HIP STRETCHES - Fixed targets
        'Hip Flexor Stretch': {
            type: 'stretch',
            targets: ['Hip Flexors', 'Psoas', 'Rectus Femoris'],
            muscles: ['quads', 'glutes'],
            postureBenefit: 'Reduces anterior pelvic tilt. Tight hip flexors pull pelvis forward, causing lower back arch.',
            technique: 'Posterior pelvic tilt (tuck tailbone), squeeze glute of back leg. Feel stretch in front of hip.',
            science: 'Hip flexor tightness correlates with lower back pain (Janda 1987)',
            duration: '2 min each side'
        },
        'Pigeon Stretch': {
            type: 'stretch',
            targets: ['Piriformis', 'Glute Medius', 'External Hip Rotators'],
            muscles: ['glutes'],
            technique: 'Keep hips square. Front shin angle based on flexibility. Fold forward to deepen.',
            science: 'Targets deep hip rotators often tight from sitting. Relieves sciatic tension.',
            duration: '2 min each side'
        },
        '90/90 Hip Stretch': {
            type: 'stretch',
            targets: ['Hip Internal Rotators', 'Hip External Rotators', 'Adductors'],
            muscles: ['glutes', 'quads'],
            technique: 'Both knees at 90°. Sit tall, rotate between internal and external rotation.',
            science: 'Comprehensive hip mobility drill. Addresses both rotation patterns.',
            duration: '90 sec each position'
        },

        // POSTURE EXERCISES - Explain the correction
        'Wall Slides': {
            type: 'posture',
            targets: ['Lower Traps', 'Serratus Anterior', 'Rotator Cuff'],
            muscles: ['shoulders', 'back'],
            postureBenefit: 'Corrects rounded shoulders and forward head. Strengthens muscles that pull shoulders back and down.',
            technique: 'Back flat against wall. Arms in "goal post" position. Slide up while keeping contact.',
            science: 'Activates scapular stabilizers weakened by desk work (Sahrmann 2002)',
            duration: '3 sets of 15'
        },
        'Thoracic Spine Extensions': {
            type: 'posture',
            targets: ['Thoracic Erectors', 'Thoracic Spine Mobility'],
            muscles: ['back'],
            postureBenefit: 'Reverses upper back kyphosis (hunching). Improves overhead mobility and breathing.',
            technique: 'Foam roller at mid-back. Support head, extend over roller. Move roller up/down spine.',
            science: 'Thoracic mobility critical for shoulder health and posture (Neumann 2010)',
            duration: '2 sets of 10'
        },
        'Dead Hangs': {
            type: 'posture',
            targets: ['Lats', 'Shoulder Capsule', 'Grip', 'Spinal Decompression'],
            muscles: ['back', 'shoulders'],
            postureBenefit: 'Decompresses spine. Stretches lats which when tight contribute to rounded shoulders.',
            technique: 'Full hang, relax shoulders. Let body weight create traction. Active hang = depress shoulders.',
            science: 'Traction relieves disc pressure. Lat flexibility improves overhead position.',
            duration: '3 sets of 30 sec'
        },
        'Band Pull-Aparts': {
            type: 'posture',
            targets: ['Rear Delts', 'Rhomboids', 'Middle Traps'],
            muscles: ['shoulders', 'back'],
            postureBenefit: 'Strengthens muscles that retract shoulder blades. Direct counter to forward shoulder posture.',
            technique: 'Arms straight, pull band apart by squeezing shoulder blades. Control the return.',
            science: 'Rear delt weakness common in desk workers. Key for shoulder balance.',
            duration: '3 sets of 20'
        },
        'Cable Face Pulls': {
            type: 'posture',
            targets: ['Rear Delts', 'External Rotators', 'Lower Traps'],
            muscles: ['shoulders'],
            postureBenefit: 'Combines external rotation with retraction. Addresses both rounded shoulders and internal rotation.',
            technique: 'Pull to face height, externally rotate at end. Elbows high, squeeze back.',
            science: 'External rotation strength prevents shoulder impingement (Reinold et al. 2009)',
            duration: '4 sets of 15'
        },
        'Reverse Pec Deck': {
            type: 'posture',
            targets: ['Rear Delts', 'Rhomboids'],
            muscles: ['shoulders', 'back'],
            postureBenefit: 'Strengthens posterior shoulder. Balances overdeveloped chest from pushing movements.',
            technique: 'Chest against pad. Lead with elbows, squeeze shoulder blades at contraction.',
            science: 'Posterior deltoid often undertrained relative to anterior (push/pull imbalance)',
            duration: '3 sets of 15'
        },
        'Glute Bridge Hold': {
            type: 'posture',
            targets: ['Glutes', 'Core Stabilizers'],
            muscles: ['glutes'],
            postureBenefit: 'Activates glutes which are inhibited by sitting. Strong glutes reduce anterior pelvic tilt.',
            technique: 'Drive through heels, squeeze glutes at top. Maintain neutral spine, don\'t hyperextend.',
            science: 'Gluteal amnesia from prolonged sitting affects pelvic alignment (McGill 2007)',
            duration: '3 sets of 30 sec'
        },

        // CORE/MOBILITY
        'Plank Hold': {
            type: 'strength',
            targets: ['Transverse Abdominis', 'Rectus Abdominis', 'Obliques'],
            muscles: ['core'],
            technique: 'Straight line from head to heels. Brace core like expecting a punch. Breathe.',
            science: 'Anti-extension exercise. Teaches core to resist spinal movement under load.',
            duration: '3 sets of 45 sec'
        },
        'Cable Woodchops': {
            type: 'strength',
            targets: ['Obliques', 'Transverse Abdominis', 'Hip Rotators'],
            muscles: ['core'],
            technique: 'Rotate through core, not arms. Hips and shoulders move together. Control the return.',
            science: 'Rotational core strength transfers to athletic movement and protects spine.',
            duration: '3 sets of 12 each side'
        },
        'Hanging Knee Raises': {
            type: 'strength',
            targets: ['Hip Flexors', 'Lower Abs', 'Grip'],
            muscles: ['core'],
            technique: 'Control the swing. Curl pelvis up at top, don\'t just lift knees. Slow negative.',
            science: 'Targets lower abdominals more than crunches. Decompresses spine while strengthening.',
            duration: '3 sets of 12'
        },
        'Cable Crunch': {
            type: 'strength',
            targets: ['Rectus Abdominis'],
            muscles: ['core'],
            technique: 'Hips stay fixed. Crunch by flexing spine, not pulling with arms. Squeeze at bottom.',
            science: 'Loaded spinal flexion. Effective for ab hypertrophy with proper form.',
            duration: '3 sets of 15'
        }
    },

    // Body areas for foam rolling (only used when type = 'foam_roll')
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
     * Get exercise data, with fallback for unknown exercises
     */
    getExerciseData(name) {
        // Direct match
        if (this.EXERCISE_DATA[name]) {
            return this.EXERCISE_DATA[name];
        }
        
        // Partial match (e.g., "Hip Flexor Stretch" matches "hip flexor")
        const lowerName = name.toLowerCase();
        for (const [key, data] of Object.entries(this.EXERCISE_DATA)) {
            if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
                return data;
            }
        }
        
        // Fallback for unknown exercises
        return {
            type: 'unknown',
            instruction: 'Complete this exercise with good form.',
            duration: 'As prescribed'
        };
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
        this.loggedSets = [];
        this.exerciseData = this.getExerciseData(exerciseName);

        const modal = document.getElementById('logger-modal');
        if (!modal) return;

        modal.innerHTML = this.render();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Enable pull-down-to-dismiss
        if (typeof ModalGestures !== 'undefined') {
            ModalGestures.init(modal, () => this.close());
        }
    },

    /**
     * Add a set to the log
     */
    addSet() {
        const data = this.exerciseData;
        let setData = {};

        // Check which input exists in the modal
        const durationInput = document.getElementById('recovery-duration');
        const repsInput = document.getElementById('recovery-reps');
        
        if (durationInput && durationInput.value) {
            const duration = parseInt(durationInput.value) || 0;
            if (duration > 0) {
                setData = { duration: duration, unit: 'seconds' };
            }
        } else if (repsInput && repsInput.value) {
            const reps = parseInt(repsInput.value) || 0;
            if (reps > 0) {
                setData = { reps: reps };
            }
        }

        // Only add if we have valid data
        if (setData.duration > 0 || setData.reps > 0) {
            this.loggedSets.push(setData);
            this.updateSetDisplay();
            // Keep value in input for quick repeated entry
        }
    },

    /**
     * Remove a set from the log
     */
    removeSet(index) {
        this.loggedSets.splice(index, 1);
        this.updateSetDisplay();
    },

    /**
     * Update the set display in the modal
     */
    updateSetDisplay() {
        const container = document.getElementById('logged-sets-container');
        const btn = document.querySelector('.recovery-complete-btn');
        
        if (container) {
            container.innerHTML = this.loggedSets.map((set, idx) => `
                <div class="logged-set-item">
                    <span class="set-number">SET ${idx + 1}</span>
                    <span class="set-value">${set.reps ? `${set.reps} reps` : `${set.duration}s`}</span>
                    <button class="set-remove" onclick="RecoveryLogger.removeSet(${idx})">×</button>
                </div>
            `).join('');
        }

        if (btn) {
            const hasData = this.loggedSets.length > 0;
            btn.textContent = hasData ? `SAVE (${this.loggedSets.length} SETS)` : 'SKIP';
            btn.classList.toggle('has-data', hasData);
        }
    },

    /**
     * Parse target sets/reps from duration string
     * e.g., "3 sets of 45 sec" -> { sets: 3, value: 45, unit: 'sec' }
     * e.g., "3×15" -> { sets: 3, value: 15, unit: 'reps' }
     * e.g., "2 min each side" -> { sets: 2, value: 120, unit: 'sec', perSide: true }
     */
    parseTarget(durationStr) {
        if (!durationStr) return { sets: 1, value: 30, unit: 'sec' };
        
        const str = durationStr.toLowerCase();
        
        // "3 sets of 45 sec"
        let match = str.match(/(\d+)\s*sets?\s*(?:of\s*)?(\d+)\s*(sec|min|reps?)?/i);
        if (match) {
            let value = parseInt(match[2]);
            const unit = match[3]?.includes('min') ? 'sec' : (match[3]?.includes('rep') ? 'reps' : 'sec');
            if (match[3]?.includes('min')) value *= 60;
            return { sets: parseInt(match[1]), value, unit };
        }
        
        // "3×15" or "3x15"
        match = str.match(/(\d+)[×x](\d+)/i);
        if (match) {
            return { sets: parseInt(match[1]), value: parseInt(match[2]), unit: 'reps' };
        }
        
        // "2 min each" or "90 sec each"
        match = str.match(/(\d+)\s*(min|sec).*each/i);
        if (match) {
            let value = parseInt(match[1]);
            if (match[2] === 'min') value *= 60;
            return { sets: 2, value, unit: 'sec', perSide: true };
        }
        
        // "30 sec" or "2 min"
        match = str.match(/(\d+)\s*(min|sec)/i);
        if (match) {
            let value = parseInt(match[1]);
            if (match[2] === 'min') value *= 60;
            return { sets: 1, value, unit: 'sec' };
        }
        
        return { sets: 3, value: 10, unit: 'reps' };
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
        this.loggedSets = [];
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
        // Log the recovery work if we have sets or areas
        if (this.loggedSets.length > 0 || this.selectedAreas.size > 0) {
            this.logRecovery();
        }

        // Mark exercise as done if we logged something
        if (this.exerciseIndex !== null && (this.loggedSets.length > 0 || this.selectedAreas.size > 0)) {
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

        const logEntry = {
            date: todayKey,
            timestamp: new Date().toISOString(),
            exercise: this.currentExercise,
            type: this.exerciseData?.type || 'unknown'
        };

        // Add sets data if logged
        if (this.loggedSets.length > 0) {
            logEntry.sets = [...this.loggedSets];
            logEntry.setCount = this.loggedSets.length;
            
            // Calculate totals
            const hasDuration = this.loggedSets[0]?.duration !== undefined;
            if (hasDuration) {
                logEntry.totalDuration = this.loggedSets.reduce((sum, s) => sum + (s.duration || 0), 0);
            } else {
                logEntry.totalReps = this.loggedSets.reduce((sum, s) => sum + (s.reps || 0), 0);
            }
        }

        // Add foam roll areas if selected
        if (this.selectedAreas.size > 0) {
            logEntry.areas = Array.from(this.selectedAreas);
            logEntry.areaCount = this.selectedAreas.size;
        }

        State._data.recoveryLog.push(logEntry);

        // Keep last 100 entries
        if (State._data.recoveryLog.length > 100) {
            State._data.recoveryLog = State._data.recoveryLog.slice(-100);
        }

        State.save();
    },

    /**
     * Render the recovery logger modal
     * Different layouts based on exercise type
     */
    render() {
        const data = this.exerciseData;
        
        // Route to appropriate renderer based on type
        if (data.type === 'foam_roll' || data.selectAreas) {
            return this.renderFoamRollModal(data);
        } else if (data.type === 'posture') {
            return this.renderPostureModal(data);
        } else if (data.type === 'stretch') {
            return this.renderStretchModal(data);
        } else if (data.type === 'strength') {
            return this.renderStrengthModal(data);
        } else {
            return this.renderGenericModal(data);
        }
    },

    /**
     * Render foam rolling modal (select areas based on fatigue)
     */
    renderFoamRollModal(data) {
        const prioritizedAreas = this.getPrioritizedAreas();
        const recommended = prioritizedAreas.filter(a => a.score > 0.3).slice(0, 5);
        const other = prioritizedAreas.filter(a => !recommended.includes(a));

        return `
            <div class="modal-overlay" onclick="RecoveryLogger.close()">
                <div class="modal-sheet" onclick="event.stopPropagation()">
                    <div class="modal-handle"></div>
                    
                    <div class="recovery-header">
                        <div class="recovery-title">FOAM ROLLING</div>
                        <div class="recovery-exercise">${this.currentExercise}</div>
                    </div>
                    
                    <div class="recovery-instruction">
                        ${data.instruction}
                    </div>
                    
                    ${recommended.length > 0 ? `
                        <div class="recovery-section">
                            <div class="recovery-section-header">
                                <span class="recovery-section-title">PRIORITY (Based on Training)</span>
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
                    
                    <div class="recovery-science">${data.science}</div>
                    
                    <div class="recovery-actions">
                        <button class="recovery-complete-btn" onclick="RecoveryLogger.complete()">
                            ${this.selectedAreas.size > 0 ? `COMPLETE (${this.selectedAreas.size} AREAS)` : 'SKIP'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render stretch modal (shows fixed targets, technique, purpose)
     */
    renderStretchModal(data) {
        const target = this.parseTarget(data.duration);
        const perSide = target.perSide ? ' (each side)' : '';
        
        return `
            <div class="modal-overlay" onclick="RecoveryLogger.close()">
                <div class="modal-sheet" onclick="event.stopPropagation()">
                    <div class="modal-handle"></div>
                    
                    <div class="recovery-header">
                        <div class="recovery-title">STRETCH</div>
                        <div class="recovery-exercise">${this.currentExercise}</div>
                        <div class="recovery-duration">Target: ${data.duration || ''}</div>
                    </div>
                    
                    <div class="recovery-targets">
                        <div class="targets-label">TARGETS</div>
                        <div class="targets-list">
                            ${(data.targets || []).map(t => `<span class="target-tag">${t}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="recovery-technique">
                        <div class="technique-label">TECHNIQUE</div>
                        <div class="technique-text">${data.technique || 'Perform with controlled movement.'}</div>
                    </div>
                    
                    <div class="recovery-log-section">
                        <div class="targets-label">LOG YOUR SETS${perSide}</div>
                        <div class="recovery-input-row">
                            <input type="number" id="recovery-duration" 
                                placeholder="${target.value}" 
                                class="recovery-input" 
                                inputmode="numeric"
                                style="color-scheme: dark;">
                            <span class="recovery-input-unit">sec</span>
                            <button class="recovery-add-btn" onclick="RecoveryLogger.addSet()">+ ADD</button>
                        </div>
                        <div id="logged-sets-container" class="logged-sets-container"></div>
                    </div>
                    
                    <div class="recovery-science">${data.science || ''}</div>
                    
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
     * Render posture modal (explains postural benefit prominently)
     */
    renderPostureModal(data) {
        const target = this.parseTarget(data.duration);
        const isHold = (data.duration || '').toLowerCase().includes('sec');
        const inputLabel = isHold ? 'Duration (sec)' : 'Reps';
        const inputId = isHold ? 'recovery-duration' : 'recovery-reps';
        const inputUnit = isHold ? 'sec' : 'reps';
        
        return `
            <div class="modal-overlay" onclick="RecoveryLogger.close()">
                <div class="modal-sheet" onclick="event.stopPropagation()">
                    <div class="modal-handle"></div>
                    
                    <div class="recovery-header">
                        <div class="recovery-title">POSTURE CORRECTION</div>
                        <div class="recovery-exercise">${this.currentExercise}</div>
                        <div class="recovery-duration">Target: ${data.duration || ''}</div>
                    </div>
                    
                    <div class="posture-benefit">
                        <div class="posture-benefit-label">WHY THIS MATTERS</div>
                        <div class="posture-benefit-text">${data.postureBenefit || ''}</div>
                    </div>
                    
                    <div class="recovery-targets">
                        <div class="targets-label">TARGETS</div>
                        <div class="targets-list">
                            ${(data.targets || []).map(t => `<span class="target-tag">${t}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="recovery-technique">
                        <div class="technique-label">TECHNIQUE</div>
                        <div class="technique-text">${data.technique || ''}</div>
                    </div>
                    
                    <div class="recovery-log-section">
                        <div class="targets-label">LOG YOUR SETS</div>
                        <div class="recovery-input-row">
                            <input type="number" id="${inputId}" 
                                placeholder="${target.value}" 
                                class="recovery-input" 
                                inputmode="numeric"
                                style="color-scheme: dark;">
                            <span class="recovery-input-unit">${inputUnit}</span>
                            <button class="recovery-add-btn" onclick="RecoveryLogger.addSet()">+ ADD</button>
                        </div>
                        <div id="logged-sets-container" class="logged-sets-container"></div>
                    </div>
                    
                    <div class="recovery-science">${data.science || ''}</div>
                    
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
     * Render strength exercise modal (core work, etc.)
     */
    renderStrengthModal(data) {
        const target = this.parseTarget(data.duration);
        const isHold = (data.duration || '').toLowerCase().includes('sec');
        const inputLabel = isHold ? 'Duration (sec)' : 'Reps';
        const inputId = isHold ? 'recovery-duration' : 'recovery-reps';
        const inputUnit = isHold ? 'sec' : 'reps';
        
        return `
            <div class="modal-overlay" onclick="RecoveryLogger.close()">
                <div class="modal-sheet" onclick="event.stopPropagation()">
                    <div class="modal-handle"></div>
                    
                    <div class="recovery-header">
                        <div class="recovery-title">CORE / ACCESSORY</div>
                        <div class="recovery-exercise">${this.currentExercise}</div>
                        <div class="recovery-duration">Target: ${data.duration || ''}</div>
                    </div>
                    
                    <div class="recovery-targets">
                        <div class="targets-label">TARGETS</div>
                        <div class="targets-list">
                            ${(data.targets || []).map(t => `<span class="target-tag">${t}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="recovery-technique">
                        <div class="technique-label">TECHNIQUE</div>
                        <div class="technique-text">${data.technique || ''}</div>
                    </div>
                    
                    <div class="recovery-log-section">
                        <div class="targets-label">LOG YOUR SETS</div>
                        <div class="recovery-input-row">
                            <input type="number" id="${inputId}" 
                                placeholder="${target.value}" 
                                class="recovery-input" 
                                inputmode="numeric"
                                style="color-scheme: dark;">
                            <span class="recovery-input-unit">${inputUnit}</span>
                            <button class="recovery-add-btn" onclick="RecoveryLogger.addSet()">+ ADD</button>
                        </div>
                        <div id="logged-sets-container" class="logged-sets-container"></div>
                    </div>
                    
                    <div class="recovery-science">${data.science || ''}</div>
                    
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
     * Render generic modal for unknown exercises
     */
    renderGenericModal(data) {
        return `
            <div class="modal-overlay" onclick="RecoveryLogger.close()">
                <div class="modal-sheet" onclick="event.stopPropagation()">
                    <div class="modal-handle"></div>
                    
                    <div class="recovery-header">
                        <div class="recovery-title">EXERCISE</div>
                        <div class="recovery-exercise">${this.currentExercise}</div>
                    </div>
                    
                    <div class="recovery-instruction">
                        ${data.instruction || 'Complete this exercise with good form.'}
                    </div>
                    
                    <div class="recovery-log-section">
                        <div class="targets-label">LOG YOUR SETS</div>
                        <div class="recovery-input-row">
                            <input type="number" id="recovery-reps" 
                                placeholder="10" 
                                class="recovery-input" 
                                inputmode="numeric"
                                style="color-scheme: dark;">
                            <span class="recovery-input-unit">reps</span>
                            <button class="recovery-add-btn" onclick="RecoveryLogger.addSet()">+ ADD</button>
                        </div>
                        <div id="logged-sets-container" class="logged-sets-container"></div>
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


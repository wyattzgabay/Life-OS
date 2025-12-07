/**
 * CARDIO-LOGGER.JS
 * Unified cardio activity logging component
 * 
 * Supports: Running, Cycling, Swimming, Walking (extensible)
 * Features:
 * - Shows prescribed workout with ability to override
 * - Pain/discomfort tracking for injury prevention
 * - Consistent UI across all cardio types
 */

const CardioLogger = {
    currentType: null,      // 'running', 'cycling', 'swimming', 'walking'
    prescription: null,     // Today's prescribed workout
    painPoints: new Set(),  // Selected pain areas
    
    // Activity type configurations
    ACTIVITY_TYPES: {
        running: {
            name: 'Running',
            unit: 'miles',
            workoutTypes: ['easy', 'tempo', 'intervals', 'long', 'recovery'],
            paceUnit: 'min/mile',
            icon: '🏃',
            painAreas: [
                { id: 'foot_arch', name: 'Foot Arch', group: 'foot' },
                { id: 'ankle', name: 'Ankle', group: 'foot' },
                { id: 'achilles', name: 'Achilles', group: 'foot' },
                { id: 'shin', name: 'Shin', group: 'leg' },
                { id: 'calf', name: 'Calf', group: 'leg' },
                { id: 'knee', name: 'Knee', group: 'leg' },
                { id: 'it_band', name: 'IT Band', group: 'leg' },
                { id: 'quad', name: 'Quad', group: 'leg' },
                { id: 'hamstring', name: 'Hamstring', group: 'leg' },
                { id: 'hip', name: 'Hip', group: 'hip' },
                { id: 'hip_flexor', name: 'Hip Flexor', group: 'hip' },
                { id: 'glute', name: 'Glute', group: 'hip' },
                { id: 'lower_back', name: 'Lower Back', group: 'back' },
            ]
        },
        cycling: {
            name: 'Cycling',
            unit: 'miles',
            workoutTypes: ['easy', 'tempo', 'intervals', 'long', 'recovery'],
            paceUnit: 'mph',
            icon: '🚴',
            painAreas: [
                { id: 'knee', name: 'Knee', group: 'leg' },
                { id: 'quad', name: 'Quad', group: 'leg' },
                { id: 'hamstring', name: 'Hamstring', group: 'leg' },
                { id: 'hip', name: 'Hip', group: 'hip' },
                { id: 'lower_back', name: 'Lower Back', group: 'back' },
                { id: 'neck', name: 'Neck', group: 'back' },
                { id: 'wrist', name: 'Wrist', group: 'arm' },
            ]
        },
        swimming: {
            name: 'Swimming',
            unit: 'yards',
            workoutTypes: ['easy', 'drill', 'intervals', 'distance', 'recovery'],
            paceUnit: 'per 100yd',
            icon: '🏊',
            painAreas: [
                { id: 'shoulder', name: 'Shoulder', group: 'arm' },
                { id: 'rotator_cuff', name: 'Rotator Cuff', group: 'arm' },
                { id: 'elbow', name: 'Elbow', group: 'arm' },
                { id: 'neck', name: 'Neck', group: 'back' },
                { id: 'lower_back', name: 'Lower Back', group: 'back' },
            ]
        },
        walking: {
            name: 'Walking',
            unit: 'miles',
            workoutTypes: ['easy', 'brisk', 'long'],
            paceUnit: 'min/mile',
            icon: '🚶',
            painAreas: [
                { id: 'foot_arch', name: 'Foot Arch', group: 'foot' },
                { id: 'ankle', name: 'Ankle', group: 'foot' },
                { id: 'knee', name: 'Knee', group: 'leg' },
                { id: 'hip', name: 'Hip', group: 'hip' },
                { id: 'lower_back', name: 'Lower Back', group: 'back' },
            ]
        }
    },

    // Known injury patterns for early detection
    INJURY_PATTERNS: {
        'achilles_tendinitis': {
            name: 'Achilles Tendinitis',
            pattern: ['calf', 'achilles', 'heel'],
            confidence: 0.7,
            advice: 'Consider eccentric heel drops and reducing intensity'
        },
        'plantar_fasciitis': {
            name: 'Plantar Fasciitis',
            pattern: ['foot_arch', 'heel'],
            confidence: 0.6,
            advice: 'Roll foot on tennis ball, stretch calves, check shoe support'
        },
        'runners_knee': {
            name: "Runner's Knee (PFPS)",
            pattern: ['knee', 'it_band', 'quad'],
            confidence: 0.65,
            advice: 'Strengthen glutes/VMO, foam roll IT band, reduce downhill running'
        },
        'it_band_syndrome': {
            name: 'IT Band Syndrome',
            pattern: ['it_band', 'knee', 'hip'],
            confidence: 0.7,
            advice: 'Foam roll, strengthen hip abductors, reduce weekly mileage'
        },
        'shin_splints': {
            name: 'Shin Splints',
            pattern: ['shin', 'calf', 'ankle'],
            confidence: 0.6,
            advice: 'Reduce impact, run on softer surfaces, strengthen tibialis anterior'
        },
        'hip_flexor_strain': {
            name: 'Hip Flexor Strain',
            pattern: ['hip_flexor', 'hip', 'quad'],
            confidence: 0.6,
            advice: 'Stretch hip flexors, strengthen core, reduce stride length'
        }
    },

    /**
     * Open the cardio logger
     * @param {string} activityType - 'running', 'cycling', etc.
     */
    open(activityType = 'running') {
        this.currentType = activityType;
        this.painPoints = new Set();
        this.prescription = this.getPrescription(activityType);
        
        const modal = document.getElementById('logger-modal');
        if (!modal) return;
        
        modal.innerHTML = this.render();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set up input listeners
        this.setupListeners();
    },

    /**
     * Get today's prescription for the activity type
     */
    getPrescription(activityType) {
        if (activityType === 'running') {
            const running = State.getRunningData();
            if (!running?.goal) {
                return { isRest: true, type: null, distance: 0, pace: null };
            }
            
            const todaysRun = RunningView.getTodaysRun(running);
            if (!todaysRun || todaysRun.type === 'rest') {
                return { isRest: true, type: null, distance: 0, pace: null };
            }
            
            const runInfo = RunningView.getRunInfo(todaysRun, running);
            const paces = State.getTrainingPaces();
            
            return {
                isRest: false,
                type: todaysRun.type,
                distance: parseFloat(runInfo.distance),
                pace: paces[todaysRun.type] || paces.easy,
                note: runInfo.note || null
            };
        }
        
        // For other activity types (future)
        return { isRest: true, type: null, distance: 0, pace: null };
    },

    /**
     * Render the cardio logger modal
     */
    render() {
        const config = this.ACTIVITY_TYPES[this.currentType];
        const rx = this.prescription;
        const isRest = rx.isRest;
        
        return `
            <div class="modal-overlay" onclick="CardioLogger.close()">
                <div class="modal-sheet cardio-logger" onclick="event.stopPropagation()">
                    <div class="modal-handle"></div>
                    
                    <!-- Header -->
                    <div class="cardio-header">
                        <div class="cardio-title">${isRest ? 'REST DAY' : "TODAY'S " + config.name.toUpperCase()}</div>
                        ${!isRest ? `
                            <div class="cardio-prescription">
                                Prescribed: ${rx.distance} ${config.unit} ${rx.type}
                            </div>
                        ` : `
                            <div class="cardio-prescription">
                                Log activity if you trained anyway
                            </div>
                        `}
                    </div>
                    
                    <!-- Workout Type Selection -->
                    <div class="cardio-section">
                        <div class="section-label">WORKOUT TYPE</div>
                        <div class="workout-type-grid">
                            ${config.workoutTypes.map(type => `
                                <button class="workout-type-btn ${type === rx.type ? 'prescribed active' : ''}" 
                                        data-type="${type}"
                                        onclick="CardioLogger.selectWorkoutType('${type}')">
                                    ${type.toUpperCase()}
                                    ${type === rx.type ? '<span class="rx-indicator">Rx</span>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Distance & Time Inputs -->
                    <div class="cardio-section">
                        <div class="cardio-inputs">
                            <div class="input-group">
                                <label>DISTANCE</label>
                                <div class="input-with-unit">
                                    <input type="number" id="cardio-distance" 
                                           value="${isRest ? '' : rx.distance}"
                                           placeholder="${isRest ? '0' : rx.distance}"
                                           step="0.1" inputmode="decimal"
                                           style="color-scheme: dark;">
                                    <span class="unit">${config.unit}</span>
                                </div>
                            </div>
                            <div class="input-group">
                                <label>TIME</label>
                                <div class="input-with-unit">
                                    <input type="text" id="cardio-time" 
                                           placeholder="mm:ss"
                                           style="color-scheme: dark;">
                                    <span class="unit">min</span>
                                </div>
                            </div>
                        </div>
                        <div class="pace-display" id="pace-display">
                            ${rx.pace ? `Target pace: ${rx.pace}` : 'Enter distance and time to see pace'}
                        </div>
                    </div>
                    
                    <!-- Effort Selection (simplified from feel + effort) -->
                    <div class="cardio-section">
                        <div class="section-label">HOW DID IT FEEL?</div>
                        <div class="effort-scale">
                            ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                                <button class="effort-num ${n === 5 ? 'default' : ''}" 
                                        data-effort="${n}"
                                        onclick="CardioLogger.selectEffort(${n})">
                                    ${n}
                                </button>
                            `).join('')}
                        </div>
                        <div class="effort-labels">
                            <span>Easy</span>
                            <span>Moderate</span>
                            <span>Hard</span>
                            <span>Max</span>
                        </div>
                        <input type="hidden" id="cardio-effort" value="5">
                    </div>
                    
                    <!-- Pain Tracking -->
                    <div class="cardio-section pain-section">
                        <div class="section-label">
                            ANYTHING HURT?
                            <span class="optional-tag">optional</span>
                        </div>
                        <div class="pain-toggle" onclick="CardioLogger.togglePainPanel()">
                            <span id="pain-summary">Tap to log discomfort</span>
                            <span class="toggle-arrow">▼</span>
                        </div>
                        <div class="pain-panel" id="pain-panel" style="display: none;">
                            <div class="pain-areas">
                                ${config.painAreas.map(area => `
                                    <button class="pain-area-btn" 
                                            data-pain="${area.id}"
                                            onclick="CardioLogger.togglePain('${area.id}')">
                                        ${area.name}
                                    </button>
                                `).join('')}
                            </div>
                            <div class="pain-warning" id="pain-warning"></div>
                        </div>
                    </div>
                    
                    <!-- Save Button -->
                    <div class="cardio-actions">
                        <button class="cardio-save-btn" onclick="CardioLogger.save()">
                            LOG ${config.name.toUpperCase()}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Set up input listeners
     */
    setupListeners() {
        const distInput = document.getElementById('cardio-distance');
        const timeInput = document.getElementById('cardio-time');
        
        const updatePace = () => {
            const dist = parseFloat(distInput.value);
            const time = timeInput.value;
            const config = this.ACTIVITY_TYPES[this.currentType];
            
            if (dist && time && time.includes(':')) {
                const [mins, secs] = time.split(':').map(Number);
                const totalMins = mins + (secs / 60);
                const pace = totalMins / dist;
                const paceMin = Math.floor(pace);
                const paceSec = Math.round((pace - paceMin) * 60);
                
                document.getElementById('pace-display').innerHTML = `
                    Pace: <strong>${paceMin}:${String(paceSec).padStart(2, '0')}</strong> ${config.paceUnit}
                `;
            }
        };
        
        distInput?.addEventListener('input', updatePace);
        timeInput?.addEventListener('input', updatePace);
    },

    /**
     * Select workout type
     */
    selectWorkoutType(type) {
        document.querySelectorAll('.workout-type-btn').forEach(btn => {
            const isThis = btn.dataset.type === type;
            btn.classList.toggle('active', isThis);
        });
    },

    /**
     * Select effort level
     */
    selectEffort(level) {
        document.querySelectorAll('.effort-num').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.effort) === level);
            btn.classList.remove('default');
        });
        document.getElementById('cardio-effort').value = level;
    },

    /**
     * Toggle pain panel visibility
     */
    togglePainPanel() {
        const panel = document.getElementById('pain-panel');
        const arrow = document.querySelector('.toggle-arrow');
        
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            arrow.textContent = '▲';
        } else {
            panel.style.display = 'none';
            arrow.textContent = '▼';
        }
    },

    /**
     * Toggle pain area selection
     */
    togglePain(areaId) {
        const btn = document.querySelector(`[data-pain="${areaId}"]`);
        
        if (this.painPoints.has(areaId)) {
            this.painPoints.delete(areaId);
            btn.classList.remove('selected');
        } else {
            this.painPoints.add(areaId);
            btn.classList.add('selected');
        }
        
        // Update summary
        this.updatePainSummary();
        
        // Check for injury patterns
        this.checkInjuryPatterns();
    },

    /**
     * Update pain summary text
     */
    updatePainSummary() {
        const summary = document.getElementById('pain-summary');
        const count = this.painPoints.size;
        
        if (count === 0) {
            summary.textContent = 'Tap to log discomfort';
        } else {
            const areas = Array.from(this.painPoints).map(id => {
                const config = this.ACTIVITY_TYPES[this.currentType];
                const area = config.painAreas.find(a => a.id === id);
                return area?.name || id;
            });
            summary.textContent = areas.join(', ');
        }
    },

    /**
     * Check for injury patterns based on recent pain history
     */
    checkInjuryPatterns() {
        const warning = document.getElementById('pain-warning');
        const recentPain = this.getRecentPainHistory();
        const allPain = [...recentPain, ...this.painPoints];
        
        for (const [key, pattern] of Object.entries(this.INJURY_PATTERNS)) {
            const matches = pattern.pattern.filter(p => allPain.includes(p)).length;
            const confidence = matches / pattern.pattern.length;
            
            if (confidence >= pattern.confidence) {
                warning.innerHTML = `
                    <div class="injury-warning">
                        <strong>⚠️ Possible ${pattern.name}</strong>
                        <p>${pattern.advice}</p>
                    </div>
                `;
                return;
            }
        }
        
        warning.innerHTML = '';
    },

    /**
     * Get recent pain history from last 7 days
     */
    getRecentPainHistory() {
        const history = State._data?.cardioLog || [];
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const recentPain = new Set();
        history.forEach(entry => {
            if (new Date(entry.timestamp).getTime() > weekAgo && entry.pain?.length > 0) {
                entry.pain.forEach(p => recentPain.add(p));
            }
        });
        
        return Array.from(recentPain);
    },

    /**
     * Save the cardio entry
     */
    save() {
        const config = this.ACTIVITY_TYPES[this.currentType];
        const distance = parseFloat(document.getElementById('cardio-distance').value);
        const time = document.getElementById('cardio-time').value;
        const effort = parseInt(document.getElementById('cardio-effort').value) || 5;
        
        // Get selected workout type
        const activeBtn = document.querySelector('.workout-type-btn.active');
        const workoutType = activeBtn?.dataset.type || this.prescription.type || 'easy';
        
        if (!distance || distance <= 0) {
            this.showError('Enter a distance');
            return;
        }
        
        // Build entry
        const entry = {
            type: this.currentType,
            workoutType,
            distance,
            time: time || null,
            effort,
            pain: Array.from(this.painPoints),
            prescribed: this.prescription.isRest ? null : {
                type: this.prescription.type,
                distance: this.prescription.distance
            },
            timestamp: new Date().toISOString(),
            date: State.getTodayKey()
        };
        
        // Save to state
        this.logCardio(entry);
        
        // Award XP
        const baseXP = Math.round(distance * 10);
        const effortBonus = effort >= 7 ? 10 : 0;
        App.awardXP(baseXP + effortBonus, 'discipline');
        
        // Close and refresh
        this.close();
        App.render();
        
        // Check if pain was logged and show any warnings
        if (this.painPoints.size > 0) {
            this.analyzeAndWarn();
        }
    },

    /**
     * Log cardio entry to state
     */
    logCardio(entry) {
        // Initialize cardio log if needed
        if (!State._data.cardioLog) {
            State._data.cardioLog = [];
        }
        
        // For running, also update the legacy runDistance for today's score
        if (entry.type === 'running') {
            const today = State.getTodayKey();
            if (!State._data.days[today]) {
                State._data.days[today] = State._createEmptyDay();
            }
            State._data.days[today].runDistance = entry.distance;
            
            // Also add to runLog for backwards compatibility
            if (!State._data.runLog) {
                State._data.runLog = [];
            }
            State._data.runLog.push({
                date: entry.date,
                distance: entry.distance,
                time: entry.time,
                effort: entry.effort,
                type: entry.workoutType,
                prescribed: entry.prescribed?.distance
            });
        }
        
        // Add to unified cardio log
        State._data.cardioLog.push(entry);
        
        // Keep last 200 entries
        if (State._data.cardioLog.length > 200) {
            State._data.cardioLog = State._data.cardioLog.slice(-200);
        }
        
        State.save();
    },

    /**
     * Analyze pain patterns and warn user
     */
    analyzeAndWarn() {
        const history = this.getRecentPainHistory();
        const allPain = [...history, ...this.painPoints];
        
        // Find matching patterns
        for (const [key, pattern] of Object.entries(this.INJURY_PATTERNS)) {
            const matches = pattern.pattern.filter(p => allPain.includes(p)).length;
            const confidence = matches / pattern.pattern.length;
            
            if (confidence >= pattern.confidence) {
                // Could show a toast or notification here
                console.log(`Injury pattern detected: ${pattern.name}`);
            }
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        // Simple alert for now, could be improved
        const btn = document.querySelector('.cardio-save-btn');
        const original = btn.textContent;
        btn.textContent = message;
        btn.style.background = 'var(--error)';
        
        setTimeout(() => {
            btn.textContent = original;
            btn.style.background = '';
        }, 2000);
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
        this.currentType = null;
        this.painPoints.clear();
    }
};

// Make globally available
if (typeof window !== 'undefined') {
    window.CardioLogger = CardioLogger;
}


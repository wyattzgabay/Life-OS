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
            icon: '',
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
        
        // Enable pull-down-to-dismiss
        if (typeof ModalGestures !== 'undefined') {
            ModalGestures.init(modal, () => this.close());
        }
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
     * Render the cardio logger modal - compact for mobile
     */
    render() {
        const config = this.ACTIVITY_TYPES[this.currentType];
        
        // Get adjusted prescription based on effort + injury data
        let rx = this.prescription;
        if (typeof InjuryIntelligence !== 'undefined' && !rx.isRest) {
            rx = InjuryIntelligence.getAdjustedPrescription(rx);
        }
        const isRest = rx.isRest;
        
        // Check for active injury warning
        const warning = typeof InjuryIntelligence !== 'undefined' ? InjuryIntelligence.getActiveWarning() : null;
        
        // Get effort trend insight
        const effortInsight = typeof InjuryIntelligence !== 'undefined' ? 
            InjuryIntelligence.renderEffortInsight() : '';
        
        return `
            <div class="modal-sheet cardio-logger" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                
                ${warning ? `
                    <div class="injury-alert ${warning.severity}">
                        <strong>${warning.title}</strong>
                        <span>${warning.message}</span>
                    </div>
                ` : ''}
                
                ${effortInsight}
                
                <!-- Header -->
                <div class="cardio-header">
                    <span class="cardio-title">${isRest ? 'LOG RUN' : rx.type.toUpperCase() + ' RUN'}</span>
                    <span class="cardio-rx">${isRest ? 'Rest day' : rx.distance + ' ' + config.unit}${rx.wasModified ? ' (adjusted)' : ''}</span>
                </div>
                
                <!-- Workout Type - inline -->
                <div class="workout-type-row">
                    ${config.workoutTypes.map(type => `
                        <button class="wt-btn ${type === rx.type ? 'active' : ''}" 
                                data-type="${type}"
                                onclick="CardioLogger.selectWorkoutType('${type}')">
                            ${type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Distance & Time -->
                <div class="cardio-row">
                    <div class="cardio-input-group">
                        <label>DISTANCE (${config.unit})</label>
                        <input type="number" id="cardio-distance" 
                               value="${isRest ? '' : rx.distance}"
                               placeholder="0" step="0.1" inputmode="decimal"
                               style="color-scheme: dark;">
                    </div>
                    <div class="cardio-input-group">
                        <label>TIME (mm:ss)</label>
                        <input type="text" id="cardio-time" placeholder="25:00"
                               style="color-scheme: dark;">
                    </div>
                </div>
                <div class="pace-line" id="pace-display">${rx.pace ? 'Target pace: ' + rx.pace : ''}</div>
                
                <!-- Effort Slider -->
                <div class="effort-section">
                    <div class="effort-header">
                        <label>EFFORT</label>
                        <span class="effort-value" id="effort-display">5</span>
                    </div>
                    <input type="range" 
                           id="cardio-effort" 
                           class="effort-slider"
                           min="1" max="10" value="5"
                           oninput="CardioLogger.updateEffortDisplay(this.value)">
                    <div class="effort-labels">
                        <span>Easy</span>
                        <span>Hard</span>
                    </div>
                </div>
                
                <!-- Smart Pain Drill-Down -->
                <div class="pain-row" onclick="CardioLogger.togglePainPanel()">
                    <span id="pain-summary">Any discomfort? <span class="pain-count"></span></span>
                    <span class="toggle-arrow" id="pain-arrow">▼</span>
                </div>
                <div class="pain-panel" id="pain-panel" style="display: none;">
                    <!-- Step 1: General Area -->
                    <div class="pain-step" id="pain-step-1">
                        <div class="pain-label">WHERE?</div>
                        <div class="pain-chips">
                            ${this.getPainRegions().map(region => `
                                <button class="pain-chip region-btn" data-region="${region.id}"
                                        onclick="CardioLogger.selectPainRegion('${region.id}')">${region.name}</button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Step 2: Specific Sub-Region (shown after region selected) -->
                    <div class="pain-step" id="pain-step-2" style="display: none;">
                        <div class="pain-label">MORE SPECIFICALLY... <span class="back-btn" onclick="CardioLogger.backToPainStep1()">← Back</span></div>
                        <div class="pain-chips" id="subregion-chips"></div>
                    </div>
                    
                    <!-- Step 3: Timing (when does it hurt) -->
                    <div class="pain-step" id="pain-step-3" style="display: none;">
                        <div class="pain-label">WHEN DOES IT HURT?</div>
                        <div class="pain-chips timing-chips" id="timing-chips"></div>
                    </div>
                    
                    <!-- Likely Injury Display -->
                    <div id="likely-injury" style="display: none;">
                        <div class="injury-match">
                            <div class="injury-name" id="injury-name"></div>
                            <div class="injury-confidence" id="injury-confidence"></div>
                        </div>
                        <div class="injury-advice" id="injury-advice"></div>
                        <button class="confirm-injury-btn" onclick="CardioLogger.confirmInjury()">Track This Issue</button>
                    </div>
                    
                    <!-- Selected Pain Summary -->
                    <div id="selected-pains"></div>
                    <div id="pain-warning"></div>
                </div>
                
                <!-- Save -->
                <button class="cardio-save-btn" onclick="CardioLogger.save()">LOG RUN</button>
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
        document.querySelectorAll('.wt-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    },

    /**
     * Update effort display from slider
     */
    updateEffortDisplay(value) {
        const display = document.getElementById('effort-display');
        if (display) {
            display.textContent = value;
        }
    },

    // Pain drill-down state
    selectedRegion: null,
    selectedSubregion: null,
    selectedTiming: null,
    detectedInjury: null,
    loggedPains: [], // Array of {region, subregion, timing, injury}
    
    /**
     * Get pain regions for drill-down (from InjuryDatabase)
     */
    getPainRegions() {
        if (typeof InjuryDatabase !== 'undefined') {
            return Object.keys(InjuryDatabase.PAIN_REGIONS).map(key => ({
                id: key,
                name: InjuryDatabase.PAIN_REGIONS[key].name
            }));
        }
        // Fallback if database not loaded
        return [
            { id: 'foot', name: 'Foot' },
            { id: 'ankle', name: 'Ankle' },
            { id: 'shin', name: 'Shin' },
            { id: 'calf', name: 'Calf' },
            { id: 'knee', name: 'Knee' },
            { id: 'thigh', name: 'Thigh' },
            { id: 'hip', name: 'Hip' },
            { id: 'lower_back', name: 'Lower Back' }
        ];
    },

    /**
     * Toggle pain panel visibility
     */
    togglePainPanel() {
        const panel = document.getElementById('pain-panel');
        const arrow = document.getElementById('pain-arrow');
        
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            if (arrow) arrow.textContent = '▲';
        } else {
            panel.style.display = 'none';
            if (arrow) arrow.textContent = '▼';
        }
    },
    
    /**
     * Step 1: Select pain region
     */
    selectPainRegion(regionId) {
        this.selectedRegion = regionId;
        this.selectedSubregion = null;
        this.selectedTiming = null;
        this.detectedInjury = null;
        
        // Highlight selected region
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.region === regionId);
        });
        
        // Get subregions from database
        const region = InjuryDatabase?.PAIN_REGIONS?.[regionId];
        if (region && region.subregions) {
            const subregionChips = document.getElementById('subregion-chips');
            subregionChips.innerHTML = Object.keys(region.subregions).map(key => `
                <button class="pain-chip subregion-btn" data-subregion="${key}"
                        onclick="CardioLogger.selectSubregion('${key}')">
                    ${region.subregions[key].name}
                </button>
            `).join('');
            
            document.getElementById('pain-step-2').style.display = 'block';
            document.getElementById('pain-step-3').style.display = 'none';
            document.getElementById('likely-injury').style.display = 'none';
        }
    },
    
    /**
     * Back to step 1
     */
    backToPainStep1() {
        this.selectedRegion = null;
        this.selectedSubregion = null;
        document.querySelectorAll('.region-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('pain-step-2').style.display = 'none';
        document.getElementById('pain-step-3').style.display = 'none';
        document.getElementById('likely-injury').style.display = 'none';
    },
    
    /**
     * Step 2: Select subregion
     */
    selectSubregion(subregionId) {
        this.selectedSubregion = subregionId;
        
        // Highlight
        document.querySelectorAll('.subregion-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.subregion === subregionId);
        });
        
        // Get timing options from database
        const region = InjuryDatabase?.PAIN_REGIONS?.[this.selectedRegion];
        const subregion = region?.subregions?.[subregionId];
        
        if (subregion && subregion.timing) {
            const timingChips = document.getElementById('timing-chips');
            const timingLabels = {
                morning_first_steps: 'First steps (morning)',
                morning_stiffness: 'Morning stiffness',
                during_run: 'During run',
                after_run: 'After run',
                at_rest: 'At rest (always)',
                going_downhill: 'Downhill/stairs',
                going_upstairs: 'Going up stairs',
                after_sitting: 'After sitting',
                after_1_2_miles: 'After 1-2 miles',
                sudden_sharp: 'Sudden sharp pain',
                lying_on_side: 'Lying on side',
                sitting: 'While sitting',
                rotation: 'With rotation/twisting'
            };
            
            timingChips.innerHTML = Object.keys(subregion.timing).map(timing => `
                <button class="pain-chip timing-btn" data-timing="${timing}"
                        onclick="CardioLogger.selectTiming('${timing}')">
                    ${timingLabels[timing] || timing.replace(/_/g, ' ')}
                </button>
            `).join('');
            
            document.getElementById('pain-step-3').style.display = 'block';
        }
    },
    
    /**
     * Step 3: Select timing → Show likely injury
     */
    selectTiming(timingId) {
        this.selectedTiming = timingId;
        
        // Highlight
        document.querySelectorAll('.timing-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.timing === timingId);
        });
        
        // Get likely injuries
        const injuries = InjuryDatabase?.getLikelyInjuries(
            this.selectedRegion, 
            this.selectedSubregion, 
            this.selectedTiming
        );
        
        if (injuries && injuries.length > 0) {
            const top = injuries[0];
            this.detectedInjury = top;
            
            document.getElementById('injury-name').textContent = top.injury.name;
            document.getElementById('injury-confidence').textContent = 
                `Prevalence: ${top.injury.prevalence || 'Common'}`;
            document.getElementById('injury-advice').innerHTML = `
                <div class="injury-symptoms">
                    <strong>Key symptoms:</strong>
                    <ul>${top.injury.keySymptoms?.slice(0, 3).map(s => `<li>${s}</li>`).join('') || ''}</ul>
                </div>
                <div class="injury-note">${top.injury.mustRest ? 'This injury requires REST - see a professional' : ''}</div>
            `;
            document.getElementById('likely-injury').style.display = 'block';
        }
    },
    
    /**
     * Confirm and track the detected injury
     */
    confirmInjury() {
        if (!this.detectedInjury) return;
        
        // Add to logged pains for this session
        this.loggedPains.push({
            region: this.selectedRegion,
            subregion: this.selectedSubregion,
            timing: this.selectedTiming,
            injury: this.detectedInjury.id
        });
        
        // Also add to painPoints for backward compatibility
        this.painPoints.add(this.selectedRegion + '_' + this.selectedSubregion);
        
        // Update UI
        this.updateSelectedPainsDisplay();
        
        // Reset drill-down for next entry
        this.backToPainStep1();
        
        // Show confirmation
        document.getElementById('pain-summary').innerHTML = 
            `<span class="pain-count">${this.loggedPains.length} issue(s) logged</span>`;
    },
    
    /**
     * Update display of selected pains
     */
    updateSelectedPainsDisplay() {
        const container = document.getElementById('selected-pains');
        if (!container) return;
        
        if (this.loggedPains.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = `
            <div class="logged-pains">
                ${this.loggedPains.map((pain, idx) => {
                    const injury = InjuryDatabase?.INJURIES?.[pain.injury];
                    return `
                        <div class="logged-pain-item">
                            <span>${injury?.name || pain.region}</span>
                            <button class="remove-pain" onclick="CardioLogger.removePain(${idx})">×</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    /**
     * Remove a logged pain
     */
    removePain(idx) {
        this.loggedPains.splice(idx, 1);
        this.updateSelectedPainsDisplay();
        document.getElementById('pain-summary').innerHTML = 
            this.loggedPains.length > 0 
                ? `<span class="pain-count">${this.loggedPains.length} issue(s) logged</span>`
                : 'Any discomfort?';
    },

    /**
     * Toggle pain area selection (legacy - keeping for backward compat)
     */
    togglePain(areaId) {
        const btn = document.querySelector(`[data-pain="${areaId}"]`);
        
        if (this.painPoints.has(areaId)) {
            this.painPoints.delete(areaId);
            btn?.classList.remove('selected');
        } else {
            this.painPoints.add(areaId);
            btn?.classList.add('selected');
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
            summary.innerHTML = 'Any discomfort?';
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
                        <strong>Possible ${pattern.name}</strong>
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
        try {
            const config = this.ACTIVITY_TYPES[this.currentType];
            const distanceInput = document.getElementById('cardio-distance');
            const timeInput = document.getElementById('cardio-time');
            const effortInput = document.getElementById('cardio-effort');
            
            const distance = parseFloat(distanceInput?.value) || 0;
            const time = timeInput?.value || '';
            const effort = parseInt(effortInput?.value) || 5;
            
            // Get selected workout type
            const activeBtn = document.querySelector('.wt-btn.active');
            const workoutType = activeBtn?.dataset?.type || this.prescription?.type || 'easy';
            
            if (!distance || distance <= 0) {
                alert('Enter a distance');
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
            painDetails: this.loggedPains, // New: detailed pain with injury detection
            prescribed: this.prescription.isRest ? null : {
                type: this.prescription.type,
                distance: this.prescription.distance
            },
            timestamp: new Date().toISOString(),
            date: State.getTodayKey()
        };
        
        // Save to state
        this.logCardio(entry);
        
        // Pain logging is handled by the entry.pain array - no separate call needed
        
        // Award XP
        const baseXP = Math.round(distance * 10);
        const effortBonus = effort >= 7 ? 10 : 0;
        App.awardXP(baseXP + effortBonus, 'discipline');
        
        // Close and refresh
        this.close();
        App.render();
        
        // Trigger injury analysis if pain was logged
        if (this.painPoints.size > 0 && typeof InjuryIntelligence !== 'undefined') {
            InjuryIntelligence.onPainLogged(Array.from(this.painPoints), entry);
        }
        } catch (err) {
            console.error('CardioLogger.save error:', err);
            alert('Error saving run: ' + err.message);
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


/**
 * RUNNING.JS
 * Advanced running training module
 * Science-based progressive program with injury considerations
 */

const RunningView = {
    /**
     * Render running section for daily view (if running goal set)
     */
    renderDailyRunning() {
        const running = State.getRunningData();
        if (!running?.goal) return '';

        const todaysRun = this.getTodaysRun(running);
        const paces = State.getTrainingPaces();
        const phase = State.getCurrentPhase();
        const trackStatus = this.getTrackStatus(running);
        const tomorrow = this.getTomorrowPreview(running);
        
        // Check if run is logged today (even on rest days)
        const todayData = State.getDayData();
        const loggedDistance = todayData?.runDistance || 0;
        
        if (!todaysRun || todaysRun.type === 'rest') {
            // Show logged run on rest day if user ran anyway
            if (loggedDistance > 0) {
                return `
                    <section class="section">
                        <div class="section-header">
                            <span class="section-title">TODAY'S RUN</span>
                            <span class="section-badge run-complete">LOGGED</span>
                        </div>
                        <div class="run-card completed">
                            ${this.renderTrackIndicator(trackStatus)}
                            <div class="run-logged-display">
                                <span class="run-distance-big">${loggedDistance.toFixed(2)}</span>
                                <span class="run-unit">miles</span>
                            </div>
                            <div class="rest-message">Nice! You ran on a rest day.</div>
                            <button class="log-run-btn secondary" onclick="CardioLogger.open('running')">
                                LOG ANOTHER
                            </button>
                        </div>
                    </section>
                `;
            }
            
            return `
                <section class="section">
                    <div class="section-header">
                        <span class="section-title">TODAY'S RUN</span>
                        <span class="section-badge">REST DAY</span>
                    </div>
                    <div class="rest-day-card">
                        ${this.renderTrackIndicator(trackStatus)}
                        <div class="rest-message">Recovery is training. Take it easy.</div>
                        <button class="log-run-btn secondary" onclick="CardioLogger.open('running')">
                            LOG ACTIVITY
                        </button>
                        ${this.renderTomorrowPreview(tomorrow)}
                    </div>
                </section>
            `;
        }

        const paceForType = {
            easy: paces.easy,
            tempo: paces.tempo,
            intervals: paces.interval,
            long: paces.easy,
            recovery: paces.easy,
        };

        const feeling = this.getRunFeeling(todaysRun.type, running);
        const science = this.getRunScience(todaysRun.type);

        // Get injury-adjusted distance
        const runInfo = this.getRunInfo(todaysRun, running);
        const injuryProtocol = this.getInjuryProtocol(running.injuries);
        const prescribedDistance = runInfo.distance;
        
        // Determine completion status
        let runStatus = 'pending';
        let statusClass = '';
        let statusText = '';
        let distanceDisplay = '';
        
        if (loggedDistance > 0) {
            const percent = Math.round((loggedDistance / prescribedDistance) * 100);
            
            if (loggedDistance >= prescribedDistance) {
                runStatus = 'complete';
                statusClass = 'run-complete';
                statusText = loggedDistance > prescribedDistance 
                    ? `+${(loggedDistance - prescribedDistance).toFixed(2)} mi extra`
                    : 'DONE';
                distanceDisplay = `<span class="prescribed-done">${prescribedDistance} mi</span>`;
            } else {
                runStatus = 'partial';
                statusClass = 'run-partial';
                statusText = `${loggedDistance.toFixed(2)} / ${prescribedDistance} mi (${percent}%)`;
                distanceDisplay = `<span class="prescribed-partial">${prescribedDistance} mi</span>`;
            }
        } else {
            distanceDisplay = `${prescribedDistance} mi`;
        }
        
        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">TODAY'S RUN</span>
                    <span class="section-badge ${statusClass}">${runStatus === 'complete' ? 'DONE' : runStatus === 'partial' ? 'PARTIAL' : todaysRun.type.toUpperCase()}</span>
                </div>
                <div class="running-card-clean ${statusClass}">
                    ${this.renderTrackIndicator(trackStatus)}
                    
                    <div class="run-main">
                        <div class="run-distance ${statusClass}">${distanceDisplay}</div>
                        ${runStatus !== 'pending' ? `<div class="run-logged-status">${statusText}</div>` : ''}
                        <div class="run-pace-target">${paceForType[todaysRun.type] || paces.easy}/mi pace</div>
                        ${injuryProtocol.adjusted ? `<div class="run-adjusted">Adjusted for ${injuryProtocol.injuryName}</div>` : ''}
                    </div>
                    
                    ${runStatus === 'pending' ? `<div class="run-feel">${feeling}</div>` : ''}
                    
                    ${injuryProtocol.hasProtocol && runStatus === 'pending' ? `
                        <div class="injury-protocol">
                            <div class="protocol-section">
                                <span class="protocol-label">BEFORE</span>
                                <span class="protocol-items">${injuryProtocol.preRun.join(' · ')}</span>
                            </div>
                            <div class="protocol-section">
                                <span class="protocol-label">AFTER</span>
                                <span class="protocol-items">${injuryProtocol.postRun.join(' · ')}</span>
                            </div>
                            <div class="protocol-tip">${injuryProtocol.tip}</div>
                        </div>
                    ` : ''}
                    
                    <div class="run-actions">
                        <button class="log-run-btn ${runStatus !== 'pending' ? 'secondary' : ''}" onclick="CardioLogger.open('running')">
                            ${runStatus === 'pending' ? 'LOG RUN' : 'UPDATE RUN'}
                        </button>
                        ${runStatus !== 'pending' ? `
                            <button class="delete-run-btn" onclick="RunningView.deleteToday()">DELETE</button>
                        ` : ''}
                    </div>
                    
                    ${this.renderTomorrowPreview(tomorrow)}
                </div>
            </section>
        `;
    },

    /**
     * Get today's run based on program
     */
    getTodaysRun(running) {
        // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
        // BASE_WEEK array: [0]=Sunday, [1]=Monday, ..., [6]=Saturday
        // They match directly - no mapping needed
        const dayOfWeek = new Date().getDay();
        
        const run = CONFIG.RUNNING.BASE_WEEK[dayOfWeek];
        
        // Add coordination note
        if (run) {
            run.coordinationNote = run.orderReason;
        }
        
        return run;
    },

    /**
     * Get run info with injury-adjusted distance and performance-based adjustment
     */
    getRunInfo(run, running) {
        if (!run || !running) {
            return { distance: '0', adjusted: false, adjustmentFactor: 1, type: 'easy' };
        }
        
        const week = running.weekNumber || 1;
        const progression = 1 + (Math.floor((week - 1) / 2) * 0.1);
        
        // Goal-based distance multipliers (5K is shorter, marathon is longer)
        const goalMultipliers = {
            '5k': 0.65,
            '10k': 1.0,
            'half': 1.3,
            'marathon': 1.6,
            'casual': 0.8
        };
        const goalMultiplier = goalMultipliers[running.goal] || 1.0;
        
        // Base distances by type
        const baseDistances = {
            easy: 2.5,
            tempo: 3.0,
            intervals: 2.0,
            long: 5.0,
            recovery: 1.5,
        };
        
        let distance = (baseDistances[run.type] || 2.5) * progression * goalMultiplier;
        
        // Check InjuryIntelligence system FIRST (primary source of truth)
        let injuryMultiplier = 1;
        let injurySource = null;
        
        if (typeof InjuryIntelligence !== 'undefined') {
            const adjustments = InjuryIntelligence.getTrainingAdjustments();
            if (adjustments && adjustments.mileageReduction) {
                // Use the aggregated max reduction from all injuries
                injuryMultiplier = 1 - adjustments.mileageReduction;
                
                // Find which injury has this reduction for display
                if (adjustments.injuries && adjustments.injuries.length > 0) {
                    const primary = adjustments.injuries.find(i => 
                        i.recovery?.mileageReduction === adjustments.mileageReduction
                    );
                    injurySource = primary?.name || adjustments.injuries[0]?.name;
                }
            }
        }
        
        // Fallback to old CONFIG.RUNNING.INJURIES system
        if (injuryMultiplier === 1) {
            const injuries = running.injuries || [];
            injuries.forEach(injuryId => {
                const injury = CONFIG.RUNNING.INJURIES.find(i => i.id === injuryId);
                if (injury && injury.distanceMultiplier < injuryMultiplier) {
                    injuryMultiplier = injury.distanceMultiplier;
                    injurySource = injury.name;
                }
            });
        }
        
        distance = distance * injuryMultiplier;
        
        // Apply performance-based adjustment factor (from AI analysis of past runs)
        const adjustmentFactor = running.adjustmentFactor || 1.0;
        distance = distance * adjustmentFactor;
        
        return {
            distance: distance.toFixed(1),
            adjusted: injuryMultiplier < 1 || adjustmentFactor < 1,
            adjustmentFactor,
            injuryMultiplier,
            injurySource,
            type: run.type
        };
    },
    
    /**
     * Get injury protocol (pre/post run routines)
     */
    getInjuryProtocol(injuries) {
        if (!injuries || injuries.length === 0) {
            return { hasProtocol: false, preRun: [], postRun: [], tip: '', adjusted: false };
        }
        
        // Get the most severe injury (lowest multiplier)
        let primaryInjury = null;
        let lowestMultiplier = 1;
        
        injuries.forEach(injuryId => {
            const injury = CONFIG.RUNNING.INJURIES.find(i => i.id === injuryId);
            if (injury && injury.distanceMultiplier < lowestMultiplier) {
                lowestMultiplier = injury.distanceMultiplier;
                primaryInjury = injury;
            }
        });
        
        if (!primaryInjury) {
            return { hasProtocol: false, preRun: [], postRun: [], tip: '', adjusted: false };
        }
        
        return {
            hasProtocol: true,
            injuryName: primaryInjury.name,
            preRun: primaryInjury.preRun || [],
            postRun: primaryInjury.postRun || [],
            tip: primaryInjury.tip || '',
            adjusted: lowestMultiplier < 1
        };
    },
    
    /**
     * Get run description based on type and week (legacy - for compatibility)
     */
    getRunDescription(run, running) {
        const info = this.getRunInfo(run, running);
        const descriptions = {
            easy: 'Conversational pace. Should be able to talk easily throughout.',
            tempo: 'Comfortably hard. 20-30 min at threshold pace after warmup.',
            intervals: 'Hard efforts with recovery. Push during work intervals.',
            long: 'Build aerobic base. Stay in Zone 2 heart rate.',
            recovery: 'Very easy. Active recovery only.',
        };
        return `<strong>${info.distance} miles</strong> - ${descriptions[run.type] || descriptions.easy}`;
    },

    /**
     * Get how the run should feel based on context
     */
    getRunFeeling(runType, running) {
        const phase = State.getCurrentPhase();
        const week = running.weekNumber;
        const recentRuns = State.getRunLog(5);
        
        // Check if they had a hard effort recently
        const lastHardRun = recentRuns.find(r => r.effort >= 7);
        const daysSinceHard = lastHardRun 
            ? Math.floor((Date.now() - new Date(lastHardRun.date).getTime()) / (1000 * 60 * 60 * 24))
            : null;
        
        let feeling = '';
        
        // Base feeling on run type
        const baseFeelings = {
            easy: 'This should feel comfortable and relaxed. You should be able to hold a conversation. If you\'re breathing hard, slow down.',
            tempo: 'This should feel "comfortably hard" - you can say short sentences but not chat freely. Controlled discomfort.',
            intervals: 'The work intervals should feel hard but sustainable. You\'re building speed. Recovery jogs should be truly easy.',
            long: 'Start conservative. The goal is time on feet, not speed. You should feel strong through mile 3-4, then manage fatigue.',
            recovery: 'This should feel almost too easy. The goal is blood flow and active recovery, not fitness gains.',
        };
        
        feeling = baseFeelings[runType] || baseFeelings.easy;
        
        // Add context based on recent training
        if (daysSinceHard !== null && daysSinceHard <= 1 && runType === 'easy') {
            feeling += ' Your legs may feel heavy from yesterday\'s effort - that\'s normal. Keep it truly easy.';
        }
        
        // Add phase-specific context
        if (phase === 'base' && week <= 3) {
            feeling += ' Early in your program - focus on consistency over speed.';
        } else if (phase === 'peak') {
            feeling += ' You\'re in peak phase - fitness is high but so is fatigue. Trust your training.';
        } else if (phase === 'taper') {
            feeling += ' Taper phase - you may feel extra energy. Don\'t overdo it; save it for race day.';
        }
        
        return feeling;
    },

    /**
     * Get the science explanation for why this run type matters
     */
    getRunScience(runType) {
        const science = {
            easy: {
                title: 'WHY EASY RUNS MATTER',
                text: 'Easy runs build your aerobic base by developing mitochondria and capillaries in your muscles. 80% of your training should be at this intensity. Running easy allows you to accumulate volume without excessive stress, which is the foundation of endurance.',
            },
            tempo: {
                title: 'THE SCIENCE OF TEMPO',
                text: 'Tempo runs train your lactate threshold - the intensity you can sustain for ~1 hour. This "comfortably hard" effort improves lactate clearance efficiency (Faude et al. 2009, Sports Med).',
            },
            intervals: {
                title: 'WHY INTERVALS WORK',
                text: 'High-intensity intervals produce superior VO2max improvements vs steady-state training (Milanović et al. 2015, Sports Med). The adaptation happens during recovery between efforts.',
            },
            long: {
                title: 'LONG RUN ADAPTATIONS',
                text: 'Long runs increase mitochondrial density and fat oxidation capacity (Holloszy & Coyle 1984). Keep pace in Zone 2 - the goal is time on feet, not speed.',
            },
            recovery: {
                title: 'ACTIVE RECOVERY SCIENCE',
                text: 'Light activity enhances lactate clearance without adding training stress (Menzies et al. 2010). Easy days make hard days possible - this is how periodization works.',
            },
        };
        
        return science[runType] || science.easy;
    },

    /**
     * Render injury modifications
     */
    renderInjuryMods(injuries) {
        if (!injuries || injuries.length === 0) return '';

        const mods = [];
        injuries.forEach(injuryId => {
            const injury = CONFIG.RUNNING.INJURIES.find(i => i.id === injuryId);
            if (injury) {
                mods.push(...injury.mods);
            }
        });

        if (mods.length === 0) return '';

        const modTexts = {
            'reduce_incline': 'Keep incline under 3%',
            'shorter_intervals': 'Reduce interval length by 25%',
            'extra_warmup': 'Add 5 min extra warmup',
            'stability_focus': 'Focus on foot stability',
            'arch_strengthening': 'Do arch strengthening exercises',
            'shorter_runs': 'Cap runs at 80% prescribed distance',
            'soft_surface': 'Run on grass/trail when possible',
            'calf_stretches': 'Extra calf stretches before/after',
            'reduce_volume': 'Reduce weekly volume by 20%',
            'reduce_impact': 'Consider pool running 1x/week',
            'grass_running': 'Prefer grass over concrete',
            'compression': 'Wear compression socks',
            'reduce_downhill': 'Avoid steep downhills',
            'quad_strengthening': 'Add quad exercises',
            'shorter_stride': 'Focus on shorter stride, higher cadence',
            'foam_roll': 'Foam roll IT band daily',
            'hip_strengthening': 'Add hip strengthening work',
            'reduce_camber': 'Run on flat surfaces, avoid road camber',
        };

        const uniqueMods = [...new Set(mods)].slice(0, 3);

        return `
            <div class="injury-mods">
                <div class="mods-label">INJURY ADAPTATIONS</div>
                ${uniqueMods.map(m => `<div class="mod-item">${modTexts[m] || m}</div>`).join('')}
            </div>
        `;
    },

    // Store selected feedback
    selectedFeedback: null,
    
    /**
     * Open run logger modal
     */
    openRunLogger(type = 'easy') {
        const paces = State.getTrainingPaces();
        const modal = document.getElementById('logger-modal');
        this.selectedFeedback = null;

        modal.innerHTML = `
            <div class="modal-sheet run-logger" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">LOG RUN</div>
                
                <div class="run-type-select">
                    ${['easy', 'tempo', 'intervals', 'long', 'recovery'].map(t => `
                        <button class="run-type-btn ${t === type ? 'active' : ''}" 
                                onclick="RunningView.selectRunType('${t}')">
                            ${t.toUpperCase()}
                        </button>
                    `).join('')}
                </div>
                
                <div class="run-inputs">
                    <div class="input-row">
                        <div class="input-col">
                            <label>DISTANCE</label>
                            <input type="number" id="run-distance" class="lift-input" 
                                   placeholder="3.0" step="0.1" inputmode="decimal">
                            <span class="input-unit">miles</span>
                        </div>
                        <div class="input-col">
                            <label>TIME</label>
                            <input type="text" id="run-time" class="lift-input" 
                                   placeholder="25:00" inputmode="text">
                            <span class="input-unit">mm:ss</span>
                        </div>
                    </div>
                </div>
                
                <div class="run-feedback-section">
                    <label>HOW DID IT FEEL?</label>
                    <div class="feedback-options">
                        <button class="feedback-btn" data-feedback="too_easy" onclick="RunningView.selectFeedback('too_easy')">
                            <span class="fb-emoji">😎</span>
                            <span class="fb-text">Too Easy</span>
                        </button>
                        <button class="feedback-btn" data-feedback="just_right" onclick="RunningView.selectFeedback('just_right')">
                            <span class="fb-emoji">👍</span>
                            <span class="fb-text">Just Right</span>
                        </button>
                        <button class="feedback-btn" data-feedback="challenging" onclick="RunningView.selectFeedback('challenging')">
                            <span class="fb-emoji">😤</span>
                            <span class="fb-text">Challenging</span>
                        </button>
                        <button class="feedback-btn" data-feedback="struggled" onclick="RunningView.selectFeedback('struggled')">
                            <span class="fb-emoji">😵</span>
                            <span class="fb-text">Struggled</span>
                        </button>
                    </div>
                    <div class="feedback-hint" id="feedback-hint"></div>
                </div>
                
                <div class="effort-select">
                    <label>EFFORT (1-10)</label>
                    <div class="effort-buttons">
                        ${[1,2,3,4,5,6,7,8,9,10].map(e => `
                            <button class="effort-btn" onclick="RunningView.selectEffort(${e})">${e}</button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="run-effort" value="5">
                </div>
                
                <div class="pace-preview" id="pace-preview">
                    Enter distance and time to see pace
                </div>
                
                <button class="save-btn" onclick="RunningView.saveRun('${type}')">LOG RUN</button>
            </div>
        `;

        modal.classList.add('active');

        // Add input listeners for pace preview
        const distInput = document.getElementById('run-distance');
        const timeInput = document.getElementById('run-time');
        
        const updatePace = () => {
            const dist = parseFloat(distInput.value);
            const time = timeInput.value;
            if (dist && time) {
                const pace = State.calculatePace(dist, time);
                document.getElementById('pace-preview').innerHTML = `
                    Pace: <strong>${pace}</strong> /mile
                `;
            }
        };

        distInput.addEventListener('input', updatePace);
        timeInput.addEventListener('input', updatePace);
    },

    /**
     * Select run type in modal
     */
    selectRunType(type) {
        document.querySelectorAll('.run-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === type);
        });
    },

    /**
     * Select feedback option
     */
    selectFeedback(feedback) {
        this.selectedFeedback = feedback;
        document.querySelectorAll('.feedback-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.feedback === feedback);
        });
        
        // Show hint based on selection
        const hints = {
            'too_easy': 'Great! Next time we can push the pace or distance.',
            'just_right': 'Perfect - exactly where you should be.',
            'challenging': 'Good effort! This builds fitness.',
            'struggled': 'Thanks for the honesty - we\'ll adjust your plan.'
        };
        
        const hintEl = document.getElementById('feedback-hint');
        if (hintEl) {
            hintEl.textContent = hints[feedback] || '';
        }
    },

    /**
     * Select effort level
     */
    selectEffort(level) {
        document.querySelectorAll('.effort-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.textContent) === level);
        });
        document.getElementById('run-effort').value = level;
    },

    /**
     * Save run
     */
    saveRun(type) {
        const distance = parseFloat(document.getElementById('run-distance').value);
        const time = document.getElementById('run-time').value;
        const effort = parseInt(document.getElementById('run-effort').value) || 5;
        const feedback = this.selectedFeedback;
        
        // Get selected type from buttons
        const activeType = document.querySelector('.run-type-btn.active');
        const runType = activeType ? activeType.textContent.trim().toLowerCase() : type;

        if (!distance) {
            alert('Enter distance');
            return;
        }

        // Get prescribed distance for comparison
        const running = State.getRunningData();
        const todaysRun = this.getTodaysRun(running);
        const runInfo = todaysRun ? this.getRunInfo(todaysRun, running) : null;
        const prescribed = runInfo ? parseFloat(runInfo.distance) : null;
        
        State.logRun({
            distance,
            time: time || null,
            effort,
            type: runType,
            feedback,
            prescribed, // Store what was prescribed
        });

        // Award XP based on distance and effort
        const baseXP = Math.round(distance * 10);
        const effortBonus = effort >= 7 ? 10 : 0;
        App.awardXP(baseXP + effortBonus, 'discipline');

        document.getElementById('logger-modal').classList.remove('active');
        
        // Check if significantly under prescribed and show AI feedback
        if (prescribed && distance < prescribed * 0.75) {
            this.showRunningAIFeedback(distance, prescribed, effort, feedback, running);
        } else {
            App.render();
        }
    },
    
    /**
     * Show feedback when run is significantly under prescribed - simplified and actionable
     */
    showRunningAIFeedback(actual, prescribed, effort, feedback, running) {
        const shortfall = Math.round(((prescribed - actual) / prescribed) * 100);
        const ratio = actual / prescribed;
        
        // Simple, actionable adjustment
        let adjustment = '';
        let adjustmentAction = null;
        
        if (ratio < 0.5 || feedback === 'struggled') {
            adjustment = 'Reducing all runs by 20% for next 2 weeks.';
            adjustmentAction = 0.8;
        } else if (ratio < 0.75) {
            adjustment = 'Reducing runs by 10% this week.';
            adjustmentAction = 0.9;
        } else {
            adjustment = 'Plan unchanged. You were close.';
        }
        
        // Apply the adjustment
        if (adjustmentAction && adjustmentAction < 1) {
            this.adjustRunningProgram(running, actual, prescribed);
        }
        
        const modal = document.getElementById('logger-modal');
        modal.innerHTML = `
            <div class="modal-sheet run-logger" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">RUN LOGGED</div>
                
                <div class="run-analysis-card">
                    <div class="analysis-stat">
                        <span class="stat-actual">${actual} mi</span>
                        <span class="stat-vs">/</span>
                        <span class="stat-prescribed">${prescribed} mi</span>
                    </div>
                </div>
                
                <div class="run-adjustment-card">
                    <div class="adjustment-message">${adjustment}</div>
                </div>
                
                <button class="save-btn" onclick="document.getElementById('logger-modal').classList.remove('active'); App.render();">
                    DONE
                </button>
            </div>
        `;
        modal.classList.add('active');
    },
    
    
    /**
     * Adjust the running program based on performance
     */
    adjustRunningProgram(running, actual, prescribed) {
        // Store the adjustment factor
        const currentFactor = running.adjustmentFactor || 1.0;
        const newFactor = Math.max(0.5, currentFactor * 0.85); // Reduce by 15%, minimum 50%
        
        State.updateRunningData({
            adjustmentFactor: newFactor,
            lastAdjustmentDate: State.getTodayKey(),
            lastAdjustmentReason: `Completed ${actual}mi of ${prescribed}mi prescribed`
        });
        
    },

    /**
     * Render running dashboard (for stats or dedicated view)
     */
    renderDashboard() {
        const running = State.getRunningData();
        const stats = State.getRunningStats();
        const paces = State.getTrainingPaces();
        const phase = State.getCurrentPhase();
        const recentRuns = State.getRunLog(60);
        const polarized = this.getPolarizedRatio();
        const racePredictor = this.getRacePredictions();
        const personalBests = this.getPersonalBests(recentRuns);
        const weeklyMileage = this.getWeeklyMileageHistory(recentRuns);
        const monthlyComparison = this.getMonthlyComparison(recentRuns);
        const trainingLoad = this.getTrainingLoad(recentRuns);
        const runStreak = this.getRunStreak(recentRuns);
        const insights = this.getTrainingInsights(recentRuns, trainingLoad, polarized);

        if (!running?.goal) {
            return `
                <div class="analysis-card">
                    <div class="analysis-header">
                        <span class="analysis-title">RUNNING</span>
                    </div>
                    <div style="text-align: center; padding: 20px;">
                        <p style="color: var(--text-muted); margin-bottom: 16px;">
                            No running program set up yet.
                        </p>
                        <button class="save-btn" onclick="RunningView.openSetup()">
                            SET UP RUNNING
                        </button>
                    </div>
                </div>
            `;
        }

        const goal = CONFIG.RUNNING.GOALS.find(g => g.id === running.goal);

        return `
            <div class="analysis-card running-dashboard">
                <div class="analysis-header">
                    <span class="analysis-title">RUNNING</span>
                    ${goal ? `<span class="running-goal-badge">${goal.name}</span>` : ''}
                </div>
                
                <!-- Primary Stats -->
                <div class="running-stats-grid">
                    <div class="running-stat primary">
                        <div class="stat-value">${stats?.weeklyMileage?.toFixed(1) || 0}</div>
                        <div class="stat-label">MILES THIS WEEK</div>
                    </div>
                    <div class="running-stat">
                        <div class="stat-value">${stats?.weeklyRuns || 0}</div>
                        <div class="stat-label">RUNS</div>
                    </div>
                    <div class="running-stat">
                        <div class="stat-value">${runStreak.current}</div>
                        <div class="stat-label">DAY STREAK</div>
                    </div>
                    <div class="running-stat">
                        <div class="stat-value">${running.vdot || '--'}</div>
                        <div class="stat-label">VDOT</div>
                    </div>
                </div>

                <!-- Training Insights (Most Important) -->
                ${this.renderTrainingInsights(insights)}
                
                <!-- Weekly Mileage Chart -->
                ${this.renderWeeklyMileageChart(weeklyMileage)}
                
                <!-- Monthly Comparison -->
                ${this.renderMonthlyComparison(monthlyComparison)}
                
                <!-- Training Load -->
                ${this.renderTrainingLoad(trainingLoad)}
                
                <!-- 80/20 Balance -->
                ${this.render8020Card(polarized)}
                
                <!-- Personal Bests -->
                ${this.renderPersonalBests(personalBests)}
                
                <!-- Training Paces (collapsible) -->
                <details class="training-paces-section">
                    <summary class="paces-toggle">Training Paces</summary>
                    <div class="training-paces">
                        <div class="paces-grid">
                            <div class="pace-item">
                                <span class="pace-type">Easy</span>
                                <span class="pace-value">${paces.easy}</span>
                            </div>
                            <div class="pace-item">
                                <span class="pace-type">Marathon</span>
                                <span class="pace-value">${paces.marathon || '--'}</span>
                            </div>
                            <div class="pace-item">
                                <span class="pace-type">Tempo</span>
                                <span class="pace-value">${paces.tempo}</span>
                            </div>
                            <div class="pace-item">
                                <span class="pace-type">Interval</span>
                                <span class="pace-value">${paces.interval}</span>
                            </div>
                        </div>
                    </div>
                </details>
                
                <!-- Race Predictions -->
                ${this.renderRacePredictor(racePredictor)}
                
                <!-- Recent Runs -->
                ${recentRuns.length > 0 ? `
                    <details class="recent-runs-section">
                        <summary class="runs-toggle">Recent Runs (${Math.min(recentRuns.length, 10)})</summary>
                        <div class="recent-runs">
                            ${recentRuns.slice(-10).reverse().map(run => `
                                <div class="run-item">
                                    <span class="run-date">${this.formatDate(run.date)}</span>
                                    <span class="run-type-badge ${run.type || 'easy'}">${(run.type || 'easy').toUpperCase()}</span>
                                    <span class="run-dist">${run.distance} mi</span>
                                    <span class="run-pace">${run.pace || '--'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                ` : ''}
            </div>
        `;
    },

    /**
     * Get personal bests from run history
     */
    getPersonalBests(runs) {
        if (!runs || runs.length === 0) return null;
        
        let fastestPace = null;
        let fastestPaceRun = null;
        let longestRun = 0;
        let longestRunDate = null;
        let mostWeeklyMiles = 0;
        let totalMiles = 0;
        let totalRuns = runs.length;
        
        // Calculate weekly mileages
        const weeklyMiles = {};
        
        runs.forEach(run => {
            const dist = parseFloat(run.distance) || 0;
            totalMiles += dist;
            
            // Longest run
            if (dist > longestRun) {
                longestRun = dist;
                longestRunDate = run.date;
            }
            
            // Fastest pace (only for runs > 1 mile to be meaningful)
            if (run.pace && dist >= 1) {
                const paceParts = run.pace.split(':');
                const paceSeconds = parseInt(paceParts[0]) * 60 + parseInt(paceParts[1] || 0);
                if (!fastestPace || paceSeconds < fastestPace) {
                    fastestPace = paceSeconds;
                    fastestPaceRun = run;
                }
            }
            
            // Weekly tracking
            const weekStart = this.getWeekStart(run.date);
            weeklyMiles[weekStart] = (weeklyMiles[weekStart] || 0) + dist;
        });
        
        // Find highest mileage week
        Object.entries(weeklyMiles).forEach(([week, miles]) => {
            if (miles > mostWeeklyMiles) {
                mostWeeklyMiles = miles;
            }
        });
        
        return {
            fastestPace: fastestPaceRun?.pace,
            fastestPaceDate: fastestPaceRun?.date,
            longestRun: longestRun.toFixed(1),
            longestRunDate,
            mostWeeklyMiles: mostWeeklyMiles.toFixed(1),
            totalMiles: totalMiles.toFixed(1),
            totalRuns
        };
    },

    /**
     * Get week start date for grouping
     */
    getWeekStart(dateStr) {
        const date = new Date(dateStr);
        const day = date.getDay();
        const diff = date.getDate() - day;
        const weekStart = new Date(date.setDate(diff));
        return weekStart.toISOString().split('T')[0];
    },

    /**
     * Get weekly mileage history for chart
     */
    getWeeklyMileageHistory(runs) {
        if (!runs || runs.length === 0) return [];
        
        const weeklyData = {};
        const now = new Date();
        
        // Initialize last 8 weeks
        for (let i = 7; i >= 0; i--) {
            const weekDate = new Date(now);
            weekDate.setDate(weekDate.getDate() - (i * 7));
            const weekStart = this.getWeekStart(weekDate.toISOString().split('T')[0]);
            weeklyData[weekStart] = { miles: 0, runs: 0, weekNum: 8 - i };
        }
        
        // Sum up runs into weeks
        runs.forEach(run => {
            const weekStart = this.getWeekStart(run.date);
            if (weeklyData[weekStart]) {
                weeklyData[weekStart].miles += parseFloat(run.distance) || 0;
                weeklyData[weekStart].runs++;
            }
        });
        
        return Object.entries(weeklyData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([week, data]) => ({
                week,
                ...data
            }));
    },

    /**
     * Get monthly comparison
     */
    getMonthlyComparison(runs) {
        if (!runs || runs.length === 0) return null;
        
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        
        let thisMonthMiles = 0, thisMonthRuns = 0;
        let lastMonthMiles = 0, lastMonthRuns = 0;
        
        runs.forEach(run => {
            const runDate = new Date(run.date);
            const dist = parseFloat(run.distance) || 0;
            
            if (runDate.getMonth() === thisMonth && runDate.getFullYear() === thisYear) {
                thisMonthMiles += dist;
                thisMonthRuns++;
            } else if (runDate.getMonth() === lastMonth && runDate.getFullYear() === lastMonthYear) {
                lastMonthMiles += dist;
                lastMonthRuns++;
            }
        });
        
        const milesDiff = thisMonthMiles - lastMonthMiles;
        const daysIntoMonth = now.getDate();
        const projectedMiles = (thisMonthMiles / daysIntoMonth) * 30;
        
        return {
            thisMonth: {
                miles: thisMonthMiles.toFixed(1),
                runs: thisMonthRuns,
                name: now.toLocaleString('default', { month: 'short' })
            },
            lastMonth: {
                miles: lastMonthMiles.toFixed(1),
                runs: lastMonthRuns,
                name: new Date(lastMonthYear, lastMonth).toLocaleString('default', { month: 'short' })
            },
            difference: milesDiff.toFixed(1),
            isAhead: milesDiff >= 0,
            projected: projectedMiles.toFixed(1)
        };
    },

    /**
     * Calculate acute:chronic training load ratio
     * CITATION: Gabbett (2016) - ACWR between 0.8-1.3 is "sweet spot"
     */
    getTrainingLoad(runs) {
        if (!runs || runs.length < 14) return null;
        
        const now = new Date();
        let acute = 0; // Last 7 days
        let chronic = 0; // Last 28 days
        
        runs.forEach(run => {
            const runDate = new Date(run.date);
            const daysAgo = Math.floor((now - runDate) / (1000 * 60 * 60 * 24));
            const load = (parseFloat(run.distance) || 0) * (run.effort || 5) / 5; // Load = distance * relative effort
            
            if (daysAgo <= 7) {
                acute += load;
            }
            if (daysAgo <= 28) {
                chronic += load;
            }
        });
        
        const chronicWeekly = chronic / 4; // Average per week
        const acwr = chronicWeekly > 0 ? (acute / chronicWeekly).toFixed(2) : 0;
        
        let status = 'optimal';
        let message = 'Training load is in the sweet spot';
        
        if (acwr < 0.8) {
            status = 'low';
            message = 'Undertraining - safe to increase volume';
        } else if (acwr > 1.5) {
            status = 'high';
            message = 'High injury risk - consider reducing';
        } else if (acwr > 1.3) {
            status = 'caution';
            message = 'Approaching limits - be careful';
        }
        
        return {
            acute: acute.toFixed(1),
            chronic: chronicWeekly.toFixed(1),
            acwr,
            status,
            message
        };
    },

    /**
     * Get run streak
     */
    getRunStreak(runs) {
        if (!runs || runs.length === 0) return { current: 0, best: 0 };
        
        // Sort by date descending
        const sortedRuns = [...runs].sort((a, b) => new Date(b.date) - new Date(a.date));
        const runDates = new Set(sortedRuns.map(r => r.date.split('T')[0]));
        
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check current streak from today
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            if (runDates.has(dateStr)) {
                if (i === 0 || currentStreak > 0) {
                    currentStreak++;
                }
                tempStreak++;
            } else if (i === 0) {
                // Didn't run today, check if ran yesterday
                continue;
            } else {
                bestStreak = Math.max(bestStreak, tempStreak);
                tempStreak = 0;
                if (currentStreak > 0) break;
            }
        }
        
        bestStreak = Math.max(bestStreak, tempStreak, currentStreak);
        
        return { current: currentStreak, best: bestStreak };
    },

    /**
     * Generate actionable training insights
     */
    getTrainingInsights(runs, trainingLoad, polarized) {
        const insights = [];
        
        if (!runs || runs.length < 3) {
            insights.push({
                type: 'info',
                title: 'Getting Started',
                message: 'Log more runs to unlock personalized insights'
            });
            return insights;
        }
        
        // Training load insights
        if (trainingLoad) {
            if (trainingLoad.status === 'high') {
                insights.push({
                    type: 'warning',
                    title: 'High Training Load',
                    message: 'Your acute:chronic ratio is high. Consider an easy week to avoid injury.'
                });
            } else if (trainingLoad.status === 'low') {
                insights.push({
                    type: 'success',
                    title: 'Room to Grow',
                    message: 'You can safely increase mileage by 10-15% this week.'
                });
            }
        }
        
        // Polarization insights
        if (polarized) {
            if (polarized.easyPercent < 70) {
                insights.push({
                    type: 'warning',
                    title: 'Too Much Intensity',
                    message: `Only ${polarized.easyPercent}% easy runs. Add 2+ easy runs this week.`
                });
            } else if (polarized.easyPercent > 90 && runs.length >= 10) {
                insights.push({
                    type: 'info',
                    title: 'Add Quality',
                    message: 'Consider adding one tempo or interval session for fitness gains.'
                });
            }
        }
        
        // Recent trend analysis
        const recentWeeks = this.getWeeklyMileageHistory(runs);
        if (recentWeeks.length >= 4) {
            const lastTwo = recentWeeks.slice(-2);
            const prevTwo = recentWeeks.slice(-4, -2);
            const recentAvg = (lastTwo[0].miles + lastTwo[1].miles) / 2;
            const prevAvg = (prevTwo[0].miles + prevTwo[1].miles) / 2;
            
            if (recentAvg > prevAvg * 1.2 && recentAvg > 0) {
                insights.push({
                    type: 'caution',
                    title: 'Volume Spike',
                    message: `Mileage up ${Math.round((recentAvg/prevAvg - 1) * 100)}% - don't increase more than 10%/week.`
                });
            } else if (recentAvg < prevAvg * 0.7 && prevAvg > 5) {
                insights.push({
                    type: 'info',
                    title: 'Volume Drop',
                    message: 'Mileage decreased. Intentional recovery or life getting in the way?'
                });
            }
        }
        
        // If no issues, give positive feedback
        if (insights.length === 0) {
            insights.push({
                type: 'success',
                title: 'On Track',
                message: 'Training is balanced. Keep up the consistency!'
            });
        }
        
        return insights;
    },

    /**
     * Render training insights
     */
    renderTrainingInsights(insights) {
        if (!insights || insights.length === 0) return '';
        
        return `
            <div class="training-insights">
                ${insights.map(insight => `
                    <div class="insight-card ${insight.type}">
                        <div class="insight-title">${insight.title}</div>
                        <div class="insight-message">${insight.message}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render weekly mileage chart
     */
    renderWeeklyMileageChart(weeklyData) {
        if (!weeklyData || weeklyData.length === 0) return '';
        
        const maxMiles = Math.max(...weeklyData.map(w => w.miles), 1);
        
        return `
            <div class="weekly-mileage-chart">
                <div class="chart-header">WEEKLY MILEAGE</div>
                <div class="mileage-bars">
                    ${weeklyData.map((week, i) => {
                        const height = (week.miles / maxMiles) * 100;
                        const isCurrentWeek = i === weeklyData.length - 1;
                        return `
                            <div class="mileage-bar-container">
                                <div class="mileage-bar ${isCurrentWeek ? 'current' : ''}" 
                                     style="height: ${Math.max(height, 2)}%"
                                     title="${week.miles.toFixed(1)} miles">
                                </div>
                                <div class="bar-label">${week.miles.toFixed(0)}</div>
                                <div class="week-label">W${week.weekNum}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render monthly comparison
     */
    renderMonthlyComparison(comparison) {
        if (!comparison) return '';
        
        return `
            <div class="monthly-comparison">
                <div class="comparison-header">
                    <span>MONTHLY PROGRESS</span>
                    <span class="comparison-diff ${comparison.isAhead ? 'positive' : 'negative'}">
                        ${comparison.isAhead ? '+' : ''}${comparison.difference} mi
                    </span>
                </div>
                <div class="comparison-bars">
                    <div class="month-bar">
                        <span class="month-name">${comparison.thisMonth.name}</span>
                        <div class="month-progress">
                            <div class="month-fill" style="width: ${Math.min((comparison.thisMonth.miles / Math.max(comparison.lastMonth.miles, comparison.thisMonth.miles, 1)) * 100, 100)}%"></div>
                        </div>
                        <span class="month-miles">${comparison.thisMonth.miles} mi</span>
                    </div>
                    <div class="month-bar last">
                        <span class="month-name">${comparison.lastMonth.name}</span>
                        <div class="month-progress">
                            <div class="month-fill" style="width: ${Math.min((comparison.lastMonth.miles / Math.max(comparison.lastMonth.miles, comparison.thisMonth.miles, 1)) * 100, 100)}%"></div>
                        </div>
                        <span class="month-miles">${comparison.lastMonth.miles} mi</span>
                    </div>
                </div>
                <div class="projected-miles">On pace for ~${comparison.projected} miles this month</div>
            </div>
        `;
    },

    /**
     * Render training load card
     */
    renderTrainingLoad(load) {
        if (!load) return '';
        
        return `
            <div class="training-load-card ${load.status}">
                <div class="load-header">
                    <span>TRAINING LOAD (ACWR)</span>
                    <span class="load-ratio">${load.acwr}</span>
                </div>
                <div class="load-bar">
                    <div class="load-zones">
                        <span class="zone low">Under</span>
                        <span class="zone optimal">Optimal</span>
                        <span class="zone high">High Risk</span>
                    </div>
                    <div class="load-marker" style="left: ${Math.min(Math.max((load.acwr / 2) * 100, 5), 95)}%"></div>
                </div>
                <div class="load-message">${load.message}</div>
            </div>
        `;
    },

    /**
     * Render personal bests
     */
    renderPersonalBests(pbs) {
        if (!pbs) return '';
        
        return `
            <div class="personal-bests">
                <div class="pbs-header">PERSONAL BESTS</div>
                <div class="pbs-grid">
                    <div class="pb-item">
                        <div class="pb-value">${pbs.fastestPace || '--'}</div>
                        <div class="pb-label">Fastest Pace</div>
                    </div>
                    <div class="pb-item">
                        <div class="pb-value">${pbs.longestRun}</div>
                        <div class="pb-label">Longest Run (mi)</div>
                    </div>
                    <div class="pb-item">
                        <div class="pb-value">${pbs.mostWeeklyMiles}</div>
                        <div class="pb-label">Best Week (mi)</div>
                    </div>
                    <div class="pb-item">
                        <div class="pb-value">${pbs.totalMiles}</div>
                        <div class="pb-label">Total Miles</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Calculate 80/20 polarized training ratio
     * CITATION: Seiler (2010) Int J Sports Physiol Perform - elite endurance athletes
     *           train ~80% low intensity, ~20% high intensity
     *           Stöggl & Sperlich (2014) Front Physiol - polarized > threshold training
     */
    getPolarizedRatio() {
        const runs = State.getRunLog(30); // Last 30 runs
        if (runs.length < 5) return null;
        
        let easyRuns = 0;
        let hardRuns = 0;
        let totalMileage = 0;
        let easyMileage = 0;
        let hardMileage = 0;
        
        for (const run of runs) {
            const isEasy = run.effort <= 6 || ['easy', 'recovery', 'long'].includes(run.type);
            const isHard = run.effort >= 7 || ['tempo', 'intervals'].includes(run.type);
            const dist = parseFloat(run.distance) || 0;
            
            totalMileage += dist;
            
            if (isEasy) {
                easyRuns++;
                easyMileage += dist;
            }
            if (isHard) {
                hardRuns++;
                hardMileage += dist;
            }
        }
        
        const totalRuns = easyRuns + hardRuns;
        const easyPercent = totalRuns > 0 ? Math.round((easyRuns / totalRuns) * 100) : 0;
        const hardPercent = 100 - easyPercent;
        
        const easyMilePercent = totalMileage > 0 ? Math.round((easyMileage / totalMileage) * 100) : 0;
        
        // Determine status
        let status = 'good';
        let message = 'Perfect! Maintaining 80/20 balance.';
        
        if (easyPercent < 70) {
            status = 'warning';
            message = 'Too much hard running. Add more easy days.';
        } else if (easyPercent < 75) {
            status = 'caution';
            message = 'Slightly intense. Consider adding easy runs.';
        } else if (easyPercent > 90) {
            status = 'caution';
            message = 'Very conservative. Could add 1 quality session.';
        }
        
        return {
            easyPercent,
            hardPercent,
            easyMilePercent,
            status,
            message,
            totalRuns: runs.length,
        };
    },

    /**
     * Render 80/20 card
     */
    render8020Card(polarized) {
        if (!polarized) return '';
        
        return `
            <div class="polarized-card ${polarized.status}">
                <div class="polarized-header">
                    <span class="polarized-title">80/20 TRAINING BALANCE</span>
                    <span class="polarized-status ${polarized.status}">${polarized.status.toUpperCase()}</span>
                </div>
                <div class="polarized-bar">
                    <div class="polarized-easy" style="width: ${polarized.easyPercent}%">
                        <span>${polarized.easyPercent}%</span>
                    </div>
                    <div class="polarized-hard" style="width: ${polarized.hardPercent}%">
                        <span>${polarized.hardPercent}%</span>
                    </div>
                </div>
                <div class="polarized-labels">
                    <span>Easy/Recovery</span>
                    <span>Hard/Quality</span>
                </div>
                <div class="polarized-message">${polarized.message}</div>
            </div>
        `;
    },

    /**
     * Get race time predictions based on VDOT
     */
    getRacePredictions() {
        const running = State.getRunningData();
        const vdot = running?.vdot || 40;
        
        // Race time predictions based on VDOT (simplified Daniels' Running Formula)
        const predictions = {
            30: { '5k': '32:00', '10k': '66:20', 'half': '2:26:00', 'marathon': '5:10:00' },
            35: { '5k': '27:30', '10k': '57:00', 'half': '2:05:00', 'marathon': '4:25:00' },
            40: { '5k': '24:00', '10k': '49:45', 'half': '1:50:00', 'marathon': '3:52:00' },
            45: { '5k': '21:15', '10k': '44:00', 'half': '1:38:00', 'marathon': '3:26:00' },
            50: { '5k': '19:00', '10k': '39:20', 'half': '1:27:30', 'marathon': '3:04:00' },
            55: { '5k': '17:15', '10k': '35:45', 'half': '1:19:30', 'marathon': '2:47:00' },
            60: { '5k': '15:45', '10k': '32:40', 'half': '1:12:30', 'marathon': '2:32:00' },
        };
        
        // Find closest VDOT
        const vdotKeys = Object.keys(predictions).map(Number);
        let closestVdot = vdotKeys.reduce((a, b) => 
            Math.abs(b - vdot) < Math.abs(a - vdot) ? b : a
        );
        
        return {
            vdot,
            predictions: predictions[closestVdot],
        };
    },

    /**
     * Render race predictor
     */
    renderRacePredictor(racePredictor) {
        if (!racePredictor) return '';
        
        return `
            <div class="race-predictor">
                <div class="predictor-header">RACE PREDICTIONS (VDOT ${racePredictor.vdot})</div>
                <div class="predictions-grid">
                    <div class="prediction-item">
                        <span class="race-dist">5K</span>
                        <span class="race-time">${racePredictor.predictions['5k']}</span>
                    </div>
                    <div class="prediction-item">
                        <span class="race-dist">10K</span>
                        <span class="race-time">${racePredictor.predictions['10k']}</span>
                    </div>
                    <div class="prediction-item">
                        <span class="race-dist">Half</span>
                        <span class="race-time">${racePredictor.predictions['half']}</span>
                    </div>
                    <div class="prediction-item">
                        <span class="race-dist">Marathon</span>
                        <span class="race-time">${racePredictor.predictions['marathon']}</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get VDOT history for improvement tracking
     */
    getVDOTHistory() {
        const running = State.getRunningData();
        const startVdot = running?.startVdot || running?.vdot;
        const currentVdot = running?.vdot;
        
        if (!startVdot || !currentVdot) return null;
        
        const improvement = currentVdot - startVdot;
        
        return {
            start: startVdot,
            current: currentVdot,
            improvement,
            improved: improvement > 0,
        };
    },

    /**
     * Render VDOT progress
     */
    renderVDOTProgress(vdotHistory) {
        if (!vdotHistory) return '';
        
        return `
            <div class="vdot-progress">
                <div class="vdot-header">VDOT IMPROVEMENT</div>
                <div class="vdot-values">
                    <div class="vdot-start">
                        <span class="vdot-label">START</span>
                        <span class="vdot-num">${vdotHistory.start}</span>
                    </div>
                    <div class="vdot-arrow">${vdotHistory.improved ? '→' : '='}</div>
                    <div class="vdot-current">
                        <span class="vdot-label">NOW</span>
                        <span class="vdot-num">${vdotHistory.current}</span>
                    </div>
                    ${vdotHistory.improvement > 0 ? `
                        <div class="vdot-gain">+${vdotHistory.improvement}</div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Format date for display
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    /**
     * Open running setup
     */
    openSetup() {
        const modal = document.getElementById('goals-modal');
        const running = State.getRunningData();

        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">RUNNING SETUP</div>
                
                <div class="setup-section">
                    <label>What's your goal?</label>
                    <div class="goal-options">
                        ${CONFIG.RUNNING.GOALS.map(g => `
                            <button class="goal-btn ${running?.goal === g.id ? 'active' : ''}" 
                                    onclick="RunningView.selectGoal('${g.id}')">
                                ${g.name}
                                ${g.weeks ? `<span class="goal-weeks">${g.weeks} weeks</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="setup-section">
                    <label>Current comfortable distance (miles)</label>
                    <input type="number" class="input-field" id="baseline-distance" 
                           value="${running?.baseline?.currentDistance || ''}" 
                           placeholder="2" step="0.5" inputmode="decimal">
                </div>
                
                <div class="setup-section">
                    <label>Recent 5K time (optional)</label>
                    <input type="text" class="input-field" id="baseline-race" 
                           value="${running?.baseline?.recentRaceTime?.time || ''}" 
                           placeholder="25:30">
                    <p style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">
                        Used to calculate your training paces
                    </p>
                </div>
                
                <div class="setup-section">
                    <label>Current injuries</label>
                    <div class="injury-options">
                        ${CONFIG.RUNNING.INJURIES.map(i => `
                            <label class="injury-check">
                                <input type="checkbox" 
                                       ${running?.injuries?.includes(i.id) ? 'checked' : ''}
                                       data-injury="${i.id}">
                                <span>${i.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <button class="save-btn" onclick="RunningView.saveSetup()">SAVE</button>
            </div>
        `;

        modal.classList.add('active');
    },

    /**
     * Select goal in setup
     */
    selectGoal(goalId) {
        document.querySelectorAll('.goal-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.goal-btn').classList.add('active');
    },

    /**
     * Save running setup
     */
    saveSetup() {
        const activeGoal = document.querySelector('.goal-btn.active');
        const goalId = activeGoal ? 
            CONFIG.RUNNING.GOALS.find(g => activeGoal.textContent.includes(g.name))?.id : null;
        
        const baselineDistance = parseFloat(document.getElementById('baseline-distance').value);
        const raceTime = document.getElementById('baseline-race').value;
        
        const injuries = [];
        document.querySelectorAll('.injury-check input:checked').forEach(cb => {
            injuries.push(cb.dataset.injury);
        });

        if (goalId) {
            State.setRunningGoal(goalId);
        }

        if (baselineDistance || raceTime) {
            State.setRunningBaseline({
                currentDistance: baselineDistance || null,
                recentRaceTime: raceTime ? { distance: '5k', time: raceTime } : null,
            });
        }

        State.setRunningInjuries(injuries);

        document.getElementById('goals-modal').classList.remove('active');
        App.render();
    },

    /**
     * Delete today's logged run
     */
    deleteToday() {
        if (!confirm('Delete today\'s run?')) return;
        
        const todayKey = State.getTodayKey();
        
        // Clear from days
        if (State._data.days[todayKey]) {
            State._data.days[todayKey].runDistance = 0;
        }
        
        // Remove from cardioLog
        State._data.cardioLog = (State._data.cardioLog || []).filter(entry => 
            entry.date !== todayKey || entry.type !== 'running'
        );
        
        // Remove from runLog
        State._data.runLog = (State._data.runLog || []).filter(entry => 
            entry.date !== todayKey
        );
        
        State.save();
        App.render();
    },

    /**
     * Get weekly summary
     */
    getWeeklySummary() {
        const running = State.getRunningData();
        if (!running?.goal) return null;

        const goal = CONFIG.RUNNING.GOALS.find(g => g.id === running.goal);
        
        return {
            week: running.weekNumber,
            totalWeeks: goal?.weeks || 'Ongoing',
            goal: goal?.name || 'General Fitness',
            injuries: running.injuries.length,
        };
    },

    /**
     * Calculate if user is on track with training
     */
    getTrackStatus(running) {
        const stats = State.getRunningStats();
        const week = running.weekNumber;
        
        // Expected runs per week based on schedule (typically 4-5)
        const expectedRunsPerWeek = 4;
        // Expected mileage grows with weeks
        const expectedMileage = 10 + (week * 2);
        
        const actualRuns = stats?.weeklyRuns || 0;
        const actualMileage = parseFloat(stats?.weeklyMileage) || 0;
        
        // Calculate percentage of expected
        const runCompletion = (actualRuns / expectedRunsPerWeek) * 100;
        const mileageCompletion = (actualMileage / expectedMileage) * 100;
        const avgCompletion = (runCompletion + mileageCompletion) / 2;
        
        let status, message;
        
        if (avgCompletion >= 90) {
            status = 'on-track';
            message = 'On track - great consistency!';
        } else if (avgCompletion >= 70) {
            status = 'slightly-behind';
            message = `Slightly behind (${actualRuns}/${expectedRunsPerWeek} runs, ${actualMileage.toFixed(1)}/${expectedMileage} mi)`;
        } else if (avgCompletion >= 40) {
            status = 'behind';
            message = `Behind schedule - prioritize your runs this week`;
        } else {
            status = 'at-risk';
            message = 'At risk - getting back on track matters more than catching up';
        }
        
        return { status, message, runCompletion, mileageCompletion, avgCompletion };
    },

    /**
     * Render track indicator (only if user has been running for a while)
     */
    renderTrackIndicator(trackStatus) {
        // Don't show if no runs logged yet or less than 3 days of tracking
        const stats = State.getRunningStats();
        const running = State.getRunningData();
        const startDate = running?.startDate;
        
        // Need at least one run AND at least 3 days since starting
        if (!stats || stats.totalRuns === 0) {
            return '';
        }
        
        // Check if at least 3 days since running program started
        if (startDate) {
            const daysSinceStart = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceStart < 3) {
                return ''; // Don't show status in first 3 days
            }
        }
        
        const statusIcons = {
            'on-track': 'ON TRACK',
            'slightly-behind': 'CATCH UP',
            'behind': 'BEHIND',
            'at-risk': 'AT RISK',
        };
        
        return `
            <div class="track-indicator ${trackStatus.status}">
                <span class="track-badge">${statusIcons[trackStatus.status]}</span>
                <span class="track-message">${trackStatus.message}</span>
            </div>
        `;
    },

    /**
     * Get tomorrow's run preview
     */
    getTomorrowPreview(running) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayOfWeek = tomorrow.getDay();
        
        // Direct mapping - getDay() matches BASE_WEEK index
        const tomorrowRun = CONFIG.RUNNING.BASE_WEEK[dayOfWeek];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return {
            dayName: dayNames[dayOfWeek],
            run: tomorrowRun,
        };
    },

    /**
     * Render tomorrow preview
     */
    renderTomorrowPreview(tomorrow) {
        if (!tomorrow?.run) return '';
        
        const typeLabels = {
            easy: 'Easy Run',
            tempo: 'Tempo Run',
            intervals: 'Interval Training',
            long: 'Long Run',
            recovery: 'Recovery Run',
            rest: 'Rest Day',
        };
        
        return `
            <div class="tomorrow-preview">
                <span class="tomorrow-label">TOMORROW</span>
                <span class="tomorrow-content">
                    ${tomorrow.dayName}: <strong>${typeLabels[tomorrow.run.type] || tomorrow.run.description}</strong>
                </span>
            </div>
        `;
    }
};

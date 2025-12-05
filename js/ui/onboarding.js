/**
 * ONBOARDING.JS
 * Onboarding flow with auto-calculated nutrition
 */

const Onboarding = {
    currentStep: 1,
    totalSteps: 7,
    data: {},

    /**
     * Render the onboarding screen
     */
    render() {
        const container = document.getElementById('onboarding-screen');
        
        container.innerHTML = `
            <div class="onboarding-container">
                ${this.renderStep(this.currentStep)}
            </div>
        `;
    },

    /**
     * Render a specific step
     */
    renderStep(step) {
        switch (step) {
            case 1: return this.renderWelcome();
            case 2: return this.renderStats();
            case 3: return this.renderGoal();
            case 4: return this.renderNutrition();
            case 5: return this.renderPosture();
            case 6: return this.renderRunning();
            case 7: return this.renderSummary();
            default: return '';
        }
    },

    /**
     * Step 1: Welcome
     */
    renderWelcome() {
        return `
            <div class="onboard-step active">
                <div class="onboard-title">OS</div>
                <div class="onboard-subtitle">Your operating system for life.</div>
                <p class="onboard-text">
                    Track workouts, nutrition, and habits. Build discipline through accountability.
                </p>
                <button class="onboard-btn" onclick="Onboarding.next()">BEGIN SETUP</button>
            </div>
        `;
    },

    /**
     * Step 2: Body Stats
     */
    renderStats() {
        return `
            <div class="onboard-step active">
                <div class="onboard-progress">${this.currentStep} / ${this.totalSteps}</div>
                <div class="onboard-step-title">YOUR STATS</div>
                
                <div class="input-group">
                    <label>Current Weight (lbs)</label>
                    <input type="number" class="input-field" id="ob-weight" 
                           placeholder="185" inputmode="decimal" value="${this.data.weight || ''}">
                </div>
                
                <div class="input-group">
                    <label>Height (ft)</label>
                    <input type="number" class="input-field" id="ob-height-ft" 
                           placeholder="5" inputmode="numeric" value="${this.data.heightFt || ''}">
                </div>
                
                <div class="input-group">
                    <label>Height (in)</label>
                    <input type="number" class="input-field" id="ob-height-in" 
                           placeholder="10" inputmode="numeric" value="${this.data.heightIn || ''}">
                </div>
                
                <div class="input-group">
                    <label>Age</label>
                    <input type="number" class="input-field" id="ob-age" 
                           placeholder="28" inputmode="numeric" value="${this.data.age || ''}">
                </div>
                
                <button class="onboard-btn" onclick="Onboarding.next()">NEXT</button>
            </div>
        `;
    },

    /**
     * Step 3: Goal
     */
    renderGoal() {
        return `
            <div class="onboard-step active">
                <div class="onboard-progress">${this.currentStep} / ${this.totalSteps}</div>
                <div class="onboard-step-title">YOUR GOAL</div>
                
                <div class="input-group">
                    <label>Target Weight (lbs)</label>
                    <input type="number" class="input-field" id="ob-target" 
                           placeholder="175" inputmode="decimal" value="${this.data.targetWeight || ''}">
                    <p class="onboard-text dim" style="margin-top: 8px; font-size: 12px;">
                        Where do you want to be?
                    </p>
                </div>
                
                <button class="onboard-btn" onclick="Onboarding.next()">CALCULATE MY TARGETS</button>
            </div>
        `;
    },

    /**
     * Step 4: Calculated Nutrition
     */
    renderNutrition() {
        const targets = this.data.targets || { tdee: '--', calories: '--', protein: '--', explanation: '' };

        return `
            <div class="onboard-step active">
                <div class="onboard-progress">${this.currentStep} / ${this.totalSteps}</div>
                <div class="onboard-step-title">YOUR NUTRITION</div>
                
                <p class="onboard-text">Based on your stats and goals, here's your science-backed plan:</p>
                
                <div class="calc-results">
                    <div class="calc-item">
                        <span class="calc-label">TDEE (Maintenance)</span>
                        <span class="calc-value">${targets.tdee} cal</span>
                    </div>
                    <div class="calc-item highlight">
                        <span class="calc-label">DAILY CALORIES</span>
                        <span class="calc-value">${targets.calories} cal</span>
                    </div>
                    <div class="calc-item highlight">
                        <span class="calc-label">DAILY PROTEIN</span>
                        <span class="calc-value">${targets.protein}g</span>
                    </div>
                </div>
                
                <div class="calc-explanation">${targets.explanation}</div>
                
                <p class="onboard-text dim" style="margin-top: 20px; font-size: 11px;">
                    Protein: 1g/lb target weight (Morton et al. 2018, British Journal of Sports Medicine).<br>
                    Calories: TDEE via Mifflin-St Jeor equation, adjusted for goal.
                </p>
                
                <button class="onboard-btn" onclick="Onboarding.next()">ACCEPT TARGETS</button>
            </div>
        `;
    },

    /**
     * Step 5: Posture Assessment (Optional)
     */
    renderPosture() {
        return `
            <div class="onboard-step active">
                <div class="onboard-progress">${this.currentStep} / ${this.totalSteps}</div>
                <div class="onboard-step-title">POSTURE ASSESSMENT</div>
                
                <p class="onboard-text">
                    Identify any posture issues. Corrective exercises will be added to your workouts.
                </p>
                
                <div class="posture-options onboard-options">
                    ${CONFIG.POSTURE_ISSUES.map(issue => `
                        <label class="posture-check ${(this.data.postureIssues || []).includes(issue.id) ? 'active' : ''}">
                            <input type="checkbox" 
                                   ${(this.data.postureIssues || []).includes(issue.id) ? 'checked' : ''}
                                   onchange="Onboarding.togglePosture('${issue.id}')">
                            <div class="posture-info">
                                <span class="posture-name">${issue.name}</span>
                                <span class="posture-desc">${issue.description}</span>
                            </div>
                        </label>
                    `).join('')}
                </div>
                
                <p class="onboard-text dim" style="margin-top: 16px; font-size: 11px;">
                    Exercises like face pulls, dead hangs, and wall slides will be emphasized.
                </p>
                
                <button class="onboard-btn" onclick="Onboarding.next()">
                    ${(this.data.postureIssues || []).length > 0 ? 'NEXT' : 'SKIP'}
                </button>
            </div>
        `;
    },

    /**
     * Toggle posture issue
     */
    togglePosture(issueId) {
        if (!this.data.postureIssues) this.data.postureIssues = [];
        
        const idx = this.data.postureIssues.indexOf(issueId);
        if (idx >= 0) {
            this.data.postureIssues.splice(idx, 1);
        } else {
            this.data.postureIssues.push(issueId);
        }
        this.render();
    },

    /**
     * Step 6: Running Goal (Optional)
     */
    renderRunning() {
        return `
            <div class="onboard-step active">
                <div class="onboard-progress">${this.currentStep} / ${this.totalSteps}</div>
                <div class="onboard-step-title">RUNNING GOAL</div>
                
                <p class="onboard-text">Optional: Set a running goal for a structured program.</p>
                
                <div class="goal-options">
                    ${CONFIG.RUNNING.GOALS.map(g => `
                        <button class="goal-btn ${this.data.runningGoal === g.id ? 'active' : ''}" 
                                onclick="Onboarding.selectRunningGoal('${g.id}')">
                            ${g.name}
                            ${g.weeks ? `<span class="goal-weeks">${g.weeks} weeks</span>` : ''}
                        </button>
                    `).join('')}
                </div>
                
                <div class="setup-section" style="margin-top: 20px;">
                    <label>Current Injuries/Limitations (select all that apply)</label>
                    <div class="injury-options">
                        ${CONFIG.RUNNING.INJURIES.map(i => `
                            <label class="injury-check">
                                <input type="checkbox" 
                                       ${(this.data.injuries || []).includes(i.id) ? 'checked' : ''}
                                       onchange="Onboarding.toggleInjury('${i.id}')">
                                <span>${i.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <button class="onboard-btn" onclick="Onboarding.next()">
                    ${this.data.runningGoal ? 'NEXT' : 'SKIP'}
                </button>
            </div>
        `;
    },

    /**
     * Select running goal
     */
    selectRunningGoal(goalId) {
        this.data.runningGoal = goalId;
        this.render();
    },

    /**
     * Toggle injury
     */
    toggleInjury(injuryId) {
        if (!this.data.injuries) this.data.injuries = [];
        
        const idx = this.data.injuries.indexOf(injuryId);
        if (idx >= 0) {
            this.data.injuries.splice(idx, 1);
        } else {
            this.data.injuries.push(injuryId);
        }
    },

    /**
     * Step 7: Summary
     */
    renderSummary() {
        const targets = this.data.targets || {};
        const hasRunning = !!this.data.runningGoal;

        return `
            <div class="onboard-step active">
                <div class="onboard-progress">${this.currentStep} / ${this.totalSteps}</div>
                <div class="onboard-step-title">READY</div>
                
                <div class="onboard-summary">
                    <div class="summary-item">
                        <span>Starting Weight</span>
                        <span>${this.data.weight} lbs</span>
                    </div>
                    <div class="summary-item">
                        <span>Target Weight</span>
                        <span>${this.data.targetWeight} lbs</span>
                    </div>
                    <div class="summary-item">
                        <span>Daily Calories</span>
                        <span>${targets.calories}</span>
                    </div>
                    <div class="summary-item">
                        <span>Daily Protein</span>
                        <span>${targets.protein}g</span>
                    </div>
                </div>
                
                <div class="feature-summary">
                    <div class="feature-item">
                        <div class="feature-name">ACCOUNTABILITY</div>
                        <div class="feature-desc">Daily scoring, XP streaks, and penalties keep you consistent. Miss a day, lose progress.</div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-name">STRENGTH</div>
                        <div class="feature-desc">Science-based lifting with progressive overload tracking, volume management, and PR detection.</div>
                    </div>
                    ${hasRunning ? `
                    <div class="feature-item">
                        <div class="feature-name">ENDURANCE</div>
                        <div class="feature-desc">Periodized running plan with pace guidance, injury adaptations, and performance tracking.</div>
                    </div>
                    ` : ''}
                    <div class="feature-item">
                        <div class="feature-name">NUTRITION</div>
                        <div class="feature-desc">AI-powered food logging with macro tracking, meal saving, and personalized targets.</div>
                    </div>
                </div>
                
                <button class="onboard-btn" onclick="Onboarding.complete()">LET'S GO</button>
            </div>
        `;
    },

    /**
     * Go to next step
     */
    next() {
        // Validate and save current step data
        if (!this.validateAndSave()) return;

        this.currentStep++;
        this.render();
    },

    /**
     * Validate current step and save data
     */
    validateAndSave() {
        switch (this.currentStep) {
            case 2: {
                const weight = parseFloat(document.getElementById('ob-weight')?.value);
                const heightFt = parseInt(document.getElementById('ob-height-ft')?.value);
                const heightIn = parseInt(document.getElementById('ob-height-in')?.value) || 0;
                const age = parseInt(document.getElementById('ob-age')?.value);

                if (!weight || !heightFt || !age) {
                    alert('Please fill in all fields');
                    return false;
                }

                this.data.weight = weight;
                this.data.heightFt = heightFt;
                this.data.heightIn = heightIn;
                this.data.height = (heightFt * 12) + heightIn;
                this.data.age = age;
                return true;
            }

            case 3: {
                const target = parseFloat(document.getElementById('ob-target')?.value);

                if (!target) {
                    alert('Please enter your target weight');
                    return false;
                }

                this.data.targetWeight = target;

                // Calculate nutrition targets - with inline fallback if Utils not loaded
                try {
                    console.log('Utils available:', typeof Utils !== 'undefined');
                    console.log('Calculating targets with:', this.data.weight, this.data.targetWeight, this.data.height, this.data.age);
                    
                    if (typeof Utils !== 'undefined' && Utils.calculateTargets) {
                        this.data.targets = Utils.calculateTargets(
                            this.data.weight,
                            this.data.targetWeight,
                            this.data.height,
                            this.data.age
                        );
                    } else {
                        // Inline fallback calculation
                        console.warn('Utils not available, using inline calculation');
                        const currentWeight = this.data.weight;
                        const targetWeight = this.data.targetWeight;
                        const heightInches = this.data.height;
                        const age = this.data.age;
                        
                        // Basic TDEE calculation (Mifflin-St Jeor)
                        const weightKg = currentWeight * 0.453592;
                        const heightCm = heightInches * 2.54;
                        const bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
                        const tdee = Math.round(bmr * 1.55);
                        
                        // Deficit for weight loss
                        const isLosing = targetWeight < currentWeight;
                        const calories = isLosing ? tdee - 500 : tdee + 300;
                        const protein = Math.round(targetWeight * 1.0);
                        const fats = Math.round(currentWeight * 0.35);
                        const fatCals = fats * 9;
                        const proteinCals = protein * 4;
                        const carbCals = calories - fatCals - proteinCals;
                        const carbs = Math.round(Math.max(100, carbCals / 4));
                        
                        const explanation = isLosing 
                            ? `500 cal deficit for ~1 lb/week loss`
                            : `300 cal surplus for lean gains`;
                        
                        this.data.targets = {
                            tdee: tdee,
                            calories: Math.max(1500, calories),
                            protein: protein,
                            carbs: carbs,
                            fats: fats,
                            explanation: explanation
                        };
                    }
                    console.log('Targets calculated:', this.data.targets);
                } catch (e) {
                    console.error('Error calculating targets:', e);
                    alert('Error calculating targets: ' + e.message);
                    return false;
                }
                return true;
            }

            default:
                return true;
        }
    },

    /**
     * Complete onboarding
     */
    complete() {
        // Initialize state with onboarding data
        State.init();
        
        State.setProfile({
            startWeight: this.data.weight,
            currentWeight: this.data.weight, // Also set as current weight
            height: this.data.height,
            age: this.data.age
        });

        State.setGoals({
            targetWeight: this.data.targetWeight,
            dailyProtein: this.data.targets.protein,
            dailyCalories: this.data.targets.calories,
            dailyCarbs: this.data.targets.carbs,
            dailyFats: this.data.targets.fats,
            tdee: this.data.targets.tdee
        });

        // Log initial weight
        State.logValue('weight', this.data.weight);

        // Set running goal if selected
        if (this.data.runningGoal) {
            State.setRunningGoal(this.data.runningGoal);
            if (this.data.injuries && this.data.injuries.length > 0) {
                State.setRunningInjuries(this.data.injuries);
            }
        }

        // Set posture issues if selected
        if (this.data.postureIssues && this.data.postureIssues.length > 0) {
            State.setPostureIssues(this.data.postureIssues);
        }

        // Mark onboarding complete
        State.completeOnboarding();

        // Show main app
        App.showMain();
    }
};


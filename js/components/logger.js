/**
 * LOGGER.JS
 * Logging modals for weight, protein, calories, sleep
 */

const Logger = {
    currentType: null,

    /**
     * Render log cards grid
     */
    renderLogGrid() {
        const todayData = State.getDayData();
        const goals = State.getGoals();
        
        // Calculate percentages
        const calPercent = goals?.dailyCalories ? Math.round((todayData?.calories || 0) / goals.dailyCalories * 100) : 0;
        const protPercent = goals?.dailyProtein ? Math.round((todayData?.protein || 0) / goals.dailyProtein * 100) : 0;

        return `
            <section class="section">
                <div class="section-header">
                    <span class="section-title">NUTRITION</span>
                    <button class="ai-log-btn" onclick="AINutrition.openLogger()">AI LOG</button>
                </div>
                <div class="log-grid">
                    <div class="log-card" onclick="Logger.open('weight')">
                        <div class="log-value">${todayData?.weight || '--'}</div>
                        <div class="log-label">WEIGHT</div>
                    </div>
                    <div class="log-card ${protPercent >= 100 ? 'goal-hit' : protPercent < 50 ? 'goal-low' : ''}" onclick="Logger.open('protein')">
                        <div class="log-value">${todayData?.protein || '0'}<span class="log-unit">g</span></div>
                        <div class="log-label">PROTEIN</div>
                        ${goals?.dailyProtein ? `<div class="log-progress">${protPercent}%</div>` : ''}
                    </div>
                    <div class="log-card ${calPercent > 100 ? 'goal-over' : calPercent >= 85 ? 'goal-close' : ''}" onclick="Logger.open('calories')">
                        <div class="log-value">${todayData?.calories || '0'}</div>
                        <div class="log-label">CALORIES</div>
                        ${goals?.dailyCalories ? `<div class="log-progress">${calPercent}%</div>` : ''}
                    </div>
                </div>
                ${this.renderMacroBar(todayData, goals)}
            </section>
        `;
    },
    
    /**
     * Render macro progress bar
     */
    renderMacroBar(todayData, goals) {
        if (!goals?.dailyCalories) return '';
        
        const calPercent = Math.min(100, Math.round((todayData?.calories || 0) / goals.dailyCalories * 100));
        const protPercent = Math.min(100, Math.round((todayData?.protein || 0) / (goals.dailyProtein || 150) * 100));
        
        return `
            <div class="macro-progress-bars">
                <div class="macro-bar-row">
                    <span class="macro-bar-label">CAL</span>
                    <div class="macro-bar">
                        <div class="macro-fill ${calPercent > 100 ? 'over' : ''}" style="width: ${calPercent}%"></div>
                    </div>
                    <span class="macro-bar-value">${calPercent}%</span>
                </div>
                <div class="macro-bar-row">
                    <span class="macro-bar-label">PRO</span>
                    <div class="macro-bar">
                        <div class="macro-fill protein ${protPercent >= 100 ? 'complete' : ''}" style="width: ${protPercent}%"></div>
                    </div>
                    <span class="macro-bar-value">${protPercent}%</span>
                </div>
            </div>
        `;
    },

    /**
     * Open logger modal
     */
    open(type) {
        this.currentType = type;
        const modal = document.getElementById('logger-modal');
        modal.innerHTML = this.renderModal(type);
        modal.classList.add('active');

        // Focus input after render
        setTimeout(() => {
            const input = document.getElementById('log-input');
            if (input) input.focus();
        }, 100);
    },

    /**
     * Close logger modal
     */
    close() {
        const modal = document.getElementById('logger-modal');
        modal.classList.remove('active');
        this.currentType = null;
    },

    /**
     * Render modal content based on type
     */
    renderModal(type) {
        const todayData = State.getDayData();
        const goals = State.getGoals();
        
        const configs = {
            weight: {
                title: 'LOG WEIGHT',
                value: todayData?.weight || '',
                placeholder: '0.0',
                step: '0.1',
                inputmode: 'decimal',
                presets: [
                    { label: '-1', action: 'Logger.adjust(-1)' },
                    { label: '-0.5', action: 'Logger.adjust(-0.5)' },
                    { label: '+0.5', action: 'Logger.adjust(0.5)' },
                ],
                goal: null
            },
            protein: {
                title: 'LOG PROTEIN',
                value: todayData?.protein || '',
                placeholder: '0',
                step: '1',
                inputmode: 'numeric',
                presets: CONFIG.LOGGING_PRESETS.protein.map(v => ({
                    label: `+${v}g`,
                    action: `Logger.add(${v})`
                })),
                goal: `Goal: ${goals?.dailyProtein || 180}g`
            },
            calories: {
                title: 'LOG CALORIES',
                value: todayData?.calories || '',
                placeholder: '0',
                step: '1',
                inputmode: 'numeric',
                presets: CONFIG.LOGGING_PRESETS.calories.map(v => ({
                    label: `+${v}`,
                    action: `Logger.add(${v})`
                })),
                goal: `Target: ${goals?.dailyCalories || 2000}`
            },
            sleep: {
                title: 'LOG SLEEP',
                value: todayData?.sleep || '',
                placeholder: '0.0',
                step: '0.5',
                inputmode: 'decimal',
                presets: CONFIG.LOGGING_PRESETS.sleep.map(v => ({
                    label: `${v}h`,
                    action: `Logger.set(${v})`
                })),
                goal: null
            }
        };

        const config = configs[type];

        return `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">${config.title}</div>
                
                <input type="number" 
                       class="logger-input" 
                       id="log-input"
                       value="${config.value}"
                       placeholder="${config.placeholder}"
                       step="${config.step}"
                       inputmode="${config.inputmode}">
                
                <div class="preset-grid">
                    ${config.presets.map(p => `
                        <button class="preset-btn" onclick="${p.action}">${p.label}</button>
                    `).join('')}
                </div>
                
                ${config.goal ? `<div class="logger-goal">${config.goal}</div>` : ''}
                
                <button class="save-btn" onclick="Logger.save()">SAVE</button>
            </div>
        `;
    },

    /**
     * Adjust current value by amount
     */
    adjust(amount) {
        const input = document.getElementById('log-input');
        const current = parseFloat(input.value) || 0;
        input.value = (current + amount).toFixed(1);
    },

    /**
     * Add to current value
     */
    add(amount) {
        const input = document.getElementById('log-input');
        const current = parseInt(input.value) || 0;
        input.value = current + amount;
    },

    /**
     * Set value directly
     */
    set(value) {
        const input = document.getElementById('log-input');
        input.value = value;
    },

    /**
     * Save the logged value
     */
    save() {
        const input = document.getElementById('log-input');
        const value = parseFloat(input.value);

        if (isNaN(value)) {
            this.close();
            return;
        }

        // Save to state
        State.logValue(this.currentType, value);

        // Determine skill for XP
        const skillMap = {
            weight: 'discipline',
            protein: 'nutrition',
            calories: 'nutrition',
            sleep: 'recovery'
        };

        // Award XP and show completion
        const skill = skillMap[this.currentType];
        App.awardXP(5, skill);

        this.close();
        App.render();
    }
};

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('logger-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) Logger.close();
        });
    }
});


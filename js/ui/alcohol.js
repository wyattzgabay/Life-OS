/**
 * ALCOHOL.JS
 * Alcohol tracker with science-based health impact warnings
 */

const AlcoholTracker = {
    /**
     * Render alcohol status for daily view
     */
    renderDailyStatus() {
        const drankToday = this.drankToday();
        const recovering = State.drankRecently(48);

        if (recovering && !drankToday) {
            const lastDrink = this.getLastDrink();
            const hoursSince = this.getHoursSinceDrink();
            
            return `
                <div class="alcohol-warning">
                    <div class="warning-header">RECOVERY MODE</div>
                    <div class="warning-text">
                        ${Math.round(hoursSince)} hours since drinking. 
                        Full recovery in ${Math.round(48 - hoursSince)} hours.
                    </div>
                    <div class="warning-impact">
                        Muscle protein synthesis reduced ~37%
                    </div>
                </div>
            `;
        }

        return '';
    },

    /**
     * Check if drank today
     */
    drankToday() {
        const today = State.getTodayKey();
        return State.getAlcoholLog().some(a => a.date === today);
    },

    /**
     * Get last drink entry
     */
    getLastDrink() {
        const log = State.getAlcoholLog();
        return log.length > 0 ? log[log.length - 1] : null;
    },

    /**
     * Get hours since last drink
     */
    getHoursSinceDrink() {
        const lastDrink = this.getLastDrink();
        if (!lastDrink) return Infinity;
        
        const drinkTime = new Date(lastDrink.timestamp);
        return (Date.now() - drinkTime.getTime()) / (1000 * 60 * 60);
    },

    /**
     * Open alcohol logger modal
     */
    openLogger() {
        const modal = document.getElementById('logger-modal');
        
        modal.innerHTML = `
            <div class="modal-sheet" onclick="event.stopPropagation()">
                <div class="modal-handle"></div>
                <div class="modal-title">LOG ALCOHOL</div>
                
                <div class="warning-box">
                    <div class="warning-icon">!</div>
                    <div class="warning-content">
                        Logging alcohol will penalize XP and track recovery impact.
                    </div>
                </div>
                
                <div class="drink-counter">
                    <button class="counter-btn" onclick="AlcoholTracker.adjustDrinks(-1)">-</button>
                    <input type="number" class="counter-input" id="drink-count" 
                           value="1" min="0" max="20" inputmode="numeric">
                    <button class="counter-btn" onclick="AlcoholTracker.adjustDrinks(1)">+</button>
                </div>
                <div class="counter-label">standard drinks</div>
                
                <div class="drink-types">
                    <button class="drink-type-btn active" data-type="beer" onclick="AlcoholTracker.selectType(this)">
                        Beer/Wine
                    </button>
                    <button class="drink-type-btn" data-type="spirit" onclick="AlcoholTracker.selectType(this)">
                        Spirits
                    </button>
                </div>
                
                <div class="science-facts">
                    ${this.renderScienceFacts()}
                </div>
                
                <button class="save-btn danger" onclick="AlcoholTracker.save()">LOG DRINKS</button>
            </div>
        `;
        
        modal.classList.add('active');
    },

    /**
     * Adjust drink counter
     */
    adjustDrinks(delta) {
        const input = document.getElementById('drink-count');
        const current = parseInt(input.value) || 0;
        const newVal = Math.max(0, Math.min(20, current + delta));
        input.value = newVal;
    },

    /**
     * Select drink type
     */
    selectType(btn) {
        document.querySelectorAll('.drink-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    /**
     * Render science-based facts about alcohol
     */
    renderScienceFacts() {
        const facts = CONFIG.ALCOHOL.WARNINGS;
        // Pick 2 random facts
        const shuffled = [...facts].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);

        return selected.map(fact => `
            <div class="science-fact">
                ${fact}
            </div>
        `).join('');
    },

    /**
     * Save alcohol log
     */
    save() {
        const drinks = parseInt(document.getElementById('drink-count')?.value) || 0;
        const typeBtn = document.querySelector('.drink-type-btn.active');
        const type = typeBtn?.dataset?.type || 'beer';

        if (drinks <= 0) {
            document.getElementById('logger-modal').classList.remove('active');
            return;
        }

        // Log the drinks
        State.logAlcohol(drinks, type);

        // Apply XP penalty
        const penalty = CONFIG.ALCOHOL.XP_PENALTY * drinks;
        App.penalizeXP(penalty, 'Alcohol consumption');

        // Close modal
        document.getElementById('logger-modal').classList.remove('active');
        
        // Show impact message
        this.showImpactMessage(drinks);
        
        App.render();
    },

    /**
     * Show impact message after logging
     */
    showImpactMessage(drinks) {
        const message = `
            -${drinks * CONFIG.ALCOHOL.XP_PENALTY} XP. 
            Recovery impacted for next 48 hours.
            Muscle protein synthesis -37%.
        `;
        
        // Create temporary toast
        const toast = document.createElement('div');
        toast.className = 'impact-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('visible'), 100);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    /**
     * Get weekly summary
     */
    getWeeklySummary() {
        const recentDrinks = State.getRecentAlcohol(7);
        const totalDrinks = recentDrinks.reduce((sum, a) => sum + a.drinks, 0);
        const daysWithDrinks = new Set(recentDrinks.map(a => a.date)).size;

        return {
            totalDrinks,
            daysWithDrinks,
            avgPerDrinkDay: daysWithDrinks > 0 ? (totalDrinks / daysWithDrinks).toFixed(1) : 0,
            isRecovering: State.drankRecently(48),
        };
    },

    /**
     * Render stats view section
     */
    renderStatsSection() {
        const summary = this.getWeeklySummary();
        const log = State.getAlcoholLog();
        
        if (log.length === 0) {
            return `
                <div class="analysis-card">
                    <div class="analysis-header">
                        <span class="analysis-title">ALCOHOL</span>
                    </div>
                    <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                        No alcohol logged - keep it up!
                    </div>
                </div>
            `;
        }

        return `
            <div class="analysis-card">
                <div class="analysis-header">
                    <span class="analysis-title">ALCOHOL - 7 DAYS</span>
                </div>
                <div class="alcohol-stats">
                    <div class="alcohol-stat">
                        <div class="alcohol-stat-num">${summary.totalDrinks}</div>
                        <div class="alcohol-stat-label">total drinks</div>
                    </div>
                    <div class="alcohol-stat">
                        <div class="alcohol-stat-num">${summary.daysWithDrinks}</div>
                        <div class="alcohol-stat-label">drinking days</div>
                    </div>
                    <div class="alcohol-stat">
                        <div class="alcohol-stat-num">${summary.avgPerDrinkDay}</div>
                        <div class="alcohol-stat-label">avg per session</div>
                    </div>
                </div>
                ${summary.isRecovering ? `
                    <div class="recovery-warning">
                        Currently in recovery window - performance impacted
                    </div>
                ` : ''}
            </div>
        `;
    }
};



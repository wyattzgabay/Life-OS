/**
 * AI-BRIEFINGS.JS
 * Morning AI-powered briefings using Groq
 */

const AIBriefings = {
    API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    MODEL: 'llama-3.1-8b-instant',
    
    // Cache briefing to avoid repeated API calls
    cachedBriefing: null,
    lastBriefingDate: null,
    
    /**
     * Get the API key from storage
     */
    getApiKey() {
        return localStorage.getItem('groq_api_key');
    },
    
    /**
     * Check if briefings are available
     */
    isAvailable() {
        return !!this.getApiKey();
    },
    
    /**
     * Get daily briefing
     */
    async getBriefing() {
        const today = State.getTodayKey();
        
        // Return cached if same day
        if (this.cachedBriefing && this.lastBriefingDate === today) {
            return this.cachedBriefing;
        }
        
        if (!this.isAvailable()) {
            return { message: 'Set up AI in the Food tab to enable briefings.', available: false };
        }
        
        const context = this.gatherContext();
        const prompt = this.buildPrompt(context);
        
        // First day - use static welcome message instead of AI
        if (prompt === null) {
            const workout = Utils.getTodaysWorkout();
            const workoutName = workout?.name || 'your first workout';
            this.cachedBriefing = { 
                message: `Day 1. ${workoutName} on deck. Log everything, build the data, build the habit. Let's go.`, 
                available: true 
            };
            this.lastBriefingDate = today;
            return this.cachedBriefing;
        }
        
        try {
            const message = await this.callAI(prompt);
            this.cachedBriefing = { message, available: true };
            this.lastBriefingDate = today;
            return this.cachedBriefing;
        } catch (error) {
            return { message: 'Ready to crush it today.', available: true };
        }
    },
    
    /**
     * Gather context for briefing
     */
    gatherContext() {
        const profile = State.getProfile();
        const goals = State.getGoals();
        const workout = Utils.getTodaysWorkout();
        const streak = Utils.getDailyStreak();
        const running = State.getRunningData();
        const todaysRun = running?.goal && typeof RunningView !== 'undefined' 
            ? RunningView.getTodaysRun(running) 
            : null;
        
        // Count total days logged
        const totalDays = State.getAllDayKeys().length;
        const isFirstDay = totalDays === 0;
        
        // Determine if it's a run day
        const isRunDay = todaysRun && todaysRun.type !== 'rest';
        
        return {
            name: profile?.name || 'Athlete',
            dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            workout: workout?.name || 'Rest',
            workoutType: workout?.type,
            streak,
            todaysRun: isRunDay ? `${todaysRun.type} run` : null,
            isFirstDay,
            totalDays
        };
    },
    
    /**
     * Build prompt - returns null for first day to use static message
     */
    buildPrompt(ctx) {
        if (ctx.isFirstDay) {
            return null;
        }
        
        // Build focused context
        let todaysFocus = ctx.workout;
        if (ctx.todaysRun) {
            todaysFocus = ctx.workout === 'Rest' ? ctx.todaysRun : `${ctx.workout} + ${ctx.todaysRun}`;
        }
        
        return `You are a direct fitness coach. Write a 1-2 sentence morning briefing (max 25 words).

- Day: ${ctx.dayOfWeek}  
- Today: ${todaysFocus}
- Streak: ${ctx.streak} days

Rules: Be direct. No emojis. Focus on today only. Output ONLY the message.`;
    },
    
    /**
     * Call the AI API
     */
    async callAI(prompt) {
        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getApiKey()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 100,
            }),
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        return data.choices[0]?.message?.content?.trim() || 'Stay focused.';
    },
    
    /**
     * Render briefing card for daily view
     */
    async renderBriefingCard() {
        let briefing;
        try {
            briefing = await this.getBriefing();
        } catch (err) {
            briefing = { message: 'Stay focused today.', available: true };
        }
        
        if (!briefing || !briefing.available) {
            return '';
        }
        
        return `
            <div class="ai-briefing-card">
                <div class="briefing-header">
                    <span class="briefing-label">TODAY'S BRIEFING</span>
                    <span class="briefing-ai">AI</span>
                </div>
                <p class="briefing-message">${briefing.message}</p>
            </div>
        `;
    }
};


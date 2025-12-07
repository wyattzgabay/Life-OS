/**
 * FOOD.JS
 * Food tracking view - meal log, nutrition insights, quality scores
 */

const FoodView = {
    
    /**
     * Get today's meals from State (not localStorage)
     * This ensures meals persist with all other data
     */
    getTodayMeals() {
        const todayKey = State.getTodayKey();
        
        // First check State
        if (State._data?.meals?.[todayKey]) {
            return State._data.meals[todayKey];
        }
        
        // Migration: check localStorage for old data
        const localMeals = localStorage.getItem(`meals_${todayKey}`);
        if (localMeals) {
            const meals = JSON.parse(localMeals);
            // Migrate to State
            this.setTodayMeals(meals);
            // Clean up old localStorage
            localStorage.removeItem(`meals_${todayKey}`);
            return meals;
        }
        
        return [];
    },
    
    /**
     * Save today's meals to State
     */
    setTodayMeals(meals) {
        const todayKey = State.getTodayKey();
        
        if (!State._data.meals) {
            State._data.meals = {};
        }
        
        State._data.meals[todayKey] = meals;
        State.save();
    },
    
    /**
     * Add a meal to today's log
     */
    addMeal(meal) {
        const meals = this.getTodayMeals();
        meals.push(meal);
        this.setTodayMeals(meals);
    },
    
    /**
     * Render the food view
     */
    render() {
        const container = document.getElementById('food-view');
        
        container.innerHTML = `
            ${Header.renderSimple('NUTRITION')}
            ${this.renderDailySummary()}
            ${this.renderMacroBreakdown()}
            ${this.renderInsights()}
            ${this.renderMealLog()}
            ${this.renderQuickLog()}
            <div class="tab-spacer"></div>
        `;
    },
    
    /**
     * Render daily nutrition summary
     */
    renderDailySummary() {
        const todayData = State.getDayData();
        const goals = State.getGoals();
        
        const calories = todayData?.calories || 0;
        const protein = todayData?.protein || 0;
        const carbs = todayData?.carbs || 0;
        const fats = todayData?.fats || 0;
        
        const calGoal = goals?.dailyCalories || 2000;
        const protGoal = goals?.dailyProtein || 150;
        const carbGoal = goals?.dailyCarbs || 200;
        const fatGoal = goals?.dailyFats || 65;
        
        const calPercent = Math.round((calories / calGoal) * 100);
        const protPercent = Math.round((protein / protGoal) * 100);
        
        let statusMessage = '';
        let statusClass = '';
        
        if (calPercent > 100) {
            statusMessage = `${calories - calGoal} cal over goal`;
            statusClass = 'over';
        } else if (calPercent >= 85) {
            statusMessage = `${calGoal - calories} cal remaining`;
            statusClass = 'close';
        } else {
            statusMessage = `${calGoal - calories} cal remaining`;
            statusClass = 'good';
        }
        
        return `
            <div class="food-summary">
                <div class="summary-main">
                    <div class="summary-calories">
                        <div class="cal-value">${calories}</div>
                        <div class="cal-label">/ ${calGoal} cal</div>
                    </div>
                    <div class="summary-status ${statusClass}">${statusMessage}</div>
                </div>
                
                <div class="summary-ring">
                    <svg viewBox="0 0 100 100">
                        <circle class="ring-bg" cx="50" cy="50" r="40"/>
                        <circle class="ring-fill" cx="50" cy="50" r="40" 
                                style="stroke-dasharray: 251; stroke-dashoffset: ${251 - (Math.min(calPercent, 100) / 100 * 251)}"/>
                    </svg>
                    <div class="ring-percent">${calPercent}%</div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render macro breakdown
     */
    renderMacroBreakdown() {
        const todayData = State.getDayData();
        const goals = State.getGoals();
        
        const macros = [
            { 
                name: 'PROTEIN', 
                current: todayData?.protein || 0, 
                goal: goals?.dailyProtein || 150,
                color: '#a78bfa',
                unit: 'g'
            },
            { 
                name: 'CARBS', 
                current: todayData?.carbs || 0, 
                goal: goals?.dailyCarbs || 200,
                color: '#60a5fa',
                unit: 'g'
            },
            { 
                name: 'FATS', 
                current: todayData?.fats || 0, 
                goal: goals?.dailyFats || 65,
                color: '#fbbf24',
                unit: 'g'
            },
        ];
        
        return `
            <div class="macro-breakdown">
                ${macros.map(m => {
                    const percent = Math.min(100, Math.round((m.current / m.goal) * 100));
                    return `
                        <div class="macro-item">
                            <div class="macro-header">
                                <span class="macro-name">${m.name}</span>
                                <span class="macro-values">${m.current}${m.unit} / ${m.goal}${m.unit}</span>
                            </div>
                            <div class="macro-bar-full">
                                <div class="macro-bar-fill" style="width: ${percent}%; background: ${m.color}"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },
    
    /**
     * Render meal log
     */
    renderMealLog() {
        const todayKey = State.getTodayKey();
        const meals = this.getTodayMeals();
        
        if (meals.length === 0) {
            return `
                <div class="meal-log empty">
                    <div class="empty-title">NO MEALS LOGGED</div>
                    <div class="empty-text">Tap below to add your first meal</div>
                </div>
            `;
        }
        
        return `
            <div class="meal-log">
                <div class="section-header">
                    <span class="section-title">TODAY'S MEALS</span>
                    <span class="meal-count">${meals.length} logged</span>
                </div>
                
                <div class="meals-list">
                    ${meals.map((meal, idx) => this.renderMealItem(meal, idx)).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Render single meal item
     */
    renderMealItem(meal, index) {
        const time = new Date(meal.timestamp);
        const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        const qualityScore = meal.quality?.score || null;
        let qualityBadge = '';
        if (qualityScore !== null) {
            if (qualityScore >= 80) {
                qualityBadge = '<span class="quality-badge good">CLEAN</span>';
            } else if (qualityScore >= 50) {
                qualityBadge = '<span class="quality-badge ok">OK</span>';
            } else {
                qualityBadge = '<span class="quality-badge poor">PROCESSED</span>';
            }
        }
        
        // Check if this meal is already saved as a preset
        const isSaved = this.isMealSaved(meal);
        
        return `
            <div class="meal-item">
                <div class="meal-header">
                    <span class="meal-time">${timeStr}</span>
                    <div class="meal-header-right">
                        ${qualityBadge}
                        <button class="meal-delete-btn" onclick="FoodView.deleteMeal(${index})">×</button>
                    </div>
                </div>
                <div class="meal-items">
                    ${(meal.items || []).map(item => `
                        <span class="meal-food">${item.name || 'Unknown'}</span>
                    `).join(', ')}
                </div>
                <div class="meal-macros">
                    <span>${meal.totals.calories} cal</span>
                    <span>${meal.totals.protein}g P</span>
                    <span>${meal.totals.carbs}g C</span>
                    <span>${meal.totals.fats}g F</span>
                </div>
                ${meal.insights && meal.insights.length > 0 ? `
                    <div class="meal-insight">${meal.insights[0]}</div>
                ` : ''}
                <div class="meal-actions">
                    ${isSaved ? `
                        <span class="meal-saved-badge">✓ SAVED</span>
                    ` : `
                        <button class="save-preset-btn" onclick="FoodView.saveMealAsPreset(${index})">SAVE AS PRESET</button>
                    `}
                </div>
            </div>
        `;
    },
    
    /**
     * Check if a meal is already saved as a preset
     */
    isMealSaved(meal) {
        if (!meal?.items || meal.items.length === 0) return false;
        
        const savedMeals = AINutrition.getSavedMeals();
        // Check by comparing item names (simple heuristic)
        const mealKey = meal.items.map(i => i.name?.toLowerCase() || '').sort().join(',');
        return savedMeals.some(saved => {
            if (!saved?.items) return false;
            const savedKey = saved.items.map(i => i.name?.toLowerCase() || '').sort().join(',');
            return savedKey === mealKey;
        });
    },
    
    /**
     * Save a logged meal as a preset
     */
    saveMealAsPreset(index) {
        const todayKey = State.getTodayKey();
        const meals = this.getTodayMeals();
        
        if (index < 0 || index >= meals.length) return;
        
        const meal = meals[index];
        
        // Generate a default name from the items
        const defaultName = meal.items?.slice(0, 2).map(i => i.name).join(' + ') || 'Meal';
        const name = prompt('Name this meal:', defaultName);
        
        if (!name) return;
        
        // Save to permanent saved meals (synced to cloud)
        const savedMeals = AINutrition.getSavedMeals();
        savedMeals.push({
            name: name,
            items: meal.items || [],
            totals: meal.totals,
            // Store flat macro values for quick access
            calories: meal.totals?.calories || 0,
            protein: meal.totals?.protein || 0,
            carbs: meal.totals?.carbs || 0,
            fats: meal.totals?.fats || 0,
            result: meal, // Store full meal data for quick logging
            savedAt: Date.now()
        });
        AINutrition.setSavedMeals(savedMeals);
        
        App.showNotification(`"${name}" saved as preset!`);
        this.render();
    },
    
    /**
     * Delete a meal and subtract from daily totals
     */
    deleteMeal(index) {
        if (!confirm('Delete this meal?')) return;
        
        const todayKey = State.getTodayKey();
        const meals = this.getTodayMeals();
        
        if (index < 0 || index >= meals.length) return;
        
        const meal = meals[index];
        
        // Subtract from daily totals
        const todayData = State.getDayData();
        const newCalories = Math.max(0, (todayData?.calories || 0) - (meal.totals?.calories || meal.calories || 0));
        const newProtein = Math.max(0, (todayData?.protein || 0) - (meal.totals?.protein || meal.protein || 0));
        const newCarbs = Math.max(0, (todayData?.carbs || 0) - (meal.totals?.carbs || meal.carbs || 0));
        const newFats = Math.max(0, (todayData?.fats || 0) - (meal.totals.fats || 0));
        
        // Update totals using State.logValue (overwrites)
        State.logValue('calories', newCalories);
        State.logValue('protein', newProtein);
        State.logValue('carbs', newCarbs);
        State.logValue('fats', newFats);
        
        // Remove meal from list
        meals.splice(index, 1);
        this.setTodayMeals(meals);
        
        App.showNotification('Meal deleted');
        this.render();
    },
    
    /**
     * Render daily insights
     */
    renderInsights() {
        const meals = this.getTodayMeals();
        const todayData = State.getDayData();
        const goals = State.getGoals();
        
        const insights = [];
        
        // Calculate food quality stats
        let wholeFoods = 0;
        let processedFoods = 0;
        let hasVegetables = false;
        let highSodiumMeals = 0;
        
        meals.forEach(meal => {
            if (meal.quality?.isWholeFood) wholeFoods++;
            if (meal.quality?.isProcessed) processedFoods++;
            if (meal.quality?.hasVegetables) hasVegetables = true;
            if (meal.quality?.isHighSodium) highSodiumMeals++;
        });
        
        // Generate insights
        const protein = todayData?.protein || 0;
        const protGoal = goals?.dailyProtein || 150;
        const calories = todayData?.calories || 0;
        const calGoal = goals?.dailyCalories || 2000;
        
        // Protein distribution
        if (meals.length >= 2) {
            const avgProteinPerMeal = Math.round(protein / meals.length);
            if (avgProteinPerMeal < 25) {
                insights.push({
                    type: 'warning',
                    text: `Avg ${avgProteinPerMeal}g protein/meal. Aim for 30-40g per meal for better muscle synthesis.`
                });
            } else {
                insights.push({
                    type: 'good',
                    text: `Good protein distribution: ~${avgProteinPerMeal}g per meal`
                });
            }
        }
        
        // Vegetables
        if (meals.length >= 2 && !hasVegetables) {
            insights.push({
                type: 'warning',
                text: 'No vegetables detected today. Add greens for fiber and micronutrients.'
            });
        }
        
        // Processed foods - check quality scores too
        const avgQuality = meals.length > 0 
            ? meals.reduce((sum, m) => sum + (m.quality?.score || 50), 0) / meals.length 
            : 50;
        
        if (processedFoods > wholeFoods && meals.length >= 2 && avgQuality < 60) {
            // Only warn if quality is actually low
            insights.push({
                type: 'warning',
                text: 'More processed than whole foods today. Prioritize real food.'
            });
        } else if (avgQuality >= 70 || (wholeFoods > 0 && processedFoods === 0)) {
            insights.push({
                type: 'good',
                text: 'Solid food quality today. Keep it up.'
            });
        }
        
        // Sodium
        if (highSodiumMeals >= 2) {
            insights.push({
                type: 'warning',
                text: 'High sodium intake may cause water retention and affect training.'
            });
        }
        
        // Protein timing
        if (protein < protGoal * 0.5 && calories > calGoal * 0.5) {
            insights.push({
                type: 'alert',
                text: `Low protein (${Math.round(protein/protGoal*100)}%) for calories consumed. Prioritize protein in next meal.`
            });
        }
        
        if (insights.length === 0) {
            if (meals.length === 0) {
                return '';
            }
            insights.push({
                type: 'neutral',
                text: 'Keep logging meals to get personalized insights.'
            });
        }
        
        return `
            <div class="food-insights">
                <div class="section-header">
                    <span class="section-title">INSIGHTS</span>
                </div>
                <div class="insights-list">
                    ${insights.map(i => `
                        <div class="insight-item ${i.type}">
                            <span class="insight-icon">${i.type === 'good' ? '+' : i.type === 'warning' ? '!' : i.type === 'alert' ? '!!' : '·'}</span>
                            <span class="insight-text">${i.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Render quick log button and saved meals
     */
    renderQuickLog() {
        const savedMeals = AINutrition.getSavedMeals();
        
        return `
            <div class="quick-log-section">
                <button class="ai-log-btn full" onclick="AINutrition.openLogger()">
                    LOG FOOD WITH AI
                </button>
                
                ${savedMeals.length > 0 ? `
                    <div class="quick-add-section">
                        <div class="section-header">
                            <span class="section-title">SAVED MEALS</span>
                            <button class="edit-btn" onclick="FoodView.toggleEditSavedMeals()">EDIT</button>
                        </div>
                        <div class="saved-meals-grid" id="saved-meals-grid">
                            ${savedMeals.map((meal, idx) => `
                                <div class="quick-meal-item">
                                    <button class="quick-meal-btn" onclick="FoodView.quickAddMeal(${idx})">
                                        <span class="quick-meal-name">${meal.name || 'Saved Meal'}</span>
                                        <span class="quick-meal-macros">${meal.calories || meal.totals?.calories || 0} cal · ${meal.protein || meal.totals?.protein || 0}g P</span>
                                    </button>
                                    <button class="quick-meal-delete hidden" onclick="FoodView.deleteSavedMeal(${idx})">×</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    /**
     * Quick add a saved meal directly
     */
    quickAddMeal(idx) {
        const savedMeals = AINutrition.getSavedMeals();
        const meal = savedMeals[idx];
        if (!meal) return;
        
        // Get current totals
        const todayData = State.getDayData();
        const currentProtein = todayData?.protein || 0;
        const currentCalories = todayData?.calories || 0;
        const currentCarbs = todayData?.carbs || 0;
        const currentFats = todayData?.fats || 0;
        
        // Add meal values
        State.logValue('protein', currentProtein + (meal.protein || 0));
        State.logValue('calories', currentCalories + (meal.calories || 0));
        State.logValue('carbs', currentCarbs + (meal.carbs || 0));
        State.logValue('fats', currentFats + (meal.fats || 0));
        
        // Also save to meal log for today
        const todayKey = State.getTodayKey();
        this.addMeal({
            timestamp: new Date().toISOString(),
            mealTime: 'quick',
            name: meal.name,
            items: [{ name: meal.name, calories: meal.calories, protein: meal.protein }],
            totals: {
                calories: meal.calories || 0,
                protein: meal.protein || 0,
                carbs: meal.carbs || 0,
                fats: meal.fats || 0
            },
            description: meal.name
        });
        
        App.showNotification(`${meal.name} logged`);
        this.render();
    },
    
    /**
     * Toggle edit mode for saved meals (shows delete buttons)
     */
    toggleEditSavedMeals() {
        const grid = document.getElementById('saved-meals-grid');
        if (!grid) return;
        
        grid.classList.toggle('edit-mode');
        
        // Toggle visibility of delete buttons
        const deleteButtons = grid.querySelectorAll('.quick-meal-delete');
        deleteButtons.forEach(btn => btn.classList.toggle('hidden'));
    },
    
    /**
     * Delete a saved meal preset
     */
    deleteSavedMeal(idx) {
        if (!confirm('Delete this saved meal?')) return;
        
        const savedMeals = AINutrition.getSavedMeals();
        savedMeals.splice(idx, 1);
        AINutrition.setSavedMeals(savedMeals);
        
        App.showNotification('Saved meal deleted');
        this.render();
    }
};


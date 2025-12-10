/**
 * APP.JS
 * Main application - initialization, navigation, global actions
 */

const App = {
    currentView: 'daily',

    /**
     * Initialize the app
     * BULLETPROOF: Checks ALL data sources before showing onboarding
     */
    async init() {
        // Check for DEMO mode first
        if (window.location.search.includes('demo')) {
            State.load(); // Initialize State structure
            if (typeof DemoMode !== 'undefined') {
                DemoMode.init();
            }
            this.hideAuthScreen();
            this.showMain();
            this.setupNavigation();
            this.setupDayChangeListener();
            return;
        }
        
        // Stress test mode - cycles through all injuries
        if (window.location.search.includes('stress_test')) {
            State.init();
            if (typeof DemoMode !== 'undefined') {
                DemoMode.runStressTest();
            }
            return;
        }
        
        // Injury test mode - loads pain data to test injury detection
        // Usage: ?test_injury (default IT Band)
        //        ?test_injury=plantar_fasciitis
        //        ?test_injury=multi (multiple injuries)
        if (window.location.search.includes('test_injury')) {
            // Initialize State structure first (don't load from storage)
            State.init();
            
            // Setup demo injury data
            if (typeof DemoMode !== 'undefined') {
                DemoMode.initInjuryTest();
            }
            
            // Save so data persists during session
            State.saveLocal();
            
            this.hideAuthScreen();
            this.showMain();
            this.setupNavigation();
            this.setupDayChangeListener();
            this.render();
            
            // Debug: log what injuries were detected
            if (typeof InjuryIntelligence !== 'undefined') {
                const injuries = InjuryIntelligence.analyzeInjuries();
                console.log('🩹 Injury Test - Pain history:', InjuryIntelligence.getPainHistory());
                console.log('🩹 Injury Test - Detected injuries:', injuries.map(i => `${i.name} (${i.severity})`));
                console.log('🩹 Injury Test - Training adjustments:', InjuryIntelligence.getTrainingAdjustments());
            }
            return;
        }
        
        // Check for WIPE parameter (intentional data clear - use carefully!)
        if (window.location.search.includes('wipe=true')) {
            if (confirm('This will DELETE ALL DATA. Are you sure?')) {
                localStorage.clear();
                indexedDB.deleteDatabase('LifeOS');
            }
            window.history.replaceState({}, '', window.location.pathname);
        }
        
        // reset=true now just clears the URL (for cache busting only, keeps data)
        if (window.location.search.includes('reset=true')) {
            window.history.replaceState({}, '', window.location.pathname);
        }
        
        // STEP 1: Try to load from localStorage
        let hasData = State.load();
        
        // STEP 2: If no localStorage, try IndexedDB recovery
        if (!hasData) {
            const recovered = await State.tryRecoverData();
            if (recovered) {
                hasData = true;
            }
        }
        
        // Fix any timezone-related date key issues
        if (hasData) {
            State.fixTimezoneDates();
            State.syncRunLogToDays();
        }

        // STEP 3: Initialize Firebase and check cloud
        await State.initFirebase();
        
        // STEP 4: If still no data but we have Firebase user, try cloud
        if (!hasData && Firebase.user) {
            const cloudData = await Firebase.loadData();
            if (cloudData && cloudData.profile) {
                State._data = cloudData;
                State.saveLocal();
                State.saveToIndexedDB(cloudData);
                hasData = true;
            }
        }
        
        // STEP 5: Determine what to show
        const isOnboarded = hasData && State.isOnboarded();
        
        // If no local data and no authenticated user, show auth screen
        if (!hasData && !Firebase.user) {
            this.showAuthScreen();
            return;
        }
        
        // If authenticated but no data, proceed to onboarding
        if (!isOnboarded) {
            this.showOnboarding();
        } else {
            // Process any missed days first (wrapped in try-catch)
            try {
                Utils.processMissedDays();
            } catch (e) {
                // Silent fail
            }
            
            // Check exercise cycling (weekly rotation)
            try {
                Utils.checkExerciseCycling();
            } catch (e) {
                // Silent fail
            }
            
            // One-time data fixes
            try {
                this.applyDataFixes();
            } catch (e) {
                // Silent fail
            }
            
            // Check midnight reset
            this.setupMidnightReset();
            
            this.showMain();
        }

        // Set up navigation
        this.setupNavigation();
        
        // Set up modal dismiss
        this.setupModals();
    },

    /**
     * Apply one-time data fixes (version migrations, bad data cleanup)
     */
    applyDataFixes() {
        const fixesApplied = State._data?.fixesApplied || {};
        
        // Fix 1: Delete erroneous 50-mile run on Dec 5, 2024
        if (!fixesApplied.dec5RunFix) {
            const runLog = State._data?.runLog || [];
            const badRun = runLog.find(r => r.date?.startsWith('2024-12-05') && parseFloat(r.distance) >= 50);
            if (badRun) {
                State.deleteRun('2024-12-05');
                console.log('Applied fix: Removed erroneous 50-mile run from Dec 5');
            }
            
            // Mark as applied even if no bad run found
            if (!State._data.fixesApplied) State._data.fixesApplied = {};
            State._data.fixesApplied.dec5RunFix = true;
            State.save();
        }
    },
    
    /**
     * Set up modals with iOS-style drag behavior
     */
    setupModals() {
        const modal = document.getElementById('logger-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        }
        
        // Also setup goals modal
        const goalsModal = document.getElementById('goals-modal');
        if (goalsModal) {
            goalsModal.addEventListener('click', (e) => {
                if (e.target === goalsModal) {
                    this.closeModal(goalsModal);
                }
            });
        }
        
        // Set up drag-to-dismiss with bounce effect on modal sheets
        this.setupModalDrag();
    },
    
    /**
     * Close modal and restore body scroll
     */
    closeModal(modal) {
        modal.classList.remove('active');
        modal.innerHTML = '';
        // Restore body scroll in case any logger locked it
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
    },
    
    /**
     * Setup iOS-style modal drag with bounce effect
     */
    setupModalDrag() {
        document.addEventListener('touchstart', (e) => {
            const sheet = e.target.closest('.modal-sheet');
            if (!sheet) return;
            
            this.dragState = {
                startY: e.touches[0].clientY,
                startScrollTop: sheet.scrollTop,
                sheet: sheet,
                isDragging: false,
                direction: null
            };
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!this.dragState?.sheet) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - this.dragState.startY;
            const sheet = this.dragState.sheet;
            
            // Determine direction
            if (!this.dragState.direction && Math.abs(deltaY) > 5) {
                this.dragState.direction = deltaY > 0 ? 'down' : 'up';
            }
            
            // At top of scroll and dragging down - allow dismiss gesture
            const atTop = sheet.scrollTop <= 0;
            // At bottom of scroll and dragging up - allow bounce
            const atBottom = sheet.scrollTop >= (sheet.scrollHeight - sheet.clientHeight - 1);
            
            if (atTop && deltaY > 0) {
                // Dragging down from top - dismiss gesture with resistance
                e.preventDefault();
                this.dragState.isDragging = true;
                const resistance = 0.5;
                const transform = deltaY * resistance;
                sheet.style.transform = `translateY(${transform}px)`;
                sheet.style.transition = 'none';
            } else if (atBottom && deltaY < 0) {
                // Dragging up from bottom - bounce effect with strong resistance
                e.preventDefault();
                this.dragState.isDragging = true;
                const resistance = 0.3;
                const transform = deltaY * resistance;
                sheet.style.transform = `translateY(${transform}px)`;
                sheet.style.transition = 'none';
            } else if (atTop && deltaY < 0) {
                // At top dragging up - bounce effect
                e.preventDefault();
                this.dragState.isDragging = true;
                const resistance = 0.25;
                const transform = deltaY * resistance;
                sheet.style.transform = `translateY(${transform}px)`;
                sheet.style.transition = 'none';
            }
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            if (!this.dragState?.sheet) return;
            
            const sheet = this.dragState.sheet;
            const currentY = e.changedTouches[0].clientY;
            const deltaY = currentY - this.dragState.startY;
            
            // Bounce back animation
            sheet.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            // If dragged down more than 100px, close the modal
            if (deltaY > 100 && this.dragState.isDragging) {
                sheet.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    sheet.closest('.modal')?.classList.remove('active');
                    sheet.style.transform = '';
                    sheet.style.transition = '';
                }, 300);
            } else {
                // Bounce back to original position
                sheet.style.transform = 'translateY(0)';
                setTimeout(() => {
                    sheet.style.transition = '';
                }, 300);
            }
            
            this.dragState = null;
        }, { passive: true });
    },

    /**
     * Setup midnight reset checker and countdown
     */
    setupMidnightReset() {
        // Check every minute if we've crossed midnight
        const lastDate = localStorage.getItem('lastActiveDate');
        const today = new Date().toISOString().split('T')[0];
        
        if (lastDate && lastDate !== today) {
            // New day - save yesterday's data and refresh
            localStorage.setItem('lastActiveDate', today);
            this.render();
        } else {
            localStorage.setItem('lastActiveDate', today);
        }
        
        // Start the midnight countdown checker
        this.startMidnightCountdown();
        
        // Check for day change every 60 seconds
        setInterval(() => {
            const now = new Date().toISOString().split('T')[0];
            const stored = localStorage.getItem('lastActiveDate');
            if (stored !== now) {
                localStorage.setItem('lastActiveDate', now);
                this.hideMidnightCountdown();
                this.render(); // Re-render for new day
            }
        }, 60000);
    },
    
    /**
     * Start midnight countdown - shows banner 5 min before midnight
     */
    startMidnightCountdown() {
        // Check every second
        setInterval(() => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0); // Next midnight
            
            const msUntilMidnight = midnight - now;
            const secondsUntilMidnight = Math.floor(msUntilMidnight / 1000);
            const minutesUntilMidnight = Math.floor(secondsUntilMidnight / 60);
            
            // Show countdown if within 5 minutes of midnight
            if (minutesUntilMidnight < 5 && secondsUntilMidnight > 0) {
                this.showMidnightCountdown(secondsUntilMidnight);
            } else {
                this.hideMidnightCountdown();
            }
        }, 1000);
    },
    
    /**
     * Show midnight countdown banner
     */
    showMidnightCountdown(seconds) {
        let banner = document.getElementById('midnight-countdown');
        
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'midnight-countdown';
            banner.className = 'midnight-countdown';
            document.body.insertBefore(banner, document.body.firstChild);
        }
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = mins > 0 
            ? `${mins}:${secs.toString().padStart(2, '0')}`
            : `${secs}s`;
        
        banner.innerHTML = `
            <div class="countdown-content">
                <span class="countdown-text">Day ends in <strong>${timeStr}</strong></span>
                <span class="countdown-hint">Log remaining data now</span>
            </div>
        `;
        banner.classList.add('visible');
    },
    
    /**
     * Hide midnight countdown banner
     */
    hideMidnightCountdown() {
        const banner = document.getElementById('midnight-countdown');
        if (banner) {
            banner.classList.remove('visible');
        }
    },

    /**
     * Hide auth/onboarding screen
     */
    hideAuthScreen() {
        document.getElementById('onboarding-screen')?.classList.add('hidden');
    },
    
    /**
     * Show auth screen (sign in or create account)
     */
    showAuthScreen() {
        document.getElementById('onboarding-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('bottom-nav').classList.add('hidden');
        
        const container = document.getElementById('onboarding-screen');
        const savedEmail = localStorage.getItem('user_email') || '';
        
        container.innerHTML = `
            <div class="onboarding-container auth-screen">
                <div class="auth-header">
                    <div class="auth-logo">OS</div>
                    <h1>Welcome to Life OS</h1>
                    <p class="auth-subtitle">Sign in to sync your data across devices</p>
                </div>
                
                <div class="auth-form">
                    <div class="auth-tabs">
                        <button class="auth-tab active" onclick="App.switchAuthTab('signin')">SIGN IN</button>
                        <button class="auth-tab" onclick="App.switchAuthTab('create')">CREATE ACCOUNT</button>
                    </div>
                    
                    <div id="auth-form-content">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="auth-email" value="${savedEmail}" 
                                   placeholder="your@email.com" autocomplete="email">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="auth-password" 
                                   placeholder="Enter password" autocomplete="current-password">
                        </div>
                        
                        <div id="auth-error" class="auth-error"></div>
                        
                        <button id="auth-submit" class="auth-submit-btn" onclick="App.handleAuth()">
                            SIGN IN
                        </button>
                    </div>
                </div>
                
                <div class="auth-footer">
                    <p>Your data is encrypted and stored securely.</p>
                </div>
            </div>
        `;
        
        this.authMode = 'signin';
    },
    
    /**
     * Switch between sign in and create account tabs
     */
    switchAuthTab(mode) {
        this.authMode = mode;
        
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent.toLowerCase().includes(mode === 'signin' ? 'sign' : 'create'));
        });
        
        const submitBtn = document.getElementById('auth-submit');
        const passwordInput = document.getElementById('auth-password');
        
        if (mode === 'signin') {
            submitBtn.textContent = 'SIGN IN';
            passwordInput.placeholder = 'Enter password';
        } else {
            submitBtn.textContent = 'CREATE ACCOUNT';
            passwordInput.placeholder = 'Create password (6+ chars)';
        }
        
        document.getElementById('auth-error').textContent = '';
    },
    
    /**
     * Handle auth form submission
     * BULLETPROOF: Checks all data sources after login
     */
    async handleAuth() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const errorDiv = document.getElementById('auth-error');
        const submitBtn = document.getElementById('auth-submit');
        
        if (!email || !password) {
            errorDiv.textContent = 'Please enter email and password';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
        errorDiv.textContent = '';
        
        let result;
        if (this.authMode === 'signin') {
            result = await Firebase.signInWithEmail(email, password);
        } else {
            result = await Firebase.createAccount(email, password);
        }
        
        if (result.success) {
            submitBtn.textContent = 'Syncing data...';
            
            // Try to load from cloud FIRST
            const cloudData = await Firebase.loadData();
            const cloudCount = State.countDataEntries(cloudData);
            
            // Check local data
            const localHasData = State.load();
            const localCount = State.countDataEntries(State._data);
            
            // Check IndexedDB
            const idbData = await State.loadFromIndexedDB();
            const idbCount = State.countDataEntries(idbData);
            
            // Check backups
            const backups = State.getBackups();
            const backupCount = backups.length > 0 ? State.countDataEntries(backups[0].data) : 0;
            
            // Use the best data source
            const sources = [
                { name: 'cloud', data: cloudData, count: cloudCount },
                { name: 'local', data: State._data, count: localCount },
                { name: 'indexeddb', data: idbData, count: idbCount },
                { name: 'backup', data: backups[0]?.data, count: backupCount }
            ].filter(s => s.data && s.count > 0);
            
            // Sort by entry count (most data wins)
            sources.sort((a, b) => b.count - a.count);
            
            if (sources.length > 0) {
                const best = sources[0];
                State._data = best.data;
                State.saveLocal();
                State.saveToIndexedDB(best.data);
                
                // If we used local/backup data, sync to cloud
                if (best.name !== 'cloud') {
                    State.syncToCloud();
                }
                
                if (State.isOnboarded()) {
                    this.showMain();
                    return;
                }
            }
            
            // No data found anywhere - truly new user
            this.showOnboarding();
        } else {
            errorDiv.textContent = result.message;
            submitBtn.disabled = false;
            submitBtn.textContent = this.authMode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT';
        }
    },
    
    /**
     * Show onboarding screen
     */
    showOnboarding() {
        document.getElementById('onboarding-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('bottom-nav').classList.add('hidden');
        
        Onboarding.render();
    },

    /**
     * Show main app
     */
    showMain() {
        document.getElementById('onboarding-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('bottom-nav').classList.remove('hidden');
        
        this.render();
    },

    /**
     * Render current view
     */
    render() {
        try {
            switch (this.currentView) {
                case 'daily':
                    DailyView.render();
                    break;
                case 'stats':
                    StatsView.render();
                    break;
                case 'skills':
                    if (typeof SkillsView !== 'undefined') {
                        SkillsView.render();
                    }
                    break;
                case 'food':
                    FoodView.render();
                    break;
                case 'profile':
                    ProfileView.render();
                    break;
                case 'reading':
                    document.getElementById('main-content').innerHTML = ReadingView.render();
                    break;
            }
        } catch (e) {
            // Show error in app instead of black screen
            const main = document.getElementById('main-content') || document.getElementById('daily-view');
            if (main) {
                main.innerHTML = `
                    <div style="padding: 20px; color: white;">
                        <h2>Error Loading</h2>
                        <p>${e.message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">Reload</button>
                    </div>
                `;
            }
        }
    },

    /**
     * Set up bottom navigation
     */
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.navigateTo(view);
            });
        });
    },

    /**
     * Navigate to a view
     */
    navigateTo(view) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Update active view
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        // Update current view and render
        this.currentView = view;
        this.render();
    },

    /**
     * Toggle exercise completion
     */
    toggleExercise(index) {
        const wasCompleted = State.getDayData()?.exercises?.[index];
        const isNowCompleted = State.toggleExercise(index);

        if (isNowCompleted && !wasCompleted) {
            // Award XP
            const workout = Utils.getTodaysWorkout();
            const exercise = workout.exercises[index];
            const skill = workout.type === 'lift' ? 'strength' : 
                         workout.type === 'cardio' ? 'discipline' : 'recovery';
            
            this.awardXP(exercise.xp, skill);
        }

        this.render();
    },

    /**
     * Toggle habit completion
     */
    toggleHabit(habitId) {
        const wasCompleted = State.getDayData()?.habits?.[habitId];
        const isNowCompleted = State.toggleHabit(habitId);

        if (isNowCompleted && !wasCompleted) {
            // Award XP
            const habit = CONFIG.HABITS.find(h => h.id === habitId);
            if (habit) {
                this.awardXP(habit.xp, habit.skill);
            }
        }

        this.render();
    },

    /**
     * Award XP with multiplier and show completion overlay
     */
    awardXP(baseAmount, skill = null) {
        const streak = Utils.getDailyStreak();
        const multiplier = Utils.getStreakMultiplier(streak);
        const amount = Math.round(baseAmount * multiplier);

        // Get level before XP
        const oldXP = State.getTotalXP();
        const oldLevel = Utils.getLevel(oldXP);

        // Add XP to state
        State.addXP(amount, skill);

        // Get level after XP
        const newXP = State.getTotalXP();
        const newLevel = Utils.getLevel(newXP);

        // Update best streak
        State.updateBestStreak(streak);

        // Check for level up!
        if (newLevel.level > oldLevel) {
            this.showLevelUp(newLevel);
        } else {
            // Show normal completion overlay
            this.showCompletion(amount, multiplier);
        }
    },
    
    /**
     * Show level up celebration
     */
    showLevelUp(level) {
        const overlay = document.getElementById('completion-overlay');
        const levelData = CONFIG.LEVELS.find(l => l.level === level.level);
        
        overlay.innerHTML = `
            <div class="levelup-content">
                <div class="levelup-badge">
                    <div class="levelup-level">${level.level}</div>
                    <div class="levelup-glow"></div>
                </div>
                <div class="levelup-title">LEVEL UP!</div>
                <div class="levelup-name">${level.title}</div>
                ${levelData?.reward ? `<div class="levelup-reward">${levelData.reward}</div>` : ''}
            </div>
        `;
        
        overlay.classList.add('active', 'levelup');
        
        // Vibrate on mobile if available
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
        
        setTimeout(() => {
            overlay.classList.remove('active', 'levelup');
        }, 3000);
    },

    /**
     * Penalize XP (for alcohol, missed days, etc.)
     */
    penalizeXP(amount, reason = '') {
        State.removeXP(amount);
    },

    /**
     * Show completion overlay
     */
    showCompletion(xp, multiplier) {
        const overlay = document.getElementById('completion-overlay');
        
        overlay.innerHTML = `
            <div class="completion-content">
                <div class="completion-ring">
                    <svg viewBox="0 0 100 100">
                        <circle class="ring-bg" cx="50" cy="50" r="45"/>
                        <circle class="ring-fill" cx="50" cy="50" r="45"/>
                    </svg>
                    <div class="completion-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="4 12 9 17 20 6"/>
                        </svg>
                    </div>
                </div>
                <div class="completion-xp">+${xp} XP</div>
                ${multiplier > 1 ? `<div class="completion-mult">${multiplier}x STREAK BONUS</div>` : ''}
            </div>
        `;

        overlay.classList.add('active');

        setTimeout(() => {
            overlay.classList.remove('active');
        }, 1000);
    },

    /**
     * Clear workout debt
     */
    clearDebt(index) {
        if (State.clearDebt(index)) {
            // Award bonus XP for clearing debt
            this.awardXP(CONFIG.ACCOUNTABILITY.DEBT_CLEAR_BONUS, 'discipline');
            this.render();
        }
    },

    /**
     * Reset onboarding (keeps data)
     */
    resetOnboarding() {
        if (confirm('Redo setup? Your data will be kept.')) {
            // Just show onboarding again
            Onboarding.currentStep = 1;
            Onboarding.data = {};
            this.showOnboarding();
        }
    },

    /**
     * Reset all data
     */
    resetAll() {
        if (confirm('DELETE ALL DATA? This cannot be undone.')) {
            State.reset();
            location.reload();
        }
    },

    /**
     * Show a toast notification
     */
    showNotification(message) {
        // Create notification element if it doesn't exist
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.classList.add('active');
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 2500);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

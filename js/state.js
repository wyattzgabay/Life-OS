/**
 * STATE.JS
 * Data management - storage, getters, setters
 * Single source of truth for all app data
 * 
 * BULLETPROOF DATA PERSISTENCE:
 * 1. localStorage - primary fast storage
 * 2. IndexedDB - secondary backup storage
 * 3. Firebase Cloud - remote sync
 * 4. Auto-backup system - recovery safety net
 */

const State = {
    // In-memory cache of data
    _data: null,
    _firebaseInitialized: false,
    _idb: null, // IndexedDB reference
    _autoSyncInterval: null,
    _lastSyncTime: 0,

    // ==========================================
    // CORE DATA OPERATIONS
    // ==========================================

    /**
     * Load data from ALL available sources
     * Priority: localStorage -> IndexedDB -> backups
     */
    load() {
        try {
            // Try localStorage first (fastest)
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (stored) {
                this._data = JSON.parse(stored);
                this.createBackup('auto-load');
                return true;
            }
        } catch (e) {
            console.error('State.load localStorage error:', e);
        }
        
        // localStorage empty - will try IndexedDB async
        return false;
    },
    
    /**
     * Try to recover data from IndexedDB if localStorage is empty
     */
    async tryRecoverFromIndexedDB() {
        try {
            const idbData = await this.loadFromIndexedDB();
            if (idbData && idbData.profile) {
                console.log('Recovered data from IndexedDB!');
                this._data = idbData;
                this.saveLocal(); // Restore to localStorage
                return true;
            }
        } catch (e) {
            console.error('IndexedDB recovery failed:', e);
        }
        return false;
    },
    
    /**
     * Try to recover from any available source
     */
    async tryRecoverData() {
        // 1. Check IndexedDB
        const idbRecovered = await this.tryRecoverFromIndexedDB();
        if (idbRecovered) return { source: 'indexeddb', data: this._data };
        
        // 2. Check backups
        const backups = this.getBackups();
        if (backups.length > 0 && backups[0].data?.profile) {
            console.log('Recovered data from backup!');
            this._data = backups[0].data;
            this.saveLocal();
            return { source: 'backup', data: this._data };
        }
        
        return null;
    },
    
    /**
     * Create a backup of current data
     */
    createBackup(reason = 'manual') {
        if (!this._data || !this._data.profile) return false;
        
        try {
            const backup = {
                timestamp: Date.now(),
                reason: reason,
                data: JSON.parse(JSON.stringify(this._data))
            };
            
            // Keep last 10 backups (increased from 5)
            let backups = JSON.parse(localStorage.getItem('life_os_backups') || '[]');
            
            // Don't create duplicate backups within 5 minutes
            if (backups.length > 0 && Date.now() - backups[0].timestamp < 300000) {
                return true; // Skip, too recent
            }
            
            backups.unshift(backup);
            backups = backups.slice(0, 10);
            localStorage.setItem('life_os_backups', JSON.stringify(backups));
            
            // Also save to IndexedDB for extra safety
            this.saveToIndexedDB(this._data);
            
            return true;
        } catch (e) {
            console.error('Backup error:', e);
            return false;
        }
    },
    
    /**
     * Restore from backup
     */
    restoreFromBackup(index = 0) {
        try {
            const backups = JSON.parse(localStorage.getItem('life_os_backups') || '[]');
            if (backups.length === 0 || index >= backups.length) {
                console.error('No backup found at index', index);
                return false;
            }
            
            const backup = backups[index];
            this._data = backup.data;
            this.saveLocal();
            this.saveToIndexedDB(this._data); // Also save to IDB
            this.syncToCloud();
            
            return true;
        } catch (e) {
            console.error('Restore error:', e);
            return false;
        }
    },
    
    /**
     * Get available backups
     */
    getBackups() {
        try {
            return JSON.parse(localStorage.getItem('life_os_backups') || '[]');
        } catch (e) {
            return [];
        }
    },
    
    // ==========================================
    // INDEXEDDB OPERATIONS (Secondary Storage)
    // ==========================================
    
    /**
     * Initialize IndexedDB
     */
    async initIndexedDB() {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('LifeOS', 1);
                
                request.onerror = () => {
                    console.warn('IndexedDB not available');
                    resolve(false);
                };
                
                request.onsuccess = (event) => {
                    this._idb = event.target.result;
                    resolve(true);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('data')) {
                        db.createObjectStore('data', { keyPath: 'id' });
                    }
                };
            } catch (e) {
                console.warn('IndexedDB init failed:', e);
                resolve(false);
            }
        });
    },
    
    /**
     * Save data to IndexedDB
     */
    async saveToIndexedDB(data) {
        if (!this._idb) await this.initIndexedDB();
        if (!this._idb || !data) return false;
        
        return new Promise((resolve) => {
            try {
                const tx = this._idb.transaction(['data'], 'readwrite');
                const store = tx.objectStore('data');
                store.put({ id: 'userData', ...data, idbTimestamp: Date.now() });
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (e) {
                console.warn('IndexedDB save failed:', e);
                resolve(false);
            }
        });
    },
    
    /**
     * Load data from IndexedDB
     */
    async loadFromIndexedDB() {
        if (!this._idb) await this.initIndexedDB();
        if (!this._idb) return null;
        
        return new Promise((resolve) => {
            try {
                const tx = this._idb.transaction(['data'], 'readonly');
                const store = tx.objectStore('data');
                const request = store.get('userData');
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        delete result.id;
                        delete result.idbTimestamp;
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = () => resolve(null);
            } catch (e) {
                console.warn('IndexedDB load failed:', e);
                resolve(null);
            }
        });
    },
    
    /**
     * Count meaningful data entries (for sync comparison)
     */
    countDataEntries(data) {
        if (!data) return 0;
        
        let count = 0;
        
        // Count days with data
        const days = data.days || {};
        for (const dayKey in days) {
            const day = days[dayKey];
            if (day.weight) count++;
            if (day.protein) count++;
            if (day.calories) count++;
            if (day.exercises && Object.keys(day.exercises).length > 0) count += Object.keys(day.exercises).length;
            if (day.runDistance) count++;
        }
        
        // Count lift history entries
        const liftHistory = data.liftHistory || {};
        for (const exercise in liftHistory) {
            count += (liftHistory[exercise] || []).length;
        }
        
        return count;
    },

    /**
     * Initialize Firebase and load cloud data
     * BULLETPROOF: Always tries to restore data if local is empty
     */
    async initFirebase() {
        // Initialize IndexedDB first
        await this.initIndexedDB();
        
        if (!Firebase.isConfigured()) {
            return false;
        }

        try {
            const initialized = await Firebase.init();
            if (initialized) {
                this._firebaseInitialized = true;
                
                // Try to load from Firebase
                const cloudData = await Firebase.loadData();
                
                if (cloudData) {
                    // Compare both timestamp AND data quantity
                    const localTimestamp = this._data?.lastModified || 0;
                    const cloudTimestamp = cloudData.lastModified || 0;
                    const localCount = this.countDataEntries(this._data);
                    const cloudCount = this.countDataEntries(cloudData);
                    
                    console.log(`Data comparison - Local: ${localCount} entries, Cloud: ${cloudCount} entries`);
                    
                    const cloudHasMoreData = cloudCount > localCount;
                    const cloudIsNewer = cloudTimestamp > localTimestamp;
                    const localHasSignificantlyMoreData = localCount > cloudCount + 5;
                    
                    // ALWAYS restore from cloud if local is empty/minimal
                    if (localCount < 3 && cloudCount > 3) {
                        console.log('Local empty, restoring from cloud');
                        this._data = cloudData;
                        this.saveLocal();
                        this.saveToIndexedDB(cloudData);
                        return true;
                    } else if (cloudHasMoreData || (cloudIsNewer && !localHasSignificantlyMoreData)) {
                        console.log('Cloud has better data, syncing from cloud');
                        this.createBackup('pre-cloud-sync');
                        this._data = cloudData;
                        this.saveLocal();
                        this.saveToIndexedDB(cloudData);
                        return true;
                    } else if (this._data) {
                        console.log('Local data is better, syncing to cloud');
                        this.syncToCloud();
                    }
                } else if (this._data) {
                    console.log('No cloud data, syncing local to cloud');
                    this.syncToCloud();
                }

                // Listen for realtime updates from other devices
                Firebase.listenForUpdates((data) => {
                    const cloudTimestamp = data.lastModified || 0;
                    const localTimestamp = this._data?.lastModified || 0;
                    const localCount = this.countDataEntries(this._data);
                    const cloudCount = this.countDataEntries(data);
                    
                    const localHasMoreData = localCount > cloudCount + 3;
                    
                    if (cloudTimestamp > localTimestamp && !localHasMoreData) {
                        this.createBackup('pre-realtime-sync');
                        this._data = data;
                        this.saveLocal();
                        this.saveToIndexedDB(data);
                        if (typeof App !== 'undefined' && App.render) {
                            App.render();
                        }
                    } else if (localHasMoreData) {
                        this.syncToCloud();
                    }
                });

                // Start auto-sync every 30 seconds
                this.startAutoSync();

                return true;
            }
        } catch (e) {
            console.error('Firebase init error:', e);
        }
        return false;
    },
    
    /**
     * Start automatic periodic sync
     */
    startAutoSync() {
        if (this._autoSyncInterval) {
            clearInterval(this._autoSyncInterval);
        }
        
        // Sync every 30 seconds if there's data
        this._autoSyncInterval = setInterval(() => {
            if (this._data && this._firebaseInitialized) {
                const timeSinceLastSync = Date.now() - this._lastSyncTime;
                // Only sync if we haven't synced in the last 25 seconds
                if (timeSinceLastSync > 25000) {
                    this.syncToCloud();
                }
            }
        }, 30000);
    },

    /**
     * Save data to localStorage only
     */
    saveLocal() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this._data));
            return true;
        } catch (e) {
            console.error('State.saveLocal error:', e);
            return false;
        }
    },

    /**
     * Sync data to Firebase
     */
    async syncToCloud() {
        if (this._firebaseInitialized && this._data) {
            try {
                await Firebase.saveData(this._data);
                this._lastSyncTime = Date.now();
            } catch (e) {
                console.error('Sync to cloud failed:', e);
                // Don't throw - just log the error
            }
        }
    },

    /**
     * Save data to ALL storage layers
     */
    save() {
        // Add timestamp for sync comparison
        this._data.lastModified = Date.now();
        
        // 1. Save to localStorage (fastest)
        this.saveLocal();
        
        // 2. Save to IndexedDB (backup)
        this.saveToIndexedDB(this._data);
        
        // 3. Sync to cloud (async, don't block)
        if (this._firebaseInitialized) {
            this.syncToCloud();
        }
        
        return true;
    },

    /**
     * Initialize fresh data
     */
    init() {
        this._data = {
            version: CONFIG.VERSION,
            onboardingComplete: false,
            createdAt: new Date().toISOString(),
            profile: {
                startWeight: null,
                height: null, // in inches
                age: null,
            },
            goals: {
                targetWeight: null,
                dailyProtein: null,
                dailyCalories: null,
                tdee: null,
            },
            stats: {
                totalXP: 0,
                skillXP: {
                    strength: 0,
                    discipline: 0,
                    nutrition: 0,
                    recovery: 0,
                },
                bestStreak: 0,
            },
            debt: [], // { type: string, date: string, exercises: number }
            days: {}, // { [dateKey]: DayData }
            
            // Running program
            running: {
                goal: null, // '5k', '10k', 'half', 'marathon', 'casual'
                injuries: [], // array of injury ids
                weekNumber: 1,
                startDate: null,
                // Baseline assessment
                baseline: {
                    currentDistance: null, // miles they can run comfortably
                    currentPace: null, // min/mile easy pace
                    recentRaceTime: null, // { distance: '5k', time: '25:30' }
                    maxHR: null, // max heart rate
                },
                // Target settings
                target: {
                    distance: null, // target race distance
                    pace: null, // target pace min/mile
                    raceDate: null, // target race date
                },
                // Calculated VDOT
                vdot: null,
                // Current phase
                currentPhase: 'base', // base, build, peak, taper
            },
            
            // Run log
            runLog: [], // { date, distance, time, pace, effort, type, notes }
            
            // Weekly mileage targets
            weeklyMileageTarget: null,
            
            // Alcohol tracking
            alcoholLog: [], // { date, drinks, type }
            
            // Reading tracking
            reading: {
                currentBook: null, // { title, totalPages, pagesRead, startDate }
                completedBooks: [], // { title, totalPages, completedDate }
                yearlyGoal: 12, // books per year
            },
            
            // Exercise variation tracking (to cycle exercises)
            exerciseWeek: 0, // increments weekly to cycle variations
            
            // Lift history for progressive overload
            liftHistory: {}, // { exerciseName: [{ date, sets: [{ weight, reps }], volume, estimated1RM }] }
            
            // Personal records
            personalRecords: {}, // { exerciseName: { weight, reps, estimated1RM, date } }
        };
        this.save();
    },

    /**
     * Get all data (read-only copy)
     */
    getData() {
        return this._data ? { ...this._data } : null;
    },

    /**
     * Check if data exists
     */
    hasData() {
        return this._data !== null;
    },

    /**
     * Check if onboarding is complete
     */
    isOnboarded() {
        return this._data?.onboardingComplete === true;
    },

    // ==========================================
    // DATE HELPERS
    // ==========================================

    /**
     * Get today's date key (YYYY-MM-DD) in LOCAL timezone
     */
    getTodayKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * Fix timezone issues - merge UTC date data with local date data
     * Call this once to fix any data logged under wrong date keys
     */
    fixTimezoneDates() {
        const today = this.getTodayKey();
        const utcToday = new Date().toISOString().split('T')[0];
        
        if (utcToday !== today && this._data.days[utcToday]) {
            
            const utcData = this._data.days[utcToday];
            const localData = this._data.days[today] || this._createEmptyDay();
            
            // Merge - prefer UTC data if local is empty
            this._data.days[today] = {
                ...localData,
                protein: (localData.protein || 0) + (utcData.protein || 0),
                calories: (localData.calories || 0) + (utcData.calories || 0),
                carbs: (localData.carbs || 0) + (utcData.carbs || 0),
                fats: (localData.fats || 0) + (utcData.fats || 0),
                weight: utcData.weight || localData.weight,
                runDistance: utcData.runDistance || localData.runDistance,
                exercises: { ...localData.exercises, ...utcData.exercises },
                habits: { ...localData.habits, ...utcData.habits },
                xp: (localData.xp || 0) + (utcData.xp || 0),
            };
            
            // Remove the UTC key to prevent duplication
            delete this._data.days[utcToday];
            this.save();
            return true;
        }
        
        // Also check yesterday's UTC key
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const utcYesterday = yesterday.toISOString().split('T')[0];
        
        // Also check yesterday - no action needed, just awareness
        // if (utcYesterday !== today && this._data.days[utcYesterday]) { }
        
        return false;
    },
    
    /**
     * Sync runLog entries to day data (one-time migration)
     */
    syncRunLogToDays() {
        const runLog = this._data?.runLog || [];
        if (runLog.length === 0) return;
        
        let synced = false;
        for (const run of runLog) {
            // Get the date key - prefer run.date, but fall back to extracting from timestamp
            let dateKey = run.date;
            if (!dateKey && run.timestamp) {
                const d = new Date(run.timestamp);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dateKey = `${year}-${month}-${day}`;
            }
            
            if (dateKey && run.distance > 0) {
                if (!this._data.days[dateKey]) {
                    this._data.days[dateKey] = this._createEmptyDay();
                }
                const dayData = this._data.days[dateKey];
                if (!dayData.runDistance || dayData.runDistance < run.distance) {
                    this._data.days[dateKey].runDistance = run.distance;
                    synced = true;
                }
            }
        }
        
        if (synced) {
            this.save();
        }
    },

    /**
     * Get date key for N days ago in LOCAL timezone
     */
    getDateKey(daysAgo = 0) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // ==========================================
    // DAY DATA OPERATIONS
    // ==========================================

    /**
     * Get data for a specific day (creates if doesn't exist for today)
     */
    getDayData(dateKey = null) {
        dateKey = dateKey || this.getTodayKey();
        
        if (!this._data.days[dateKey]) {
            // Only auto-create for today
            if (dateKey === this.getTodayKey()) {
                this._data.days[dateKey] = this._createEmptyDay();
                this.save();
            } else {
                return null;
            }
        }
        
        return { ...this._data.days[dateKey] };
    },

    /**
     * Create empty day structure
     */
    _createEmptyDay() {
        return {
            exercises: {},
            habits: {},
            weight: null,
            protein: null,
            calories: null,
            sleep: null,
            xp: 0,
            completed: false,
            failed: false,
        };
    },

    /**
     * Update today's data
     */
    updateToday(updates) {
        const today = this.getTodayKey();
        if (!this._data.days[today]) {
            this._data.days[today] = this._createEmptyDay();
        }
        this._data.days[today] = { ...this._data.days[today], ...updates };
        this.save();
    },

    /**
     * Toggle exercise completion for today
     */
    toggleExercise(index) {
        const today = this.getTodayKey();
        const day = this.getDayData(today);
        const newExercises = { ...day.exercises };
        newExercises[index] = !newExercises[index];
        this.updateToday({ exercises: newExercises });
        return newExercises[index]; // Return new state
    },

    /**
     * Toggle habit completion for today
     */
    toggleHabit(habitId) {
        const today = this.getTodayKey();
        const day = this.getDayData(today);
        const newHabits = { ...day.habits };
        newHabits[habitId] = !newHabits[habitId];
        this.updateToday({ habits: newHabits });
        return newHabits[habitId]; // Return new state
    },

    /**
     * Log a value for today
     */
    logValue(type, value) {
        this.updateToday({ [type]: value });
    },
    
    /**
     * Log weight - updates today's log AND profile currentWeight
     */
    logWeight(weight) {
        // Log to today's data
        this.updateToday({ weight: weight });
        
        // Also update profile's currentWeight for macro calculations
        this.setProfile({ currentWeight: weight });
    },

    // ==========================================
    // XP OPERATIONS
    // ==========================================

    /**
     * Ensure stats object exists (migration for old data)
     */
    ensureStats() {
        if (!this._data.stats) {
            this._data.stats = {
                totalXP: 0,
                skillXP: {
                    strength: 0,
                    discipline: 0,
                    nutrition: 0,
                    recovery: 0,
                    health: 0,
                },
                bestStreak: 0,
            };
        }
        if (!this._data.stats.skillXP) {
            this._data.stats.skillXP = {
                strength: 0,
                discipline: 0,
                nutrition: 0,
                recovery: 0,
                health: 0,
            };
        }
        if (typeof this._data.stats.totalXP !== 'number') {
            this._data.stats.totalXP = 0;
        }
    },
    
    /**
     * Add XP (with optional skill allocation)
     */
    addXP(amount, skill = null) {
        // Ensure stats object exists
        this.ensureStats();
        
        // Validate amount
        if (!amount || typeof amount !== 'number' || isNaN(amount)) {
            console.warn('Invalid XP amount:', amount);
            return;
        }
        
        this._data.stats.totalXP += amount;
        
        if (skill && this._data.stats.skillXP) {
            if (this._data.stats.skillXP[skill] === undefined) {
                this._data.stats.skillXP[skill] = 0;
            }
            this._data.stats.skillXP[skill] += amount;
        }
        
        // Track today's XP
        const today = this.getTodayKey();
        if (this._data.days[today]) {
            this._data.days[today].xp = (this._data.days[today].xp || 0) + amount;
        }
        
        this.save();
    },

    /**
     * Remove XP (for decay)
     */
    removeXP(amount) {
        this._data.stats.totalXP = Math.max(0, this._data.stats.totalXP - amount);
        this.save();
    },

    /**
     * Get total XP
     */
    getTotalXP() {
        this.ensureStats();
        return this._data?.stats?.totalXP || 0;
    },

    /**
     * Get skill XP
     */
    getSkillXP(skill) {
        return this._data?.stats?.skillXP?.[skill] || 0;
    },

    // ==========================================
    // PROFILE & GOALS
    // ==========================================

    /**
     * Set profile data
     */
    setProfile(profile) {
        this._data.profile = { ...this._data.profile, ...profile };
        this.save();
    },

    /**
     * Set goals
     */
    setGoals(goals) {
        this._data.goals = { ...this._data.goals, ...goals };
        this.save();
    },

    /**
     * Get profile
     */
    getProfile() {
        return this._data?.profile ? { ...this._data.profile } : null;
    },

    /**
     * Get goals
     */
    getGoals() {
        return this._data?.goals ? { ...this._data.goals } : null;
    },

    /**
     * Complete onboarding
     */
    completeOnboarding() {
        this._data.onboardingComplete = true;
        this.save();
    },

    // ==========================================
    // DEBT OPERATIONS
    // ==========================================

    /**
     * Add workout debt
     */
    addDebt(type, date, exercises) {
        this._data.debt.push({ type, date, exercises });
        // Cap at max items
        if (this._data.debt.length > CONFIG.ACCOUNTABILITY.MAX_DEBT_ITEMS) {
            this._data.debt = this._data.debt.slice(-CONFIG.ACCOUNTABILITY.MAX_DEBT_ITEMS);
        }
        this.save();
    },

    /**
     * Clear debt item by index
     */
    clearDebt(index) {
        if (index >= 0 && index < this._data.debt.length) {
            this._data.debt.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    },

    /**
     * Get all debt
     */
    getDebt() {
        return this._data?.debt ? [...this._data.debt] : [];
    },

    // ==========================================
    // STREAK TRACKING
    // ==========================================

    /**
     * Update best streak if current is higher
     */
    updateBestStreak(currentStreak) {
        if (currentStreak > (this._data.stats.bestStreak || 0)) {
            this._data.stats.bestStreak = currentStreak;
            this.save();
        }
    },

    /**
     * Get best streak
     */
    getBestStreak() {
        return this._data?.stats?.bestStreak || 0;
    },

    // ==========================================
    // DAY STATUS
    // ==========================================

    /**
     * Mark a day as failed
     */
    markDayFailed(dateKey) {
        if (this._data.days[dateKey]) {
            this._data.days[dateKey].failed = true;
            this.save();
        }
    },

    /**
     * Mark a day as completed
     */
    markDayCompleted(dateKey) {
        if (this._data.days[dateKey]) {
            this._data.days[dateKey].completed = true;
            this.save();
        }
    },

    // ==========================================
    // BACKUP / RESTORE
    // ==========================================

    /**
     * Export data as JSON string
     */
    export() {
        return JSON.stringify(this._data, null, 2);
    },

    /**
     * Import data from JSON string
     */
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data && data.version) {
                this._data = data;
                this.save();
                return true;
            }
        } catch (e) {
            console.error('State.import error:', e);
        }
        return false;
    },

    /**
     * Reset all data
     */
    reset() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        this._data = null;
    },

    // ==========================================
    // RUNNING PROGRAM
    // ==========================================

    /**
     * Set running goal
     */
    setRunningGoal(goalId) {
        this._data.running.goal = goalId;
        this._data.running.startDate = new Date().toISOString();
        this._data.running.weekNumber = 1;
        this.save();
    },

    /**
     * Set running injuries
     */
    setRunningInjuries(injuries) {
        this._data.running.injuries = injuries;
        this.save();
    },

    /**
     * Get running data
     */
    getRunningData() {
        return this._data?.running ? { ...this._data.running } : null;
    },
    
    /**
     * Update running data (partial update)
     */
    updateRunningData(updates) {
        this._data.running = { ...this._data.running, ...updates };
        this.save();
    },

    /**
     * Advance running week
     */
    advanceRunningWeek() {
        this._data.running.weekNumber++;
        this.save();
    },

    /**
     * Set running baseline assessment
     */
    setRunningBaseline(baseline) {
        this._data.running.baseline = { ...this._data.running.baseline, ...baseline };
        // Calculate VDOT if we have race time
        if (baseline.recentRaceTime) {
            const vdot = this.calculateVDOT(baseline.recentRaceTime);
            this._data.running.vdot = vdot;
            // Store start VDOT for progress tracking
            if (!this._data.running.startVdot) {
                this._data.running.startVdot = vdot;
            }
        }
        this.save();
    },

    /**
     * Set running target
     */
    setRunningTarget(target) {
        this._data.running.target = { ...this._data.running.target, ...target };
        this.save();
    },

    /**
     * Calculate VDOT from race time (simplified)
     */
    calculateVDOT(raceTime) {
        // Convert race time to seconds and estimate VDOT
        // This is a simplified calculation
        const { distance, time } = raceTime;
        const parts = time.split(':');
        const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
        
        // Simplified VDOT estimation based on 5K time
        if (distance === '5k') {
            if (totalSeconds <= 900) return 60;  // sub 15:00
            if (totalSeconds <= 1020) return 55; // sub 17:00
            if (totalSeconds <= 1140) return 50; // sub 19:00
            if (totalSeconds <= 1275) return 45; // sub 21:15
            if (totalSeconds <= 1440) return 40; // sub 24:00
            if (totalSeconds <= 1650) return 35; // sub 27:30
            return 30;
        }
        // Default estimate based on current easy pace
        return 40;
    },

    /**
     * Log a run
     */
    logRun(runData) {
        if (!this._data.runLog) this._data.runLog = [];
        
        const entry = {
            date: this.getTodayKey(),
            timestamp: new Date().toISOString(),
            distance: runData.distance, // miles
            time: runData.time, // "mm:ss" or total minutes
            pace: runData.pace || this.calculatePace(runData.distance, runData.time),
            effort: runData.effort, // 1-10
            type: runData.type, // easy, tempo, intervals, long, recovery
            notes: runData.notes || '',
        };
        
        this._data.runLog.push(entry);
        
        // Keep last 200 runs
        if (this._data.runLog.length > 200) {
            this._data.runLog = this._data.runLog.slice(-200);
        }
        
        // ALSO update today's runDistance for day score calculation
        this.updateToday({ runDistance: runData.distance });
        
        this.save();
        return entry;
    },

    /**
     * Calculate pace from distance and time
     */
    calculatePace(distance, timeStr) {
        if (!distance || !timeStr) return null;
        
        let totalMinutes;
        if (typeof timeStr === 'string' && timeStr.includes(':')) {
            const parts = timeStr.split(':');
            totalMinutes = parseInt(parts[0]) + (parseInt(parts[1] || 0) / 60);
        } else {
            totalMinutes = parseFloat(timeStr);
        }
        
        const paceMinutes = totalMinutes / distance;
        const mins = Math.floor(paceMinutes);
        const secs = Math.round((paceMinutes - mins) * 60);
        
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Get run log
     */
    getRunLog(limit = 50) {
        return (this._data?.runLog || []).slice(-limit);
    },

    /**
     * Get weekly mileage
     */
    getWeeklyMileage() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        const runs = (this._data?.runLog || []).filter(r => r.date >= weekAgoStr);
        return runs.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0);
    },

    /**
     * Get running stats
     */
    getRunningStats() {
        const runs = this._data?.runLog || [];
        if (runs.length === 0) return null;
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        const thisWeekRuns = runs.filter(r => r.date >= weekAgoStr);
        const totalMileage = runs.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0);
        const weeklyMileage = thisWeekRuns.reduce((sum, r) => sum + (parseFloat(r.distance) || 0), 0);
        
        // Calculate average pace
        let totalPaceMinutes = 0;
        let paceCount = 0;
        for (const run of thisWeekRuns) {
            if (run.pace) {
                const parts = run.pace.split(':');
                totalPaceMinutes += parseInt(parts[0]) + (parseInt(parts[1] || 0) / 60);
                paceCount++;
            }
        }
        const avgPace = paceCount > 0 ? totalPaceMinutes / paceCount : null;
        
        return {
            totalRuns: runs.length,
            totalMileage: totalMileage.toFixed(1),
            weeklyMileage: weeklyMileage.toFixed(1),
            weeklyRuns: thisWeekRuns.length,
            avgPace: avgPace ? `${Math.floor(avgPace)}:${Math.round((avgPace % 1) * 60).toString().padStart(2, '0')}` : null,
        };
    },

    /**
     * Get training paces based on VDOT
     */
    getTrainingPaces() {
        const vdot = this._data?.running?.vdot || 40;
        return CONFIG.RUNNING.VDOT_PACES[vdot] || CONFIG.RUNNING.VDOT_PACES[40];
    },

    /**
     * Get current training phase
     */
    getCurrentPhase() {
        const running = this._data?.running;
        if (!running?.startDate || !running?.goal) return null;
        
        const goal = CONFIG.RUNNING.GOALS.find(g => g.id === running.goal);
        if (!goal?.weeks) return null;
        
        const weekNum = running.weekNumber;
        const totalWeeks = goal.weeks;
        
        // Determine phase based on week number
        if (weekNum <= 4) return 'base';
        if (weekNum <= totalWeeks - 5) return 'build';
        if (weekNum <= totalWeeks - 2) return 'peak';
        return 'taper';
    },

    // ==========================================
    // ALCOHOL TRACKING
    // ==========================================

    /**
     * Log alcohol consumption
     */
    logAlcohol(drinks, type = 'standard') {
        this._data.alcoholLog.push({
            date: this.getTodayKey(),
            drinks,
            type,
            timestamp: new Date().toISOString()
        });
        this.save();
    },

    /**
     * Get alcohol log
     */
    getAlcoholLog() {
        return this._data?.alcoholLog ? [...this._data.alcoholLog] : [];
    },

    /**
     * Get recent alcohol (last N days)
     */
    getRecentAlcohol(days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        
        return this.getAlcoholLog().filter(a => a.date >= cutoffStr);
    },

    /**
     * Check if drank recently (affects recovery)
     */
    drankRecently(hours = 48) {
        const log = this.getAlcoholLog();
        if (log.length === 0) return false;
        
        const lastDrink = new Date(log[log.length - 1].timestamp);
        const hoursSince = (Date.now() - lastDrink.getTime()) / (1000 * 60 * 60);
        
        return hoursSince < hours;
    },

    // ==========================================
    // READING TRACKING
    // ==========================================

    /**
     * Start a new book
     */
    startBook(title, totalPages) {
        this._data.reading.currentBook = {
            title,
            totalPages,
            pagesRead: 0,
            startDate: new Date().toISOString()
        };
        this.save();
    },

    /**
     * Update pages read
     */
    updatePagesRead(pages) {
        if (!this._data.reading.currentBook) return;
        this._data.reading.currentBook.pagesRead = pages;
        this.save();
    },

    /**
     * Add pages to current book
     */
    addPagesRead(pages) {
        if (!this._data.reading.currentBook) return;
        this._data.reading.currentBook.pagesRead += pages;
        
        // Check if book is complete
        if (this._data.reading.currentBook.pagesRead >= this._data.reading.currentBook.totalPages) {
            this.completeBook();
        } else {
            this.save();
        }
    },

    /**
     * Complete current book
     */
    completeBook() {
        if (!this._data.reading.currentBook) return;
        
        this._data.reading.completedBooks.push({
            title: this._data.reading.currentBook.title,
            totalPages: this._data.reading.currentBook.totalPages,
            completedDate: new Date().toISOString()
        });
        
        this._data.reading.currentBook = null;
        this.save();
    },

    /**
     * Get reading data
     */
    getReadingData() {
        return this._data?.reading ? { ...this._data.reading } : null;
    },

    /**
     * Get completed books
     */
    getCompletedBooks() {
        return this._data?.reading?.completedBooks ? [...this._data.reading.completedBooks] : [];
    },

    // ==========================================
    // EXERCISE CYCLING
    // ==========================================

    /**
     * Get current exercise week (for cycling)
     */
    getExerciseWeek() {
        return this._data?.exerciseWeek || 0;
    },

    /**
     * Advance exercise week
     */
    advanceExerciseWeek() {
        this._data.exerciseWeek = (this._data.exerciseWeek || 0) + 1;
        this.save();
    },

    // ==========================================
    // LIFT HISTORY & PROGRESSIVE OVERLOAD
    // ==========================================

    /**
     * Log a lift with sets
     * Updates existing entry for the date or creates new one
     * @param {string} exerciseName - Name of exercise
     * @param {array} sets - Array of { weight, reps }
     * @param {string} dateKey - Optional date key (defaults to today, allows logging to specific date)
     * @returns {object} { isPR, estimated1RM, volume, previousBest }
     */
    logLift(exerciseName, sets, dateKey = null) {
        // Initialize if needed
        if (!this._data.liftHistory) this._data.liftHistory = {};
        if (!this._data.personalRecords) this._data.personalRecords = {};
        if (!this._data.liftHistory[exerciseName]) this._data.liftHistory[exerciseName] = [];
        
        // Use provided date or default to today
        const targetDateKey = dateKey || this.getTodayKey();
        
        // Calculate metrics
        const volume = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        const bestSet = sets.reduce((best, set) => {
            const e1rm = this.calculateEstimated1RM(set.weight, set.reps);
            return e1rm > (best?.e1rm || 0) ? { ...set, e1rm } : best;
        }, null);
        
        const estimated1RM = bestSet?.e1rm || 0;
        
        // Check for PR
        const previousPR = this._data.personalRecords[exerciseName];
        const isPR = !previousPR || estimated1RM > previousPR.estimated1RM;
        
        // Check if there's already an entry for this date - UPDATE it instead of creating new
        const existingIndex = this._data.liftHistory[exerciseName].findIndex(
            entry => entry.date === targetDateKey
        );
        
        // Build entry
        const entry = {
            date: targetDateKey,
            timestamp: new Date().toISOString(),
            sets: sets,
            volume: volume,
            estimated1RM: estimated1RM,
            bestSet: bestSet
        };
        
        if (existingIndex >= 0) {
            // Update existing entry for today
            this._data.liftHistory[exerciseName][existingIndex] = entry;
        } else {
            // Create new entry
            this._data.liftHistory[exerciseName].push(entry);
        }
        
        // Keep only last 100 entries per exercise
        if (this._data.liftHistory[exerciseName].length > 100) {
            this._data.liftHistory[exerciseName] = 
                this._data.liftHistory[exerciseName].slice(-100);
        }
        
        // Update PR if new
        if (isPR) {
            this._data.personalRecords[exerciseName] = {
                weight: bestSet.weight,
                reps: bestSet.reps,
                estimated1RM: estimated1RM,
                date: targetDateKey
            };
        }
        
        this.save();
        
        return {
            isPR,
            estimated1RM,
            volume,
            previousBest: previousPR
        };
    },

    /**
     * Remove a lift entry for a specific date
     * Used when all sets are deleted
     */
    removeLiftEntry(exerciseName, dateKey) {
        if (!this._data.liftHistory?.[exerciseName]) return;
        
        const index = this._data.liftHistory[exerciseName].findIndex(
            entry => entry.date === dateKey
        );
        
        if (index >= 0) {
            this._data.liftHistory[exerciseName].splice(index, 1);
            this.save();
        }
    },

    /**
     * Save an exercise swap for today
     * Maps original exercise to swapped exercise
     */
    saveExerciseSwap(originalExercise, newExercise) {
        const todayKey = this.getTodayKey();
        
        if (!this._data.exerciseSwaps) {
            this._data.exerciseSwaps = {};
        }
        
        if (!this._data.exerciseSwaps[todayKey]) {
            this._data.exerciseSwaps[todayKey] = {};
        }
        
        this._data.exerciseSwaps[todayKey][originalExercise] = newExercise;
        this.save();
    },
    
    /**
     * Get swapped exercise for today (if any)
     */
    getExerciseSwap(originalExercise) {
        const todayKey = this.getTodayKey();
        return this._data?.exerciseSwaps?.[todayKey]?.[originalExercise] || null;
    },
    
    /**
     * Get all exercise swaps for today
     */
    getTodaySwaps() {
        const todayKey = this.getTodayKey();
        return this._data?.exerciseSwaps?.[todayKey] || {};
    },

    /**
     * Calculate estimated 1RM using Brzycki formula
     */
    calculateEstimated1RM(weight, reps) {
        if (reps === 1) return weight;
        if (reps > 12) reps = 12; // Formula less accurate above 12 reps
        return Math.round(weight * (36 / (37 - reps)));
    },

    /**
     * Get last lift entry for an exercise
     */
    getLastLift(exerciseName) {
        const history = this._data?.liftHistory?.[exerciseName];
        if (!history || history.length === 0) return null;
        return history[history.length - 1];
    },

    /**
     * Get lift history for an exercise
     */
    getLiftHistory(exerciseName, limit = 10) {
        const history = this._data?.liftHistory?.[exerciseName];
        if (!history) return [];
        return history.slice(-limit);
    },
    
    /**
     * Get today's sets for an exercise (or specific date)
     */
    getTodaySets(exerciseName, dateKey = null) {
        const targetDate = dateKey || this.getTodayKey();
        const history = this._data?.liftHistory?.[exerciseName];
        if (!history) return [];
        
        const todayEntry = history.find(entry => entry.date === targetDate);
        return todayEntry?.sets || [];
    },
    
    /**
     * Get today's run distance (checks both todayData and runLog)
     */
    getTodayRunDistance(dateKey = null) {
        const targetDate = dateKey || this.getTodayKey();
        
        // First check today's data
        const dayData = this.getDayData(targetDate);
        if (dayData?.runDistance > 0) {
            return dayData.runDistance;
        }
        
        // Then check runLog - try exact match first
        const runLog = this._data?.runLog || [];
        let todayRun = runLog.find(r => r.date === targetDate);
        
        // If no exact match, check if any run's date STARTS with today (handles timezone issues)
        if (!todayRun) {
            todayRun = runLog.find(r => r.date && r.date.startsWith(targetDate.substring(0, 10)));
        }
        
        // Also check if the run's timestamp is from today
        if (!todayRun) {
            const todayStart = new Date(targetDate).setHours(0, 0, 0, 0);
            const todayEnd = new Date(targetDate).setHours(23, 59, 59, 999);
            todayRun = runLog.find(r => {
                if (r.timestamp) {
                    const runTime = new Date(r.timestamp).getTime();
                    return runTime >= todayStart && runTime <= todayEnd;
                }
                return false;
            });
        }
        
        if (todayRun?.distance > 0) {
            return todayRun.distance;
        }
        
        return 0;
    },

    /**
     * Get PR for an exercise
     */
    getPR(exerciseName) {
        return this._data?.personalRecords?.[exerciseName] || null;
    },

    /**
     * Get all PRs
     */
    getAllPRs() {
        return this._data?.personalRecords ? { ...this._data.personalRecords } : {};
    },

    /**
     * Get science-based progression suggestion for an exercise
     * Uses double progression (6-12 rep range) and considers volume status
     */
    getProgressionSuggestion(exerciseName) {
        const lastLift = this.getLastLift(exerciseName);
        if (!lastLift || !lastLift.bestSet) return null;
        
        const lastWeight = lastLift.bestSet.weight;
        const lastReps = lastLift.bestSet.reps;
        const avgReps = Math.round(lastLift.sets.reduce((sum, s) => sum + s.reps, 0) / lastLift.sets.length);
        
        // Find which muscle group this exercise belongs to
        let muscleGroup = null;
        for (const [muscle, exercises] of Object.entries(CONFIG.MUSCLE_GROUPS || {})) {
            if (exercises.some(ex => ex.toLowerCase() === exerciseName.toLowerCase())) {
                muscleGroup = muscle;
                break;
            }
        }
        
        // Check volume status for this muscle group
        let nearMRV = false;
        if (muscleGroup) {
            const volume = this.getWeeklyVolume(muscleGroup);
            const landmarks = CONFIG.VOLUME_LANDMARKS?.[muscleGroup] || CONFIG.VOLUME_LANDMARKS?.default || { MRV: 20 };
            nearMRV = volume.sets >= landmarks.MRV - 3;
        }
        
        // SCIENCE-BASED DOUBLE PROGRESSION (6-12 rep range)
        // Goal: When you can do 12 reps with good form, increase weight and drop to 6-8
        
        if (nearMRV) {
            // At high volume - maintain, don't push progression
            return {
                weight: lastWeight,
                reps: avgReps,
                message: `High volume week - maintain ${lastWeight} lbs, focus on form`
            };
        }
        
        if (avgReps >= 12) {
            // Hit top of rep range - time to add weight
            const newWeight = lastWeight + 5;
            return {
                weight: newWeight,
                reps: '6-8',
                message: `${avgReps} reps = time to progress. Add 5 lbs.`
            };
        } else if (avgReps >= 10) {
            // Strong performance - same weight, push for more reps
            return {
                weight: lastWeight,
                reps: avgReps + 1,
                message: `${avgReps} reps last time. Push for ${avgReps + 1} today.`
            };
        } else if (avgReps >= 8) {
            // Good range - keep building
            return {
                weight: lastWeight,
                reps: avgReps + 1,
                message: `${avgReps} reps - keep building at ${lastWeight} lbs`
            };
        } else if (avgReps >= 6) {
            // Lower end of range - stay here until 8+
            return {
                weight: lastWeight,
                reps: 8,
                message: `Build to 8+ reps at ${lastWeight} lbs before adding weight`
            };
        } else {
            // Under 6 reps - weight is too heavy
            const newWeight = Math.max(lastWeight - 5, 5);
            return {
                weight: newWeight,
                reps: 8,
                message: `Only ${avgReps} reps - drop to ${newWeight} lbs, aim for 8`
            };
        }
    },

    /**
     * Get weekly volume for a muscle group
     */
    getWeeklyVolume(muscleGroup) {
        const exercises = CONFIG.MUSCLE_GROUPS?.[muscleGroup] || [];
        let totalSets = 0;
        let totalVolume = 0;
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        for (const exercise of exercises) {
            const history = this._data?.liftHistory?.[exercise] || [];
            for (const entry of history) {
                if (entry.date >= weekAgoStr) {
                    totalSets += entry.sets.length;
                    totalVolume += entry.volume;
                }
            }
        }
        
        return { sets: totalSets, volume: totalVolume };
    },

    /**
     * Get all muscle group volumes for the week
     */
    getAllWeeklyVolumes() {
        const volumes = {};
        const muscleGroups = Object.keys(CONFIG.MUSCLE_GROUPS || {});
        
        for (const group of muscleGroups) {
            volumes[group] = this.getWeeklyVolume(group);
        }
        
        return volumes;
    },

    /**
     * Get total weekly training volume and stats
     */
    getWeeklyTrainingStats() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        let totalSets = 0;
        let totalVolume = 0;
        let sessionsThisWeek = 0;
        const sessionDates = new Set();
        
        const history = this._data?.liftHistory || {};
        
        for (const exercise in history) {
            const entries = history[exercise] || [];
            for (const entry of entries) {
                if (entry.date >= weekAgoStr) {
                    totalSets += entry.sets.length;
                    totalVolume += entry.volume;
                    sessionDates.add(entry.date);
                }
            }
        }
        
        sessionsThisWeek = sessionDates.size;
        
        return {
            totalSets,
            totalVolume,
            sessionsThisWeek,
            avgSetsPerSession: sessionsThisWeek > 0 ? Math.round(totalSets / sessionsThisWeek) : 0
        };
    },

    /**
     * Check if deload is recommended
     * Based on: 4+ weeks of training without a deload
     */
    shouldDeload() {
        const history = this._data?.liftHistory || {};
        const allDates = [];
        
        for (const exercise in history) {
            const entries = history[exercise] || [];
            for (const entry of entries) {
                allDates.push(entry.date);
            }
        }
        
        if (allDates.length === 0) return { recommended: false };
        
        // Sort dates and find consecutive training weeks
        const uniqueDates = [...new Set(allDates)].sort();
        const firstDate = new Date(uniqueDates[0]);
        const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
        const weeksTraining = Math.floor((lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000));
        
        // Check weekly stats for fatigue indicators
        const weeklyStats = this.getWeeklyTrainingStats();
        
        // Recommend deload after 4-6 weeks or if volume is very high
        const weeksSinceStart = weeksTraining;
        const lastDeload = this._data?.lastDeloadDate;
        const weeksSinceDeload = lastDeload 
            ? Math.floor((Date.now() - new Date(lastDeload).getTime()) / (7 * 24 * 60 * 60 * 1000))
            : weeksSinceStart;
        
        return {
            recommended: weeksSinceDeload >= 4,
            weeksSinceDeload,
            reason: weeksSinceDeload >= 6 
                ? 'Over 6 weeks without deload - fatigue likely accumulated'
                : weeksSinceDeload >= 4 
                    ? 'Consider a deload week to optimize recovery'
                    : null
        };
    },

    /**
     * Mark deload week completed
     */
    markDeloadComplete() {
        this._data.lastDeloadDate = new Date().toISOString();
        this.save();
    },

    // ==========================================
    // UTILITY
    // ==========================================

    /**
     * Get all day keys sorted
     */
    getAllDayKeys() {
        return Object.keys(this._data?.days || {}).sort();
    },

    /**
     * Get recent day keys
     */
    getRecentDayKeys(count = 7) {
        return this.getAllDayKeys().slice(-count);
    },

    // ==========================================
    // PHYSIQUE PRIORITIES & POSTURE
    // ==========================================

    /**
     * Get physique priorities
     */
    getPhysiquePriorities() {
        return this._data?.physiquePriorities || [];
    },

    /**
     * Set physique priorities
     */
    setPhysiquePriorities(priorities) {
        this._data.physiquePriorities = priorities;
        this.save();
    },

    /**
     * Get posture issues
     */
    getPostureIssues() {
        return this._data?.postureIssues || [];
    },

    /**
     * Set posture issues
     */
    setPostureIssues(issues) {
        this._data.postureIssues = issues;
        this.save();
    },

    // ==========================================
    // FEEDBACK
    // ==========================================

    /**
     * Get all feedback submissions
     */
    getFeedback() {
        return this._data?.feedback || [];
    },

    /**
     * Add feedback - saves locally AND to shared Firebase collection
     */
    addFeedback(text) {
        if (!this._data.feedback) {
            this._data.feedback = [];
        }
        
        // Get user identifier - prefer email, then profile name, then 'Anonymous'
        let userName = 'Anonymous';
        
        // Debug logging
        console.log('Firebase.user:', Firebase.user);
        console.log('Firebase.user?.email:', Firebase.user?.email);
        console.log('localStorage user_email:', localStorage.getItem('user_email'));
        
        // Try multiple sources for email
        const email = Firebase.user?.email || localStorage.getItem('user_email');
        
        if (email) {
            userName = email.split('@')[0]; // Just the part before @
        } else if (this._data.profile?.name) {
            userName = this._data.profile.name;
        }
        
        const feedbackItem = {
            text: text,
            timestamp: Date.now(),
            date: this.getTodayKey(),
            userName: userName,
            userEmail: email || null,
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        this._data.feedback.push(feedbackItem);
        this.save();
        
        // Also save to shared Firebase collection (if available)
        this.sendFeedbackToFirebase(feedbackItem);
    },
    
    /**
     * Send feedback to shared Firebase collection for admin viewing
     */
    async sendFeedbackToFirebase(feedbackItem) {
        console.log('Attempting to send feedback to Firebase...');
        console.log('Firebase.isConfigured:', Firebase.isConfigured());
        console.log('Firebase.db:', Firebase.db ? 'exists' : 'null');
        console.log('Firebase.initialized:', Firebase.initialized);
        
        // Try to get db directly if not available via Firebase object
        let db = Firebase.db;
        if (!db && typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                db = firebase.firestore();
                console.log('Got Firestore directly');
            } catch (e) {
                console.log('Could not get Firestore:', e);
            }
        }
        
        if (!db) {
            console.log('Firebase Firestore not available for feedback');
            return;
        }
        
        try {
            const docRef = await db.collection('feedback').add({
                ...feedbackItem,
                sentAt: new Date().toISOString(),
                userId: Firebase.user?.uid || 'anonymous'
            });
            console.log('✅ Feedback sent to Firebase! Doc ID:', docRef.id);
        } catch (e) {
            console.error('❌ Failed to send feedback to Firebase:', e);
            console.error('Error code:', e.code);
            console.error('Error message:', e.message);
        }
    },
    
    /**
     * Clear all feedback
     */
    clearFeedback() {
        this._data.feedback = [];
        this.save();
    },
};


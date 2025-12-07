/**
 * DEMO-MODE.JS
 * Pre-populates the app with impressive sample data for marketing
 * 
 * TEST MODES:
 * ?test_injury - Default IT Band test
 * ?test_injury=plantar_fasciitis - Specific injury test
 * ?test_injury=multi - Multiple injuries (IT Band + Plantar)
 * ?stress_test - Cycle through all injuries
 */

const DemoMode = {
    
    // Map of injury keys to their earlySignals for testing
    INJURY_SIGNALS: {
        plantar_fasciitis: ['foot_arch', 'heel'],
        achilles_tendinitis: ['achilles', 'calf'],
        shin_splints: ['shin'],
        stress_fracture: ['shin', 'foot'],
        runners_knee: ['knee'],
        it_band_syndrome: ['it_band'],
        hamstring_strain: ['hamstring'],
        hip_flexor_strain: ['hip'],
        piriformis_syndrome: ['glute', 'hip'],
        lower_back_pain: ['lower_back'],
        calf_strain: ['calf'],
        ankle_sprain: ['ankle'],
        metatarsalgia: ['foot_arch'],
        morton_neuroma: ['foot_arch', 'toes'],
        bursitis_hip: ['hip'],
        groin_strain: ['groin', 'hip'],
    },
    
    /**
     * Check if demo mode is active
     */
    isActive() {
        return window.location.search.includes('demo');
    },
    
    /**
     * Check if injury test mode is active
     */
    isInjuryTestActive() {
        return window.location.search.includes('test_injury');
    },
    
    /**
     * Get specific injury to test from URL
     */
    getTestInjury() {
        const params = new URLSearchParams(window.location.search);
        return params.get('test_injury') || 'it_band_syndrome';
    },
    
    /**
     * Initialize injury test mode with sample pain data
     * Supports: ?test_injury=plantar_fasciitis, ?test_injury=multi, etc.
     */
    initInjuryTest() {
        if (!this.isInjuryTestActive()) return false;
        
        const injuryToTest = this.getTestInjury();
        console.log('🩹 Injury Test Mode Active - Testing:', injuryToTest);
        
        // IMPORTANT: Initialize State._data if it doesn't exist
        if (!State._data) {
            State.init();
        }
        
        const today = new Date();
        let cardioLog = [];
        
        if (injuryToTest === 'multi') {
            // Test MULTIPLE injuries at once
            cardioLog = this.generateMultiInjuryData(today);
            console.log('🩹 Testing MULTIPLE injuries: IT Band + Plantar Fasciitis');
        } else {
            // Test single injury
            const signals = this.INJURY_SIGNALS[injuryToTest] || ['it_band'];
            cardioLog = this.generateInjuryData(today, signals, injuryToTest);
        }
        
        // Set cardio log
        State._data.cardioLog = cardioLog;
        
        // Set up a running goal so the running view shows
        State._data.running = {
            ...State._data.running,
            goal: '10k',
            currentWeek: 3,
            weekNumber: 3,
            injuries: [], // User-reported injuries from onboarding
            baseline: { time: '28:00', distance: 5 },
            target: { raceDate: '2025-03-01', goalTime: '55:00' }
        };
        
        // Set profile so app is "onboarded"
        State._data.profile = {
            ...State._data.profile,
            name: 'Test User',
            age: 30,
            weight: 175,
            height: 70,
            sex: 'male',
            activityLevel: 'moderate',
            goal: 'maintain'
        };
        
        // Mark onboarding complete
        State._data.onboardingComplete = true;
        
        // Add today's data with nutrition
        State._data.days = State._data.days || {};
        State._data.days[this.formatDate(today)] = {
            completed: [],
            weight: 175,
            calories: 1800,
            protein: 140
        };
        
        State.save();
        console.log('Cardio log loaded with pain data:', cardioLog.length, 'entries');
        
        return true;
    },
    
    /**
     * Generate pain data for a single injury
     */
    generateInjuryData(today, painSignals, injuryKey) {
        const cardioLog = [];
        
        for (let i = 0; i < 6; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i * 2));
            
            cardioLog.push({
                type: 'running',
                workoutType: i % 3 === 0 ? 'long' : 'easy',
                distance: 3 + (i % 3),
                time: '28:00',
                effort: 6,
                pain: painSignals,
                painDetails: [{
                    injury: injuryKey
                }],
                date: this.formatDate(date),
                timestamp: date.toISOString()
            });
        }
        
        return cardioLog;
    },
    
    /**
     * Generate pain data for MULTIPLE injuries
     */
    generateMultiInjuryData(today) {
        const cardioLog = [];
        
        // IT Band pain - outer knee/thigh
        for (let i = 0; i < 4; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i * 2));
            
            cardioLog.push({
                type: 'running',
                workoutType: 'easy',
                distance: 3,
                time: '28:00',
                effort: 6,
                pain: ['it_band'],
                date: this.formatDate(date),
                timestamp: date.toISOString()
            });
        }
        
        // Plantar fasciitis pain - heel/arch
        for (let i = 0; i < 4; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i * 3));
            
            cardioLog.push({
                type: 'running',
                workoutType: 'long',
                distance: 5,
                time: '45:00',
                effort: 7,
                pain: ['foot_arch', 'heel'],
                date: this.formatDate(date),
                timestamp: date.toISOString()
            });
        }
        
        return cardioLog;
    },
    
    /**
     * Stress test: cycle through all injuries
     * Usage: ?stress_test
     */
    runStressTest() {
        const injuries = Object.keys(this.INJURY_SIGNALS);
        let current = 0;
        
        console.log('🔥 STRESS TEST: Testing', injuries.length, 'injuries');
        console.log('Injuries to test:', injuries);
        
        const testNext = () => {
            if (current >= injuries.length) {
                console.log('✅ STRESS TEST COMPLETE - All injuries passed');
                alert('Stress Test Complete! All ' + injuries.length + ' injuries tested.');
                return;
            }
            
            const injury = injuries[current];
            console.log(`\n📋 Testing ${current + 1}/${injuries.length}: ${injury}`);
            
            // Generate data for this injury
            State.init();
            const today = new Date();
            const signals = this.INJURY_SIGNALS[injury];
            State._data.cardioLog = this.generateInjuryData(today, signals, injury);
            State._data.onboardingComplete = true;
            State._data.profile = { name: 'Test' };
            State._data.running = { goal: '10k' };
            
            // Check if injury is detected
            const detected = InjuryIntelligence.analyzeInjuries();
            const found = detected.find(d => d.key === injury);
            
            if (found) {
                console.log(`  ✅ ${injury} detected correctly (${found.severity})`);
            } else {
                console.error(`  ❌ ${injury} NOT detected!`);
                console.log('  Signals used:', signals);
                console.log('  Detected instead:', detected.map(d => d.key));
            }
            
            current++;
            setTimeout(testNext, 100);
        };
        
        testNext();
    },
    
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },
    
    /**
     * Initialize demo mode with sample data
     */
    init() {
        if (!this.isActive()) return false;
        
        // Generate demo data
        const demoData = this.generateDemoData();
        
        // Load into State
        State._data = demoData;
        
        // Don't save to localStorage in demo mode
        State.save = () => {};
        
        return true;
    },
    
    /**
     * Generate impressive demo data
     */
    generateDemoData() {
        const today = new Date();
        const todayKey = this.formatDate(today);
        
        // Generate last 30 days of data
        const days = {};
        const liftHistory = {};
        const runLog = {};
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = this.formatDate(date);
            const dayOfWeek = date.getDay();
            
            // Skip some days randomly for realism (but not many)
            const completed = i === 0 || Math.random() > 0.1;
            
            if (completed) {
                days[dateKey] = this.generateDayData(dateKey, dayOfWeek, i === 0);
                
                // Add lift history
                this.addLiftHistory(liftHistory, dateKey, dayOfWeek);
                
                // Add run data on run days
                if ([0, 3, 4].includes(dayOfWeek)) {
                    runLog[dateKey] = this.generateRunData(dateKey, dayOfWeek, i);
                }
            }
        }
        
        return {
            version: 2,
            createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastModified: new Date().toISOString(),
            
            // User profile
            profile: {
                name: 'Alex',
                age: 28,
                weight: 175,
                height: 70,
                activityLevel: 'active',
                physiqueGoal: 'recomp',
                fitnessLevel: 'intermediate'
            },
            
            // Goals
            goals: {
                protein: 180,
                calories: 2400,
                steps: 10000,
                water: 100,
                sleep: 7
            },
            
            // Running
            running: {
                goal: '10k',
                weeklyMileage: 15,
                longestRun: 5,
                raceDate: this.formatDate(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)),
                currentVDOT: 42,
                paces: {
                    easy: '9:30',
                    tempo: '8:00',
                    interval: '7:15',
                    long: '10:00'
                }
            },
            
            // Injuries
            injuries: ['wrist'],
            
            // XP and progression
            totalXP: 4850,
            skillXP: {
                strength: 1800,
                endurance: 1200,
                discipline: 1100,
                recovery: 750
            },
            
            // Streaks
            currentStreak: 12,
            longestStreak: 18,
            
            // Daily data
            days: days,
            
            // Lift history
            liftHistory: liftHistory,
            
            // Personal records
            personalRecords: {
                'Barbell Bench Press': { weight: 185, reps: 6, estimated1RM: 215, date: todayKey },
                'Barbell Back Squat': { weight: 225, reps: 8, estimated1RM: 281, date: todayKey },
                'Trap Bar Deadlift': { weight: 315, reps: 5, estimated1RM: 354, date: todayKey },
                'Barbell Overhead Press': { weight: 115, reps: 8, estimated1RM: 144, date: todayKey },
                'Pull-ups': { weight: 25, reps: 10, estimated1RM: 58, date: todayKey }
            },
            
            // Run log
            runLog: runLog,
            
            // Saved meals
            savedMeals: [
                {
                    name: 'Morning Protein Shake',
                    calories: 420,
                    protein: 48,
                    carbs: 32,
                    fats: 12,
                    items: [
                        { name: 'Whey Protein', calories: 120, protein: 25 },
                        { name: 'Banana', calories: 105, protein: 1 },
                        { name: 'Peanut Butter', calories: 95, protein: 4 },
                        { name: 'Oat Milk', calories: 100, protein: 3 }
                    ]
                },
                {
                    name: 'Chicken & Rice Bowl',
                    calories: 650,
                    protein: 52,
                    carbs: 68,
                    fats: 14,
                    items: [
                        { name: 'Grilled Chicken', calories: 280, protein: 45 },
                        { name: 'Brown Rice', calories: 220, protein: 5 },
                        { name: 'Broccoli', calories: 55, protein: 4 },
                        { name: 'Teriyaki Sauce', calories: 95, protein: 1 }
                    ]
                }
            ],
            
            // Onboarding complete
            onboardingComplete: true
        };
    },
    
    /**
     * Generate a single day's data
     */
    generateDayData(dateKey, dayOfWeek, isToday) {
        const baseProtein = 160 + Math.floor(Math.random() * 40);
        const baseCalories = 2200 + Math.floor(Math.random() * 400);
        
        return {
            protein: isToday ? 142 : baseProtein,
            calories: isToday ? 1850 : baseCalories,
            carbs: Math.floor(baseCalories * 0.4 / 4),
            fats: Math.floor(baseCalories * 0.25 / 9),
            water: 80 + Math.floor(Math.random() * 40),
            steps: 8000 + Math.floor(Math.random() * 5000),
            sleep: 6.5 + Math.random() * 2,
            grade: this.randomGrade(),
            exercises: {},
            runDistance: [0, 3, 4].includes(dayOfWeek) ? (2 + Math.random() * 4) : 0
        };
    },
    
    /**
     * Add lift history for a day
     */
    addLiftHistory(history, dateKey, dayOfWeek) {
        const exercises = this.getExercisesForDay(dayOfWeek);
        
        exercises.forEach(ex => {
            if (!history[ex.name]) history[ex.name] = [];
            
            const sets = [];
            const numSets = 3 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < numSets; i++) {
                sets.push({
                    weight: ex.baseWeight + Math.floor(Math.random() * 20) - 10,
                    reps: ex.baseReps + Math.floor(Math.random() * 4) - 2
                });
            }
            
            history[ex.name].push({
                date: dateKey,
                timestamp: new Date().toISOString(),
                sets: sets,
                volume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
                estimated1RM: Math.round(sets[0].weight * (1 + sets[0].reps / 30))
            });
        });
    },
    
    /**
     * Get exercises for a specific day
     */
    getExercisesForDay(dayOfWeek) {
        const exercisesByDay = {
            1: [ // Monday - Upper Strength
                { name: 'Barbell Bench Press', baseWeight: 175, baseReps: 6 },
                { name: 'Barbell Row', baseWeight: 155, baseReps: 8 },
                { name: 'Barbell Overhead Press', baseWeight: 105, baseReps: 8 }
            ],
            2: [ // Tuesday - Lower Power
                { name: 'Barbell Back Squat', baseWeight: 205, baseReps: 6 },
                { name: 'Romanian Deadlift', baseWeight: 185, baseReps: 8 }
            ],
            3: [ // Wednesday - Upper Hypertrophy
                { name: 'Incline Dumbbell Press', baseWeight: 65, baseReps: 10 },
                { name: 'Cable Rows', baseWeight: 140, baseReps: 12 },
                { name: 'Lateral Raises', baseWeight: 20, baseReps: 15 }
            ],
            5: [ // Friday - Lower Hypertrophy
                { name: 'Trap Bar Deadlift', baseWeight: 275, baseReps: 6 },
                { name: 'Bulgarian Split Squat', baseWeight: 45, baseReps: 10 },
                { name: 'Leg Extension', baseWeight: 120, baseReps: 15 }
            ]
        };
        
        return exercisesByDay[dayOfWeek] || [];
    },
    
    /**
     * Generate run data
     */
    generateRunData(dateKey, dayOfWeek, daysAgo) {
        const runTypes = {
            0: { type: 'long', distance: 4 + Math.random() * 2, pace: '9:45' },
            3: { type: 'easy', distance: 2 + Math.random() * 1.5, pace: '9:30' },
            4: { type: 'tempo', distance: 3 + Math.random() * 1, pace: '8:15' }
        };
        
        const run = runTypes[dayOfWeek] || { type: 'easy', distance: 2, pace: '9:30' };
        
        return {
            date: dateKey,
            distance: Math.round(run.distance * 10) / 10,
            duration: Math.round(run.distance * 9.5),
            pace: run.pace,
            type: run.type,
            feeling: ['good', 'great', 'okay'][Math.floor(Math.random() * 3)],
            notes: ''
        };
    },
    
    /**
     * Random grade weighted towards good performance
     */
    randomGrade() {
        const rand = Math.random();
        if (rand > 0.7) return 'A';
        if (rand > 0.4) return 'B';
        if (rand > 0.15) return 'C';
        return 'D';
    },
    
    /**
     * Format date as YYYY-MM-DD
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
};

// Auto-init if demo parameter present
document.addEventListener('DOMContentLoaded', () => {
    if (DemoMode.isActive()) {
        // Wait for State to be ready
        setTimeout(() => DemoMode.init(), 100);
    }
});


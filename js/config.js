/**
 * CONFIG.JS
 * Static configuration - workouts, habits, levels, multipliers
 * This file should rarely change
 */

const CONFIG = {
    // App version - increment when data schema changes
    VERSION: 1,
    STORAGE_KEY: 'lifeOS_v1',

    // Training program - SCIENCE-BASED weekly structure
    // Key principle: 48-72hr separation between leg work and ALL hard runs (Hickson 1980, Wilson et al. 2012)
    // For developing runners, long runs ARE hard - they need fresh legs too
    WORKOUTS: {
        0: { // Sunday - LONG RUN (48hrs after Friday legs = fresh legs for long run)
            name: 'LONG RUN DAY',
            type: 'cardio',
            runType: 'long', // Long run - 48hrs post leg work, legs recovered
            runOrder: 'run_first',
            science: '48hrs post-legs = adequate recovery for long run. For newer runners, long runs are hard efforts.',
            exercises: [
                { name: 'Foam Roll Full Body', detail: '10 min', xp: 10 },
                { name: 'Hip Flexor Stretch', detail: '2 min each', xp: 5, posture: true },
                { name: 'Pigeon Stretch', detail: '2 min each', xp: 5 },
                { name: '90/90 Hip Stretch', detail: '90 sec each', xp: 5 },
            ]
        },
        1: { // Monday - UPPER STRENGTH (post long run - legs recovering)
            name: 'UPPER STRENGTH',
            type: 'lift',
            runType: 'easy', // Easy run OK for 10K+ training - promotes recovery blood flow
            runOrder: 'lift_first',
            runOptional: true, // Optional - skip if legs too fatigued from Sunday
            science: 'Post-long run: easy run promotes blood flow. Skip if legs need full rest.',
            exercises: [
                { name: 'Flat Barbell Bench Press', detail: '4×6', xp: 15, muscle: ['chest', 'triceps'] },
                { name: 'Lat Pulldown', detail: '4×8', xp: 12, muscle: ['back', 'biceps'] },
                { name: 'Seated Cable Row', detail: '4×10', xp: 12, muscle: ['back'] },
                { name: 'Cable Face Pulls', detail: '4×15', xp: 10, muscle: ['shoulders'], posture: true },
                { name: 'Dumbbell Lateral Raises', detail: '3×15', xp: 8, muscle: ['shoulders'] },
                { name: 'Reverse Pec Deck', detail: '3×15', xp: 8, muscle: ['shoulders'], posture: true },
                { name: 'Band Pull-Aparts', detail: '3×20', xp: 6, posture: true },
            ]
        },
        2: { // Tuesday - LOWER POWER (48hrs since long run - legs recovered for heavy work)
            name: 'LOWER POWER',
            type: 'lift',
            runType: 'rest', // NO RUNNING - save all energy for heavy squats/deads
            runOrder: 'lift_only',
            science: '48hrs post-long run. Heavy compound leg work requires full glycogen + fresh CNS (Bompa & Haff 2009)',
            exercises: [
                { name: 'Barbell Back Squat', detail: '4×6', xp: 18, muscle: ['quads', 'glutes'] },
                { name: 'Romanian Deadlift', detail: '4×8', xp: 15, muscle: ['hamstrings', 'glutes'] },
                { name: 'Leg Press', detail: '4×10', xp: 12, muscle: ['quads'] },
                { name: 'Lying Leg Curl', detail: '3×12', xp: 10, muscle: ['hamstrings'] },
                { name: 'Standing Calf Raises', detail: '4×12', xp: 8, muscle: ['calves'] },
                { name: 'Cable Crunch', detail: '3×15', xp: 8, muscle: ['abs'] },
                { name: 'Glute Bridge Hold', detail: '3×30 sec', xp: 6, posture: true },
            ]
        },
        3: { // Wednesday - UPPER HYPERTROPHY (24hrs post legs - upper focus, easy run optional)
            name: 'UPPER HYPERTROPHY',
            type: 'lift',
            runType: 'easy', // Easy run OK - upper body day, light movement aids recovery
            runOrder: 'lift_first',
            science: 'Upper body focus. Easy run promotes blood flow to recovering legs.',
            exercises: [
                { name: 'Incline Dumbbell Press', detail: '4×10', xp: 12, muscle: ['chest', 'triceps'] },
                { name: 'Cable Lat Pulldown Wide', detail: '4×12', xp: 12, muscle: ['back', 'biceps'] },
                { name: 'Dumbbell Rows', detail: '3×10 each', xp: 10, muscle: ['back'] },
                { name: 'Dumbbell Shoulder Press', detail: '3×12', xp: 10, muscle: ['shoulders'] },
                { name: 'Tricep Rope Pushdown', detail: '3×15', xp: 8, muscle: ['triceps'] },
                { name: 'EZ Bar Curls', detail: '3×12', xp: 8, muscle: ['biceps'] },
                { name: 'Cable Face Pulls', detail: '3×20', xp: 8, muscle: ['shoulders'], posture: true },
            ]
        },
        4: { // Thursday - TEMPO RUN (48hrs since Tuesday legs = quality run possible)
            name: 'TEMPO RUN DAY',
            type: 'cardio',
            runType: 'tempo', // Quality run - 48hrs post leg work, legs recovered
            runOrder: 'run_first',
            science: '48hrs post-legs = recovered for tempo work. Threshold running builds lactate clearance (Bishop et al. 2008)',
            exercises: [
                { name: 'Plank Hold', detail: '3×45 sec', xp: 8, muscle: ['abs'] },
                { name: 'Cable Woodchops', detail: '3×12 each', xp: 8, muscle: ['abs'] },
                { name: 'Hanging Knee Raises', detail: '3×12', xp: 10, muscle: ['abs'] },
                { name: 'Dead Hangs', detail: '3×30 sec', xp: 8, posture: true },
                { name: 'Hip Flexor Stretch', detail: '2 min each', xp: 5, posture: true },
            ]
        },
        5: { // Friday - LOWER HYPERTROPHY (24hrs post tempo - acceptable, tempo was moderate distance)
            name: 'LOWER HYPERTROPHY',
            type: 'lift',
            runType: 'rest', // NO RUNNING - save all energy for volume leg work
            runOrder: 'lift_only',
            science: 'Tempo runs are shorter duration than long runs. 24hr gap acceptable. Volume leg work needs full focus.',
            exercises: [
                { name: 'Trap Bar Deadlift', detail: '4×6', xp: 18, muscle: ['back', 'hamstrings', 'glutes'] },
                { name: 'Bulgarian Split Squat', detail: '3×10 each', xp: 12, muscle: ['quads'] },
                { name: 'Walking Lunges', detail: '3×10 each', xp: 10, muscle: ['quads', 'glutes'] },
                { name: 'Barbell Hip Thrust', detail: '4×12', xp: 12, muscle: ['glutes'] },
                { name: 'Leg Extension', detail: '3×15', xp: 8, muscle: ['quads'] },
                { name: 'Seated Calf Raises', detail: '4×15', xp: 8, muscle: ['calves'] },
                { name: 'Back Extension', detail: '3×12', xp: 8, posture: true },
            ]
        },
        6: { // Saturday - RECOVERY (24hrs post legs - full rest before Sunday long run)
            name: 'RECOVERY + MOBILITY',
            type: 'recovery',
            runType: 'rest', // REST - legs recovering, prepping for Sunday long run
            runOrder: 'recovery_only',
            science: 'Rest day between leg work and long run. Mobility work aids recovery without adding stress.',
            exercises: [
                { name: 'Foam Roll Full Body', detail: '10 min', xp: 10 },
                { name: 'Hip Flexor Stretch', detail: '2 min each', xp: 5, posture: true },
                { name: 'Pigeon Stretch', detail: '2 min each', xp: 5 },
                { name: 'Wall Slides', detail: '3×15', xp: 6, posture: true },
                { name: 'Thoracic Spine Extensions', detail: '2×10', xp: 6, posture: true },
                { name: 'Dead Hangs', detail: '3×30 sec', xp: 8, posture: true },
            ]
        }
    },

    // Daily habits (removed water, sleep, steps per user request)
    HABITS: [
        { id: 'protein', name: 'Hit Protein Goal', xp: 20, skill: 'nutrition' },
        { id: 'reading', name: 'Read 30+ Minutes', xp: 15, skill: 'discipline' },
        { id: 'run_complete', name: 'Complete Run Session', xp: 25, skill: 'strength' },
    ],

    // Alcohol tracking - science-based impacts
    // CITATIONS:
    // - Parr et al. (2014) PLoS ONE: Alcohol ingestion impairs MPS by 37%
    // - Barnes et al. (2010) Eur J Appl Physiol: 24-48h recovery impairment
    // - Ebrahim et al. (2013) Alcohol Clin Exp Res: Sleep architecture disruption
    ALCOHOL: {
        XP_PENALTY: 25,  // Lose XP when drinking
        RECOVERY_IMPACT_HOURS: 48,  // Barnes et al. (2010): 24-48h impairment
        SLEEP_QUALITY_REDUCTION: 0.3,  // Ebrahim et al. (2013): REM suppression
        MUSCLE_PROTEIN_SYNTHESIS_REDUCTION: 0.37,  // Parr et al. (2014): 37% reduction
        WARNINGS: [
            'Alcohol reduces muscle protein synthesis by ~37% (Parr et al. 2014)',
            'Even moderate drinking disrupts REM sleep cycles (Ebrahim et al. 2013)',
            'Dehydration from alcohol impairs next-day performance',
            'Alcohol increases cortisol, hindering recovery (Bianco et al. 2014)',
            'Empty calories: ~7 cal/gram with zero nutritional value',
        ]
    },

    // Running program configuration
    RUNNING: {
        GOALS: [
            { id: '5k', name: '5K', distance: 3.1, weeks: 8, runsPerWeek: 3 },
            { id: '10k', name: '10K', distance: 6.2, weeks: 12, runsPerWeek: 4 },
            { id: 'half', name: 'Half Marathon', distance: 13.1, weeks: 16, runsPerWeek: 4 },
            { id: 'marathon', name: 'Marathon', distance: 26.2, weeks: 20, runsPerWeek: 5 },
            { id: 'casual', name: 'General Fitness', distance: null, weeks: null, runsPerWeek: 3 },
        ],
        // Weekly run structure by goal (coordinated with lifting)
        // Core runs: Long (Sun), Easy (Wed), Tempo (Thu) = 3 runs
        // +1 for 10K+: Easy (Mon, optional)
        // +1 for Marathon: Recovery (Sat, short)
        WEEKLY_RUNS: {
            '5k':      ['long', 'easy', 'tempo'],                           // 3 runs
            '10k':     ['long', 'easy_recovery', 'easy', 'tempo'],          // 4 runs
            'half':    ['long', 'easy_recovery', 'easy', 'tempo'],          // 4 runs  
            'marathon':['long', 'easy_recovery', 'easy', 'tempo', 'easy'], // 5 runs
            'casual':  ['long', 'easy', 'tempo'],                           // 3 runs
        },
        // Research-based injury protocols with actionable routines
        INJURIES: [
            { 
                id: 'tibialis', 
                name: 'Tight Tibialis Anterior',
                distanceMultiplier: 0.9,
                preRun: ['Toe raises: 2×15', 'Ankle circles: 30 sec each'],
                postRun: ['Tibialis stretch against wall: 60 sec', 'Roll shins with stick: 2 min'],
                tip: 'Keep cadence high (170+) to reduce ground contact time'
            },
            { 
                id: 'flat_feet', 
                name: 'Flat Feet / Overpronation',
                distanceMultiplier: 0.85,
                preRun: ['Towel scrunches: 2×20', 'Calf raises (slow): 2×12'],
                postRun: ['Roll arches with lacrosse ball: 2 min each', 'Big toe stretches: 30 sec'],
                tip: 'Stability shoes recommended. Focus on midfoot strike.'
            },
            { 
                id: 'plantar', 
                name: 'Plantar Fasciitis',
                distanceMultiplier: 0.75,
                preRun: ['Frozen water bottle roll: 3 min', 'Calf stretches on step: 45 sec each'],
                postRun: ['Eccentric calf drops: 3×15', 'Plantar stretch: 60 sec each'],
                tip: 'Never run through sharp pain. Morning stiffness = still healing.'
            },
            { 
                id: 'shin_splints', 
                name: 'Shin Splints',
                distanceMultiplier: 0.7,
                preRun: ['Walk on heels: 30 sec', 'Toe walks: 30 sec'],
                postRun: ['Ice shins: 15 min', 'Tibialis raises: 2×20'],
                tip: 'Run on grass/trails. Consider compression sleeves.'
            },
            { 
                id: 'knee', 
                name: 'Knee Pain (Runner\'s Knee)',
                distanceMultiplier: 0.8,
                preRun: ['Quad foam roll: 2 min each', 'Glute activation: 2×10 clamshells'],
                postRun: ['Terminal knee extensions: 2×15', 'Ice if swollen: 15 min'],
                tip: 'Avoid downhills. Shorten stride length by 5-10%.'
            },
            { 
                id: 'it_band', 
                name: 'IT Band Syndrome',
                distanceMultiplier: 0.75,
                preRun: ['Hip circles: 10 each direction', 'Side-lying leg raises: 2×15'],
                postRun: ['Foam roll IT band (gently): 2 min each', 'Pigeon stretch: 60 sec each'],
                tip: 'Don\'t run on cambered roads. Strengthen glute medius.'
            },
        ],
        // Training phases for periodization
        PHASES: {
            base: { name: 'Base Building', description: 'Build aerobic foundation', easyPercent: 90, weeks: 4 },
            build: { name: 'Build Phase', description: 'Increase volume and add tempo', easyPercent: 80, weeks: 4 },
            peak: { name: 'Peak Phase', description: 'Race-specific workouts', easyPercent: 75, weeks: 3 },
            taper: { name: 'Taper', description: 'Reduce volume, maintain intensity', easyPercent: 85, weeks: 2 },
        },
        // Heart rate zones (% of max HR)
        HR_ZONES: [
            { zone: 1, name: 'Recovery', min: 50, max: 60, description: 'Very easy, recovery' },
            { zone: 2, name: 'Easy', min: 60, max: 70, description: 'Conversational pace' },
            { zone: 3, name: 'Aerobic', min: 70, max: 80, description: 'Moderate effort' },
            { zone: 4, name: 'Threshold', min: 80, max: 90, description: 'Comfortably hard' },
            { zone: 5, name: 'VO2max', min: 90, max: 100, description: 'Max effort' },
        ],
        // VDOT tables (Daniels' Running Formula) - maps VDOT to training paces
        VDOT_PACES: {
            30: { easy: '12:40', marathon: '11:30', tempo: '10:30', interval: '9:30', repetition: '9:00', race5k: '32:00' },
            35: { easy: '11:15', marathon: '10:10', tempo: '9:15', interval: '8:20', repetition: '7:55', race5k: '27:30' },
            40: { easy: '10:05', marathon: '9:05', tempo: '8:15', interval: '7:25', repetition: '7:00', race5k: '24:00' },
            45: { easy: '9:10', marathon: '8:15', tempo: '7:30', interval: '6:45', repetition: '6:20', race5k: '21:15' },
            50: { easy: '8:25', marathon: '7:30', tempo: '6:55', interval: '6:10', repetition: '5:50', race5k: '19:00' },
            55: { easy: '7:50', marathon: '7:00', tempo: '6:25', interval: '5:45', repetition: '5:25', race5k: '17:15' },
            60: { easy: '7:20', marathon: '6:35', tempo: '6:00', interval: '5:20', repetition: '5:00', race5k: '15:45' },
        },
        // Base weekly structure - SCIENCE-BASED COORDINATION
        // Key: 48hr minimum between leg work and ALL hard runs (long runs ARE hard for developing runners)
        // Citations: Hickson 1980, Wilson et al. 2012, Bishop et al. 2008, Bompa & Haff 2009
        BASE_WEEK: [
            { 
                day: 'Sun', type: 'long', description: 'Long Run', 
                liftType: 'Long Run Day',
                order: 'run_first',
                orderReason: '48hrs after Friday legs - fresh legs for long run',
                science: 'Long runs need recovered legs. Saturday rest = 48hr buffer from Friday leg work.'
            },
            { 
                day: 'Mon', type: 'easy', description: 'Easy Run (Optional)', 
                liftType: 'Upper Strength',
                order: 'lift_first',
                optional: true, // For 10K+ training add this run; for 5K/casual can skip
                orderReason: 'Post long-run: easy run aids recovery. Skip if fatigued.',
                science: 'Easy running promotes blood flow to recovering legs. Skip if DOMS is severe.'
            },
            { 
                day: 'Tue', type: 'rest', description: 'Rest - Leg Day', 
                liftType: 'Lower Power',
                order: 'lift_only',
                orderReason: '48hrs post long run - heavy leg day, NO running',
                science: 'Squats/deads require full glycogen + fresh CNS. 48hrs post-long run = recovered.'
            },
            { 
                day: 'Wed', type: 'easy', description: 'Easy Run', 
                liftType: 'Upper Hypertrophy',
                order: 'lift_first',
                orderReason: 'Upper body day - easy run aids leg recovery from Tuesday',
                science: '24hrs post-legs: easy running promotes blood flow without impeding recovery.'
            },
            { 
                day: 'Thu', type: 'tempo', description: 'Tempo Run', 
                liftType: 'Tempo Run Day',
                order: 'run_first',
                orderReason: '48hrs post Tuesday legs - quality run possible',
                science: 'Threshold running needs recovered legs. 48hr window allows quality work (Bishop et al. 2008).'
            },
            { 
                day: 'Fri', type: 'rest', description: 'Rest - Leg Day', 
                liftType: 'Lower Hypertrophy',
                order: 'lift_only',
                orderReason: '24hrs post-tempo OK (tempo is short). Volume leg day - NO running.',
                science: 'Tempo runs are shorter duration. 24hr gap acceptable for leg work.'
            },
            { 
                day: 'Sat', type: 'rest', description: 'Recovery', 
                liftType: 'Recovery + Mobility',
                order: 'recovery_only',
                orderReason: 'Rest day - legs recovering, prep for Sunday long run',
                science: 'Buffer day between leg work and long run. Mobility aids recovery.'
            },
        ]
    },

    // Exercise variations for cycling (swap options)
    EXERCISE_VARIATIONS: {
        'Flat Barbell Bench Press': ['Dumbbell Bench Press', 'Machine Chest Press', 'Floor Press'],
        'Lat Pulldown': ['Pull-ups', 'Cable Pulldown Close Grip', 'Assisted Pull-ups'],
        'Seated Cable Row': ['Dumbbell Rows', 'Machine Row', 'T-Bar Row'],
        'Barbell Back Squat': ['Goblet Squat', 'Leg Press', 'Smith Machine Squat'],
        'Romanian Deadlift': ['Stiff Leg Deadlift', 'Single Leg RDL', 'Good Mornings'],
        'Leg Press': ['Hack Squat', 'Belt Squat', 'Smith Machine Squat'],
        'Incline Dumbbell Press': ['Incline Barbell Press', 'Incline Machine Press', 'Cable Flyes'],
        'Trap Bar Deadlift': ['Conventional Deadlift', 'Sumo Deadlift', 'Rack Pulls'],
        'Bulgarian Split Squat': ['Leg Press', 'Hack Squat', 'Goblet Squat'],
        'Walking Lunges': ['Reverse Lunges', 'Step Ups', 'Split Squat'],
        'Barbell Hip Thrust': ['Hip Thrust Machine', 'Glute Bridge', 'Cable Pull Through'],
        'Back Extension': ['Reverse Hyper', 'Good Mornings', 'Superman Hold'],
    },

    // Muscle group mappings for volume tracking
    MUSCLE_GROUPS: {
        chest: [
            'Flat Barbell Bench Press', 'Dumbbell Bench Press', 'Machine Chest Press', 
            'Floor Press', 'Incline Dumbbell Press', 'Incline Barbell Press', 
            'Incline Machine Press', 'Cable Flyes', 'Cable Crossover'
        ],
        back: [
            'Lat Pulldown', 'Pull-ups', 'Cable Pulldown Close Grip', 'Cable Lat Pulldown Wide',
            'Assisted Pull-ups', 'Seated Cable Row', 'Dumbbell Rows', 'Machine Row', 'T-Bar Row',
            'Trap Bar Deadlift', 'Conventional Deadlift', 'Sumo Deadlift', 'Rack Pulls',
            'Back Extension', 'Reverse Hyper'
        ],
        shoulders: [
            'Cable Face Pulls', 'Dumbbell Lateral Raises', 'Reverse Pec Deck',
            'Machine Shoulder Press', 'Dumbbell Shoulder Press', 'Band Pull-Aparts'
        ],
        biceps: [
            // Direct biceps work only - compound pulls don't count here
            'Barbell Curls', 'Dumbbell Curls', 'Cable Curls', 'Hammer Curls', 'EZ Bar Curls'
        ],
        triceps: [
            // Direct triceps work only - compound presses don't count here
            'Tricep Rope Pushdown', 'Tricep Pushdown', 'Cable Tricep Extension', 
            'Close Grip Bench', 'Dips', 'Overhead Tricep Extension', 'Skull Crushers'
        ],
        quads: [
            'Barbell Back Squat', 'Goblet Squat', 'Leg Press', 'Smith Machine Squat',
            'Hack Squat', 'Leg Extension', 'Walking Lunges', 'Bulgarian Split Squat',
            'Reverse Lunges', 'Step Ups', 'Split Squat'
        ],
        hamstrings: [
            'Romanian Deadlift', 'Stiff Leg Deadlift', 'Single Leg RDL', 'Good Mornings',
            'Lying Leg Curl', 'Seated Leg Curl', 'Trap Bar Deadlift', 'Conventional Deadlift'
        ],
        glutes: [
            'Barbell Hip Thrust', 'Hip Thrust Machine', 'Glute Kickback', 'Cable Pull Through',
            'Romanian Deadlift', 'Barbell Back Squat', 'Walking Lunges', 'Bulgarian Split Squat',
            'Glute Bridge Hold', 'Glute Bridge'
        ],
        calves: [
            'Standing Calf Raises', 'Seated Calf Raises'
        ],
        abs: [
            'Cable Crunch', 'Plank Hold', 'Cable Woodchops', 'Hanging Knee Raises',
            'Ab Crunch Machine'
        ]
    },

    // Posture exercises - for tracking and awareness
    POSTURE_EXERCISES: [
        'Cable Face Pulls', 'Reverse Pec Deck', 'Band Pull-Aparts',
        'Dead Hangs', 'Wall Slides', 'Thoracic Spine Extensions',
        'Hip Flexor Stretch', 'Glute Bridge Hold', 'Back Extension', 'Reverse Hyper'
    ],

    // Physique priorities - user can select lagging areas
    PHYSIQUE_PRIORITIES: [
        { id: 'chest', name: 'Chest', description: 'Build a fuller chest' },
        { id: 'back', name: 'Back Width', description: 'Wider lats and V-taper' },
        { id: 'shoulders', name: 'Shoulders', description: 'Capped delts for width' },
        { id: 'arms', name: 'Arms', description: 'Bigger biceps and triceps' },
        { id: 'quads', name: 'Quads', description: 'Leg size and definition' },
        { id: 'glutes', name: 'Glutes', description: 'Stronger, rounder glutes' },
        { id: 'posture', name: 'Posture', description: 'Fix rounded shoulders, forward head' },
    ],

    // Posture issues and corrections
    POSTURE_ISSUES: [
        { 
            id: 'forward_head', 
            name: 'Forward Head Posture',
            description: 'Head sits forward of shoulders',
            corrections: ['Dead Hangs', 'Wall Slides', 'Thoracic Spine Extensions'],
            focus: ['Upper back strength', 'Neck retraction']
        },
        { 
            id: 'rounded_shoulders', 
            name: 'Rounded Shoulders',
            description: 'Shoulders roll forward, chest caves',
            corrections: ['Cable Face Pulls', 'Band Pull-Aparts', 'Reverse Pec Deck'],
            focus: ['Rear delts', 'External rotation', 'Scapular retraction']
        },
        { 
            id: 'anterior_pelvic_tilt', 
            name: 'Anterior Pelvic Tilt',
            description: 'Hips tilt forward, lower back arches',
            corrections: ['Hip Flexor Stretch', 'Glute Bridge Hold', 'Plank Hold'],
            focus: ['Hip flexor mobility', 'Glute activation', 'Core bracing']
        },
        { 
            id: 'kyphosis', 
            name: 'Upper Back Kyphosis',
            description: 'Excessive rounding of upper back',
            corrections: ['Thoracic Spine Extensions', 'Wall Slides', 'Dead Hangs'],
            focus: ['Thoracic extension', 'Lat stretching']
        },
    ],

    // Volume landmarks (sets per week per muscle group) - based on Renaissance Periodization research
    // MEV = Minimum Effective Volume (maintain/slow progress)
    // MAV = Maximum Adaptive Volume (sweet spot for gains)
    // MRV = Maximum Recoverable Volume (beyond = overtraining risk)
    // VOLUME LANDMARKS - sets per muscle group per week
    // CITATION: Schoenfeld et al. (2017) J Sports Sci - dose-response relationship
    //           10-20 sets/week optimal for hypertrophy
    //           Israetel et al. (2019) - MEV/MAV/MRV framework
    VOLUME_LANDMARKS: {
        chest:     { MEV: 8,  MAV: 14, MRV: 20 },  // Responds well to moderate volume
        back:      { MEV: 8,  MAV: 16, MRV: 25 },  // Can handle high volume, many muscles
        shoulders: { MEV: 6,  MAV: 14, MRV: 22 },  // Delts recover well
        quads:     { MEV: 6,  MAV: 14, MRV: 20 },  // High fatigue per set
        hamstrings:{ MEV: 4,  MAV: 10, MRV: 16 },  // Lower volume needed
        glutes:    { MEV: 4,  MAV: 12, MRV: 18 },  // Often hit by compounds
        biceps:    { MEV: 4,  MAV: 10, MRV: 18 },  // Small muscle, recovers fast
        triceps:   { MEV: 4,  MAV: 10, MRV: 18 },  // Small muscle, hit by pressing
        core:      { MEV: 4,  MAV: 10, MRV: 16 },  // Stabilizers, recover fast
        // Default fallback for unlisted groups
        default:   { MEV: 6,  MAV: 14, MRV: 20 }
    },

    // Levels and XP thresholds - DESIGNED TO BE A GRIND
    // Expected ~80-120 XP/day with consistent effort
    // Level 5 should take ~3 weeks, Level 10 should take ~6 months
    LEVELS: [
        { level: 1, title: 'INITIATE', xp: 0, reward: 'Welcome to the grind' },
        { level: 2, title: 'NOVICE', xp: 300, reward: 'Streak multipliers unlocked' },
        { level: 3, title: 'APPRENTICE', xp: 800, reward: 'Advanced stats unlocked' },
        { level: 4, title: 'ADEPT', xp: 1500, reward: 'PR tracking bonus +25%' },
        { level: 5, title: 'EXPERT', xp: 2500, reward: 'Custom workout unlocks' },
        { level: 6, title: 'VETERAN', xp: 4000, reward: 'Elite analytics unlocked' },
        { level: 7, title: 'MASTER', xp: 6000, reward: 'Double protein XP bonus' },
        { level: 8, title: 'ELITE', xp: 9000, reward: 'Streak protection (1 miss forgiven/week)' },
        { level: 9, title: 'CHAMPION', xp: 13000, reward: 'Legacy mode unlocked' },
        { level: 10, title: 'LEGEND', xp: 20000, reward: 'You made it. True discipline.' },
    ],

    // Streak multipliers
    STREAK_MULTIPLIERS: [
        { days: 0, multiplier: 1.0 },
        { days: 3, multiplier: 1.1 },
        { days: 7, multiplier: 1.25 },
        { days: 14, multiplier: 1.5 },
        { days: 30, multiplier: 2.0 },
    ],

    // Skill trees
    SKILL_TREES: {
        strength: {
            name: 'STRENGTH',
            icon: 'I',
            nodes: [
                { name: 'Foundation', xpRequired: 0 },
                { name: 'Compound', xpRequired: 150 },
                { name: 'Progressive', xpRequired: 400 },
                { name: 'Advanced', xpRequired: 800 },
                { name: 'Elite', xpRequired: 1500 },
            ]
        },
        discipline: {
            name: 'DISCIPLINE',
            icon: 'II',
            nodes: [
                { name: 'Beginner', xpRequired: 0 },
                { name: 'Consistent', xpRequired: 200 },
                { name: 'Dedicated', xpRequired: 500 },
                { name: 'Relentless', xpRequired: 1000 },
                { name: 'Unstoppable', xpRequired: 2000 },
            ]
        },
        nutrition: {
            name: 'NUTRITION',
            icon: 'III',
            nodes: [
                { name: 'Tracker', xpRequired: 0 },
                { name: 'Aware', xpRequired: 100 },
                { name: 'Optimized', xpRequired: 300 },
                { name: 'Precision', xpRequired: 600 },
                { name: 'Master', xpRequired: 1200 },
            ]
        },
        recovery: {
            name: 'RECOVERY',
            icon: 'IV',
            nodes: [
                { name: 'Rest', xpRequired: 0 },
                { name: 'Sleep', xpRequired: 100 },
                { name: 'Restore', xpRequired: 250 },
                { name: 'Optimize', xpRequired: 500 },
                { name: 'Peak', xpRequired: 1000 },
            ]
        }
    },

    // Accountability settings
    ACCOUNTABILITY: {
        XP_DECAY_PER_MISSED_DAY: 15,
        DEBT_CLEAR_BONUS: 25,
        MAX_DEBT_ITEMS: 3,
        SCORE_LOOKBACK_DAYS: 14,
        SCORE_PENALTY_PER_FAIL: 5,
    },

    // Exercise alternatives - swap for similar movements when equipment unavailable
    EXERCISE_ALTERNATIVES: {
        'Dumbbell Rows': ['Seated Cable Row', 'Machine Row', 'T-Bar Row'],
        'Flat Barbell Bench Press': ['Dumbbell Bench Press', 'Machine Chest Press', 'Smith Machine Bench'],
        'Incline Dumbbell Press': ['Incline Barbell Press', 'Incline Machine Press', 'Cable Flyes'],
        'Lat Pulldown': ['Pull-Ups', 'Assisted Pull-Ups', 'Cable Pullover'],
        'Cable Lat Pulldown Wide': ['Wide Grip Pull-Ups', 'Lat Pulldown', 'Straight Arm Pulldown'],
        'Seated Cable Row': ['Dumbbell Rows', 'Machine Row', 'Barbell Row'],
        'Barbell Back Squat': ['Leg Press', 'Hack Squat', 'Goblet Squat', 'Smith Machine Squat'],
        'Romanian Deadlift': ['Stiff Leg Deadlift', 'Good Mornings', 'Cable Pull Through'],
        'Dumbbell Shoulder Press': ['Machine Shoulder Press', 'Arnold Press', 'Barbell OHP'],
        'Tricep Rope Pushdown': ['Overhead Tricep Extension', 'Close Grip Bench', 'Skull Crushers'],
        'EZ Bar Curls': ['Dumbbell Curls', 'Cable Curls', 'Hammer Curls'],
        'Cable Face Pulls': ['Band Face Pulls', 'Reverse Pec Deck', 'Rear Delt Flyes'],
        'Barbell Hip Thrust': ['Hip Thrust Machine', 'Glute Bridge', 'Cable Pull Through'],
        'Trap Bar Deadlift': ['Conventional Deadlift', 'Sumo Deadlift', 'Rack Pulls'],
        'Leg Press': ['Hack Squat', 'Smith Machine Squat', 'Goblet Squat'],
        'Walking Lunges': ['Reverse Lunges', 'Bulgarian Split Squat', 'Step Ups'],
        'Bulgarian Split Squat': ['Walking Lunges', 'Reverse Lunges', 'Leg Press'],
        'Back Extension': ['Reverse Hyper', 'Good Mornings', 'Superman Hold'],
    },

    // XP Rewards for various actions - BALANCED FOR GRIND
    // Target: ~80-120 XP/day with perfect execution
    XP_REWARDS: {
        // Daily tracking (max ~15 XP/day)
        LOG_WEIGHT: 5,                // Logging daily weight
        
        // Food logging (max ~15 XP/day)
        AI_FOOD_LOG: 3,               // Per meal logged via AI
        LEUCINE_THRESHOLD_HIT: 2,     // Bonus for hitting leucine threshold
        PROTEIN_GOAL_HIT: 10,         // Daily protein goal
        CALORIE_TARGET_HIT: 5,        // Staying within calorie target
        
        // Running (max ~25 XP/day on run days)
        RUN_COMPLETE: 15,             // Completing a run
        RUN_TEMPO: 25,                // Tempo/hard run bonus
        RUN_LONG: 30,                 // Long run bonus
        
        // Lifting (max ~60-80 XP/day from exercises)
        PR_BONUS: 30,                 // Personal record (rare, big reward)
        WORKOUT_COMPLETE: 15,         // Completing full workout
        
        // Reading (max ~15 XP/day)
        READING_SESSION: 8,           // Per reading session
        BOOK_COMPLETE: 40,            // Finishing a book
        
        // Streaks (one-time bonuses at milestones)
        STREAK_3_DAY: 10,
        STREAK_7_DAY: 25,
        STREAK_14_DAY: 50,
        STREAK_30_DAY: 100,
        
        // Penalties
        ALCOHOL_PENALTY: -20,         // Per drink
        MISSED_DAY_PENALTY: -25,      // Per missed day (hurts more than before)
    },

    // Logging presets
    LOGGING_PRESETS: {
        protein: [25, 30, 40, 50, 20, 10],
        calories: [300, 500, 700],
        sleep: [6, 6.5, 7, 7.5, 8, 8.5],
    },
};

// Freeze to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.WORKOUTS);
Object.freeze(CONFIG.HABITS);
Object.freeze(CONFIG.LEVELS);
Object.freeze(CONFIG.STREAK_MULTIPLIERS);
Object.freeze(CONFIG.SKILL_TREES);


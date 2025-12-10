/**
 * INJURY-INTELLIGENCE.JS
 * Built-in Physical Therapist
 * 
 * Tracks pain patterns over time, detects developing injuries,
 * adjusts training automatically, and provides recovery protocols.
 * 
 * RESEARCH SOURCES:
 * - Hreljac, A. (2004). Impact and overuse injuries in runners. Medicine & Science in Sports & Exercise.
 * - van Gent, R.N. et al. (2007). Incidence and determinants of lower extremity running injuries. British Journal of Sports Medicine.
 * - Taunton, J.E. et al. (2002). A retrospective case-control analysis of 2002 running injuries. British Journal of Sports Medicine.
 * - Fredericson, M. & Wolf, C. (2005). Iliotibial band syndrome in runners. Sports Medicine.
 * - Alfredson, H. et al. (1998). Heavy-load eccentric calf muscle training for the treatment of chronic Achilles tendinosis. American Journal of Sports Medicine.
 */

const InjuryIntelligence = {
    
    // XP rewards for completing recovery exercises
    RECOVERY_XP: {
        exercise: 5,      // Per exercise completed
        fullProtocol: 15, // Completing all daily exercises
        consistency: 25,  // 7-day streak of recovery work
    },
    
    // ==========================================
    // COMPREHENSIVE INJURY DATABASE
    // ==========================================
    
    INJURIES: {
        // FOOT & ANKLE
        plantar_fasciitis: {
            name: 'Plantar Fasciitis',
            description: 'Inflammation of the plantar fascia - band connecting heel to toes',
            earlySignals: ['foot_arch', 'heel'],
            progressionSignals: ['heel', 'foot_arch', 'calf'],
            riskFactors: ['sudden_mileage_increase', 'hard_surfaces', 'worn_shoes', 'tight_calves'],
            commonTriggers: ['long', 'tempo'], // Run types that often trigger it
            severity: {
                mild: { days: 1, occurrences: 2 },
                moderate: { days: 7, occurrences: 4 },
                severe: { days: 14, occurrences: 6 }
            },
            recovery: {
                mild: {
                    mileageReduction: 0.1, // 10% reduction
                    avoidTypes: [],
                    exercises: ['plantar_roll', 'calf_stretch', 'towel_scrunch'],
                    message: 'Early signs of plantar stress. Add arch rolling before runs.'
                },
                moderate: {
                    mileageReduction: 0.3,
                    avoidTypes: ['tempo', 'intervals'],
                    exercises: ['plantar_roll', 'calf_stretch', 'eccentric_calf_drops', 'arch_strengthening'],
                    message: 'Plantar fasciitis developing. Reduce intensity, focus on recovery.'
                },
                severe: {
                    mileageReduction: 0.5,
                    avoidTypes: ['tempo', 'intervals', 'long'],
                    exercises: ['plantar_roll', 'night_splint', 'ice_massage', 'professional_evaluation'],
                    message: 'Significant plantar issue. Consider seeing a PT. Easy running only.'
                }
            }
        },
        
        achilles_tendinitis: {
            name: 'Achilles Tendinitis',
            description: 'Inflammation or degeneration of the Achilles tendon',
            earlySignals: ['achilles', 'calf'],
            progressionSignals: ['achilles', 'calf', 'heel'],
            riskFactors: ['sudden_intensity_increase', 'hill_running', 'worn_shoes', 'tight_calves'],
            commonTriggers: ['tempo', 'intervals', 'hills'],
            severity: {
                mild: { days: 1, occurrences: 2 },
                moderate: { days: 5, occurrences: 3 },
                severe: { days: 10, occurrences: 5 }
            },
            recovery: {
                mild: {
                    mileageReduction: 0.15,
                    avoidTypes: ['intervals'],
                    exercises: ['eccentric_heel_drops', 'calf_stretch', 'ankle_mobility'],
                    message: 'Achilles showing stress. Start eccentric heel drops daily.'
                },
                moderate: {
                    mileageReduction: 0.4,
                    avoidTypes: ['tempo', 'intervals'],
                    exercises: ['eccentric_heel_drops', 'calf_foam_roll', 'ice_post_run', 'compression'],
                    message: 'Achilles tendinitis developing. This can become chronic - take it seriously.'
                },
                severe: {
                    mileageReduction: 0.7,
                    avoidTypes: ['tempo', 'intervals', 'long'],
                    exercises: ['rest', 'eccentric_protocol', 'professional_evaluation'],
                    message: 'Stop running. Achilles injuries can rupture if ignored. See a PT.'
                }
            }
        },
        
        shin_splints: {
            name: 'Shin Splints (MTSS)',
            description: 'Medial tibial stress syndrome - pain along the shinbone',
            earlySignals: ['shin'],
            progressionSignals: ['shin', 'calf', 'ankle'],
            riskFactors: ['beginner', 'sudden_mileage_increase', 'hard_surfaces', 'overpronation'],
            commonTriggers: ['long', 'intervals'],
            severity: {
                mild: { days: 1, occurrences: 3 },
                moderate: { days: 7, occurrences: 5 },
                severe: { days: 14, occurrences: 7 }
            },
            recovery: {
                mild: {
                    mileageReduction: 0.2,
                    avoidTypes: [],
                    exercises: ['calf_raises', 'toe_walks', 'foam_roll_calves'],
                    message: 'Shin discomfort detected. Strengthen lower legs and check your shoes.'
                },
                moderate: {
                    mileageReduction: 0.4,
                    avoidTypes: ['intervals'],
                    exercises: ['ice_shins', 'compression_sleeves', 'soft_surface_only', 'gait_analysis'],
                    message: 'Shin splints developing. Run on grass/trails, avoid concrete.'
                },
                severe: {
                    mileageReduction: 0.6,
                    avoidTypes: ['intervals', 'tempo'],
                    exercises: ['rest', 'cross_train_only', 'professional_evaluation'],
                    message: 'Shin splints can lead to stress fractures. Consider a bone scan if pain persists.'
                }
            }
        },
        
        runners_knee: {
            name: "Runner's Knee (PFPS)",
            description: 'Patellofemoral pain syndrome - pain around/behind kneecap',
            earlySignals: ['knee'],
            progressionSignals: ['knee', 'quad', 'it_band'],
            riskFactors: ['weak_glutes', 'weak_quads', 'overpronation', 'downhill_running'],
            commonTriggers: ['long', 'downhill'],
            severity: {
                mild: { days: 1, occurrences: 2 },
                moderate: { days: 7, occurrences: 4 },
                severe: { days: 14, occurrences: 6 }
            },
            recovery: {
                mild: {
                    mileageReduction: 0.1,
                    avoidTypes: [],
                    exercises: ['quad_strengthening', 'glute_bridges', 'foam_roll_quads'],
                    message: 'Knee showing signs of stress. Strengthen quads and glutes.'
                },
                moderate: {
                    mileageReduction: 0.3,
                    avoidTypes: ['long'],
                    exercises: ['single_leg_squats', 'step_downs', 'patella_taping', 'avoid_stairs'],
                    message: "Runner's knee developing. Avoid downhill running and long runs temporarily."
                },
                severe: {
                    mileageReduction: 0.5,
                    avoidTypes: ['long', 'tempo'],
                    exercises: ['rest', 'pt_evaluation', 'quad_strengthening_protocol'],
                    message: 'Significant knee pain. Get evaluated - could need specific rehab protocol.'
                }
            }
        },
        
        it_band_syndrome: {
            name: 'IT Band Syndrome',
            description: 'Iliotibial band friction syndrome - pain on outer knee',
            earlySignals: ['it_band'],
            progressionSignals: ['it_band', 'knee', 'hip'],
            riskFactors: ['weak_hip_abductors', 'excessive_camber', 'sudden_mileage_increase'],
            commonTriggers: ['long', 'downhill'],
            severity: {
                mild: { days: 1, occurrences: 2 },
                moderate: { days: 5, occurrences: 3 },
                severe: { days: 10, occurrences: 5 }
            },
            recovery: {
                mild: {
                    mileageReduction: 0.2,
                    avoidTypes: [],
                    exercises: ['it_band_foam_roll', 'hip_strengthening', 'clamshells'],
                    message: 'IT band tightness detected. Foam roll daily and strengthen hips.'
                },
                moderate: {
                    mileageReduction: 0.4,
                    avoidTypes: ['long'],
                    exercises: ['it_band_foam_roll', 'hip_strengthening', 'side_lying_leg_raises', 'avoid_camber'],
                    message: 'IT band syndrome developing. Shorten runs, strengthen hip abductors.'
                },
                severe: {
                    mileageReduction: 0.6,
                    avoidTypes: ['long', 'tempo'],
                    exercises: ['rest', 'aggressive_foam_rolling', 'glute_activation', 'pt_evaluation'],
                    message: 'IT band is inflamed. May need 1-2 weeks off running to reset.'
                }
            }
        },
        
        hip_flexor_strain: {
            name: 'Hip Flexor Strain',
            description: 'Strain of the iliopsoas or rectus femoris muscles',
            earlySignals: ['hip_flexor'],
            progressionSignals: ['hip_flexor', 'hip', 'quad'],
            riskFactors: ['sitting_job', 'weak_core', 'overstriding'],
            commonTriggers: ['intervals', 'tempo'],
            severity: {
                mild: { days: 1, occurrences: 2 },
                moderate: { days: 5, occurrences: 4 },
                severe: { days: 10, occurrences: 6 }
            },
            recovery: {
                mild: {
                    mileageReduction: 0.1,
                    avoidTypes: [],
                    exercises: ['hip_flexor_stretch', 'core_work', 'glute_activation'],
                    message: 'Hip flexor tightness. Stretch daily and work on core stability.'
                },
                moderate: {
                    mileageReduction: 0.3,
                    avoidTypes: ['intervals'],
                    exercises: ['active_hip_flexor_stretch', 'psoas_release', 'core_stability'],
                    message: 'Hip flexor strain developing. Ease off speed work temporarily.'
                },
                severe: {
                    mileageReduction: 0.5,
                    avoidTypes: ['intervals', 'tempo'],
                    exercises: ['rest', 'gentle_stretching', 'professional_evaluation'],
                    message: 'Hip flexor strain needs rest. Speed work is out until resolved.'
                }
            }
        },
        
        hamstring_strain: {
            name: 'Hamstring Strain',
            description: 'Strain or microtears in the hamstring muscles',
            earlySignals: ['hamstring'],
            progressionSignals: ['hamstring', 'glute', 'knee'],
            riskFactors: ['speed_work', 'inadequate_warmup', 'weak_hamstrings'],
            commonTriggers: ['intervals', 'tempo'],
            severity: {
                mild: { days: 1, occurrences: 2 },
                moderate: { days: 7, occurrences: 3 },
                severe: { days: 14, occurrences: 4 }
            },
            recovery: {
                mild: {
                    mileageReduction: 0.15,
                    avoidTypes: ['intervals'],
                    exercises: ['hamstring_stretch', 'nordic_curls', 'foam_roll'],
                    message: 'Hamstring tightness. Focus on eccentric strengthening.'
                },
                moderate: {
                    mileageReduction: 0.4,
                    avoidTypes: ['intervals', 'tempo'],
                    exercises: ['gentle_hamstring_work', 'no_speed_work', 'progressive_loading'],
                    message: 'Hamstring strain present. No speed work until pain-free for 1 week.'
                },
                severe: {
                    mileageReduction: 0.7,
                    avoidTypes: ['intervals', 'tempo', 'long'],
                    exercises: ['rest', 'progressive_rehab', 'professional_evaluation'],
                    message: 'Hamstring strain is significant. Running could make it worse. Rest and rehab.'
                }
            }
        },
        
        lower_back_pain: {
            name: 'Lower Back Pain',
            description: 'Pain in the lumbar region, often from weak core or tight hips',
            earlySignals: ['lower_back'],
            progressionSignals: ['lower_back', 'hip', 'glute'],
            riskFactors: ['weak_core', 'tight_hip_flexors', 'excessive_mileage'],
            commonTriggers: ['long'],
            severity: {
                mild: { days: 1, occurrences: 2 },
                moderate: { days: 7, occurrences: 4 },
                severe: { days: 14, occurrences: 6 }
            },
            recovery: {
                mild: {
                    mileageReduction: 0.1,
                    avoidTypes: [],
                    exercises: ['core_stability', 'hip_flexor_stretch', 'glute_bridges'],
                    message: 'Back tightness after runs. Strengthen core and stretch hip flexors.'
                },
                moderate: {
                    mileageReduction: 0.25,
                    avoidTypes: ['long'],
                    exercises: ['cat_cow', 'bird_dog', 'dead_bug', 'reduce_sitting'],
                    message: 'Lower back pain developing. Focus on core stability work.'
                },
                severe: {
                    mileageReduction: 0.5,
                    avoidTypes: ['long', 'tempo'],
                    exercises: ['rest', 'gentle_movement', 'professional_evaluation'],
                    message: 'Back pain is significant. Rule out disc issues with a professional.'
                }
            }
        }
    },
    
    // ==========================================
    // RECOVERY EXERCISES DATABASE (Research-Backed)
    // ==========================================
    
    EXERCISES: {
        // PLANTAR FASCIITIS - DiGiovanni et al. (2003) showed tissue-specific stretching superior to standard stretching
        plantar_roll: { 
            name: 'Plantar Fascia Roll', 
            description: 'Roll foot on frozen water bottle or lacrosse ball, 2 min each foot',
            frequency: 'Morning + before runs',
            xp: 5,
            science: 'Breaks up adhesions and increases blood flow to fascia'
        },
        towel_scrunch: { 
            name: 'Towel Scrunches', 
            description: 'Scrunch towel with toes, 3 sets of 20',
            frequency: 'Daily',
            xp: 5,
            science: 'Strengthens intrinsic foot muscles that support the arch'
        },
        plantar_stretch: {
            name: 'Plantar Fascia Stretch',
            description: 'Cross leg, pull toes back toward shin, hold 30 sec. 10 reps before first steps.',
            frequency: 'Before getting out of bed',
            xp: 5,
            science: 'DiGiovanni (2003): 52% improvement vs 22% with Achilles stretching alone'
        },
        
        // ACHILLES - Alfredson Protocol (1998) - gold standard for Achilles tendinopathy
        eccentric_heel_drops: { 
            name: 'Alfredson Eccentric Heel Drops', 
            description: 'Stand on step edge, raise on good leg, lower SLOWLY on injured leg. 3x15, twice daily.',
            frequency: '2x daily for 12 weeks',
            xp: 8,
            science: 'Alfredson (1998): 89% of patients returned to pre-injury activity levels'
        },
        calf_stretch_gastric: {
            name: 'Gastrocnemius Stretch',
            description: 'Wall stretch with back knee straight, 30 sec holds, 3 reps each side',
            frequency: 'Before & after runs',
            xp: 3,
            science: 'Targets the outer calf muscle that connects to Achilles'
        },
        calf_stretch_soleus: {
            name: 'Soleus Stretch',
            description: 'Wall stretch with back knee BENT, 30 sec holds, 3 reps each side',
            frequency: 'Before & after runs',
            xp: 3,
            science: 'Targets deeper calf muscle - often neglected but crucial for Achilles health'
        },
        
        // IT BAND - Fredericson & Wolf (2005) showed hip abductor strengthening key
        it_band_foam_roll: { 
            name: 'IT Band & TFL Foam Roll', 
            description: 'Roll from hip to just above knee, 2-3 min each side. Pause on tender spots.',
            frequency: 'Daily, especially post-run',
            xp: 5,
            science: 'Reduces fascial adhesions. Roll the TFL (hip) not just the IT band itself.'
        },
        hip_abductor_strengthen: {
            name: 'Hip Abductor Circuit',
            description: 'Clamshells (3x15) + Side-lying leg raises (3x15) + Standing hip abduction (3x12)',
            frequency: 'Daily during flare, 3x/week maintenance',
            xp: 10,
            science: 'Fredericson (2000): 6-week hip program resolved ITBS in 92% of runners'
        },
        single_leg_balance: {
            name: 'Single Leg Balance',
            description: 'Stand on one leg 60 sec, progress to eyes closed, then on pillow',
            frequency: 'Daily',
            xp: 3,
            science: 'Improves hip stability and proprioception'
        },
        
        // RUNNER\'S KNEE - Powers (2003) emphasized VMO and glute strengthening
        quad_sets: {
            name: 'Quad Sets (VMO Focus)',
            description: 'Seated, tighten quad pushing knee down, hold 10 sec. 3x20.',
            frequency: 'Daily',
            xp: 5,
            science: 'Targets VMO (inner quad) which controls patellar tracking'
        },
        step_downs: { 
            name: 'Slow Step Downs', 
            description: 'Stand on step, slowly lower opposite heel to ground. 3x10 each leg.',
            frequency: 'Daily',
            xp: 8,
            science: 'Eccentric quad loading - more effective than concentric for PFPS'
        },
        glute_bridges: { 
            name: 'Glute Bridges', 
            description: 'Squeeze glutes at top, hold 3 sec. Progress to single leg. 3x12.',
            frequency: 'Daily',
            xp: 5,
            science: 'Weak glutes cause knee valgus (caving) which worsens PFPS'
        },
        
        // SHIN SPLINTS - Winters et al. (2004) toe walking protocol
        toe_walks: {
            name: 'Toe Walks',
            description: 'Walk on toes for 30m, then on heels for 30m. 3 sets.',
            frequency: 'Daily',
            xp: 5,
            science: 'Strengthens tibialis anterior and posterior'
        },
        calf_raises_eccentric: {
            name: 'Eccentric Calf Raises',
            description: 'Rise on both feet, lower on one foot slowly. 3x15 each leg.',
            frequency: 'Every other day',
            xp: 8,
            science: 'Builds calf strength to absorb impact'
        },
        
        // GENERAL
        hip_flexor_stretch: { 
            name: 'Hip Flexor Stretch', 
            description: 'Half-kneeling, posterior pelvic tilt, lean forward. 60 sec each side.',
            frequency: '2x daily',
            xp: 5,
            science: 'Tight hip flexors from sitting cause anterior pelvic tilt affecting running mechanics'
        },
        core_stability: { 
            name: 'Core Stability Circuit', 
            description: 'Dead bug (3x10) + Bird dog (3x10) + Plank (3x30sec)',
            frequency: '3x/week',
            xp: 10,
            science: 'McGill (2007): Core stability reduces energy leakage and protects spine'
        },
        
        // CHRONIC MANAGEMENT
        chronic_warmup: {
            name: 'Extended Warm-Up Protocol',
            description: '10-15 min walk, dynamic stretches, activation exercises before every run',
            frequency: 'Before every run',
            xp: 5,
            science: 'Chronic issues need more preparation time - rushing leads to flare-ups'
        },
        activity_modification: {
            name: 'Activity Modification',
            description: 'Avoid triggers identified in your pain log. Substitute with pain-free alternatives.',
            frequency: 'Ongoing',
            xp: 0,
            science: 'Managing chronic issues means working around them, not through them'
        },
        
        // Professional referral
        professional_evaluation: { 
            name: 'See a Professional', 
            description: 'PT or sports medicine doctor for proper diagnosis and treatment plan',
            frequency: 'ASAP for moderate/severe',
            xp: 0,
            science: 'Some conditions need imaging or manual therapy beyond self-treatment'
        }
    },
    
    // ==========================================
    // CHRONIC INJURY MANAGEMENT
    // ==========================================
    
    CHRONIC_THRESHOLDS: {
        daysToConsiderChronic: 30,  // If pain persists 30+ days
        minOccurrences: 8,          // Or 8+ occurrences
    },
    
    /**
     * Check if an injury should be considered chronic
     */
    isChronicInjury(assessment) {
        return assessment.daysSinceFirst >= this.CHRONIC_THRESHOLDS.daysToConsiderChronic ||
               assessment.occurrences >= this.CHRONIC_THRESHOLDS.minOccurrences;
    },
    
    /**
     * Get chronic management protocol
     */
    getChronicManagement(injuryKey) {
        const chronicProtocols = {
            plantar_fasciitis: {
                message: "Chronic plantar fasciitis requires ongoing management. It may never fully 'go away' but can be controlled.",
                dailyPrevention: ['plantar_stretch', 'plantar_roll', 'calf_stretch_gastric'],
                preRunRequired: ['plantar_roll', 'calf_stretch_gastric', 'calf_stretch_soleus'],
                avoidForever: ['barefoot_running', 'minimalist_shoes', 'sudden_mileage_jumps'],
                canStillDo: ['All run types with proper warm-up', 'Racing with taping', 'High mileage if gradual'],
                lifestyleTips: [
                    'Wear supportive shoes even at home',
                    'Night splint during flare-ups',
                    'Replace running shoes every 300-400 miles',
                    'Consider custom orthotics'
                ]
            },
            achilles_tendinitis: {
                message: "Chronic Achilles tendinopathy is manageable. The tendon may always be sensitive but you can run pain-free.",
                dailyPrevention: ['eccentric_heel_drops', 'calf_stretch_gastric', 'calf_stretch_soleus'],
                preRunRequired: ['calf_stretch_gastric', 'calf_stretch_soleus', 'chronic_warmup'],
                avoidForever: ['hill_repeats_when_sore', 'speed_work_without_warmup'],
                canStillDo: ['Easy runs', 'Long runs (with care)', 'Speed work when symptom-free'],
                lifestyleTips: [
                    'Never skip eccentric heel drops',
                    'Consider heel lifts in shoes',
                    'Avoid walking barefoot on hard floors',
                    'Ice after harder efforts'
                ]
            },
            it_band_syndrome: {
                message: "ITBS often becomes a recurring issue. Hip strength is your long-term solution.",
                dailyPrevention: ['hip_abductor_strengthen', 'it_band_foam_roll'],
                preRunRequired: ['it_band_foam_roll', 'single_leg_balance', 'chronic_warmup'],
                avoidForever: ['excessive_downhill', 'running_same_side_of_road'],
                canStillDo: ['Flat running', 'Track work', 'Racing'],
                lifestyleTips: [
                    'Hip strength is lifetime maintenance',
                    'Vary running surfaces',
                    'Alternate directions on track',
                    'Consider gait analysis'
                ]
            },
            runners_knee: {
                message: "Runner's knee is often lifelong but very manageable with consistent quad/glute work.",
                dailyPrevention: ['quad_sets', 'glute_bridges', 'step_downs'],
                preRunRequired: ['quad_sets', 'glute_bridges'],
                avoidForever: ['deep_squats_when_flared', 'excessive_stairs_when_sore'],
                canStillDo: ['All run types with strong quads', 'Racing', 'High mileage'],
                lifestyleTips: [
                    'Quad strength is your insurance policy',
                    'Avoid prolonged sitting with bent knees',
                    'Consider patellar taping for long runs',
                    'Keep quads/hips strong year-round'
                ]
            }
        };
        
        return chronicProtocols[injuryKey] || null;
    },
    
    // ==========================================
    // ANALYSIS FUNCTIONS
    // ==========================================
    
    /**
     * Analyze pain history and return injury assessments
     */
    analyzeInjuries() {
        const painHistory = this.getPainHistory();
        const assessments = [];
        
        // 1. Check pain-detected injuries from cardio logs
        for (const [injuryKey, injury] of Object.entries(this.INJURIES)) {
            const assessment = this.assessInjury(injuryKey, injury, painHistory);
            if (assessment) {
                assessments.push(assessment);
            }
        }
        
        // 2. Include USER-REPORTED injuries from onboarding/profile
        // These are stored in State._data.running.injuries
        const userReported = State._data?.running?.injuries || [];
        userReported.forEach(injuryId => {
            // Don't duplicate if already detected from pain
            if (assessments.find(a => a.key === injuryId)) return;
            
            const injury = this.INJURIES[injuryId];
            if (!injury) return;
            
            // User-reported injuries start as "mild" and can escalate with pain data
            assessments.push({
                key: injuryId,
                name: injury.name,
                description: injury.description,
                severity: 'mild',
                occurrences: 0,
                daysSinceFirst: 0,
                userReported: true,
                recovery: injury.recovery.mild
            });
        });
        
        // Sort by severity
        return assessments.sort((a, b) => {
            const severityOrder = { severe: 3, moderate: 2, mild: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    },
    
    /**
     * Assess a specific injury based on pain history
     */
    assessInjury(injuryKey, injury, painHistory) {
        // PRIORITY: Must match at least one earlySignal to be considered
        // progressionSignals alone don't qualify - they only add context
        const relevantPain = painHistory.filter(entry => {
            // Must have at least one early signal match
            const hasEarlyMatch = entry.pain?.some(p => injury.earlySignals.includes(p));
            return hasEarlyMatch;
        });
        
        if (relevantPain.length === 0) return null;
        
        // Calculate metrics
        const occurrences = relevantPain.length;
        const firstDate = new Date(relevantPain[0].timestamp);
        const daysSinceFirst = Math.floor((Date.now() - firstDate) / (24 * 60 * 60 * 1000));
        
        // Check for progression (pain spreading to more areas)
        const allPainAreas = new Set();
        relevantPain.forEach(entry => entry.pain?.forEach(p => allPainAreas.add(p)));
        
        const hasProgression = injury.progressionSignals.filter(s => allPainAreas.has(s)).length >= 2;
        
        // Check trigger patterns (what run types cause this)
        const triggerTypes = {};
        relevantPain.forEach(entry => {
            if (entry.workoutType) {
                triggerTypes[entry.workoutType] = (triggerTypes[entry.workoutType] || 0) + 1;
            }
        });
        
        // Determine severity from pattern (days/occurrences)
        let calculatedSeverity = null;
        if (daysSinceFirst >= injury.severity.severe.days || occurrences >= injury.severity.severe.occurrences) {
            calculatedSeverity = 'severe';
        } else if (daysSinceFirst >= injury.severity.moderate.days || occurrences >= injury.severity.moderate.occurrences) {
            calculatedSeverity = 'moderate';
        } else if (occurrences >= injury.severity.mild.occurrences) {
            calculatedSeverity = 'mild';
        }
        
        // Also check user-reported severity from "when does it hurt" timing
        const reportedSeverity = this.getReportedSeverity(injuryKey, painHistory);
        
        // Check for IMPROVEMENT: recent pain-free activities
        const recentEntries = painHistory.slice(-7); // Last 7 logged activities
        const recentPainFree = recentEntries.filter(entry => {
            const hasPainForThisInjury = entry.painDetails?.some(pd => pd.injury === injuryKey) ||
                                         entry.pain?.some(p => injury.earlySignals.includes(p));
            return !hasPainForThisInjury;
        }).length;
        
        // Determine base severity
        const severityOrder = { mild: 1, moderate: 2, severe: 3 };
        let severity = calculatedSeverity;
        if (reportedSeverity && (!calculatedSeverity || severityOrder[reportedSeverity] > severityOrder[calculatedSeverity])) {
            severity = reportedSeverity;
        }
        
        // IMPROVEMENT LOGIC: Downgrade if recent activities are pain-free
        let isImproving = false;
        if (recentEntries.length >= 3 && recentPainFree >= 3) {
            // At least 3 pain-free activities out of last 7 = improving
            isImproving = true;
            if (severity === 'severe' && recentPainFree >= 4) {
                severity = 'moderate';
            } else if (severity === 'moderate' && recentPainFree >= 5) {
                severity = 'mild';
            }
        }
        
        // If ALL last 5+ activities are pain-free, consider resolved
        if (recentEntries.length >= 5 && recentPainFree === recentEntries.length) {
            return null; // Injury resolved - remove from active tracking
        }
        
        if (!severity) return null;
        
        const recovery = injury.recovery[severity];
        
        return {
            key: injuryKey,
            name: injury.name,
            description: injury.description,
            severity,
            occurrences,
            daysSinceFirst,
            hasProgression,
            isImproving,
            painFreeActivities: recentPainFree,
            recentActivities: recentEntries.length,
            affectedAreas: Array.from(allPainAreas),
            triggerTypes: Object.entries(triggerTypes).sort((a, b) => b[1] - a[1]),
            recovery: {
                mileageReduction: recovery.mileageReduction,
                avoidTypes: recovery.avoidTypes,
                exercises: recovery.exercises.map(e => this.EXERCISES[e] || { name: e }),
                message: isImproving 
                    ? `Improving! ${recentPainFree}/${recentEntries.length} recent activities pain-free. ` + recovery.message
                    : recovery.message
            }
        };
    },
    
    /**
     * Get pain history from cardio log
     */
    getPainHistory() {
        const cardioLog = State._data?.cardioLog || [];
        // Include both legacy pain array and new painDetails with severity
        return cardioLog.filter(entry => 
            (entry.pain && entry.pain.length > 0) || 
            (entry.painDetails && entry.painDetails.length > 0)
        ).map(entry => ({
            ...entry,
            // Merge painDetails into pain array for backward compat
            pain: [
                ...(entry.pain || []),
                ...(entry.painDetails || []).map(pd => pd.region + '_' + pd.subregion)
            ],
            // Keep painDetails for severity lookup
            painDetails: entry.painDetails || []
        }));
    },
    
    /**
     * Get highest reported severity for an injury from recent logs
     * Normalizes 'high' to 'severe' for consistency with recovery protocols
     */
    getReportedSeverity(injuryId, painHistory) {
        const severityOrder = { mild: 1, moderate: 2, high: 3, severe: 3 };
        let maxSeverity = null;
        let maxLevel = 0;
        
        // Check last 14 days of pain history for this injury
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        
        painHistory.forEach(entry => {
            const entryTime = new Date(entry.timestamp || entry.date).getTime();
            if (entryTime < twoWeeksAgo) return; // Skip old entries
            
            (entry.painDetails || []).forEach(pd => {
                if (pd.injury === injuryId && pd.severity) {
                    const level = severityOrder[pd.severity] || 1;
                    if (level > maxLevel) {
                        maxLevel = level;
                        // Normalize 'high' to 'severe' for recovery protocol lookup
                        maxSeverity = pd.severity === 'high' ? 'severe' : pd.severity;
                    }
                }
            });
        });
        
        return maxSeverity;
    },
    
    /**
     * Get recommended training adjustments based on current injuries
     */
    getTrainingAdjustments() {
        const injuries = this.analyzeInjuries();
        if (injuries.length === 0) return null;
        
        // Get the most severe injury's recommendations
        const primary = injuries[0];
        
        // Aggregate all avoid types
        const allAvoidTypes = new Set();
        injuries.forEach(inj => {
            inj.recovery.avoidTypes.forEach(t => allAvoidTypes.add(t));
        });
        
        // Calculate total mileage reduction (don't double-count)
        const maxReduction = Math.max(...injuries.map(i => i.recovery.mileageReduction));
        
        // Collect all exercises (dedupe)
        const exercises = [];
        const seenExercises = new Set();
        injuries.forEach(inj => {
            inj.recovery.exercises.forEach(ex => {
                if (!seenExercises.has(ex.name)) {
                    seenExercises.add(ex.name);
                    exercises.push(ex);
                }
            });
        });
        
        return {
            injuries,
            mileageReduction: maxReduction,
            avoidTypes: Array.from(allAvoidTypes),
            exercises,
            primaryMessage: primary.recovery.message,
            shouldWarn: primary.severity === 'moderate' || primary.severity === 'severe',
            shouldStop: primary.severity === 'severe'
        };
    },
    
    /**
     * Apply injury adjustments to a prescribed run
     */
    adjustRun(prescribedRun) {
        const adjustments = this.getTrainingAdjustments();
        if (!adjustments) return prescribedRun;
        
        let adjusted = { ...prescribedRun };
        
        // Check if this run type should be avoided
        if (adjustments.avoidTypes.includes(prescribedRun.type)) {
            // Convert to easy run
            adjusted.type = 'easy';
            adjusted.originalType = prescribedRun.type;
            adjusted.injuryAdjusted = true;
            adjusted.adjustmentReason = `${adjustments.injuries[0].name} - avoiding ${prescribedRun.type} runs`;
        }
        
        // Reduce distance
        if (adjustments.mileageReduction > 0) {
            adjusted.distance = Math.round(prescribedRun.distance * (1 - adjustments.mileageReduction) * 10) / 10;
            adjusted.originalDistance = prescribedRun.distance;
            adjusted.injuryAdjusted = true;
        }
        
        return adjusted;
    },
    
    /**
     * Get injury warning for display
     */
    getActiveWarning() {
        const adjustments = this.getTrainingAdjustments();
        if (!adjustments || !adjustments.shouldWarn) return null;
        
        const primary = adjustments.injuries[0];
        
        return {
            title: primary.name,
            severity: primary.severity,
            message: primary.recovery.message,
            occurrences: primary.occurrences,
            days: primary.daysSinceFirst,
            exercises: adjustments.exercises.slice(0, 3),
            mileageReduction: Math.round(adjustments.mileageReduction * 100),
            avoidTypes: adjustments.avoidTypes
        };
    },
    
    /**
     * Log pain and check for new patterns
     */
    onPainLogged(painAreas, runData) {
        // This is called after CardioLogger saves
        // Check if any new patterns have emerged
        const previousAssessments = this.analyzeInjuries();
        
        // Pain was just logged, so re-analyze
        setTimeout(() => {
            const newAssessments = this.analyzeInjuries();
            
            // Check if any injury has progressed to a new severity level
            newAssessments.forEach(newA => {
                const prev = previousAssessments.find(p => p.key === newA.key);
                
                if (!prev && newA.severity === 'mild') {
                    // New potential injury detected
                    this.showNotification({
                        title: `Potential ${newA.name}`,
                        message: newA.recovery.message,
                        type: 'warning'
                    });
                } else if (prev && this.severityLevel(newA.severity) > this.severityLevel(prev.severity)) {
                    // Injury has progressed
                    this.showNotification({
                        title: `${newA.name} Getting Worse`,
                        message: newA.recovery.message,
                        type: 'alert'
                    });
                }
            });
        }, 500);
    },
    
    severityLevel(severity) {
        return { mild: 1, moderate: 2, severe: 3 }[severity] || 0;
    },
    
    /**
     * Show notification (integrate with app's notification system)
     */
    showNotification(notification) {
        // For now, just log. Can integrate with a proper notification system later
        // Could show a modal or toast here
        if (notification.type === 'alert') {
            // High priority - could interrupt flow
        }
    },
    
    // ==========================================
    // DAILY EXERCISE INTEGRATION
    // ==========================================
    
    /**
     * Get today's prescribed recovery exercises with severity-based scaling
     * This integrates with the daily workout view
     * 
     * SCIENCE-BASED EXERCISE CAPS:
     * - Max 5 exercises per session (prevents overload, improves adherence)
     * - Mild: 3 exercises (10-15 min)
     * - Moderate: 4 exercises (15-20 min)
     * - Severe: 5 exercises (20-25 min)
     * 
     * Citation: Littlewood et al. (2013): Exercise adherence drops significantly 
     * when programs exceed 6 exercises or 20 minutes
     */
    getTodaysRecoveryExercises() {
        const adjustments = this.getTrainingAdjustments();
        if (!adjustments) return { exercises: [], protocol: null };
        
        const todayKey = State.getTodayKey();
        const completedToday = State._data?.recoveryExercisesCompleted?.[todayKey] || [];
        const primary = adjustments.injuries[0];
        const severity = primary?.severity || 'mild';
        const numInjuries = adjustments.injuries.length;
        
        // Severity-based protocol with EXERCISE CAPS
        const protocols = {
            mild: {
                frequency: '1x daily',
                sessionsPerDay: 1,
                timeCommitment: '10-15 min',
                priority: 'Consistency matters more than intensity',
                xpMultiplier: 1,
                maxExercises: 3  // Less overwhelming, better adherence
            },
            moderate: {
                frequency: '2x daily (morning + evening)',
                sessionsPerDay: 2,
                timeCommitment: '15-20 min per session',
                priority: 'Do these exercises BEFORE and AFTER any activity',
                xpMultiplier: 1.5,
                maxExercises: 4
            },
            severe: {
                frequency: '2-3x daily + before any movement',
                sessionsPerDay: 3,
                timeCommitment: '20-25 min per session',
                priority: 'Recovery is your PRIMARY workout right now',
                xpMultiplier: 2,
                maxExercises: 5  // Max cap - never exceed this
            }
        };
        
        const protocol = protocols[severity];
        
        // Prioritize exercises: ones with science citations first, then by XP
        const sortedExercises = [...(adjustments.exercises || [])].sort((a, b) => {
            // "See Professional" always last
            if (a.name === 'See a Professional') return 1;
            if (b.name === 'See a Professional') return -1;
            // Science-backed first
            if (a.science && !b.science) return -1;
            if (!a.science && b.science) return 1;
            // Higher XP = more important
            return (b.xp || 5) - (a.xp || 5);
        });
        
        const exercises = [];
        const seenNames = new Set();
        
        for (const ex of sortedExercises) {
            // Skip duplicates, "see professional", and enforce cap
            if (seenNames.has(ex.name)) continue;
            if (ex.name === 'See a Professional' || ex.name === 'See Professional') continue;
            if (exercises.length >= protocol.maxExercises) break;
            
            seenNames.add(ex.name);
            
            // First exercises for severe injuries are PRIORITY
            const isPriority = severity === 'severe' && exercises.length < 2;
            
            exercises.push({
                id: ex.name.toLowerCase().replace(/\s+/g, '_'),
                name: ex.name,
                description: ex.description,
                frequency: ex.frequency || ex.reps || '2-3 sets',
                xp: Math.round((ex.xp || 5) * protocol.xpMultiplier),
                science: ex.science,
                completed: completedToday.includes(ex.name),
                forInjury: primary?.name,
                isPriority,
                severity
            });
        }
        
        return {
            exercises,
            protocol: {
                ...protocol,
                severity,
                injuryName: primary?.name,
                totalInjuries: numInjuries,
                totalExercises: exercises.length,
                completedToday: exercises.filter(e => e.completed).length,
                message: primary?.recovery?.message,
                isImproving: primary?.isImproving,
                painFreeActivities: primary?.painFreeActivities,
                recentActivities: primary?.recentActivities
            }
        };
    },
    
    /**
     * Mark a recovery exercise as complete
     */
    completeRecoveryExercise(exerciseName) {
        const todayKey = State.getTodayKey();
        
        if (!State._data.recoveryExercisesCompleted) {
            State._data.recoveryExercisesCompleted = {};
        }
        
        if (!State._data.recoveryExercisesCompleted[todayKey]) {
            State._data.recoveryExercisesCompleted[todayKey] = [];
        }
        
        if (!State._data.recoveryExercisesCompleted[todayKey].includes(exerciseName)) {
            State._data.recoveryExercisesCompleted[todayKey].push(exerciseName);
            
            // Award XP based on current protocol
            const { exercises, protocol } = this.getTodaysRecoveryExercises();
            const exerciseData = exercises?.find(e => e.name === exerciseName);
            const xp = exerciseData?.xp || this.RECOVERY_XP.exercise;
            App.awardXP(xp, 'discipline');
            
            // Check if all exercises completed for bonus
            const allCompleted = exercises?.every(e => 
                State._data.recoveryExercisesCompleted[todayKey].includes(e.name)
            );
            
            if (allCompleted && exercises?.length >= 2) {
                const bonusXP = Math.round(this.RECOVERY_XP.fullProtocol * (protocol?.xpMultiplier || 1));
                App.awardXP(bonusXP, 'discipline');
            }
            
            State.save();
        }
        
        return true;
    },
    
    /**
     * Render recovery exercises for daily view with severity-based protocol
     */
    renderDailyRecoverySection() {
        const { exercises, protocol } = this.getTodaysRecoveryExercises();
        
        if (!exercises || exercises.length === 0) return '';
        
        const severityClass = protocol?.severity === 'severe' ? 'danger' : 
                             protocol?.severity === 'moderate' ? 'warning' : 'caution';
        
        const severityLabel = protocol?.severity?.toUpperCase() || 'RECOVERY';
        
        return `
            <section class="section recovery-section ${severityClass}">
                <div class="section-header">
                    <span class="section-title">RECOVERY PROTOCOL</span>
                    <span class="section-badge ${severityClass}">${severityLabel}</span>
                </div>
                
                <!-- Protocol Overview -->
                <div class="recovery-protocol-overview">
                    <div class="protocol-injury-row">
                        <span class="protocol-injury">${protocol?.injuryName || 'Recovery'}</span>
                        ${protocol?.isImproving ? `<span class="improving-badge">IMPROVING</span>` : ''}
                    </div>
                    ${protocol?.isImproving ? `
                        <div class="improvement-tracker">
                            <div class="improvement-bar">
                                <div class="improvement-fill" style="width: ${Math.round((protocol.painFreeActivities / Math.max(protocol.recentActivities, 5)) * 100)}%"></div>
                            </div>
                            <span class="improvement-text">${protocol.painFreeActivities}/${protocol.recentActivities} recent activities pain-free</span>
                        </div>
                    ` : ''}
                    <div class="protocol-details">
                        <div class="protocol-stat">
                            <span class="stat-label">FREQUENCY</span>
                            <span class="stat-value">${protocol?.frequency}</span>
                        </div>
                        <div class="protocol-stat">
                            <span class="stat-label">TIME</span>
                            <span class="stat-value">${protocol?.timeCommitment}</span>
                        </div>
                    </div>
                    ${protocol?.severity !== 'mild' && !protocol?.isImproving ? `
                        <div class="protocol-priority">${protocol?.priority}</div>
                    ` : ''}
                    ${protocol?.isImproving ? `
                        <div class="protocol-priority improving">Keep doing the exercises - you're on the right track!</div>
                    ` : ''}
                    ${protocol?.message && !protocol?.isImproving ? `<div class="protocol-message">${protocol.message}</div>` : ''}
                </div>
                
                <!-- Exercise List -->
                <div class="recovery-exercises-list">
                    ${exercises.map(ex => `
                        <div class="recovery-exercise-item ${ex.completed ? 'completed' : ''} ${ex.isPriority ? 'priority' : ''}"
                             onclick="InjuryIntelligence.completeRecoveryExercise('${ex.name}'); App.render();">
                            ${ex.isPriority ? '<div class="priority-badge">PRIORITY</div>' : ''}
                            <div class="recovery-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <polyline points="4 12 9 17 20 6"/>
                                </svg>
                            </div>
                            <div class="recovery-info">
                                <div class="recovery-name">${ex.name}</div>
                                <div class="recovery-desc">${ex.description}</div>
                                <div class="recovery-freq">${ex.frequency}</div>
                            </div>
                            <div class="recovery-xp">+${ex.xp}</div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Progress -->
                ${protocol?.completedToday === protocol?.totalExercises && protocol?.totalExercises > 0 ? `
                    <div class="recovery-complete-bonus">
                        Session complete! +${Math.round(this.RECOVERY_XP.fullProtocol * (protocol?.xpMultiplier || 1))} XP
                        ${protocol?.sessionsPerDay > 1 ? `<div class="next-session">Do again ${protocol.sessionsPerDay === 2 ? 'tonight' : 'in 4-6 hours'}</div>` : ''}
                    </div>
                ` : `
                    <div class="recovery-progress">
                        <div class="progress-count">${protocol?.completedToday || 0}/${protocol?.totalExercises || 0}</div>
                        <div class="progress-hint">Complete all for +${Math.round(this.RECOVERY_XP.fullProtocol * (protocol?.xpMultiplier || 1))} bonus XP</div>
                    </div>
                `}
            </section>
        `;
    },
    
    // ==========================================
    // ENHANCED PAIN TRACKING
    // ==========================================
    
    /**
     * Enhanced pain entry with more context
     */
    PAIN_INTENSITIES: {
        1: { label: 'Barely noticeable', color: '#22c55e' },
        2: { label: 'Mild discomfort', color: '#84cc16' },
        3: { label: 'Noticeable', color: '#eab308' },
        4: { label: 'Uncomfortable', color: '#f97316' },
        5: { label: 'Significant pain', color: '#ef4444' },
    },
    
    PAIN_TIMING: {
        during: 'During the run',
        after: 'Right after',
        later: 'Hours later',
        next_day: 'Next day',
    },
    
    // ==========================================
    // EFFORT-BASED TRAINING INTELLIGENCE
    // ==========================================
    
    /**
     * Analyze recent efforts to intelligently adjust training
     * Research: Foster et al. (2001) - Session RPE for training load monitoring
     * 
     * Key insights:
     * - High effort + under-distance = struggling, needs recovery
     * - Low effort + at/over-distance = adapting well, can progress
     * - Consistent high effort = risk of overtraining
     */
    analyzeEffortTrend() {
        const cardioLog = State._data?.cardioLog || [];
        const recentRuns = cardioLog
            .filter(e => e.type === 'running')
            .slice(-10) // Last 10 runs
            .reverse(); // Most recent first
        
        if (recentRuns.length < 3) {
            return { status: 'insufficient_data', adjustment: 0, message: 'Need more data' };
        }
        
        let struggleCount = 0;
        let easyCount = 0;
        let totalEffort = 0;
        let underPerformed = 0;
        let overPerformed = 0;
        
        recentRuns.forEach(run => {
            const effort = run.effort || 5;
            totalEffort += effort;
            
            const prescribed = run.prescribed?.distance || 0;
            const actual = run.distance || 0;
            const completionRatio = prescribed > 0 ? actual / prescribed : 1;
            
            // High effort (8+) but under-performed (<80% of prescribed)
            if (effort >= 8 && completionRatio < 0.8) {
                struggleCount++;
                underPerformed++;
            }
            // Low effort (1-4) and hit or exceeded distance
            else if (effort <= 4 && completionRatio >= 1.0) {
                easyCount++;
            }
            
            // Track over/under performance
            if (completionRatio < 0.8) underPerformed++;
            if (completionRatio > 1.1) overPerformed++;
        });
        
        const avgEffort = totalEffort / recentRuns.length;
        
        // Determine training adjustment
        let adjustment = 0;
        let status = 'on_track';
        let message = '';
        
        // Struggling: High effort but under-performing
        if (struggleCount >= 2 || (avgEffort >= 7.5 && underPerformed >= 2)) {
            adjustment = -0.15; // Reduce by 15%
            status = 'struggling';
            message = 'Recent runs feel harder than expected. Reducing load to help recovery.';
        }
        // Overreaching risk: Consistently high effort
        else if (avgEffort >= 8 && recentRuns.length >= 5) {
            adjustment = -0.1;
            status = 'overreaching';
            message = 'Training load is high. Adding easy days to prevent burnout.';
        }
        // Adapting well: Low effort, hitting targets
        else if (easyCount >= 3 && avgEffort <= 5) {
            adjustment = 0.1; // Increase by 10%
            status = 'progressing';
            message = 'You\'re adapting well! Ready for slightly more challenge.';
        }
        // Slightly under-challenged
        else if (avgEffort <= 4 && overPerformed >= 2) {
            adjustment = 0.05;
            status = 'under_challenged';
            message = 'Workouts feeling easy. Small bump in intensity.';
        }
        
        return {
            status,
            adjustment,
            message,
            avgEffort: avgEffort.toFixed(1),
            recentRuns: recentRuns.length,
            struggleCount,
            easyCount
        };
    },
    
    /**
     * Get today's running prescription with effort-based adjustments
     */
    getAdjustedPrescription(basePrescription) {
        if (!basePrescription || basePrescription.type === 'rest') {
            return basePrescription;
        }
        
        // Get effort trend analysis
        const effortAnalysis = this.analyzeEffortTrend();
        
        // Get injury adjustments
        const injuryAdjustments = this.getTrainingAdjustments();
        
        // Combine adjustments (effort + injury)
        let totalDistanceAdjustment = effortAnalysis.adjustment;
        if (injuryAdjustments) {
            totalDistanceAdjustment -= injuryAdjustments.mileageReduction;
        }
        
        // Cap adjustments
        totalDistanceAdjustment = Math.max(-0.5, Math.min(0.2, totalDistanceAdjustment));
        
        // Apply to prescription
        const adjustedDistance = basePrescription.distance * (1 + totalDistanceAdjustment);
        
        // Check if workout type should be modified due to struggling
        let adjustedType = basePrescription.type;
        if (effortAnalysis.status === 'struggling' && ['tempo', 'intervals'].includes(basePrescription.type)) {
            adjustedType = 'easy'; // Downgrade hard workouts when struggling
        }
        
        // Check injury avoid types
        if (injuryAdjustments?.avoidTypes?.includes(basePrescription.type)) {
            adjustedType = 'easy';
        }
        
        return {
            ...basePrescription,
            type: adjustedType,
            originalType: basePrescription.type,
            distance: Math.round(adjustedDistance * 10) / 10,
            originalDistance: basePrescription.distance,
            effortAdjustment: effortAnalysis,
            injuryAdjustment: injuryAdjustments,
            wasModified: adjustedType !== basePrescription.type || 
                        Math.abs(adjustedDistance - basePrescription.distance) > 0.1
        };
    },
    
    /**
     * Render effort analysis for CardioLogger or stats
     */
    renderEffortInsight() {
        const analysis = this.analyzeEffortTrend();
        
        if (analysis.status === 'insufficient_data') {
            return ''; // Don't show anything yet
        }
        
        const icons = {
            struggling: '!',
            overreaching: '!!',
            progressing: '📈',
            under_challenged: '+',
            on_track: '✓'
        };
        
        const colors = {
            struggling: 'var(--warning)',
            overreaching: 'var(--error)',
            progressing: 'var(--success)',
            under_challenged: 'var(--success)',
            on_track: 'var(--text-muted)'
        };
        
        return `
            <div class="effort-insight" style="
                background: var(--surface-2);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
                font-size: 12px;
            ">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: 16px;">${icons[analysis.status]}</span>
                    <span style="color: ${colors[analysis.status]}; font-weight: 600; text-transform: uppercase; font-size: 11px;">
                        ${analysis.status.replace('_', ' ')}
                    </span>
                    <span style="color: var(--text-dim); margin-left: auto;">
                        Avg effort: ${analysis.avgEffort}/10
                    </span>
                </div>
                <div style="color: var(--text-muted);">
                    ${analysis.message}
                </div>
            </div>
        `;
    },
    
    /**
     * Render injury dashboard for profile/stats view
     */
    renderDashboard() {
        const adjustments = this.getTrainingAdjustments();
        
        if (!adjustments || adjustments.injuries.length === 0) {
            return `
                <div class="injury-dashboard empty">
                    <div class="injury-status good">All Clear</div>
                    <div class="injury-message">No injury patterns detected. Keep it up!</div>
                </div>
            `;
        }
        
        const primary = adjustments.injuries[0];
        const statusClass = primary.severity === 'severe' ? 'danger' : 
                          primary.severity === 'moderate' ? 'warning' : 'caution';
        
        return `
            <div class="injury-dashboard">
                <div class="injury-status ${statusClass}">
                    ${primary.severity.toUpperCase()}: ${primary.name}
                </div>
                <div class="injury-message">${primary.recovery.message}</div>
                
                <div class="injury-details">
                    <div class="injury-stat">
                        <span class="stat-value">${primary.occurrences}</span>
                        <span class="stat-label">occurrences</span>
                    </div>
                    <div class="injury-stat">
                        <span class="stat-value">${primary.daysSinceFirst}</span>
                        <span class="stat-label">days</span>
                    </div>
                    <div class="injury-stat">
                        <span class="stat-value">-${Math.round(adjustments.mileageReduction * 100)}%</span>
                        <span class="stat-label">mileage</span>
                    </div>
                </div>
                
                ${adjustments.avoidTypes.length > 0 ? `
                    <div class="injury-avoid">
                        <strong>Avoid:</strong> ${adjustments.avoidTypes.join(', ')} runs
                    </div>
                ` : ''}
                
                <div class="injury-exercises">
                    <strong>Recovery Protocol:</strong>
                    <ul>
                        ${adjustments.exercises.slice(0, 4).map(ex => `
                            <li><strong>${ex.name}</strong> - ${ex.frequency || ''}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
};

// Make globally available
if (typeof window !== 'undefined') {
    window.InjuryIntelligence = InjuryIntelligence;
}


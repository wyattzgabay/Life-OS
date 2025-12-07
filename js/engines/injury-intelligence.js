/**
 * INJURY-INTELLIGENCE.JS
 * Built-in Physical Therapist
 * 
 * Tracks pain patterns over time, detects developing injuries,
 * adjusts training automatically, and provides recovery protocols.
 */

const InjuryIntelligence = {
    
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
    // RECOVERY EXERCISES DATABASE
    // ==========================================
    
    EXERCISES: {
        // Plantar Fasciitis
        plantar_roll: { name: 'Plantar Roll', description: 'Roll foot on tennis/lacrosse ball for 2 min each', frequency: 'Before runs & before bed' },
        towel_scrunch: { name: 'Towel Scrunches', description: 'Scrunch towel with toes, 3x20', frequency: 'Daily' },
        arch_strengthening: { name: 'Arch Strengthening', description: 'Short foot exercise, 3x10 holds', frequency: 'Daily' },
        night_splint: { name: 'Night Splint', description: 'Wear dorsiflexion splint while sleeping', frequency: 'Nightly' },
        
        // Achilles
        eccentric_heel_drops: { name: 'Eccentric Heel Drops', description: 'Stand on step, lower heel slowly, 3x15 each leg', frequency: '2x daily' },
        ankle_mobility: { name: 'Ankle Mobility', description: 'Ankle circles and alphabet, 2 min each foot', frequency: 'Daily' },
        
        // General
        calf_stretch: { name: 'Calf Stretch', description: 'Wall stretch, 30 sec each leg', frequency: 'Before & after runs' },
        calf_raises: { name: 'Calf Raises', description: 'Slow controlled raises, 3x15', frequency: 'Every other day' },
        foam_roll_calves: { name: 'Foam Roll Calves', description: '2 min each calf on foam roller', frequency: 'After runs' },
        
        // Hip/Glute
        clamshells: { name: 'Clamshells', description: 'Side lying, band above knees, 3x15 each side', frequency: 'Daily' },
        glute_bridges: { name: 'Glute Bridges', description: 'Hold at top 3 sec, 3x12', frequency: 'Daily' },
        hip_strengthening: { name: 'Hip Strengthening Circuit', description: 'Clamshells + fire hydrants + side leg raises', frequency: '3x/week' },
        hip_flexor_stretch: { name: 'Hip Flexor Stretch', description: 'Kneeling lunge stretch, 60 sec each side', frequency: '2x daily' },
        
        // Knee
        quad_strengthening: { name: 'Quad Strengthening', description: 'Wall sits + step downs + leg extensions', frequency: '3x/week' },
        single_leg_squats: { name: 'Single Leg Squats', description: 'Pistol progressions, 3x8 each leg', frequency: '3x/week' },
        step_downs: { name: 'Step Downs', description: 'Slow controlled step downs, 3x10 each leg', frequency: 'Daily' },
        
        // IT Band
        it_band_foam_roll: { name: 'IT Band Foam Roll', description: '2-3 min each side, focus on tender spots', frequency: 'Daily' },
        side_lying_leg_raises: { name: 'Side Lying Leg Raises', description: 'With band, 3x15 each side', frequency: 'Daily' },
        
        // Core
        core_stability: { name: 'Core Stability Work', description: 'Planks + dead bugs + bird dogs', frequency: '3x/week' },
        dead_bug: { name: 'Dead Bug', description: 'Slow controlled, 3x10 each side', frequency: 'Daily' },
        bird_dog: { name: 'Bird Dog', description: 'Hold 5 sec each, 3x10 each side', frequency: 'Daily' },
        
        // General
        professional_evaluation: { name: 'See a Professional', description: 'Consider seeing a PT or sports medicine doctor', frequency: 'ASAP' },
        rest: { name: 'Complete Rest', description: 'No running for at least 3-5 days', frequency: 'As needed' },
        cross_train_only: { name: 'Cross Training Only', description: 'Bike, swim, or pool running instead', frequency: 'Until pain-free' },
        ice_post_run: { name: 'Ice After Running', description: '15 min ice on affected area', frequency: 'After every run' }
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
        
        for (const [injuryKey, injury] of Object.entries(this.INJURIES)) {
            const assessment = this.assessInjury(injuryKey, injury, painHistory);
            if (assessment) {
                assessments.push(assessment);
            }
        }
        
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
        // Get pain entries that match this injury's signals
        const relevantPain = painHistory.filter(entry => {
            return entry.pain?.some(p => 
                injury.earlySignals.includes(p) || 
                injury.progressionSignals.includes(p)
            );
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
        
        // Determine severity
        let severity = null;
        if (daysSinceFirst >= injury.severity.severe.days || occurrences >= injury.severity.severe.occurrences) {
            severity = 'severe';
        } else if (daysSinceFirst >= injury.severity.moderate.days || occurrences >= injury.severity.moderate.occurrences) {
            severity = 'moderate';
        } else if (occurrences >= injury.severity.mild.occurrences) {
            severity = 'mild';
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
            affectedAreas: Array.from(allPainAreas),
            triggerTypes: Object.entries(triggerTypes).sort((a, b) => b[1] - a[1]),
            recovery: {
                mileageReduction: recovery.mileageReduction,
                avoidTypes: recovery.avoidTypes,
                exercises: recovery.exercises.map(e => this.EXERCISES[e] || { name: e }),
                message: recovery.message
            }
        };
    },
    
    /**
     * Get pain history from cardio log
     */
    getPainHistory() {
        const cardioLog = State._data?.cardioLog || [];
        return cardioLog.filter(entry => entry.pain && entry.pain.length > 0);
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
        console.log('Injury Alert:', notification);
        
        // Could show a modal or toast here
        if (notification.type === 'alert') {
            // High priority - could interrupt flow
        }
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


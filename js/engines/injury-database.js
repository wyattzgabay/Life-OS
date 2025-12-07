/**
 * INJURY-DATABASE.JS
 * Comprehensive Running Injury Database
 * 
 * TOP 25 RUNNING INJURIES with:
 * - Specific pain location mapping (drill-down)
 * - 7 recovery exercises each with timing tags
 * - Research citations
 * - Risk factors and prevention
 * 
 * SOURCES:
 * - Taunton JE et al. (2002) British Journal of Sports Medicine
 * - van Gent RN et al. (2007) British Journal of Sports Medicine  
 * - Lopes AD et al. (2012) Sports Medicine
 * - Hreljac A (2004) Medicine & Science in Sports & Exercise
 */

const InjuryDatabase = {
    
    // ==========================================
    // PAIN LOCALIZATION TREE
    // Helps narrow down injury from general area to specific condition
    // ==========================================
    
    PAIN_REGIONS: {
        foot: {
            name: 'Foot',
            subregions: {
                arch: {
                    name: 'Arch (bottom of foot)',
                    timing: {
                        morning_first_steps: ['plantar_fasciitis'],
                        during_run: ['plantar_fasciitis', 'posterior_tibial_tendinitis'],
                        after_run: ['plantar_fasciitis', 'metatarsalgia']
                    }
                },
                heel: {
                    name: 'Heel',
                    timing: {
                        morning_first_steps: ['plantar_fasciitis'],
                        during_run: ['heel_spur', 'fat_pad_syndrome'],
                        after_run: ['heel_bruise', 'plantar_fasciitis']
                    }
                },
                ball: {
                    name: 'Ball of foot (forefoot)',
                    timing: {
                        during_run: ['metatarsalgia', 'mortons_neuroma', 'stress_fracture_metatarsal'],
                        after_run: ['metatarsalgia', 'sesamoiditis']
                    }
                },
                top: {
                    name: 'Top of foot',
                    timing: {
                        during_run: ['extensor_tendinitis', 'stress_fracture_metatarsal'],
                        after_run: ['extensor_tendinitis']
                    }
                },
                outer: {
                    name: 'Outer edge',
                    timing: {
                        during_run: ['peroneal_tendinitis', 'stress_fracture_5th_metatarsal'],
                        after_run: ['peroneal_tendinitis']
                    }
                }
            }
        },
        ankle: {
            name: 'Ankle',
            subregions: {
                back: {
                    name: 'Back of ankle (Achilles area)',
                    timing: {
                        morning_stiffness: ['achilles_tendinopathy'],
                        during_run: ['achilles_tendinopathy', 'retrocalcaneal_bursitis'],
                        after_run: ['achilles_tendinopathy']
                    }
                },
                inner: {
                    name: 'Inner ankle',
                    timing: {
                        during_run: ['posterior_tibial_tendinitis', 'medial_ankle_impingement'],
                        after_run: ['posterior_tibial_tendinitis']
                    }
                },
                outer: {
                    name: 'Outer ankle',
                    timing: {
                        during_run: ['peroneal_tendinitis', 'lateral_ankle_impingement'],
                        after_run: ['peroneal_tendinitis', 'chronic_ankle_instability']
                    }
                },
                front: {
                    name: 'Front of ankle',
                    timing: {
                        during_run: ['anterior_ankle_impingement'],
                        after_run: ['anterior_ankle_impingement']
                    }
                }
            }
        },
        shin: {
            name: 'Shin',
            subregions: {
                inner_lower: {
                    name: 'Inner shin (lower 2/3)',
                    timing: {
                        during_run: ['medial_tibial_stress_syndrome', 'stress_fracture_tibia'],
                        after_run: ['medial_tibial_stress_syndrome']
                    }
                },
                outer: {
                    name: 'Outer shin / front',
                    timing: {
                        during_run: ['anterior_shin_splints', 'compartment_syndrome'],
                        after_run: ['anterior_shin_splints']
                    }
                },
                bone_point_pain: {
                    name: 'Specific point on bone (sharp)',
                    timing: {
                        during_run: ['stress_fracture_tibia'],
                        at_rest: ['stress_fracture_tibia']
                    }
                }
            }
        },
        calf: {
            name: 'Calf',
            subregions: {
                upper_inner: {
                    name: 'Upper calf (behind knee)',
                    timing: {
                        during_run: ['gastrocnemius_strain', 'popliteal_artery_entrapment'],
                        sudden_sharp: ['calf_tear']
                    }
                },
                mid: {
                    name: 'Middle of calf',
                    timing: {
                        during_run: ['calf_strain', 'soleus_strain'],
                        after_run: ['calf_tightness', 'soleus_strain']
                    }
                },
                lower: {
                    name: 'Lower calf (near Achilles)',
                    timing: {
                        during_run: ['achilles_tendinopathy', 'soleus_strain'],
                        morning_stiffness: ['achilles_tendinopathy']
                    }
                }
            }
        },
        knee: {
            name: 'Knee',
            subregions: {
                front_under_kneecap: {
                    name: 'Under/around kneecap',
                    timing: {
                        going_downhill: ['patellofemoral_syndrome'],
                        going_upstairs: ['patellofemoral_syndrome'],
                        after_sitting: ['patellofemoral_syndrome']
                    }
                },
                front_below_kneecap: {
                    name: 'Below kneecap (patellar tendon)',
                    timing: {
                        during_run: ['patellar_tendinitis'],
                        jumping: ['patellar_tendinitis']
                    }
                },
                outer: {
                    name: 'Outside of knee',
                    timing: {
                        after_1_2_miles: ['it_band_syndrome'],
                        going_downhill: ['it_band_syndrome'],
                        after_run: ['it_band_syndrome']
                    }
                },
                inner: {
                    name: 'Inside of knee',
                    timing: {
                        during_run: ['pes_anserine_bursitis', 'mcl_strain'],
                        after_run: ['pes_anserine_bursitis']
                    }
                },
                behind: {
                    name: 'Behind knee',
                    timing: {
                        during_run: ['bakers_cyst', 'hamstring_tendinopathy'],
                        after_run: ['bakers_cyst']
                    }
                }
            }
        },
        thigh: {
            name: 'Thigh',
            subregions: {
                front_upper: {
                    name: 'Front upper (quad)',
                    timing: {
                        during_run: ['quad_strain', 'hip_flexor_strain'],
                        sprinting: ['quad_strain']
                    }
                },
                front_lower: {
                    name: 'Front lower (above knee)',
                    timing: {
                        during_run: ['quad_tendinopathy'],
                        after_run: ['quad_tendinopathy']
                    }
                },
                outer: {
                    name: 'Outer thigh',
                    timing: {
                        during_run: ['it_band_tightness', 'tfl_strain'],
                        foam_rolling: ['it_band_tightness']
                    }
                },
                inner: {
                    name: 'Inner thigh (groin)',
                    timing: {
                        during_run: ['adductor_strain', 'sports_hernia'],
                        lateral_movement: ['adductor_strain']
                    }
                },
                back: {
                    name: 'Back of thigh (hamstring)',
                    timing: {
                        during_run: ['hamstring_strain', 'high_hamstring_tendinopathy'],
                        sitting: ['high_hamstring_tendinopathy'],
                        sudden_sharp: ['hamstring_tear']
                    }
                }
            }
        },
        hip: {
            name: 'Hip',
            subregions: {
                front: {
                    name: 'Front of hip',
                    timing: {
                        during_run: ['hip_flexor_strain', 'hip_impingement'],
                        after_sitting: ['hip_flexor_tightness']
                    }
                },
                side: {
                    name: 'Side of hip (greater trochanter)',
                    timing: {
                        lying_on_side: ['trochanteric_bursitis', 'gluteus_medius_tendinopathy'],
                        during_run: ['trochanteric_bursitis']
                    }
                },
                back: {
                    name: 'Back of hip / deep in glute',
                    timing: {
                        sitting: ['piriformis_syndrome', 'high_hamstring_tendinopathy'],
                        during_run: ['piriformis_syndrome']
                    }
                },
                groin: {
                    name: 'Groin / deep hip',
                    timing: {
                        during_run: ['hip_impingement', 'labral_tear', 'adductor_strain'],
                        rotation: ['hip_impingement', 'labral_tear']
                    }
                }
            }
        },
        lower_back: {
            name: 'Lower Back',
            subregions: {
                center: {
                    name: 'Center of lower back',
                    timing: {
                        after_long_run: ['lumbar_strain', 'disc_issue'],
                        bending: ['disc_issue']
                    }
                },
                side: {
                    name: 'Side of lower back',
                    timing: {
                        during_run: ['quadratus_lumborum_strain', 'si_joint_dysfunction'],
                        after_run: ['si_joint_dysfunction']
                    }
                }
            }
        }
    },
    
    // ==========================================
    // COMPREHENSIVE INJURY DATABASE (Top 25)
    // ==========================================
    
    INJURIES: {
        // ========== FOOT INJURIES ==========
        plantar_fasciitis: {
            name: 'Plantar Fasciitis',
            prevalence: '10% of runners', // Most common
            description: 'Inflammation/degeneration of the plantar fascia, the thick band connecting heel to toes.',
            keySymptoms: [
                'Sharp heel pain with first morning steps',
                'Pain improves after warming up',
                'Pain returns after rest periods',
                'Tenderness along arch'
            ],
            riskFactors: ['High arches', 'Flat feet', 'Tight calves', 'Sudden mileage increase', 'Worn shoes'],
            recovery: {
                mild: '2-4 weeks',
                moderate: '2-3 months',
                severe: '6-12 months'
            },
            science: 'DiGiovanni et al. (2003): Plantar fascia-specific stretching superior to Achilles stretching.',
            exercises: {
                pre_run: ['plantar_stretch', 'calf_stretch_gastric', 'foot_roll'],
                post_run: ['foot_roll', 'calf_stretch_soleus', 'ice_arch'],
                rest_day: ['plantar_stretch', 'towel_scrunches', 'arch_doming', 'calf_eccentric', 'ankle_mobility'],
                always: ['supportive_footwear']
            }
        },
        
        metatarsalgia: {
            name: 'Metatarsalgia',
            prevalence: '8% of runners',
            description: 'Pain and inflammation in the ball of the foot, often under 2nd/3rd metatarsal heads.',
            keySymptoms: [
                'Burning pain in ball of foot',
                'Feels like walking on pebble',
                'Worse in thin-soled shoes',
                'Pain increases with activity'
            ],
            riskFactors: ['High arches', 'Tight toe box shoes', 'High heels', 'Bunions', 'Hammer toes'],
            recovery: {
                mild: '1-2 weeks',
                moderate: '4-6 weeks',
                severe: '2-3 months'
            },
            science: 'Espinosa & Brodsky (2010): Metatarsal pads reduce peak pressure by 50%.',
            exercises: {
                pre_run: ['toe_spreads', 'calf_stretch_gastric', 'ankle_mobility'],
                post_run: ['toe_spreads', 'foot_roll', 'metatarsal_massage'],
                rest_day: ['toe_yoga', 'marble_pickups', 'calf_stretch_soleus', 'intrinsic_foot_strengthening'],
                always: ['wider_toe_box_shoes', 'metatarsal_pad']
            }
        },

        stress_fracture_metatarsal: {
            name: 'Metatarsal Stress Fracture',
            prevalence: '4% of runners',
            description: 'Microscopic cracks in metatarsal bones from repetitive stress. REQUIRES REST.',
            keySymptoms: [
                'Localized sharp pain on top of foot',
                'Pain worsens with activity',
                'Swelling on top of foot',
                'Pain at rest in severe cases'
            ],
            riskFactors: ['Rapid mileage increase', 'Female runners', 'Low bone density', 'Amenorrhea', 'Low calcium/vitamin D'],
            recovery: {
                typical: '6-8 weeks NO running',
                severe: '3-4 months'
            },
            science: 'Matheson et al. (1987): 2nd metatarsal most common site. Rest is mandatory.',
            exercises: {
                pre_run: [], // NO RUNNING
                post_run: [], // NO RUNNING
                rest_day: ['pool_running', 'cycling', 'upper_body_strength', 'core_stability'],
                always: ['see_professional', 'bone_density_check']
            },
            redFlag: true,
            mustRest: true
        },

        // ========== ACHILLES / ANKLE ==========
        achilles_tendinopathy: {
            name: 'Achilles Tendinopathy',
            prevalence: '11% of runners',
            description: 'Degeneration of the Achilles tendon, usually 2-6cm above heel insertion.',
            keySymptoms: [
                'Morning stiffness in Achilles',
                'Pain at start of run that warms up',
                'Thickening of tendon',
                'Tender to pinch'
            ],
            riskFactors: ['Tight calves', 'Sudden hill training', 'Speed work increase', 'Age 30+'],
            recovery: {
                mild: '4-6 weeks',
                moderate: '3-6 months',
                severe: '6-12 months'
            },
            science: 'Alfredson (1998): Eccentric loading protocol - 89% success rate at 12 weeks.',
            exercises: {
                pre_run: ['calf_stretch_gastric', 'calf_stretch_soleus', 'ankle_mobility', 'heel_raises_warmup'],
                post_run: ['eccentric_heel_drops', 'calf_stretch_gastric', 'ice_achilles'],
                rest_day: ['eccentric_heel_drops_heavy', 'calf_stretch_both', 'ankle_mobility', 'isometric_holds', 'soleus_bridge'],
                always: ['heel_lifts_in_shoes', 'avoid_barefoot']
            }
        },

        posterior_tibial_tendinitis: {
            name: 'Posterior Tibial Tendinitis',
            prevalence: '3% of runners',
            description: 'Inflammation of tendon supporting the arch, runs behind inner ankle bone.',
            keySymptoms: [
                'Pain along inner ankle',
                'Pain worsens going up on toes',
                'Arch collapse/flattening',
                'Swelling behind inner ankle'
            ],
            riskFactors: ['Flat feet', 'Overpronation', 'Worn-out shoes', 'Obesity'],
            recovery: {
                mild: '4-6 weeks',
                moderate: '2-3 months',
                severe: '6+ months (may need orthotics)'
            },
            science: 'Kulig et al. (2009): Progressive strengthening effective for early-stage PTTD.',
            exercises: {
                pre_run: ['arch_activation', 'ankle_mobility', 'calf_stretch_gastric'],
                post_run: ['arch_massage', 'calf_stretch_soleus', 'ice_inner_ankle'],
                rest_day: ['towel_scrunches', 'single_leg_balance', 'heel_raises_slow', 'arch_doming', 'resistance_band_inversion'],
                always: ['motion_control_shoes', 'orthotics_consideration']
            }
        },

        peroneal_tendinitis: {
            name: 'Peroneal Tendinitis',
            prevalence: '2% of runners',
            description: 'Inflammation of tendons on outer ankle that stabilize foot during running.',
            keySymptoms: [
                'Pain behind outer ankle bone',
                'Pain worse on uneven surfaces',
                'Ankle feels unstable',
                'Pain with pushing off'
            ],
            riskFactors: ['High arches', 'Ankle instability', 'Running on cambered roads', 'Supination'],
            recovery: {
                mild: '2-4 weeks',
                moderate: '6-8 weeks',
                severe: '3 months'
            },
            science: 'Karlsson & Wiger (2002): Strengthening and proprioception training essential.',
            exercises: {
                pre_run: ['ankle_circles', 'calf_stretch_gastric', 'single_leg_balance'],
                post_run: ['peroneal_stretch', 'ankle_mobility', 'ice_outer_ankle'],
                rest_day: ['resistance_band_eversion', 'single_leg_balance_unstable', 'heel_walks', 'ankle_alphabet'],
                always: ['lateral_ankle_support', 'avoid_cambered_surfaces']
            }
        },

        // ========== SHIN INJURIES ==========
        medial_tibial_stress_syndrome: {
            name: 'Shin Splints (MTSS)',
            prevalence: '13% of runners', // Very common
            description: 'Pain along inner shin from stress on tibia and surrounding muscles.',
            keySymptoms: [
                'Diffuse pain along inner shin',
                'Pain worse at start of run',
                'Tenderness along lower 2/3 of tibia',
                'Pain with toe raises'
            ],
            riskFactors: ['New runners', 'Sudden mileage increase', 'Hard surfaces', 'Overpronation', 'Weak calves'],
            recovery: {
                mild: '2-3 weeks',
                moderate: '4-6 weeks',
                severe: '2-3 months'
            },
            science: 'Winters et al. (2013): Graded running program with calf strengthening most effective.',
            exercises: {
                pre_run: ['calf_stretch_gastric', 'toe_walks', 'ankle_mobility'],
                post_run: ['foam_roll_calves', 'calf_stretch_soleus', 'ice_shins', 'shin_massage'],
                rest_day: ['eccentric_calf_raises', 'toe_walks', 'heel_walks', 'tibialis_raises', 'single_leg_balance', 'soleus_stretch'],
                always: ['gradual_mileage_increase', 'soft_surfaces']
            }
        },

        stress_fracture_tibia: {
            name: 'Tibial Stress Fracture',
            prevalence: '5% of runners',
            description: 'Microscopic crack in the tibia. SERIOUS - requires complete rest from impact.',
            keySymptoms: [
                'Pinpoint pain on tibia',
                'Pain at rest in severe cases',
                'Night pain',
                'Pain with hopping on affected leg'
            ],
            riskFactors: ['Female athlete triad', 'Low calcium', 'Rapid mileage increase', 'History of stress fractures'],
            recovery: {
                typical: '8-12 weeks NO running',
                high_risk_location: '12-16 weeks'
            },
            science: 'Bennell et al. (1996): High-risk locations (anterior tibia) need longer rest.',
            exercises: {
                pre_run: [], // NO RUNNING
                post_run: [], // NO RUNNING
                rest_day: ['pool_running', 'swimming', 'cycling_low_resistance', 'upper_body', 'core_work'],
                always: ['see_professional_immediately', 'bone_density_screen', 'nutrition_evaluation']
            },
            redFlag: true,
            mustRest: true
        },

        compartment_syndrome: {
            name: 'Chronic Exertional Compartment Syndrome',
            prevalence: '2% of runners',
            description: 'Pressure builds in muscle compartment during exercise, causing pain and numbness.',
            keySymptoms: [
                'Pain starts at predictable time/distance',
                'Tight, bursting sensation',
                'Numbness or weakness in foot',
                'Pain resolves within 15-30 min of stopping'
            ],
            riskFactors: ['Young athletes', 'High volume training', 'Tight fascia'],
            recovery: {
                conservative: '3-6 months of modified training',
                surgical: '3 months post-op'
            },
            science: 'Clanton & Solcher (1994): Pressure testing confirms diagnosis. Surgery often needed.',
            exercises: {
                pre_run: ['calf_stretch_gastric', 'ankle_mobility', 'shin_massage'],
                post_run: ['foam_roll_calves', 'calf_stretch_soleus', 'elevation'],
                rest_day: ['gait_retraining', 'soft_tissue_work', 'ankle_mobility_extensive'],
                always: ['see_sports_medicine', 'pressure_testing']
            },
            redFlag: true
        },

        // ========== KNEE INJURIES ==========
        patellofemoral_syndrome: {
            name: "Runner's Knee (PFPS)",
            prevalence: '16% of runners', // Most common knee injury
            description: 'Pain under or around kneecap from tracking issues and muscle imbalances.',
            keySymptoms: [
                'Aching under kneecap',
                'Pain going downstairs/downhill',
                'Pain after prolonged sitting',
                'Grinding/popping sensation'
            ],
            riskFactors: ['Weak quads (esp VMO)', 'Weak glutes', 'Tight IT band', 'Overpronation'],
            recovery: {
                mild: '4-6 weeks',
                moderate: '2-3 months',
                severe: '6+ months'
            },
            science: 'Powers (2003): Hip strengthening as effective as quad strengthening for PFPS.',
            exercises: {
                pre_run: ['quad_activation', 'glute_activation', 'IT_band_foam_roll'],
                post_run: ['quad_stretch', 'IT_band_foam_roll', 'ice_knee'],
                rest_day: ['quad_sets_VMO', 'step_downs_slow', 'glute_bridges', 'clamshells', 'single_leg_squats_shallow', 'hip_abduction', 'wall_sits'],
                always: ['avoid_deep_squats', 'avoid_stairs_when_flared']
            }
        },

        it_band_syndrome: {
            name: 'IT Band Syndrome',
            prevalence: '12% of runners',
            description: 'Friction of IT band over outer knee causing inflammation. Classic "stops you in your tracks."',
            keySymptoms: [
                'Sharp pain outside knee',
                'Pain starts 1-2 miles into run',
                'Pain worse going downhill',
                'Cannot run through it'
            ],
            riskFactors: ['Weak hip abductors', 'Excessive hip drop', 'Downhill running', 'Cambered roads'],
            recovery: {
                mild: '2-4 weeks',
                moderate: '6-8 weeks',
                severe: '3+ months'
            },
            science: 'Fredericson et al. (2000): 6-week hip strengthening program - 92% return to running.',
            exercises: {
                pre_run: ['IT_band_foam_roll', 'glute_activation', 'hip_circles'],
                post_run: ['IT_band_foam_roll', 'TFL_stretch', 'glute_stretch', 'ice_outer_knee'],
                rest_day: ['clamshells_banded', 'side_lying_leg_raises', 'single_leg_bridge', 'hip_hikes', 'monster_walks', 'standing_hip_abduction', 'lateral_band_walks'],
                always: ['vary_running_direction', 'avoid_excessive_downhill']
            }
        },

        patellar_tendinitis: {
            name: 'Patellar Tendinitis (Jumper\'s Knee)',
            prevalence: '5% of runners',
            description: 'Inflammation of tendon connecting kneecap to shin bone.',
            keySymptoms: [
                'Pain just below kneecap',
                'Pain worse with jumping/hills',
                'Tender to press on tendon',
                'Stiffness after sitting'
            ],
            riskFactors: ['Hill running', 'Speed work', 'Tight quads', 'Weak quads'],
            recovery: {
                mild: '4-6 weeks',
                moderate: '2-3 months',
                severe: '6+ months'
            },
            science: 'Kongsgaard et al. (2009): Heavy slow resistance training superior to eccentric alone.',
            exercises: {
                pre_run: ['quad_stretch', 'patellar_tendon_warmup', 'glute_activation'],
                post_run: ['quad_foam_roll', 'quad_stretch', 'ice_patellar_tendon'],
                rest_day: ['Spanish_squats', 'decline_squats_slow', 'quad_isometrics', 'leg_extensions_light', 'step_ups_slow'],
                always: ['avoid_jumping', 'reduce_hill_work']
            }
        },

        pes_anserine_bursitis: {
            name: 'Pes Anserine Bursitis',
            prevalence: '3% of runners',
            description: 'Inflammation of bursa on inner knee where hamstring tendons attach.',
            keySymptoms: [
                'Pain on inner knee below joint',
                'Tender to touch',
                'Pain going upstairs',
                'Pain with resisted knee flexion'
            ],
            riskFactors: ['Overpronation', 'Tight hamstrings', 'Weak hip muscles', 'Valgus knee'],
            recovery: {
                mild: '2-4 weeks',
                moderate: '6-8 weeks',
                severe: '2-3 months'
            },
            science: 'Alvarez-Nemegyei (2007): Hip strengthening and hamstring flexibility key.',
            exercises: {
                pre_run: ['hamstring_stretch_light', 'glute_activation', 'hip_circles'],
                post_run: ['hamstring_stretch', 'inner_thigh_foam_roll', 'ice_inner_knee'],
                rest_day: ['hamstring_stretch_nerve_glide', 'hip_strengthening_circuit', 'glute_bridges', 'clamshells'],
                always: ['motion_control_shoes', 'avoid_breaststroke']
            }
        },

        // ========== HIP/GLUTE INJURIES ==========
        piriformis_syndrome: {
            name: 'Piriformis Syndrome',
            prevalence: '5% of runners',
            description: 'Piriformis muscle irritates sciatic nerve causing deep glute/hip pain.',
            keySymptoms: [
                'Deep ache in buttock',
                'Pain worse sitting',
                'Pain may radiate down leg',
                'Tender spot deep in glute'
            ],
            riskFactors: ['Excessive sitting', 'Wallet in back pocket', 'Weak glutes', 'Overstriding'],
            recovery: {
                mild: '2-4 weeks',
                moderate: '6-8 weeks',
                severe: '3+ months'
            },
            science: 'Tonley et al. (2010): Hip strengthening reduces symptoms in 79% of patients.',
            exercises: {
                pre_run: ['piriformis_stretch', 'glute_activation', 'hip_circles'],
                post_run: ['piriformis_stretch', 'figure_4_stretch', 'glute_foam_roll'],
                rest_day: ['pigeon_pose', 'seated_piriformis_stretch', 'nerve_glides', 'glute_strengthening', 'hip_external_rotation_stretch', 'lacrosse_ball_glute'],
                always: ['dont_sit_on_wallet', 'standing_desk']
            }
        },

        trochanteric_bursitis: {
            name: 'Hip Bursitis (Greater Trochanteric)',
            prevalence: '4% of runners',
            description: 'Inflammation of bursa on outer hip bone. Common in women.',
            keySymptoms: [
                'Pain on outer hip',
                'Pain lying on affected side',
                'Pain going up stairs',
                'Tender over hip bone'
            ],
            riskFactors: ['Women', 'Weak glutes', 'IT band tightness', 'Running on cambered surfaces'],
            recovery: {
                mild: '2-4 weeks',
                moderate: '6-8 weeks',
                severe: '3+ months'
            },
            science: 'Mellor et al. (2018): Exercise superior to corticosteroid injection long-term.',
            exercises: {
                pre_run: ['IT_band_foam_roll', 'glute_activation', 'hip_circles'],
                post_run: ['IT_band_foam_roll', 'glute_stretch', 'ice_hip'],
                rest_day: ['clamshells', 'side_lying_leg_raises', 'glute_bridges', 'standing_hip_abduction', 'isometric_hip_abduction', 'hip_hikes'],
                always: ['sleep_with_pillow_between_knees', 'avoid_crossing_legs']
            }
        },

        hip_flexor_strain: {
            name: 'Hip Flexor Strain',
            prevalence: '6% of runners',
            description: 'Strain of muscles that lift thigh, usually iliopsoas or rectus femoris.',
            keySymptoms: [
                'Pain in front of hip',
                'Pain lifting knee',
                'Pain worse with speed work',
                'Tightness after sitting'
            ],
            riskFactors: ['Tight hip flexors', 'Weak core', 'Hill sprints', 'Overstriding'],
            recovery: {
                mild: '1-2 weeks',
                moderate: '4-6 weeks',
                severe: '2-3 months'
            },
            science: 'Tyler et al. (2014): Progressive strengthening after initial rest most effective.',
            exercises: {
                pre_run: ['hip_flexor_stretch_active', 'leg_swings', 'glute_activation'],
                post_run: ['hip_flexor_stretch', 'quad_stretch', 'psoas_release'],
                rest_day: ['hip_flexor_stretch_kneeling', 'couch_stretch', 'psoas_march', 'dead_bugs', 'hip_circles_large', 'standing_hip_flexion'],
                always: ['sit_less', 'avoid_hills_when_acute']
            }
        },

        gluteus_medius_tendinopathy: {
            name: 'Glute Med Tendinopathy',
            prevalence: '3% of runners',
            description: 'Degeneration of gluteus medius tendon where it attaches to hip.',
            keySymptoms: [
                'Pain on side of hip',
                'Pain lying on side',
                'Hip weakness/Trendelenburg gait',
                'Pain with single leg stance'
            ],
            riskFactors: ['Age 40+', 'Women', 'Weak hip abductors', 'Running on cambered roads'],
            recovery: {
                mild: '4-6 weeks',
                moderate: '3-4 months',
                severe: '6+ months'
            },
            science: 'Mellor et al. (2018): Progressive loading superior to passive treatments.',
            exercises: {
                pre_run: ['glute_activation', 'isometric_hip_abduction', 'hip_circles'],
                post_run: ['glute_stretch', 'IT_band_foam_roll', 'ice_hip'],
                rest_day: ['isometric_wall_press', 'side_lying_leg_raise_isometric', 'clamshells_heavy', 'standing_hip_abduction_isometric', 'single_leg_bridge', 'step_ups_lateral'],
                always: ['avoid_stretching_lateral_hip', 'pillow_between_knees_sleeping']
            }
        },

        // ========== HAMSTRING INJURIES ==========
        hamstring_strain: {
            name: 'Hamstring Strain',
            prevalence: '7% of runners',
            description: 'Strain or partial tear of hamstring muscles, usually during speed work.',
            keySymptoms: [
                'Sudden sharp pain back of thigh',
                'Pain with sprinting',
                'Bruising in severe cases',
                'Weakness with knee flexion'
            ],
            riskFactors: ['Speed work', 'Poor warm-up', 'Fatigue', 'Previous hamstring injury'],
            recovery: {
                grade_1: '1-3 weeks',
                grade_2: '4-8 weeks',
                grade_3: '3-6 months'
            },
            science: 'Askling et al. (2013): Lengthening exercises (L-protocol) faster return than conventional.',
            exercises: {
                pre_run: ['hamstring_sweep', 'leg_swings', 'dynamic_stretching'],
                post_run: ['hamstring_stretch_gentle', 'foam_roll_hamstrings', 'ice_if_acute'],
                rest_day: ['nordic_hamstring_curls', 'romanian_deadlifts_light', 'supine_hamstring_stretch', 'sliding_leg_curls', 'glute_bridges', 'single_leg_deadlifts'],
                always: ['warm_up_thoroughly', 'avoid_overstretching']
            }
        },

        high_hamstring_tendinopathy: {
            name: 'High Hamstring Tendinopathy',
            prevalence: '4% of runners',
            description: 'Chronic irritation where hamstrings attach to sit bone. "Pain in the butt."',
            keySymptoms: [
                'Pain at sit bone',
                'Pain sitting on hard surfaces',
                'Pain during hill running',
                'Deep ache in upper hamstring'
            ],
            riskFactors: ['Speed work', 'Hill training', 'Excessive stretching', 'Sitting on hard surfaces'],
            recovery: {
                typical: '6-12 months', // Notoriously slow healer
                chronic: '12-24 months'
            },
            science: 'Cacchio et al. (2012): Shockwave therapy + eccentric loading shows promise.',
            exercises: {
                pre_run: ['hamstring_activation', 'glute_activation', 'hip_circles'],
                post_run: ['hamstring_flossing', 'glute_stretch_NOT_hamstring', 'ice_sit_bone'],
                rest_day: ['isometric_hip_extension', 'supine_bridge_holds', 'hip_hinge_pattern', 'prone_hip_extension', 'single_leg_bridge_isometric'],
                always: ['avoid_stretching_hamstrings', 'cushioned_seat', 'standing_desk']
            },
            warnings: ['DO NOT stretch - makes it worse', 'Very slow to heal - patience required']
        },

        // ========== BACK INJURIES ==========
        si_joint_dysfunction: {
            name: 'SI Joint Dysfunction',
            prevalence: '3% of runners',
            description: 'Dysfunction of sacroiliac joint where spine meets pelvis.',
            keySymptoms: [
                'One-sided low back/buttock pain',
                'Pain with single leg activities',
                'Pain rolling over in bed',
                'Asymmetrical symptoms'
            ],
            riskFactors: ['Leg length difference', 'Pregnancy', 'Previous back injury', 'Hypermobility'],
            recovery: {
                typical: '4-8 weeks with proper treatment',
                chronic: '3-6 months'
            },
            science: 'Vleeming et al. (2012): Core stability and load transfer exercises most effective.',
            exercises: {
                pre_run: ['pelvic_tilts', 'glute_activation', 'core_activation'],
                post_run: ['cat_cow', 'knee_to_chest_both', 'ice_si_joint'],
                rest_day: ['bird_dogs', 'dead_bugs', 'bridges_with_squeeze', 'clamshells', 'side_plank', 'pallof_press'],
                always: ['see_PT_for_assessment', 'consider_SI_belt']
            }
        },

        lumbar_strain: {
            name: 'Lower Back Strain',
            prevalence: '5% of runners',
            description: 'Strain of muscles or ligaments in lower back from running impact.',
            keySymptoms: [
                'Aching in lower back',
                'Stiffness after long runs',
                'Pain with bending',
                'Muscle spasm'
            ],
            riskFactors: ['Weak core', 'Tight hip flexors', 'Poor running form', 'Excessive sitting'],
            recovery: {
                acute: '1-2 weeks',
                moderate: '4-6 weeks',
                chronic: '2-3 months'
            },
            science: 'McGill (2007): Core stability (not flexibility) key to back health.',
            exercises: {
                pre_run: ['cat_cow', 'pelvic_tilts', 'glute_activation'],
                post_run: ['cat_cow', 'child_pose', 'knee_to_chest'],
                rest_day: ['mcgill_big_3', 'bird_dogs', 'side_planks', 'dead_bugs', 'glute_bridges', 'hip_flexor_stretch'],
                always: ['core_work_regular', 'avoid_sit_ups']
            }
        }
    },
    
    // ==========================================
    // EXERCISE DATABASE (for all injuries)
    // ==========================================
    
    EXERCISES: {
        // ===== FOOT =====
        plantar_stretch: {
            name: 'Plantar Fascia Stretch',
            description: 'Seated, cross ankle over knee, pull toes back toward shin. Hold 30 sec.',
            reps: '10 reps each foot',
            timing: 'pre_run',
            xp: 5,
            science: 'DiGiovanni (2003): 52% improvement vs 22% with Achilles stretching alone'
        },
        foot_roll: {
            name: 'Plantar Roll (Frozen Bottle)',
            description: 'Roll arch on frozen water bottle or lacrosse ball. 2 minutes each foot.',
            reps: '2 min each',
            timing: 'any',
            xp: 5
        },
        towel_scrunches: {
            name: 'Towel Scrunches',
            description: 'Seated, use toes to scrunch towel toward you. Strengthens intrinsic foot muscles.',
            reps: '3 x 20',
            timing: 'rest_day',
            xp: 5
        },
        arch_doming: {
            name: 'Arch Doming (Short Foot)',
            description: 'Seated, try to shorten foot by lifting arch without curling toes. Hold 5 sec.',
            reps: '3 x 10 holds',
            timing: 'rest_day',
            xp: 5
        },
        toe_spreads: {
            name: 'Toe Spreads',
            description: 'Spread toes apart as wide as possible, hold 5 seconds.',
            reps: '3 x 15',
            timing: 'any',
            xp: 3
        },
        marble_pickups: {
            name: 'Marble Pickups',
            description: 'Pick up marbles with toes and place in cup. Builds intrinsic strength.',
            reps: '20 marbles each foot',
            timing: 'rest_day',
            xp: 5
        },

        // ===== CALF / ACHILLES =====
        calf_stretch_gastric: {
            name: 'Gastrocnemius Stretch',
            description: 'Wall stretch, back knee STRAIGHT. Feel stretch in upper calf.',
            reps: '3 x 30 sec each',
            timing: 'any',
            xp: 3
        },
        calf_stretch_soleus: {
            name: 'Soleus Stretch',
            description: 'Wall stretch, back knee BENT. Feel stretch in lower calf near Achilles.',
            reps: '3 x 30 sec each',
            timing: 'any',
            xp: 3
        },
        eccentric_heel_drops: {
            name: 'Eccentric Heel Drops',
            description: 'Stand on step, rise on both feet, lower SLOWLY on injured leg. Key for Achilles.',
            reps: '3 x 15 each leg',
            timing: 'post_run',
            xp: 8,
            science: 'Alfredson (1998): Gold standard for Achilles tendinopathy'
        },
        eccentric_heel_drops_heavy: {
            name: 'Weighted Eccentric Heel Drops',
            description: 'Same as heel drops but holding weights. Progress when bodyweight is easy.',
            reps: '3 x 15 each leg',
            timing: 'rest_day',
            xp: 10
        },
        toe_walks: {
            name: 'Toe Walks',
            description: 'Walk on toes for 30m. Strengthens calves and anterior tibialis.',
            reps: '3 x 30m',
            timing: 'pre_run',
            xp: 5
        },
        heel_walks: {
            name: 'Heel Walks',
            description: 'Walk on heels for 30m. Strengthens tibialis anterior (shin muscle).',
            reps: '3 x 30m',
            timing: 'rest_day',
            xp: 5
        },
        foam_roll_calves: {
            name: 'Calf Foam Roll',
            description: 'Roll calves on foam roller, pausing on tender spots. 2 min each.',
            reps: '2 min each',
            timing: 'post_run',
            xp: 5
        },

        // ===== SHIN =====
        tibialis_raises: {
            name: 'Tibialis Raises',
            description: 'Sit with heels on step, lift toes up. Or standing against wall.',
            reps: '3 x 20',
            timing: 'rest_day',
            xp: 5
        },
        shin_massage: {
            name: 'Shin Self-Massage',
            description: 'Use fingers to massage along tibialis anterior (front/outer shin).',
            reps: '2 min each shin',
            timing: 'post_run',
            xp: 3
        },

        // ===== KNEE =====
        quad_sets_VMO: {
            name: 'Quad Sets (VMO Focus)',
            description: 'Seated, leg straight, tighten quad pushing knee down. Focus on inner quad.',
            reps: '3 x 20 with 5 sec holds',
            timing: 'rest_day',
            xp: 5
        },
        step_downs_slow: {
            name: 'Slow Step Downs',
            description: 'Stand on step, slowly lower opposite heel to floor. Control descent.',
            reps: '3 x 10 each leg',
            timing: 'rest_day',
            xp: 8,
            science: 'Eccentric loading more effective than concentric for PFPS'
        },
        IT_band_foam_roll: {
            name: 'IT Band Foam Roll',
            description: 'Roll outer thigh from hip to knee. Focus on TFL (near hip) not just IT band.',
            reps: '2-3 min each side',
            timing: 'any',
            xp: 5
        },
        clamshells: {
            name: 'Clamshells',
            description: 'Side lying, knees bent, lift top knee keeping feet together. Band above knees.',
            reps: '3 x 15 each side',
            timing: 'rest_day',
            xp: 5
        },
        clamshells_banded: {
            name: 'Banded Clamshells',
            description: 'Clamshells with resistance band above knees. Key for IT band syndrome.',
            reps: '3 x 20 each side',
            timing: 'rest_day',
            xp: 8,
            science: 'Fredericson (2000): Hip abductor strengthening resolves ITBS'
        },
        side_lying_leg_raises: {
            name: 'Side Lying Leg Raises',
            description: 'Side lying, lift top leg to 45 degrees keeping it straight. Control descent.',
            reps: '3 x 15 each side',
            timing: 'rest_day',
            xp: 5
        },
        monster_walks: {
            name: 'Monster Walks',
            description: 'Band around ankles, walk sideways staying in athletic stance.',
            reps: '3 x 20 steps each direction',
            timing: 'rest_day',
            xp: 8
        },
        lateral_band_walks: {
            name: 'Lateral Band Walks',
            description: 'Band above knees, sidestep maintaining tension. Dont let knees cave in.',
            reps: '3 x 15 steps each way',
            timing: 'rest_day',
            xp: 8
        },

        // ===== GLUTE / HIP =====
        glute_bridges: {
            name: 'Glute Bridges',
            description: 'On back, feet flat, squeeze glutes and lift hips. Hold 3 sec at top.',
            reps: '3 x 15',
            timing: 'rest_day',
            xp: 5
        },
        single_leg_bridge: {
            name: 'Single Leg Glute Bridge',
            description: 'Bridge with one leg extended. Much harder, requires control.',
            reps: '3 x 10 each leg',
            timing: 'rest_day',
            xp: 8
        },
        glute_activation: {
            name: 'Glute Activation (Fire Hydrants)',
            description: 'On all fours, lift knee out to side keeping 90 degree bend.',
            reps: '2 x 10 each side',
            timing: 'pre_run',
            xp: 3
        },
        piriformis_stretch: {
            name: 'Piriformis Stretch (Figure 4)',
            description: 'On back, ankle on opposite knee, pull thigh toward chest.',
            reps: '3 x 30 sec each',
            timing: 'any',
            xp: 5
        },
        pigeon_pose: {
            name: 'Pigeon Pose',
            description: 'Front leg bent at 90 degrees, back leg extended. Deep hip stretch.',
            reps: '2 min each side',
            timing: 'rest_day',
            xp: 5
        },
        hip_flexor_stretch: {
            name: 'Hip Flexor Stretch (Kneeling)',
            description: 'Half kneeling, tuck tailbone, lean forward. Feel stretch in front of hip.',
            reps: '3 x 60 sec each',
            timing: 'any',
            xp: 5
        },
        couch_stretch: {
            name: 'Couch Stretch',
            description: 'Knee in corner of couch, foot up the back. Intense hip flexor stretch.',
            reps: '2 min each side',
            timing: 'rest_day',
            xp: 8
        },
        hip_circles: {
            name: 'Hip Circles',
            description: 'Standing on one leg, make large circles with other leg. Both directions.',
            reps: '10 each direction, each leg',
            timing: 'pre_run',
            xp: 3
        },
        standing_hip_abduction: {
            name: 'Standing Hip Abduction',
            description: 'Stand on one leg, lift other leg out to side. Use band for resistance.',
            reps: '3 x 15 each side',
            timing: 'rest_day',
            xp: 5
        },
        hip_hikes: {
            name: 'Hip Hikes',
            description: 'Stand on step on one leg, drop other hip down then hike it up.',
            reps: '3 x 15 each side',
            timing: 'rest_day',
            xp: 5
        },

        // ===== HAMSTRING =====
        hamstring_stretch_gentle: {
            name: 'Gentle Hamstring Stretch',
            description: 'Seated or lying, gentle stretch to hamstrings. Dont overstretch!',
            reps: '3 x 30 sec each',
            timing: 'post_run',
            xp: 3
        },
        nordic_hamstring_curls: {
            name: 'Nordic Hamstring Curls',
            description: 'Kneel, have partner hold ankles, lower slowly to ground using hamstrings.',
            reps: '3 x 5 (progress slowly)',
            timing: 'rest_day',
            xp: 10,
            science: 'Askling (2013): Eccentric training reduces hamstring reinjury by 51%'
        },
        foam_roll_hamstrings: {
            name: 'Hamstring Foam Roll',
            description: 'Roll hamstrings on foam roller or ball, pausing on tender spots.',
            reps: '2 min each leg',
            timing: 'post_run',
            xp: 5
        },

        // ===== CORE =====
        bird_dogs: {
            name: 'Bird Dogs',
            description: 'On all fours, extend opposite arm and leg. Keep spine neutral.',
            reps: '3 x 10 each side',
            timing: 'rest_day',
            xp: 5
        },
        dead_bugs: {
            name: 'Dead Bugs',
            description: 'On back, arms up, knees at 90. Lower opposite arm/leg keeping back flat.',
            reps: '3 x 10 each side',
            timing: 'rest_day',
            xp: 5
        },
        side_planks: {
            name: 'Side Planks',
            description: 'On forearm and side of foot, hold body in straight line.',
            reps: '3 x 30 sec each side',
            timing: 'rest_day',
            xp: 8
        },
        pallof_press: {
            name: 'Pallof Press',
            description: 'Cable or band at chest height, press out and hold against rotation.',
            reps: '3 x 10 each side',
            timing: 'rest_day',
            xp: 8
        },
        cat_cow: {
            name: 'Cat-Cow',
            description: 'On all fours, alternate arching and rounding spine. Gentle mobility.',
            reps: '10 slow cycles',
            timing: 'any',
            xp: 3
        },

        // ===== ANKLE MOBILITY =====
        ankle_mobility: {
            name: 'Ankle Mobility (Wall)',
            description: 'Foot 3 inches from wall, drive knee forward over toes.',
            reps: '3 x 10 each side',
            timing: 'pre_run',
            xp: 3
        },
        ankle_circles: {
            name: 'Ankle Circles',
            description: 'Large circles with ankle in both directions.',
            reps: '10 each direction, each ankle',
            timing: 'pre_run',
            xp: 3
        },
        single_leg_balance: {
            name: 'Single Leg Balance',
            description: 'Stand on one leg for 30-60 sec. Progress to eyes closed, then on pillow.',
            reps: '3 x 30 sec each leg',
            timing: 'any',
            xp: 5
        },

        // ===== GENERAL =====
        ice_arch: { name: 'Ice Arch', description: 'Ice arch for 15 min', reps: '15 min', timing: 'post_run', xp: 3 },
        ice_achilles: { name: 'Ice Achilles', description: 'Ice Achilles for 15 min', reps: '15 min', timing: 'post_run', xp: 3 },
        ice_shins: { name: 'Ice Shins', description: 'Ice shins for 15 min', reps: '15 min', timing: 'post_run', xp: 3 },
        ice_knee: { name: 'Ice Knee', description: 'Ice knee for 15 min', reps: '15 min', timing: 'post_run', xp: 3 },
        ice_hip: { name: 'Ice Hip', description: 'Ice hip for 15 min', reps: '15 min', timing: 'post_run', xp: 3 },
        see_professional: { name: 'See Professional', description: 'This injury may need professional evaluation', reps: 'N/A', timing: 'always', xp: 0 },
        pool_running: { name: 'Pool Running', description: 'Deep water running maintains fitness without impact', reps: '20-40 min', timing: 'rest_day', xp: 10 },
        cycling: { name: 'Cycling (Low Impact)', description: 'Cycling maintains fitness with zero impact', reps: '20-40 min', timing: 'rest_day', xp: 10 },
    },

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    /**
     * Get likely injuries from pain location + timing
     */
    getLikelyInjuries(region, subregion, timing) {
        const painRegion = this.PAIN_REGIONS[region];
        if (!painRegion) return [];
        
        const subReg = painRegion.subregions[subregion];
        if (!subReg) return [];
        
        const injuries = subReg.timing[timing] || [];
        return injuries.map(id => ({
            id,
            injury: this.INJURIES[id]
        })).filter(i => i.injury);
    },

    /**
     * Get exercises for an injury filtered by timing
     */
    getExercisesForInjury(injuryId, timing = 'rest_day') {
        const injury = this.INJURIES[injuryId];
        if (!injury) return [];
        
        const exerciseIds = injury.exercises[timing] || [];
        return exerciseIds.map(id => this.EXERCISES[id]).filter(Boolean);
    },

    /**
     * Get all exercises for today based on injury and cardio plan
     */
    getTodaysRecoveryExercises(injuryId, cardioType = null) {
        const injury = this.INJURIES[injuryId];
        if (!injury) return [];
        
        let exercises = [];
        
        if (cardioType === 'long' || cardioType === 'tempo') {
            // Before hard run: focus on pre-run exercises
            exercises = [
                ...injury.exercises.pre_run,
                ...injury.exercises.always || []
            ];
        } else if (cardioType === 'rest' || !cardioType) {
            // Rest day: do more exercises including rest-day-only
            exercises = [
                ...injury.exercises.rest_day,
                ...injury.exercises.always || []
            ];
        } else {
            // Easy/recovery run: balanced
            exercises = [
                ...injury.exercises.pre_run,
                ...injury.exercises.post_run,
            ];
        }
        
        // Dedupe and limit to 7
        const unique = [...new Set(exercises)];
        return unique.slice(0, 7).map(id => this.EXERCISES[id]).filter(Boolean);
    }
};

// Make globally available
if (typeof window !== 'undefined') {
    window.InjuryDatabase = InjuryDatabase;
}


# Life OS - Feature Checklist (Beta v1.0)

## BETA LAUNCH STATUS
**Version:** v21 (Beta Launch)
**Date:** December 2024
**Status:** Ready for 1-month personal beta testing

---

## MONETIZATION & MARKET ANALYSIS

### Philosophy
This is a personal project first. Monetization is gravy, not the goal. Low/no marketing - organic growth through friends, LinkedIn, Instagram.

### Monetization Path

**Recommended: Freemium + Lifetime Option**

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Local storage only, basic features, 5 AI food logs/day |
| **Pro Monthly** | $4.99/mo | Cloud sync, unlimited AI, advanced stats, priority features |
| **Pro Yearly** | $39.99/yr | Same as monthly (33% discount) |
| **Lifetime** | $79.99 once | Everything forever (early adopter deal) |

**Why this model:**
- Free tier lets friends/family use without friction
- Lifetime captures enthusiasts who hate subscriptions
- Low price point = impulse buy, no buyer's remorse
- Cloud sync is natural paywall (costs us money anyway)

### Revenue Scenarios

| Scenario | Users | Paid % | MRR | ARR |
|----------|-------|--------|-----|-----|
| **Friends Only** | 50 | 0% (free codes) | $0 | $0 |
| **Soft Launch** | 200 | 10% = 20 | $100 | $1,200 |
| **Modest Growth** | 1,000 | 10% = 100 | $500 | $6,000 |
| **Niche Success** | 5,000 | 10% = 500 | $2,500 | $30,000 |
| **Breakout** | 25,000 | 8% = 2,000 | $10,000 | $120,000 |

*Assumes $5 effective ARPU (mix of monthly/yearly/lifetime)*

### Costs at Scale

| Users | Firebase (est.) | Groq API | Total/mo |
|-------|-----------------|----------|----------|
| 100 | Free | Free | $0 |
| 1,000 | Free | Free | $0 |
| 5,000 | ~$25/mo | Free | ~$25 |
| 25,000 | ~$100/mo | ~$50/mo | ~$150 |

**Margin:** 95%+ at most scales (software economics)

### TAM Analysis (Quick)

**Global Fitness App Market:** ~$15B (not relevant, too broad)

**Our Niche:** Gamified, prescriptive fitness tracking for data nerds
- People who want to be TOLD what to do (not customize)
- Respond to XP/streaks/accountability
- Love stats and analytics
- Willing to pay for premium tools

**Realistic Addressable Market:**
- ~500K people globally who would LOVE this exact vibe
- 1% penetration = 5,000 users
- 10% paid = 500 paying users = $2,500/mo

**Comps:**
- Strong (habit tracker): ~$2M ARR, similar vibe
- MacroFactor (nutrition): ~$3M ARR, data-nerd audience
- Hevy (workout tracker): ~$5M ARR, gym bros

**Realistic Ceiling:** $50K-$200K ARR as a solo/small project
**Lottery Ticket:** If it goes viral in fitness Reddit/Twitter, could 10x

### Launch Plan (Low Effort)

1. **Beta (Now):** Personal use, iron out bugs
2. **Friends & Family:** Free codes, gather feedback
3. **Soft Launch:** LinkedIn + Instagram post, Product Hunt maybe
4. **Organic Growth:** Let it spread naturally, no paid marketing
5. **If Traction:** Consider App Store listing, light SEO

### Bottom Line

| Metric | Conservative | Optimistic |
|--------|--------------|------------|
| Year 1 Users | 500 | 5,000 |
| Year 1 Revenue | $1,000 | $15,000 |
| Effort Required | 2 hrs/week maintenance | 5 hrs/week |
| ROI | Fun project that pays for itself | Nice side income |

**This isn't a business - it's a tool you built for yourself that might make beer money.**

---

## FREE TIER LIMITS (Monthly)

### Firebase (Spark Plan - FREE)
- **Firestore reads:** 50,000/day = ~1.5M/month 
- **Firestore writes:** 20,000/day = ~600K/month 
- **Storage:** 1GB 
- **Auth:** Unlimited anonymous users 
- **Estimated usage:** ~100 writes/day = 3,000/month (well under limit)

### Groq API (FREE)
- **Rate limit:** 30 requests/minute, 14,400 requests/day 
- **Token limit:** Varies by model, but generous for our use
- **Estimated usage:** 
  - Food logging: ~5-10 requests/day
  - Morning/evening briefings: 2 requests/day (cached)
  - **Total:** ~12 requests/day = ~360/month (well under limit)

**Conclusion:**  1 month of testing easily within free tiers

---

## Core Features (ALL COMPLETE)

### Data & State 
- [x] Local storage persistence
- [x] Data backup to clipboard
- [x] Data restore from clipboard
- [x] JSON export
- [x] Auto-save on every change
- [x] Midnight auto-reset for new day
- [x] Firebase cloud sync
- [x] Anonymous authentication
- [x] Multi-device support
- [x] Sync indicator UI

### Onboarding 
- [x] Weight, height, age input
- [x] Target weight input
- [x] Auto-calculate TDEE, calories, protein, carbs, fats
- [x] Posture assessment
- [x] Running goal selection (optional)
- [x] Injury selection for running program

### Daily View 
- [x] Header with XP, level, streak
- [x] AI morning/evening briefings
- [x] Nutrition summary (tap to Food tab)
- [x] Accountability score bar
- [x] Volume alerts (MEV/MRV warnings)
- [x] Workout debt section
- [x] Daily insight messages
- [x] Today's workout with LOG buttons
- [x] Running section (if goal set)
- [x] Reading section
- [x] Alcohol recovery warning

### Food Tab 
- [x] AI food logger with Groq
- [x] Meal time selector (AM/Noon/PM/Late)
- [x] Leucine threshold tracking
- [x] Calorie/protein/carbs/fats tracking
- [x] Meal log with timestamps
- [x] Food quality scoring (CLEAN/OK/PROCESSED)
- [x] Smart insights (veggies, sodium, protein distribution)
- [x] Progress feedback when logging
- [x] Alcohol auto-detection

### Progressive Overload Tracking 
- [x] Log weight � reps � sets
- [x] Calculate estimated 1RM
- [x] "Last time" stats when logging
- [x] Progression suggestions
- [x] Set-by-set guidance
- [x] Weight increment buttons
- [x] PR detection + bonus XP
- [x] Weekly volume per muscle group
- [x] MEV/MAV/MRV indicators
- [x] Deload detection

### Running Engine 
- [x] VDOT calculation from race time
- [x] Training paces (Easy/Tempo/Interval/Repetition/Marathon)
- [x] Periodized phases (Base/Build/Peak/Taper)
- [x] Daily run prescriptions
- [x] "How it should feel" guidance
- [x] Science explanations
- [x] Run logging modal
- [x] Weekly mileage tracking
- [x] Track status indicator
- [x] Tomorrow preview
- [x] 80/20 polarized tracking
- [x] Race predictor (5K/10K/Half/Marathon)

### Reading Module 
- [x] Current book tracking
- [x] Page progress
- [x] Completed books list
- [x] XP for reading + book completion

### Alcohol Tracker 
- [x] Log drinks
- [x] Science-based warnings
- [x] XP penalty
- [x] 48-hour recovery tracking

### Stats View 
- [x] Protein distribution analysis (after 7+ days)
- [x] "What Predicts Your Success" correlations
- [x] Fun stats (total protein, workouts, PRs, etc.)
- [x] Weight progress + prediction
- [x] Volume tracker dashboard
- [x] Deload recommendations
- [x] Progress forecast
- [x] 7-day averages
- [x] Week grid
- [x] All-time stats
- [x] Running dashboard

### Skills View 
- [x] 4 skill trees (Strength, Discipline, Nutrition, Recovery)
- [x] XP tracking per skill
- [x] Level progression per skill

### Profile View 
- [x] Level ring with progress
- [x] Stats grid
- [x] Goals display + edit (with macro breakdown)
- [x] Posture issues management
- [x] Running program setup
- [x] Cloud sync status
- [x] Backup/restore/export

### XP System 
- [x] Base XP for exercises (5-25 XP)
- [x] Streak multipliers (up to 2x at 30 days)
- [x] Skill-specific XP allocation
- [x] PR bonus XP (50 XP)
- [x] Food logging XP (5 XP per meal)
- [x] Leucine threshold bonus (3 XP)
- [x] Protein goal hit bonus (20 XP)
- [x] Reading XP (10 per session, 50 per book)
- [x] Run completion XP (25-40 XP)
- [x] Alcohol penalty (-25 XP per drink)
- [x] Missed day penalty (-15 XP)

### PWA / iPhone Ready 
- [x] manifest.json
- [x] Standalone display mode
- [x] Dark theme
- [x] iOS safe areas
- [x] Midnight reset
- [x] Offline-first (localStorage)
- [x] Sync when online

---

## KNOWN LIMITATIONS (for beta)

1. **Multi-user:** Currently single-user per Firebase project. To share with friends later, they'll need their own Firebase project or we'll need to add proper user auth.

2. **PWA Icons:** Using SVG icon (works on most devices, may need PNG fallbacks for older iOS).

3. **Groq API Key:** Users need their own key from console.groq.com (free)

4. **Data Portability:** Can export JSON, but no import from other apps

---

## Future Roadmap (Post-Beta)

---

### DESIGN PHILOSOPHY
**The app is the trainer.** Users don't customize workouts - they show up and get prescribed what to do. Prescriptive, not permissive.

---

### Near Term (Priority)

#### Recovery System
- [ ] Pain level tracking (1-10 scale, by body area)
- [ ] Fatigue/readiness score
- [ ] Auto-suggest rest days when recovery is low
- [ ] Adjust prescribed workout volume based on recovery state
- [ ] "How do you feel?" morning check-in
- [ ] Recovery impacts day score expectations

#### Exercise Substitution Database (NOT AI)
- [ ] Expand existing `alternatives` mapping in config.js
- [ ] Comprehensive swap options for every exercise
- [ ] Organized by: equipment available, injury-safe, difficulty level
- [ ] One-tap swap from pre-approved list
- [ ] Injury-aware suggestions (e.g., hip injury � no squats in swap list)

#### More Chronic Injuries
- [ ] Knee pain (patella, ACL recovery, meniscus)
- [ ] Shoulder impingement
- [ ] Lower back pain
- [ ] Rotator cuff issues
- [ ] Elbow tendinitis
- [ ] Ankle instability
- Each injury affects exercise selection + adds rehab/prehab exercises

#### Additional Cardio Types
- [ ] Cycling (distance/time/intensity tracking)
- [ ] Walking (for non-runners, step goals)
- [ ] Swimming (laps/distance)
- [ ] Yoga/mobility sessions (guided routines)

#### UI Polish
- [ ] Workout duration timer on Today tab
- [ ] Heat map calendar (GitHub-style activity)
- [ ] Achievement badges

### Medium Term
- [x] Email/password authentication  DONE
- [ ] Share progress with friends
- [ ] Native iOS app wrapper
- [ ] Apple Health integration
- [ ] Weekly quests/challenges

### Long Term
- [ ] Social features / accountability partners
- [ ] Wearable integrations (Apple Watch, etc.)

---

### "Adaptive Mode" (Tabled - Future)
Special mode for users with significant physical limitations (e.g., 62yo with hip replacement candidate)

**Features:**
- [ ] Age-based workout adjustments
- [ ] Serious injury accommodations (joint replacements, chronic conditions)
- [ ] Walking replaces running entirely
- [ ] Lower-impact exercise alternatives only
- [ ] Modified scoring system (adjusted expectations)
- [ ] Pain level tracking (affects workout intensity)
- [ ] Balance/fall prevention exercises
- [ ] Physical therapy exercise integration

**Use case:** Older user with hip pain, walks daily, lifts with modifications. Needs:
- No running, walking-focused cardio
- Hip-friendly exercises only (no squats/lunges)
- Lower volume expectations
- Gentler accountability

---

### NOT Building (By Design)
-  Progress photos - not core to the experience
-  Body measurements - too much tracking, monthly weigh-ins show progress
-  Custom exercises - we prescribe, users execute
-  Workout templates - we ARE the template
-  AI-driven exercise swaps - use curated database instead

---

## Files

| File | Purpose | Status |
|------|---------|--------|
| index.html | App shell |  |
| manifest.json | PWA config |  |
| icon.svg | App icon |  |
| css/styles.css | All styles |  |
| js/firebase-config.js | Firebase setup |  |
| js/config.js | Static config |  |
| js/state.js | Data management |  |
| js/utils.js | Calculations |  |
| js/app.js | Main init |  |
| js/ai-nutrition.js | AI food logger |  |
| js/ui/daily.js | Daily view |  |
| js/ui/food.js | Food tab |  |
| js/ui/stats.js | Stats view |  |
| js/ui/skills.js | Skills view |  |
| js/ui/profile.js | Profile view |  |
| js/ui/onboarding.js | Onboarding |  |
| js/ui/running.js | Running module |  |
| js/ui/reading.js | Reading tracker |  |
| js/ui/alcohol.js | Alcohol tracker |  |
| js/components/* | UI components |  |

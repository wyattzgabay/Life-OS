# Life OS � Startup Engineering Plan
## From Disorganized Alpha � Organized Beta V1

**Created:** December 2025  
**Status:** Alpha � Beta Transition Planning

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit)
3. [Core Feature Definition](#3-core-feature-definition)
4. [Technical Debt Assessment](#4-technical-debt-assessment)
5. [Architecture Recommendations](#5-architecture-recommendations)
6. [Proposed File Structure](#6-proposed-file-structure)
7. [Beta V1 Roadmap](#7-beta-v1-roadmap)
8. [Development Phases](#8-development-phases)
9. [Quality Gates](#9-quality-gates)
10. [Next Steps](#10-next-steps)

---

## 1. Executive Summary

### What We Have
A functional fitness tracking PWA with ~26,000 lines of code covering:
- Workout programming with volume tracking
- Running program (5K to Marathon)
- AI-powered nutrition logging
- XP/gamification system
- Firebase cloud sync

### What We Need
- Clean, modular codebase
- Clear separation of concerns
- Proper documentation
- Test coverage
- Performance optimization
- Production-ready deployment

### The Goal
**Beta V1:** A polished, stable app ready for 50-100 external testers with:
- Zero data loss guarantees
- Smooth UX
- Core features working flawlessly
- Clear upgrade path to V2

---

## 2. Current State Audit

### 2.1 Codebase Statistics

| Category | Files | Lines | Notes |
|----------|-------|-------|-------|
| JavaScript | 19 | ~19,200 | Core application |
| CSS | 1 | 7,042 | Single monolithic file |
| HTML | 3 | ~250 | index, admin, test |
| Docs | 3 | ~800 | PRODUCT_SPEC, CURRENT_SYSTEM, FEATURES |
| **Total** | **26** | **~27,300** | |

### 2.2 File Size Analysis (Problem Areas)

| File | Lines | Issue | Action |
|------|-------|-------|--------|
| `state.js` | 1,937 | Too large, mixed concerns | Split into modules |
| `running.js` | 1,188 | Monolithic | Extract engine logic |
| `profile.js` | 1,210 | UI + logic mixed | Separate concerns |
| `utils.js` | 1,157 | Utility grab-bag | Categorize functions |
| `styles.css` | 7,042 | Single file | Split by component |
| `lift-logger.js` | 693 | Acceptable but complex | Refactor modal logic |

### 2.3 Code Quality Issues

| Issue | Count | Priority |
|-------|-------|----------|
| `console.log` statements | 58 | High - Remove before beta |
| TODO/FIXME comments | 5 | Medium - Address or document |
| Dead code | Unknown | Medium - Audit needed |
| Missing error handling | Many | High - Add try/catch |
| No TypeScript | - | Low - Consider for V2 |
| No tests | 0 | High - Add critical path tests |

### 2.4 Feature Inventory

** Implemented & Working:**
- Daily workout display
- Exercise logging (sets/reps/weight)
- Volume tracking (MEV/MAV/MRV)
- Double progression suggestions
- Exercise swaps
- Running program (multi-goal)
- VDOT pace calculator
- AI food logging (Groq)
- XP & leveling system
- Streak tracking
- Firebase cloud sync
- Email/password auth
- Day scoring
- Weekly stats view
- Profile management
- Demo mode

** Partially Working:**
- Deload recommendations (logic exists, UI unclear)
- Running injuries (data exists, limited integration)
- Skill trees (UI exists, rewards not connected)
- AI briefings (disabled, not adding value)

** Not Implemented:**
- Age-adjusted programming
- Chronic injury system
- Intra-workout adjustments
- Cross-domain feedback
- Personal MRV learning
- Push notifications
- Offline mode (proper service worker)
- Data export

---

## 3. Core Feature Definition

### 3.1 Beta V1 Core Features (Must Have)

These features MUST work flawlessly for Beta V1:

| # | Feature | Current Status | Work Needed |
|---|---------|----------------|-------------|
| 1 | **Workout Display** |  Working | Polish UI |
| 2 | **Exercise Logging** |  Working | Fix edge cases |
| 3 | **Progression Suggestions** |  Working | Improve messaging |
| 4 | **Volume Tracking** |  Working | Add visual indicators |
| 5 | **Running Program** |  Working | Simplify UI |
| 6 | **Food Logging (AI)** |  Working | Error handling |
| 7 | **Daily Score** |  Working | Verify calculations |
| 8 | **Cloud Sync** |  Working | Add offline queue |
| 9 | **User Auth** |  Working | Add password reset |
| 10 | **Data Persistence** |  Fragile | Bulletproof backup |

### 3.2 Beta V1 Nice-to-Have

| # | Feature | Priority | Effort |
|---|---------|----------|--------|
| 1 | Dark mode toggle | Medium | Low |
| 2 | Data export (JSON) | High | Low |
| 3 | Password reset | High | Medium |
| 4 | Improved onboarding | Medium | Medium |
| 5 | Widget/summary view | Low | High |

### 3.3 V2 Features (Post-Beta)

| # | Feature | Complexity |
|---|---------|------------|
| 1 | Age-adjusted programming | High |
| 2 | Injury intelligence system | High |
| 3 | TrainingState closed-loop | Very High |
| 4 | Intra-workout RPE adjustments | High |
| 5 | Cross-domain feedback | High |
| 6 | Personal MRV/MEV learning | Very High |
| 7 | Push notifications | Medium |
| 8 | Apple Watch integration | Very High |

---

## 4. Technical Debt Assessment

### 4.1 Critical (Fix Before Beta)

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| 58 console.log | Multiple | Performance, security | Remove all |
| No error boundaries | All UI | Crashes white-screen app | Add try/catch in render |
| Mixed concerns in state.js | state.js | Hard to maintain | Split into modules |
| Hardcoded API key | ai-nutrition.js | Security risk | Move to env/config |
| No input validation | Forms | Data corruption | Add validation |
| Date handling fragile | Multiple | Timezone bugs | Standardize with library |

### 4.2 Important (Fix During Beta)

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| Single CSS file | styles.css | Hard to maintain | Split by component |
| No loading states | UI | Poor UX | Add skeletons/spinners |
| No offline handling | App | Data loss risk | Add service worker |
| Magic numbers | config.js, utils.js | Hard to understand | Document or extract |

### 4.3 Low Priority (V2)

| Issue | Impact | Notes |
|-------|--------|-------|
| No TypeScript | Type safety | Consider for V2 rewrite |
| No unit tests | Quality | Add for critical paths |
| No CI/CD | Deployment | Set up GitHub Actions |

---

## 5. Architecture Recommendations

### 5.1 Current Architecture

```
����������������������������������������������������
��                   index.html                     ��
��            (Single page, all inline)             ��
����������������������������������������������������
                        ��
        �����������������������������������
        �               �               �
   ������������    �������������    �������������
   �� app.js  ��    �� state.js ��    �� config.js��
   �� (init)  ��    �� (1937 ln)��    �� (static) ��
   ������������    �������������    �������������
        ��               ��
        �               �
   ������������������������������������������������
   ��              UI Components                   ��
   ��  daily.js, food.js, running.js, profile.js  ��
   ��        (tightly coupled to State)           ��
   ������������������������������������������������
```

**Problems:**
- State.js is a god object (1937 lines)
- UI components directly mutate state
- No clear data flow
- Hard to test in isolation

### 5.2 Recommended Architecture (Beta V1)

```
����������������������������������������������������
��                   index.html                     ��
����������������������������������������������������
                        ��
                        �
                 �����������������
                 ��    App.js    ��
                 ��  (Router +   ��
                 ��   Lifecycle) ��
                 �����������������
                        ��
        �����������������������������������
        �               �               �
 ���������������� ���������������� ����������������
 ��   Services  �� ��    State    �� ��   Config    ��
 �� ����������  �� �� ����������  �� �� ����������  ��
 �� � Firebase  �� �� � UserData  �� �� � Workouts  ��
 �� � AI/Groq   �� �� � Storage   �� �� � Levels    ��
 �� � Analytics �� �� � Sync      �� �� � Running   ��
 ���������������� ���������������� ����������������
        ��               ��               ��
        �����������������������������������
                        �
              ���������������������
              ��   UI Components  ��
              �� (Render only,    ��
              ��  call services)  ��
              ���������������������
```

**Benefits:**
- Clear separation of concerns
- Services can be tested independently
- UI components are pure renderers
- Easier to add features

---

## 6. Proposed File Structure

### 6.1 Current Structure
```
life-os-app/
��� index.html
��� admin.html
��� test.html
��� manifest.json
��� css/
��   ���� styles.css (7042 lines - monolithic)
��� js/
��   ��� app.js
��   ��� state.js (1937 lines - god object)
��   ��� config.js
��   ��� utils.js (1157 lines - grab bag)
��   ��� firebase-config.js
��   ��� ai-nutrition.js
��   ��� demo-mode.js
��   ��� components/
��   ��   ��� header.js
��   ��   ��� lift-logger.js
��   ��   ��� logger.js
��   ��   ���� workout.js
��   ���� ui/
��       ��� daily.js
��       ��� food.js
��       ��� running.js
��       ��� profile.js
��       ��� stats.js
��       ��� onboarding.js
��       ��� alcohol.js
��       ��� reading.js
��       ���� skills.js
���� docs/
    ��� PRODUCT_SPEC.md
    ��� CURRENT_SYSTEM.md
    ���� FEATURES.md
```

### 6.2 Proposed Structure (Beta V1)
```
life-os-app/
��� index.html
��� admin.html
��� manifest.json
��� package.json (NEW - for versioning)
��� CHANGELOG.md (NEW)
��� README.md (NEW)
��
��� assets/
��   ��� icons/
��   ��   ��� icon-180.png
��   ��   ��� icon-192.png
��   ��   ���� icon-512.png
��   ���� images/
��
��� css/
��   ��� base/
��   ��   ��� reset.css
��   ��   ��� variables.css (colors, spacing, fonts)
��   ��   ���� typography.css
��   ��� components/
��   ��   ��� buttons.css
��   ��   ��� cards.css
��   ��   ��� forms.css
��   ��   ��� modals.css
��   ��   ���� navigation.css
��   ��� views/
��   ��   ��� daily.css
��   ��   ��� food.css
��   ��   ��� running.css
��   ��   ��� profile.css
��   ��   ���� stats.css
��   ���� main.css (imports all)
��
��� js/
��   ��� app.js (entry point, router)
��   ��
��   ��� config/
��   ��   ��� index.js (exports all)
��   ��   ��� workouts.js
��   ��   ��� running.js
��   ��   ��� levels.js
��   ��   ��� nutrition.js
��   ��   ���� constants.js
��   ��
��   ��� services/
��   ��   ��� firebase.js (auth + firestore)
��   ��   ��� storage.js (localStorage + IndexedDB)
��   ��   ��� ai.js (Groq API)
��   ��   ���� analytics.js (future)
��   ��
��   ��� state/
��   ��   ��� index.js (main state manager)
��   ��   ��� user.js (profile, goals)
��   ��   ��� workouts.js (lift history, PRs)
��   ��   ��� running.js (run logs, program)
��   ��   ��� nutrition.js (meals, macros)
��   ��   ���� sync.js (cloud sync logic)
��   ��
��   ��� engines/
��   ��   ��� workout-engine.js (volume calc, progression)
��   ��   ��� running-engine.js (paces, phases, scheduling)
��   ��   ���� scoring-engine.js (XP, daily score)
��   ��
��   ��� components/
��   ��   ��� Header.js
��   ��   ��� Navigation.js
��   ��   ��� LiftLogger.js
��   ��   ��� WorkoutCard.js
��   ��   ��� RunCard.js
��   ��   ��� MealCard.js
��   ��   ���� Modal.js
��   ��
��   ��� views/
��   ��   ��� DailyView.js
��   ��   ��� FoodView.js
��   ��   ��� RunningView.js
��   ��   ��� ProfileView.js
��   ��   ��� StatsView.js
��   ��   ���� OnboardingView.js
��   ��
��   ���� utils/
��       ��� date.js (date helpers)
��       ��� format.js (number/string formatting)
��       ��� validation.js (input validation)
��       ���� dom.js (DOM helpers)
��
��� docs/
��   ��� PRODUCT_SPEC.md
��   ��� CURRENT_SYSTEM.md
��   ��� ARCHITECTURE.md (NEW)
��   ��� API.md (NEW - internal API docs)
��   ���� CONTRIBUTING.md (NEW)
��
���� tests/ (NEW - for V2)
    ��� unit/
    ���� integration/
```

---

## 7. Beta V1 Roadmap

### 7.1 Timeline Overview

```
Week 1-2: Cleanup & Stabilization
Week 3-4: Refactoring & Organization  
Week 5-6: Polish & Testing
Week 7-8: Beta Launch & Monitoring
```

### 7.2 Milestone Definitions

| Milestone | Target | Criteria |
|-----------|--------|----------|
| **M1: Code Cleanup** | Week 2 | 0 console.logs, dead code removed |
| **M2: Structure** | Week 4 | New file structure, split state.js |
| **M3: Core Polish** | Week 6 | Top 10 features bug-free |
| **M4: Beta Launch** | Week 8 | 50 external testers onboarded |

### 7.3 Feature Freeze

**Beta V1 Feature Freeze: End of Week 4**

After Week 4, no new features. Only:
- Bug fixes
- Performance improvements
- UX polish

---

## 8. Development Phases

### Phase 1: Cleanup (Week 1-2)

**Goal:** Remove technical debt, stabilize existing code

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Remove all console.log (58) | P0 | 2h | - |
| Audit and remove dead code | P0 | 4h | - |
| Add error boundaries to all views | P0 | 4h | - |
| Fix known bugs (list TBD) | P0 | 8h | - |
| Add input validation | P1 | 4h | - |
| Standardize date handling | P1 | 4h | - |
| Document all CONFIG values | P1 | 2h | - |

**Deliverable:** Clean, stable codebase with no obvious issues

### Phase 2: Refactoring (Week 3-4)

**Goal:** Reorganize code into modular structure

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Split state.js into modules | P0 | 8h | - |
| Split utils.js by category | P0 | 4h | - |
| Create services layer | P0 | 6h | - |
| Split CSS into components | P1 | 6h | - |
| Create config modules | P1 | 4h | - |
| Extract workout engine | P1 | 4h | - |
| Extract running engine | P1 | 4h | - |

**Deliverable:** Modular codebase matching proposed structure

### Phase 3: Polish (Week 5-6)

**Goal:** Perfect the core user experience

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Fix all UI edge cases | P0 | 8h | - |
| Add loading states | P0 | 4h | - |
| Improve error messages | P0 | 4h | - |
| Add data export feature | P1 | 4h | - |
| Performance audit | P1 | 4h | - |
| Accessibility audit | P2 | 4h | - |
| Cross-browser testing | P1 | 4h | - |

**Deliverable:** Polished app ready for external users

### Phase 4: Beta Launch (Week 7-8)

**Goal:** Onboard testers, monitor, iterate

| Task | Priority | Effort | Owner |
|------|----------|--------|-------|
| Create onboarding guide | P0 | 2h | - |
| Set up feedback system | P0 | 2h | - |
| Recruit 50 beta testers | P0 | 4h | - |
| Monitor Firebase/errors | P0 | Ongoing | - |
| Triage and fix critical bugs | P0 | Ongoing | - |
| Collect and prioritize feedback | P1 | Ongoing | - |

**Deliverable:** Live beta with active users and feedback loop

---

## 9. Quality Gates

### 9.1 Code Quality Checklist

Before any code is merged:

- [ ] No console.log statements
- [ ] No hardcoded values (use CONFIG)
- [ ] Error handling for all async operations
- [ ] Input validation on all forms
- [ ] Works on mobile (iOS Safari)
- [ ] Works on desktop (Chrome)
- [ ] No UI crashes on edge cases

### 9.2 Beta Launch Checklist

Before Beta V1 launch:

- [ ] All P0 bugs fixed
- [ ] Data persistence verified (multi-day test)
- [ ] Cloud sync verified (multi-device test)
- [ ] Onboarding flow tested (new user test)
- [ ] Core features documented
- [ ] Feedback system working
- [ ] Admin panel functional
- [ ] 10+ internal test sessions completed

### 9.3 Definition of Done

A feature is "done" when:

1. Code is clean and follows conventions
2. Works on iOS Safari + Chrome desktop
3. Edge cases handled gracefully
4. No console errors
5. Tested by someone other than the developer

---

## 10. Next Steps

### Immediate Actions (This Week)

1. **Review and approve this plan**
2. **Create GitHub Issues for Phase 1 tasks**
3. **Set up project board (Kanban)**
4. **Begin console.log removal**
5. **Create bug list for known issues**

### Decision Points

| Decision | Options | Recommendation |
|----------|---------|----------------|
| TypeScript migration? | Now vs V2 | V2 (too disruptive now) |
| Testing framework? | Jest vs none | Add basic tests in Phase 2 |
| CI/CD setup? | Now vs later | Later (manual deploy for now) |
| Analytics? | Now vs later | Later (focus on core) |

### Questions to Answer

1. Who are the 50 beta testers? (Friends, fitness communities?)
2. What's the feedback collection method? (In-app, form, Discord?)
3. What metrics define beta success? (DAU, retention, NPS?)
4. What's the budget for beta? (Firebase costs, etc.)

---

## Appendix A: Current Bug List

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | TBD - need to audit | - | - |

*To be populated during Phase 1 audit*

---

## Appendix B: Key Metrics to Track

| Metric | Current | Beta Target | How to Measure |
|--------|---------|-------------|----------------|
| Daily Active Users | ~2 | 20+ | Firebase Analytics |
| Session Duration | Unknown | 5+ min | Firebase Analytics |
| Data Loss Incidents | Unknown | 0 | User reports |
| Crash Rate | Unknown | <1% | Error monitoring |
| Feature Completion Rate | Unknown | 70%+ | In-app tracking |

---

*This document is the source of truth for the Beta V1 transition. Update as decisions are made.*


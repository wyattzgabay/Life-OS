# Life OS

**Your Adaptive Training Operating System**

Life OS is an intelligent fitness platform that prescribes workouts, guides injury adaptation, and builds programming around your goals. It learns from your performance and adjusts in real-time.

---

## What It Does

Life OS combines strength training, running programs, and nutrition tracking into one unified system:

**Intelligent Workout Programming**
- Science-based weekly structure with volume tracking
- MEV/MAV/MRV thresholds per muscle group (Renaissance Periodization methodology)
- Double progression model with automatic weight/rep suggestions
- Exercise alternatives for equipment flexibility

**Running Programs**
- 5K through Marathon training plans
- VDOT-based pace calculations (Daniels' Running Formula)
- Periodized phases: Base, Build, Peak, Taper
- Injury protocols with pre/post-run routines

**Nutrition Intelligence**
- AI-powered food logging via natural language
- Protein and leucine threshold tracking
- Macro breakdown with meal history

**Adaptive Engine**
- Deload recommendations based on training history
- Volume adjustments mid-week if approaching MRV
- Exercise swaps stored per session
- Running/lifting schedule coordination to prevent interference

---

## Technical Overview

| Component | Implementation |
|-----------|----------------|
| Frontend | Vanilla JavaScript (ES6+), CSS3 |
| Storage | localStorage + IndexedDB (triple backup) |
| Cloud | Firebase Authentication + Firestore |
| AI | Groq API (Llama model) |
| Deployment | GitHub Pages (PWA) |

**Codebase:** ~26,000 lines across 26 files

---

## Installation

**For Users:**
1. Open in Safari (iOS) or Chrome (Android/Desktop)
2. Add to Home Screen for native app experience
3. Create account to enable cloud sync

**For Development:**
```bash
git clone https://github.com/wyattzgabay/Life-OS.git
cd Life-OS
python3 -m http.server 8000
# Visit http://localhost:8000
```

---

## Version History

| Version | Status | Notes |
|---------|--------|-------|
| 0.1.0-alpha | Stable | Current testers on main branch |
| 0.2.0-beta | In Development | beta-v1 branch |

---

## Documentation

- `STARTUP_PLAN.md` - Engineering roadmap and phase planning
- `CURRENT_SYSTEM.md` - Technical documentation of all features and values
- `PRODUCT_SPEC.md` - V2 feature specifications
- `CHANGELOG.md` - Version history

---

## Core Values

**Prescriptive, Not Passive**
Life OS tells you what to do. It is not a blank tracker waiting for input.

**Science-Based**
Every recommendation cites exercise science literature. Volume landmarks from Renaissance Periodization. Running paces from Daniels' VDOT. Progression models from evidence-based practice.

**Adaptive**
The system responds to your data. Miss volume targets? It adjusts. Approaching MRV? It scales back. Injury flagged? It modifies movements.

**No Fluff**
No motivational quotes. No social features. No gamification theater. Just intelligent programming that helps you get stronger.

---

Built for serious training.

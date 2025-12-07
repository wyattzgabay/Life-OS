# Life OS

> An adaptive fitness operating system that combines strength training, running programs, and nutrition tracking into one intelligent platform.

[![Version](https://img.shields.io/badge/version-0.1.0--alpha-orange)]()
[![Status](https://img.shields.io/badge/status-alpha-yellow)]()
[![Platform](https://img.shields.io/badge/platform-PWA-blue)]()

---

## 🎯 What is Life OS?

Life OS is a Progressive Web App (PWA) that provides:

- **Smart Workout Programming** — Weekly strength training with volume tracking (MEV/MAV/MRV)
- **Running Programs** — 5K to Marathon training with VDOT-based pacing
- **AI Nutrition Logging** — Natural language food logging with macro tracking
- **Gamification** — XP, levels, streaks, and skill trees to keep you motivated
- **Cloud Sync** — Your data backed up and synced across devices

## 📱 Live Demo

**Production:** [https://wyattzgabay.github.io/Life-OS/](https://wyattzgabay.github.io/Life-OS/)

**Demo Mode:** [https://wyattzgabay.github.io/Life-OS/?demo](https://wyattzgabay.github.io/Life-OS/?demo)

## 🚀 Quick Start

### For Users

1. Open the link above in **Safari** (iOS) or **Chrome** (Android/Desktop)
2. Tap **Share → Add to Home Screen** for the full app experience
3. Create an account to enable cloud sync
4. Complete onboarding to set your goals

### For Developers

```bash
# Clone the repository
git clone https://github.com/wyattzgabay/Life-OS.git
cd Life-OS

# No build required - it's vanilla JS!
# Open index.html in a browser or use a local server:
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## 🏗️ Architecture

```
life-os-app/
├── index.html          # Single-page app entry
├── manifest.json       # PWA manifest
├── css/
│   └── styles.css      # All styles (7000+ lines)
├── js/
│   ├── app.js          # App initialization & routing
│   ├── state.js        # Data management & persistence
│   ├── config.js       # Static configuration
│   ├── utils.js        # Utility functions
│   ├── firebase-config.js  # Firebase setup
│   ├── ai-nutrition.js     # Groq AI integration
│   ├── components/     # Reusable UI components
│   └── ui/             # View-specific code
└── docs/               # Documentation
```

## ✨ Features

### Core Features (Working)
| Feature | Description |
|---------|-------------|
| 📊 **Volume Tracking** | MEV/MAV/MRV per muscle group with smart adjustments |
| 📈 **Progression System** | Double progression model (6-12 rep range) |
| 🏃 **Running Programs** | 5K, 10K, Half, Marathon with VDOT pacing |
| 🍎 **AI Food Logging** | Natural language → macro breakdown |
| ⚡ **XP & Levels** | Gamified progress tracking |
| ☁️ **Cloud Sync** | Firebase-backed data persistence |

### Planned Features (V2)
- Age-adjusted programming
- Injury intelligence system
- Intra-workout RPE adjustments
- Personal MRV/MEV learning

## 📊 Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JavaScript (ES6+) |
| Styling | CSS3 with CSS Variables |
| Storage | localStorage + IndexedDB |
| Cloud | Firebase (Auth + Firestore) |
| AI | Groq API (Llama) |
| Hosting | GitHub Pages |

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [STARTUP_PLAN.md](./STARTUP_PLAN.md) | Roadmap from Alpha → Beta |
| [CURRENT_SYSTEM.md](./CURRENT_SYSTEM.md) | Technical documentation of all features |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) | V2 feature specifications |
| [FEATURES.md](./FEATURES.md) | Feature overview |

## 🧪 Development Status

**Current Version:** 0.1.0-alpha

| Phase | Status | Target |
|-------|--------|--------|
| Alpha | ✅ Current | Dec 2024 |
| Beta V1 | 🔄 In Progress | Jan 2025 |
| Public Beta | ⏳ Planned | Feb 2025 |
| V1.0 Release | ⏳ Planned | Q2 2025 |

## 🤝 Contributing

This is currently a private project in development. Contributions are not yet open.

## 📄 License

All rights reserved. This project is not open source.

---

**Built with 💪 by the Life OS team**


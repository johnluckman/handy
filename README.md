# 📱 Handy – In-Store Tools for Sales Assistants

Handy is a modular mobile app for sales assistants to quickly access a suite of in-store tools from a shared iPhone. The app is designed as a front-page "toolkit" where each tool can be launched individually. Tools are modular and should be housed in their own folders, so they can be added or removed independently without breaking the app.

## 🔐 Authentication & User Management

The app uses a simple username-based login system for the shared device:
- **Simple Username Login**: Staff can log in with just their username
- **Local Authentication**: No external authentication servers required
- **Shared Device**: Multiple users can use the same iPhone throughout the day
- **Session Tracking**: Basic session management to track which user performed actions

## 🚀 Features (Planned)

Each of these will be developed as separate tools/modules in the app:
- **Cash Counter**: Helps staff count tills, calculate daily floats, and log totals.
- **Restocker**: Imports sales data to show what's sold and needs restocking from the storeroom. Also helps pick online orders.
- **Stocktaker**: Allows recounting stock levels by brand and updating inventory.
- **Training Quiz**: Weekly quiz tool to test store and brand knowledge using spaced repetition.
- **Brand Info**: Quick reference tool for learning about brands we carry.
- *(More tools can be added later.)*

## 🧰 Tech Stack
- **Frontend**: Expo (React Native)
- **Navigation**: React Navigation
- **State Management**: React Context or Zustand (TBD)
- **Data**: Local async storage to start (cloud sync later optional)
- **Testing**: Jest for unit tests, optional E2E later

## ✅ Prerequisites
- Node.js (LTS)
- Yarn or npm
- Expo CLI installed: `npm install -g expo-cli`
- Xcode / Android Studio for mobile testing
- Git
- Optional: VS Code with Cursor

## 🛠️ Roadmap
### Phase 1 – Core Structure
- Set up base Expo app
- Create front-page "toolkit" dashboard
- Folder structure: `/tools/[tool-name]`
- Modular tool loading system (graceful if one tool fails)
- Shared UI component system

### Phase 2 – Placeholder Screens
- Placeholder UI for each tool
- Mock example data (e.g. Cash Counter)
- Local logging of actions (e.g. daily float log)

### Phase 3 – Feature Development
- Build each tool with real functionality
- Add onboarding/help screen
- Explore offline-first capabilities

## 🧩 Notes
- App is shared across users on one iPhone in-store.
- Tools should function independently.
- UX should be clean and minimal, mobile-first.
- Goal: add/remove tools easily over time.

---

*This README will be updated as the project evolves.*

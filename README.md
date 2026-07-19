# Betapp - Gambling Recovery App

A React Native app to help users overcome gambling addiction through habit tracking, financial management, and accountability features.

## Project structure

- `frontend/` - Expo (React Native) app, plain JavaScript
- `backend/` - Node.js + Express API with MongoDB (accounts, buddy system, check-ins)

## Design system

The app uses a calm **Quiet Momentum** theme:

- Deep indigo and restorative teal as core colors
- Warm coral accents for encouragement
- Soft rounded surfaces and supportive copy
- Light, dark, and system appearance modes (persisted)

Sensitive recovery data stays private on the device. Accounts, buddies, and check-ins use the backend as the source of truth.

## Getting started

### Backend

Requires a MongoDB server. Either install [MongoDB Community Server](https://www.mongodb.com/try/download/community) locally, or create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) and copy its connection string.

```bash
cd backend
npm install
npm start
```

The API runs on `http://localhost:3000` and connects to `mongodb://localhost:27017/betapp` by default. To use a different database (e.g. Atlas), set the `MONGODB_URI` environment variable before starting:

```powershell
$env:MONGODB_URI = "mongodb+srv://user:password@cluster.mongodb.net/betapp"
npm start
```

To verify the backend works without installing MongoDB, run `node test-api.js` - it spins up a temporary in-memory MongoDB and tests all the API flows.

### Frontend

```bash
cd frontend
npm install
npx expo start
```

Then scan the QR code with the Expo Go app (iOS/Android), or press `a` / `i` to open an emulator.

**API URL configuration**

The frontend reads `EXPO_PUBLIC_API_URL` when set. Otherwise it defaults to:

- iOS simulator / web: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`

If you run the app on a physical phone, set your computer's LAN IP before starting Expo:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:3000"
npx expo start
```

**Frontend tests**

```bash
cd frontend
npm test
```

## Features

- **Splash, onboarding & auth** - branded splash, 3-page onboarding, login/signup connected to `/api/auth`, session restore via secure token storage + `/api/auth/me`
- **Home dashboard** - gambling-free streak, money kept, one-tap Urge SOS, today's journal at a glance
- **Urge SOS & safety plan** - automatic 60-second guided breathing, personal recovery reasons, immediately doable coping actions, direct buddy/support access, and optional trigger logging; the editable plan stays on-device
- **Habit tracking** - log urges (intensity slider) with triggers (emotion, location, time of day auto-detected), one journal entry per day with mood, top-trigger insights
- **Financial tracking** - money kept total, log money set aside (or slips, which reset the streak), savings goal with progress bar, last-7-days net-saved chart
- **Accountability buddies** - share your buddy code, send/accept/decline requests, post daily check-ins (streak and money kept attached automatically), view buddies' check-ins
- **Support** - helplines (tap to call), communities and reading resources, crisis guidance
- **Reminders** - optional daily check-in and encouragement notifications at times you choose (`expo-notifications`), scheduled on-device and persisted
- **Theming** - light / dark / system appearance, persisted, across every screen

Habit and financial data stays local on the device (SQLite). Only accounts, buddies and check-ins go through the backend.

## Tech

- Frontend: Expo SDK 54 (Expo Go compatible), React Navigation (stack + bottom tabs), Zustand, expo-sqlite, AsyncStorage, expo-secure-store, expo-linear-gradient, expo-notifications
- Backend: Express, MongoDB (Mongoose), JWT (jsonwebtoken), bcryptjs

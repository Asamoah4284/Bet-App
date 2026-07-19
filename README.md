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

By default the app talks to the deployed backend at `https://bet-app-dgqz.onrender.com`.

To use a local backend instead, set `EXPO_PUBLIC_API_URL` before starting Expo:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://localhost:3000"          # iOS simulator / web
$env:EXPO_PUBLIC_API_URL = "http://10.0.2.2:3000"           # Android emulator
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:3000"       # physical phone (your LAN IP)
npx expo start
```

Note: Render's free tier spins down after ~15 minutes idle. The first request after that can take 30–50 seconds while the server wakes up.

**Forgot password**

`POST /api/auth/forgot-password` issues a 6-digit code valid for 15 minutes. No email provider is wired up yet, so the code is printed in the **backend logs** (Render dashboard → Logs, or your local terminal). Enter it on the "Forgot password" screen with a new password. Swap in an email service (Resend, SendGrid, ...) in `authController.forgotPassword` when ready.

**Google sign-in**

The button is wired end to end (`/api/auth/google` verifies the ID token and creates/links the account), but the native Google module cannot run inside Expo Go - it needs a development build:

1. Create a **Web application** OAuth client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (plus an Android client with your package name + SHA-1).
2. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` before building, and optionally `GOOGLE_CLIENT_IDS` on the backend to lock token audience.
3. Build and run: `npx expo prebuild` then `npx expo run:android`.

In Expo Go the button shows a friendly "needs a development build" notice instead.

**Frontend tests**

```bash
cd frontend
npm test
```

## Features

- **Splash, onboarding & auth** - branded splash, 3-page illustrated onboarding, login with email **or username**, signup with optional username, forgot-password reset codes, Google sign-in, session restore via secure token storage + `/api/auth/me`
- **Home dashboard** - gambling-free streak, money kept, one-tap Urge SOS, today's journal at a glance
- **Urge SOS & safety plan** - automatic 60-second guided breathing, personal recovery reasons, immediately doable coping actions, direct buddy/support access, and optional trigger logging; the editable plan stays on-device
- **Habit tracking** - log urges (intensity slider) with triggers (emotion, location, time of day auto-detected), one journal entry per day with mood, top-trigger insights
- **Financial tracking** - money kept total, log money set aside (or slips, which reset the streak), savings goal with progress bar, last-7-days net-saved chart
- **Accountability buddies** - share your buddy code, send/accept/decline requests, post daily check-ins (streak and money kept attached automatically), view buddies' check-ins
- **Profile & sharing** - editable display name, username and bio, private on-device profile photo, and a web/deep-link invitation that lets another user preview your safe public profile and add you as a buddy
- **Achievements & progress** - private streak, journaling, urge-awareness and money-kept achievements, a streak detail view, and next-achievement progress
- **Opt-in leaderboards** - friends and global streak rankings; disabled by default and limited to display name, username and streak (never money, urges, journal data, email or profile photo)
- **Support** - helplines (tap to call), communities and reading resources, crisis guidance
- **Reminders** - optional daily check-in and encouragement notifications at times you choose (`expo-notifications`), scheduled on-device and persisted
- **Theming** - light / dark / system appearance, persisted, across every screen

Habit and financial data stays local on the device (SQLite). Only accounts, buddies and check-ins go through the backend.

## Tech

- Frontend: Expo SDK 54 (Expo Go compatible), React Navigation (stack + bottom tabs), Zustand, expo-sqlite, AsyncStorage, expo-secure-store, expo-linear-gradient, expo-notifications
- Backend: Express, MongoDB (Mongoose), JWT (jsonwebtoken), bcryptjs

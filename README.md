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

**Shield (betting website blocking)**

Shield blocks known gambling **websites** with a local DNS VPN on Android. It does **not** force-close or uninstall native betting apps.

1. Redeploy the backend so `GET /api/shield/targets` is available (seeds Ghana-focused domains on first boot).
2. Shield UI works in Expo Go for browsing the list and adding personal domains, but **DNS blocking requires a development build**:

```bash
cd frontend
npm install
npx expo prebuild
npx expo run:android
```

3. Open Profile → Shield (or Home → Shield), enable the toggle, and accept the Android VPN consent prompt.
4. Keep SportyBet / Betway apps uninstalled for the strongest protection; Shield covers browsers and in-app webviews.

iOS Network Extension support is not in this version.

**Frontend tests**

```bash
cd frontend
npm test
```

## Features

- **Splash, onboarding & auth** - branded splash, 3-page illustrated onboarding, login with email **or username**, signup with optional username, forgot-password reset codes, Google sign-in, session restore via secure token storage + `/api/auth/me`
- **Home dashboard** - gambling-free streak based on honest daily reflections, one-day catch-up, money kept, one-tap Urge SOS, and today's journal at a glance
- **Urge SOS & safety plan** - automatic 60-second guided breathing, personal recovery reasons, immediately doable coping actions, direct buddy/support access, and optional trigger logging; the editable plan stays on-device
- **Habit tracking** - log urges (intensity slider) with triggers (emotion, location, time of day auto-detected), one journal entry per day with mood, top-trigger insights
- **Financial tracking** - money kept total, log money set aside or slipped, savings goal with progress bar, last-7-days net-saved chart
- **Accountability buddies** - find opted-in users by display name or username, share a buddy code, send/accept/decline/cancel requests, post daily check-ins, and view buddies' check-ins; search discoverability is off by default
- **Profile & sharing** - editable display name, username and bio, private on-device profile photo, and a web/deep-link invitation that lets another user preview your safe public profile and add you as a buddy
- **Achievements & progress** - private streak, journaling, urge-awareness and money-kept achievements, a streak detail view, and next-achievement progress
- **Opt-in leaderboards** - friends and global streak rankings; disabled by default and limited to display name, username and streak (never money, urges, journal data, email or profile photo)
- **Shield** - curated betting-domain blocklist from the backend, personal domains on-device, and an Android local DNS VPN that blocks those sites when enabled (dev/production build required; Expo Go can manage the list but cannot run the VPN)
- **Support** - helplines (tap to call), communities and reading resources, crisis guidance
- **Reminders & push** - optional daily reflection and encouragement at times you choose; buddy events, streak milestones, and a gentle Urge SOS follow-up. Preferences sync to the backend when signed in. Signed-in users on a native build receive dailies via Expo Push (server cron); otherwise dailies stay on-device. Tap a notification to jump to the matching screen.
- **Theming** - light / dark / system appearance, persisted, across every screen

Habit, financial, reflection and Shield preference data stays local on the device (SQLite / AsyncStorage). Accounts, buddies, check-ins, reminder preference sync, push tokens, and the shared shield catalog go through the backend.

### Push notifications (EAS / FCM / APNs)

Remote push needs a **development, preview, or production build** (not Expo Go):

1. Redeploy the backend so `/api/notifications/*` and the minute cron are live. The Node process must stay running — free-tier sleep (e.g. Render) will pause scheduled pushes until the server wakes.
2. In the Expo project, configure credentials once:
   - Android: add an FCM server key / Google service account via `eas credentials`
   - iOS: upload an APNs key via `eas credentials`
3. Build with EAS (`eas build -p android|ios --profile preview`) and install that binary.
4. Sign in, open Profile → Reminders, enable the nudges you want, and grant notification permission.

**Delivery ownership:** when a push token is registered, the server owns daily reflection/encouragement (local schedules are cancelled to avoid duplicates). Without a token, the device schedules local dailies. Urge follow-up prefers a server delayed job and falls back to a local timer if the API is unreachable.

## Tech

- Frontend: Expo SDK 54, React Navigation (stack + bottom tabs), Zustand, expo-sqlite, AsyncStorage, expo-secure-store, expo-linear-gradient, expo-notifications, local `betapp-shield` Android VPN module
- Backend: Express, MongoDB (Mongoose), JWT (jsonwebtoken), bcryptjs, expo-server-sdk, node-cron

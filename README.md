# Betapp - Gambling Recovery App

A React Native app to help users overcome gambling addiction through habit tracking, financial management, and accountability features.

## Project structure

- `frontend/` - Expo (React Native) app, plain JavaScript
- `backend/` - Node.js + Express API with MongoDB (accounts, buddy system, check-ins)

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

**Important:** if you run the app on a physical phone, edit `frontend/src/services/api.js` and change `API_BASE_URL` from `localhost` to your computer's LAN IP address (e.g. `http://192.168.1.20:3000`). On the Android emulator use `http://10.0.2.2:3000`.

## Features

- **Home dashboard** - gambling-free streak, money kept, quick urge-log button
- **Habit tracking** - log urges (intensity slider), triggers (emotions, location, time of day), daily journal with mood; top-trigger insights
- **Financial tracking** - estimated money not gambled away, log money set aside (or slips), savings goal with progress bar, weekly savings chart
- **Support** - helplines (tap to call), articles, communities, progress sharing
- **Accountability buddies** - create an account, share your buddy code, link with a buddy, daily check-ins visible to each other

Habit and financial data stays local on the device (SQLite). Only accounts, buddies and check-ins go through the backend.

## Tech

- Frontend: Expo, React Navigation, Zustand, expo-sqlite, AsyncStorage, expo-notifications
- Backend: Express, MongoDB (Mongoose), JWT (jsonwebtoken), bcryptjs

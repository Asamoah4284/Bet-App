
# Google + Apple sign-in

## Google (hardened)
- `googleAuth.js`: webClientId + optional iosClientId; Play Services only on Android; clearer errors
- `app.config.js`: injects Google `iosUrlScheme` from `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`
- Env examples: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`
- Backend: set `GOOGLE_CLIENT_IDS` to your Web client ID in production

## Apple (new)
- Package: `expo-apple-authentication` + `usesAppleSignIn` / entitlement in `app.json`
- Frontend: `appleAuth.js`, `AppleSignInButton` (iOS only), Login + Signup
- Store/API: `loginWithApple` → `POST /api/auth/apple`
- Backend: `jose` JWKS verify; User.`apple_id`; password optional if google_id or apple_id
- Audience default: `com.betapp.recovery` (`APPLE_CLIENT_ID` override)

## Required to actually work
1. Native/EAS build (not Expo Go)
2. Google Cloud: Web client + iOS client (bundle com.betapp.recovery) + Android SHA-1; fill frontend env; put Web client in backend GOOGLE_CLIENT_IDS
3. Apple Developer: enable Sign in with Apple for App ID com.betapp.recovery; rebuild iOS

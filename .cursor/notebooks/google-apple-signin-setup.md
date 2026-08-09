# Google + Apple sign-in — remaining setup

Firebase project already linked: **bitbyte-79a03**  
Android/iOS package/bundle: **com.betapp.recovery**

Env files ready (fill Google IDs after console steps):
- `frontend/.env`
- `backend/.env` (`APPLE_CLIENT_ID=com.betapp.recovery` already set)

## Google (Firebase + Google Cloud)

1. Open https://console.firebase.google.com → project **bitbyte-79a03**
2. Project settings (gear) → Your apps
   - Ensure Android app `com.betapp.recovery` exists
   - Add iOS app with bundle `com.betapp.recovery` if missing
3. Enable Google sign-in: Build → Authentication → Sign-in method → Google → Enable → save
4. Open Google Cloud OAuth clients (linked project):
   https://console.cloud.google.com/apis/credentials?project=bitbyte-79a03
5. Create **OAuth client ID → Web application**
   - Copy Client ID → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `GOOGLE_CLIENT_IDS`
6. Create **OAuth client ID → iOS**
   - Bundle ID: `com.betapp.recovery`
   - Copy Client ID → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - URL scheme = reverse the ID:
     `123-xyz.apps.googleusercontent.com` → `com.googleusercontent.apps.123-xyz`
   - Put that in `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`
7. Android client: add SHA-1 for your debug/release keystore (EAS credentials or `keytool`)
8. Download fresh `google-services.json` from Firebase Android app settings → replace `frontend/google-services.json`
9. Restart backend + rebuild native app (EAS). Google does **not** work in Expo Go.

## Apple Sign in with Apple

1. https://developer.apple.com/account → Identifiers → App ID `com.betapp.recovery`
2. Enable capability **Sign In with Apple** → Save
3. In Xcode / EAS, ensure provisioning profile includes that capability (rebuild)
4. Backend already uses `APPLE_CLIENT_ID=com.betapp.recovery`
5. Test on a real iPhone / iOS simulator with a native build (not Expo Go)

## After pasting IDs

```
# frontend/.env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=....apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=....apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps....

# backend/.env
GOOGLE_CLIENT_IDS=....apps.googleusercontent.com   # same as Web client
APPLE_CLIENT_ID=com.betapp.recovery
```

Then: restart backend, `npx expo start -c`, and run an EAS development/production build.

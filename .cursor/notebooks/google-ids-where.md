# Where Google IDs come from

## Already wired in repo
- Android: `frontend/google-services.json` (no oauth_client yet — needs SHA-1 + re-download)
- iOS: `frontend/GoogleService-Info.plist` (no CLIENT_ID yet — create iOS OAuth / re-download from Firebase)
- app.json: `ios.googleServicesFile` + `android.googleServicesFile`

## You must create in console
1. Firebase Auth → enable Google
2. Google Cloud Credentials → Web client ID + iOS client ID
3. Android SHA-1 → re-download google-services.json
4. Paste Web/iOS IDs + reversed scheme into env / EAS secrets

See chat for click-by-click steps.

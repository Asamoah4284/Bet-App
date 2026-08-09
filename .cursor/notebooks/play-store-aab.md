# Play Store AAB build

## Command used
```
cd frontend
eas build -p android --profile production --non-interactive
```

## Prep done
- Google IDs in `frontend/.env` + `backend/.env`
- `eas.json` production: `buildType: app-bundle` + Google env baked for EAS
- `GoogleService-Info.plist` in frontend with CLIENT_ID / REVERSED_CLIENT_ID
- `google-services.json` has oauth clients

## Reminder
Set `GOOGLE_CLIENT_IDS` on Render to the Web client ID (same as backend .env).

# App Store submit guide (Quibet / betapp)

## Before you start
- Local changes (Apple/Google auth) were **not all pushed** last check — commit + push first.
- Google env IDs may still be empty — set EAS secrets before production build if Google must work.
- Bundle ID: `com.betapp.recovery` | Display name: Quibet | API: Render
- Shield uses Network Extension — App ID must include Packet Tunnel + Sign in with Apple.

## Steps
1. Apple Developer: App ID + Sign in with Apple (+ Network Extension if Shield ships)
2. App Store Connect: create iOS app Quibet, bundle com.betapp.recovery
3. Commit/push code; put GoogleService-Info.plist in frontend if using Google on iOS
4. `eas secret:create` for EXPO_PUBLIC_GOOGLE_* if needed
5. From frontend: `eas build -p ios --profile production`
6. `eas submit -p ios --latest` (or submit from expo.dev)
7. Fill ASC listing, privacy, screenshots, review notes (Shield/VPN)
8. Submit for Review

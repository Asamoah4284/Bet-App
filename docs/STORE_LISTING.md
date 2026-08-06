# Quibet — Store listing fill-in guide

Use this while creating Google Play Console and App Store Connect listings.
Replace every `REPLACE_…` value before submit.

Public legal pages (after GitHub Pages is on):

| Page | Relative path | Paste this URL pattern |
|------|---------------|------------------------|
| Hub | `docs/index.html` | `https://REPLACE_GITHUB_USER.github.io/REPLACE_REPO/` |
| Privacy | `docs/privacy.html` | `…/privacy.html` |
| Terms | `docs/terms.html` | `…/terms.html` |
| Support | `docs/support.html` | `…/support.html` |

---

## App identity (both stores)

| Field | Value |
|-------|--------|
| Public app name | **Quibet** |
| Subtitle / short description idea | Quiet momentum for gambling recovery |
| Android package name | `com.betapp.recovery` |
| iOS bundle ID | `com.betapp.recovery` |
| Version | `1.0.0` (match `app.json`) |
| Developer / seller | Asamoah (individual) |
| Support email | `REPLACE_WITH_YOUR_EMAIL@example.com` |
| Privacy Policy URL | GitHub Pages privacy URL |
| Terms URL | GitHub Pages terms URL |
| Support / marketing URL | GitHub Pages support or hub URL |
| Category (primary) | Health & Fitness |
| Secondary (optional) | Lifestyle / Medical *(prefer Health & Fitness; Quibet is not a medical device)* |
| Content rating | Teen / PEGI / IARC as questionnaires decide (self-harm helplines may appear; no gambling gameplay) |
| Price | Free (unless you add IAP later) |

### Suggested short description (Google, ≤80 chars)
`Track gambling-free streaks, urges, money kept, buddies & website Shield.`

### Suggested full description (both stores — edit tone as you like)
```
Quibet helps you build quiet momentum away from gambling.

• Daily reflections that keep your gambling-free streak honest
• Urge SOS with breathing and your personal safety plan
• Journal and money-kept tracking kept private on your device
• Accountability buddies and optional check-ins
• Optional leaderboards (display name + streak only)
• Gentle reminders and encouragement notifications
• Shield: on-device DNS blocking for betting websites (optional)

Important: Quibet is a self-help companion, not medical care or crisis treatment.
If you are in danger, contact emergency services.
```

### Keywords (Apple, comma-separated, no trademark stuffing)
`gambling recovery, urge, streak, accountability, habit, wellness, addiction support, mindfulness`

### What’s new (1.0.0)
`First public release: streaks, Urge SOS, buddies, reminders, and Shield website blocking.`

---

## Screenshots & graphics checklist

Prepare before upload:

**Android**
- [ ] Phone screenshots (min 2; 4–8 recommended), PNG/JPEG
- [ ] Feature graphic 1024×500
- [ ] App icon 512×512 (high-res)
- [ ] Optional: 7" / 10" tablet screenshots

**iOS**
- [ ] 6.7" iPhone screenshots (required for modern phones)
- [ ] Optional: 6.5", iPad if you support tablet (`supportsTablet: true`)
- [ ] App icon already in binary (1024×1024 without alpha for store)

Screenshot ideas: Home streak, Urge SOS, Daily reflection, Buddies, Shield, Reminders, Privacy.

---

## Google Play Console — fields & answers

### Store presence
- App name: Quibet  
- Short description: (above)  
- Full description: (above)  
- App icon / feature graphic / screenshots  
- Application type: App  
- Category: Health & Fitness  
- Tags: habit tracking, mental health, wellness (pick allowed tags)  
- Contact email / phone / website  
- Privacy Policy URL: required  

### App content questionnaires (typical answers for Quibet)

**Privacy policy** → Yes, URL provided  

**Ads** → No (unless you add ads later)  

**App access** → All features available without special login instructions *or* provide a demo account if reviewers must sign in:
- Demo email / password: create one and write it here: `REPLACE_DEMO_EMAIL` / `REPLACE_DEMO_PASSWORD`

**Content ratings (IARC)** — answer honestly:
- Violence / sexual content / language: generally No  
- Controlled substances: No  
- Users interact / share info: Yes (buddies, optional discovery, optional leaderboard)  
- Shares location: No continuous GPS (only optional text tags for urges)  
- Promotes gambling / casino gameplay: No — recovery / anti-gambling helper  

**Target audience** → 18+ recommended (recovery content). If you select under-18, extra policies apply. Prefer **18 and over**.

**News app** → No  

**COVID-19** → No  

**Data safety** (declare data collected/shared):

| Data type | Collected? | Shared? | Purpose | Notes |
|-----------|------------|---------|---------|-------|
| Email | Yes | No* | Account | *Not shared with other users publicly |
| Name / username | Yes | Yes (optional) | Profile, buddies, optional leaderboard | |
| User IDs | Yes | No | Account | |
| Photos | Yes (optional) | No | Profile photo on-device / may sync only if you later change that — currently on-device | State **on-device** if form allows |
| Messages / in-app content | Yes | Yes | Buddy check-ins / bio | User-generated |
| App activity / streak snapshot | Yes | Yes (optional leaderboard) | App functionality | Limited fields only |
| App interactions | Optional analytics — currently no third-party analytics | — | — | Say No unless you add analytics |
| Crash logs | Only if you later add Crashlytics/Sentry | — | — | Currently No |
| Device IDs / push token | Yes | With push providers | Notifications | Expo/FCM/APNs |
| Approximate location | No | No | — | |
| Precise location | No | No | — | |

Encryption in transit: Yes (HTTPS in production)  
Users can request deletion: Yes (email support)  

**Permissions declarations**
- Notifications: yes  
- Photos: yes (optional avatar)  
- VPN service / foreground service: yes for Shield — explain: “Optional local DNS VPN to block gambling websites on-device; no browsing history uploaded.”  

**Government apps** → No  

**Financial features** → No banking; money-kept is personal tracking only  

### Production release
- [ ] Closed testing track first (Google often requires 12+ testers for 14 days for new personal accounts — check current policy)
- [ ] AAB upload via `eas build -p android --profile production` then `eas submit` or Play Console upload
- [ ] Countries / pricing  
- [ ] Store listing translations (optional)

---

## Apple App Store Connect — fields & answers

### App Information
- Name: Quibet  
- Subtitle: Quiet momentum for recovery  
- Category: Health & Fitness  
- Content Rights: You own/have rights to content  
- Age Rating: complete questionnaire (no unrestricted web, no gambling game; user-generated text may push rating up slightly)  
- Privacy Policy URL: required  

### Pricing
- Free  

### App Privacy (nutrition labels)
Align with Privacy Policy:

**Data linked to you**
- Contact info (email)  
- Name  
- User ID  
- Other user content (check-ins, bio)  

**Data not linked / on-device** (as applicable)
- Health & fitness style habit data kept on-device (urges, journal, money) — classify carefully as “Other User Content” / “Health & Fitness” if Apple’s form fits, noting it is not HealthKit  

**Data used for tracking** → No (unless you add ATT trackers)

**Purposes**: App Functionality, Product Personalization (reminders), Developer Communications (optional email)

### Version information
- Screenshots  
- Description / keywords / support URL / marketing URL  
- Promotional text (optional)  
- Copyright: `2026 Asamoah`  

### App Review Information
- Sign-in required: Yes  
- Demo account: `REPLACE_DEMO_EMAIL` / `REPLACE_DEMO_PASSWORD`  
- Contact phone + email  

**Notes for reviewer (paste):**
```
Quibet is a gambling-recovery companion (not a casino app).

Sign in with the demo account provided.

Shield (Profile → Shield) optionally installs an on-device Packet Tunnel / DNS filter
to block known betting websites. It does not sell VPN service, does not upload browsing
history, and does not force-close other apps. Please allow the Network Extension /
VPN permission if testing Shield.

Sensitive recovery logs (urges, journal, money) stay on-device.
Buddies and optional leaderboard use only limited profile/streak fields.
```

### Capabilities Apple may ask about
- Push Notifications: Yes  
- Sign in with Google: Yes (and/or email)  
- Network Extension / Personal VPN: Yes — personal content filter for recovery, not a commercial VPN product  
- App Groups: `group.com.betapp.recovery.shield`  

### Export compliance
- `ITSAppUsesNonExemptEncryption` is already `false` in app config (standard HTTPS only). Answer encryption questionnaire accordingly.

---

## GitHub Pages (host the HTML)

1. Push the `docs/` folder to GitHub.
2. Repo → **Settings → Pages**
3. Source: Deploy from branch `main` (or `master`), folder **/docs**
4. Wait for the site URL, then open:
   - `https://<user>.github.io/<repo>/privacy.html`
   - `https://<user>.github.io/<repo>/terms.html`
   - `https://<user>.github.io/<repo>/support.html`
5. Replace `REPLACE_WITH_YOUR_EMAIL@example.com` and country placeholders in all HTML files before submission.

---

## Build / submit commands (reference)

```powershell
cd frontend

# Android production AAB
eas build -p android --profile production
eas submit -p android --latest

# iOS production
eas build -p ios --profile production
eas submit -p ios --latest
```

You still need Play Console + App Store Connect developer accounts ($ one-time Play; paid Apple Developer yearly).

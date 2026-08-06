
# Expo slug vs public name

## Rule
- Public display name: **Quibet** (`expo.name`)
- Internal Expo/EAS slug: **betapp** (must match `extra.eas.projectId`)
- Bundle IDs stay `com.betapp.recovery`
- Deep link schemes: both `betapp` and `quibet` supported

## Fix applied
`frontend/app.json`: `slug` `quibet` → `betapp`; merged duplicate `extra` keys (API_URL + eas.projectId).

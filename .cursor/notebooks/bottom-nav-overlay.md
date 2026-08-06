# Bottom nav frosted bar + FAB clipping

## Goal
Telegram-style frosted tab bar; Money FAB fully visible and raised above the frost edge, with label tight underneath.

## Fixes
1. Tall washed overlay: tab bar was in-flow + Screen also padded by tab height; AppBackground bottomFade was 160px. Made tab bar `position: absolute`, shortened fade, drop bottom SafeArea edge in tab screens.
2. Frosted chrome: `expo-blur` BlurView + light wash + hairline. Frost layers live in their own `overflow: hidden` clip so they don’t cut the FAB.
3. FAB clipping: do **not** put `overflow: hidden` on the bar that contains the FAB. Lift with `transform: translateY(-FAB_LIFT)`. Use navigator `insets.bottom` for home-indicator padding. Keep FAB zIndex/elevation above frost.
4. FAB ↔ “Money” gap: `transform` leaves layout space. Pair with `marginBottom: -FAB_LIFT` so the label sits close under the circle.

## Files
- `frontend/src/navigation/TabBar.js`
- `frontend/src/components/Screen.js`
- `frontend/src/components/AppBackground.js`
- package: `expo-blur`

# Edit profile success feedback

## Problem
After saving profile changes, success was a tiny caption (`typography.caption`) saying "Profile updated." — easy to miss.

## Fix
Use the existing app toast system plus a clearer in-screen banner:
- `useToastStore().show({ title, body, icon: checkmark-circle, tint: success })` — top toast via `ToastHost`
- Inline green status banner above Save with icon + title + subtitle
- Auto-clear inline banner after ~4.5s

## File
- `frontend/src/screens/EditProfileScreen.js`

# Tab content obscured by bottom nav

## Cause
`Screen` applied tab-bar `paddingBottom`, then screens passed `contentStyle={{ paddingBottom: 12 }}` **after** it in the style array, which overrode clearance. Floating absolute tab bar then covered the last content.

## Fix
In `Screen.js`:
- Apply `contentStyle` first, then tab clearance last so it always wins
- Use fallback height (`100`) while measured tab bar height is still `0`
- Extra clearance `16` so content clears frost + Money FAB peek

## File
- `frontend/src/components/Screen.js`


# Buddy chat / messaging

## Status
Accepted buddies can DM each other (v1 text chat).

## Backend
- `backend/src/models/Message.js` — sender, receiver, body (max 1000), created_at, read_at
- `backend/src/controllers/messageController.js` — `listThread`, `sendMessage` (gated by `isBuddyWith`)
- `backend/src/routes/messages.js` — `GET /with/:userId`, `POST /`
- Mounted at `/api/messages` in `server.js`
- Push type `buddy_message` added to NotificationJob enum; send notifies peer with screen `BuddyChat`

## Frontend
- `messagesApi` in `services/api.js`
- `store/messageStore.js` — fetch/send/poll refresh
- `screens/BuddyChatScreen.js` — thread + composer
- Entry: Buddies list chat icon, BuddyDetail "Message" button
- Push routing: `buddy_message` → BuddyChat with userId/displayName
- Poll every 10s while chat focused

## Flow
Buddies tab → chat icon or buddy detail → Message → type + send. Restart backend after pull so routes load.

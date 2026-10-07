https://spark-chat-app.onrender.com/

> For the ready Render deployment configuration, start with **DEPLOY_RENDER.md**.

# Spark — discovery, mutual matches and real-time chat

A Tinder-inspired redesign of your uploaded React / Express / MongoDB / Socket.IO chat project, with original Spark branding. This is a local development project, not an official Tinder product.

## Run on Windows

Use Node.js 22.12+ (or Node 24) and a running MongoDB instance.

Extract this ZIP into a NEW folder so old node_modules and old frontend files do not remain alongside the updated files. Open a terminal in the extracted `realtime-chat-app-socketio-main` folder (the folder containing this README and package.json).

```cmd
npm run install:all
npm run backend
```

Keep that terminal open. In a second terminal, in the same root folder:

```cmd
npm run frontend
```

Open the localhost URL printed by Vite. Normally http://localhost:5173; port 5174 is also configured.

A root package.json is now included, fixing the earlier missing package.json problem. The real frontend is in `frontend/vite-project`, not directly in `frontend`.

## Environment configuration

Ready-to-use LOCAL configuration is included in `backend/.env` and `frontend/vite-project/.env`. A fresh random JWT secret has been generated for this project. Do not commit your .env files.

Backend:

```env
NODE_ENV=development
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/spark
JWT_SECRET=your_random_secret_at_least_32_characters
CLIENT_URLS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
COOKIE_SAME_SITE=lax
```

Frontend:

```env
VITE_API_URL=
DEV_API_TARGET=http://localhost:8000
```

Leave VITE_API_URL empty for local development: Vite forwards both `/api` and `/socket.io` to port 8000. If you change the backend port, change DEV_API_TARGET too. Restart both servers after environment changes.

For MongoDB Atlas, replace MONGO_URI with your own connection string and configure your cluster access. The server connects to MongoDB before accepting requests; a database connection error must be fixed before the frontend can log in. Existing accounts can be reused by pointing MONGO_URI to your previous database, then completing the age field in My profile. The old code forced database `chatapp`; the new code honors the database in MONGO_URI.

## Try the complete flow

1. Register account A (18+), open My profile, add your city, bio, interests and optionally an HTTPS photo URL. A gradient initial avatar appears without a photo.
2. Use another browser or an incognito window to create account B. Cookies are shared between tabs in the same browser profile, so use separate browser sessions.
3. Refresh Discover on account A; like account B. On account B, refresh and like account A.
4. A mutual match unlocks Messages. Select the connection and send messages. The recipient sees them live; messages remain in MongoDB after refresh.
5. Pass removes that profile from your discovery queue. Preferences filter the current discovery batch by gender and maximum age. A swipe decision is final in this version.

Discovery uses real registered adult accounts. No fake people or fake matches are inserted. New installations show an empty state until another adult registers. Photo URLs must be directly accessible images; an initial avatar is used when an image cannot load.

## What changed

- Responsive desktop/mobile discovery interface, peach/pink styling, profile cards, swipe gestures, like/pass buttons, filters, match dialog, authentication and profile editor.
- Persisted likes/passes and mutual match checks. Chat reads and writes require a mutual match.
- Shared explicit CORS allowlist for Express and Socket.IO, including credentials and preflight support. WebSocket origin checking uses the same policy.
- One configurable frontend API origin and same-origin Vite proxy. Removed the old hardcoded localhost URLs from the active application.
- Socket identity comes from a verified HTTP-only JWT cookie; query-string user IDs cannot impersonate another account. Multiple tabs use user rooms.
- Fixed duplicate signup save, missing signup `_id`, local secure-cookie issue, case-sensitive database import issue and session restore on reload.
- Server validates profiles, usernames, message length and adult age. New passwords require 8–72 characters.
- Components are separated into Auth, Avatar, Profile and Chat. API configuration lives in src/api.js.

## Build and tests

```cmd
npm run build
npm test
npm --prefix frontend/vite-project run lint
```

The build is written to `frontend/vite-project/dist`. The included automated CORS test checks REST requests, preflight and Socket.IO polling for configured ports and rejected origins.

## Hosting notes

Vite's development proxy is not part of the production build. For production, serve frontend and backend under one HTTPS origin with a reverse proxy forwarding `/api` and `/socket.io` (including WebSocket upgrades). Alternatively set VITE_API_URL to the backend HTTPS origin before building, set CLIENT_URLS to the exact frontend HTTPS origin, and set NODE_ENV=production. Truly cross-site cookies require COOKIE_SAME_SITE=none and HTTPS; browser third-party-cookie restrictions may still apply, so a same-origin deployment is preferred.

Keep localhost and 127.0.0.1 usage consistent within a session. Add the exact origin to CLIENT_URLS if Vite chooses a port other than 5173/5174. Do not use `*` with credentials.

## Scope

This delivers discovery, profiles, matching and text chat. It does not implement location-distance search, photo uploads/storage, identity verification, moderation/report/block, undo/unmatch, account deletion, notifications or payments. Age is self-reported. Chat loads the latest 200 messages and discovery loads up to 100 unreviewed profiles. Public launch requires those product and operational decisions, plus auth rate limiting and abuse controls.

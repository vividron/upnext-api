# 🎧 UpNext – Backend

Backend service for **UpNext**, a real-time social music voting app where people in a room can match their playlists with the queue and collaboratively upvote or downvote songs, shaping the queue and creating a more fair and interactive listening experience.

## 🔗 Links

- Live App: https://upnext-music.vercel.app/
- Frontend Repository: https://github.com/vividron/upnext-frontend

## 🚀 Overview

This repository contains the backend service responsible for:

- Spotify OAuth login with PKCE
- JWT-based authentication for API and Socket.IO connections
- Room creation, joining, leaving, and session management
- Real-time queue voting with Redis-backed atomic updates
- Playlist import and “match playlist” batch upvoting
- Spotify playback control for the room host
- Presence tracking and auto-disconnect handling
- Persistent storage with MongoDB and fast session/cache state with Redis

---

## 🔥 Features

### Authentication
- Spotify OAuth login flow
- PKCE-based authorization code exchange
- JWT issued after successful Spotify login
- Access token refresh handled automatically

### Rooms
- Create a room
- Join / leave a room
- Activate a room when the host joins
- End the room when the host leaves
- Persist room state, queue, and votes back to MongoDB

### Queue & Voting
- No modification of Spotify’s actual queue
- Backend controls playback using a **virtual queue** based on redis sorted sets
- Adding song/playlists to the room queue
- Prevent duplicate songs in the queue
- Enforce queue size limits
- Upvote/downvote songs in real time
- Queue automatically reorders based on votes
- Playlist matching. Batch upvote matched songs from a user playlist
- Atomic vote updates using Redis Lua scripts

### 🎧 Spotify Integration
- Spotify account info
- Users songs and playlists
- Playback runs on **host’s Spotify device**
- Supports:
  - Play / Pause
  - Next Track
  - Device switching

### Playback Sync
- Play current track
- Pause / resume playback
- Play next track from the virtual queue
- Seek to a specific position
- Player State Sync
    - Detects manual changes on Spotify
    - Handles: Pauses, Track skips, Device disconnects
    - Displays sync errors when needed

### Presence & Reliability
- Track room members and active sockets
- Handle reconnect grace periods
- Auto-remove inactive users
- End session cleanly if the host leaves

---

## 🛠️ Tech Stack

| Layer | Tech |
|------|------|
| Backend | Node.js, Express (HTTP server) |
| Realtime | Socket.IO (Websocket server) |
| Database | MongoDB (Persistent storage) |
| Session / Concurrency | Redis |
| Auth | Arctic (Spotify OAuth) |
| APIs | Spotify Web API |
| Sync | Presence Worker + Polling |

---

## ⚙️ System Architecture Highlights

### 🧩 Atomic Voting (Race Condition Safe)
- Implemented using **Redis Lua scripts**
- Ensures consistent vote updates under heavy concurrency

### 🧠 Presence Tracking
- Tracks active users in rooms
- Handles:
  - Disconnects
  - Network failures
  - Rejoins

### 🔄 Auto-Reconnect
- Clients reconnect seamlessly
- State is restored without breaking the experience

### 👑 Host-Controlled Lifecycle
- Host is the authority
- If host disconnects → room auto ends

---

## 🔐 Authentication

- Uses **Spotify OAuth 2.0 (Authorization Code Flow with PKCE)**
- Only **Spotify Premium users** can create rooms

---

## 📡 Socket.IO Events

### Client → Server
- `room:subscribe`
- `queue:vote-song`

### Server → Client
- `room:member-count`
- `room:end`
- `queue:add-songs`
- `queue:clear`
- `queue:scores-updated`
- `player:pause`
- `player:resume`
- `player:next`
- `player:seek`
- `player:sync-failed`

---

## 🌐 API Endpoints

### 🔐 Auth
- `GET /api/auth/spotify`
- `GET /api/auth/spotify/callback`
- `GET /api/auth/me`

### 👥 Rooms
- `POST /api/rooms/create`
- `GET /api/rooms`
- `POST /api/rooms/:roomId/join`
- `POST /api/rooms/:roomId/leave`
- `GET /api/rooms/:roomId`
- `DELETE /api/rooms/:roomId`

### 🎵 Spotify
- `GET /api/spotify/playlists`
- `GET /api/spotify/playlists/:playlistId/items`

### 🎧 Player
- `GET /api/rooms/:roomId/player/state`
- `POST /api/rooms/:roomId/player/resume`
- `POST /api/rooms/:roomId/player/pause`
- `POST /api/rooms/:roomId/player/next`
- `POST /api/rooms/:roomId/player/previous`
- `POST /api/rooms/:roomId/player/seek`

### 📜 Queue
- `POST /api/rooms/:roomId/queue/playlist`
- `DELETE /api/rooms/:roomId/queue`
- `POST /api/rooms/:roomId/queue/songs/upvote-matches`

---

## Challenges & Solutions

### 1. Real-Time Consistency Under High Concurrency
**Challenge:**  
Multiple users voting on the same song at the same time caused race conditions and inconsistent vote counts.

**Solution:**  
Implemented **atomic operations using Redis Lua scripts**, ensuring all vote updates are processed as a single transaction without conflicts.

---

### 2. Keeping Queue & Spotify Playback in Sync
**Challenge:**  
Spotify playback state can change externally (manual skips, device switches), causing desync with the app.

**Solution:**  
Built a **player state sync layer** using:
- Periodic polling on player state, cause spotify does not provide webhook for that.
- Event-driven updates
- Fallback handling for edge cases

---

### 3. Handling Unreliable Connections
**Challenge:**  
Users disconnecting unexpectedly could leave rooms in inconsistent states.

**Solution:**  
- Implemented **presence tracking with Redis**
- Added **grace periods for reconnect**
- Auto-cleanup of inactive users

---

### 4. Host Dependency & Room Lifecycle
**Challenge:**  
The system depends on the host’s Spotify session, so host disconnects could break the experience.

**Solution:**  
- Designed **host-based session control**
- Automatically **ends the room when the host leaves**
- Persists session state safely before cleanup

---

### 5. Efficient Queue Management Without Touching Spotify Queue
**Challenge:**  
Directly modifying Spotify’s queue is limited and unreliable.

**Solution:**  
Created a **virtual queue system using Redis sorted sets**:
- Full control over ordering and voting
- Syncs only the currently playing track to Spotify

---

### 6. Playlist Matching at Scale
**Challenge:**  
Matching user playlists against the room queue efficiently.

**Solution:**  
- Used **set-based comparisons in Redis**
- Implemented **batch upvoting** instead of per-song operations
- Reduced API calls and improved performance

---

### 7. Socket State vs Persistent State
**Challenge:**  
Socket events are ephemeral, but room state must persist reliably.

**Solution:**  
- Redis acts as the **source of truth during active sessions**
- MongoDB used for **long-term persistence**
- Periodic sync between both layers

---

## 🚀 Installation Guide

Follow these steps to run the backend locally.

### 1) Clone the repository

```bash
git clone https://github.com/your-username/upnext-api.git
cd upnext-api
```

### 2) Install dependencies

```bash
npm install
```

### 3) Setup environment variables

Create a `.env` file in the root directory:

```env
PORT=8000
MAX_QUEUE_SIZE=100
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://127.0.0.1:8000
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 4) Setup external services

**MongoDB**
- Use local MongoDB or cloud (recommended: [MongoDB Atlas](https://www.mongodb.com/atlas))
- Make sure your connection string is correct in `.env`

**Redis**
- Install locally or use [Redis Cloud](https://redis.io/cloud/)
- Ensure Redis is running before starting the server

### 5) Configure Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add the following redirect URI: http://127.0.0.1:8000/api/auth/spotify/callback

4. Copy your **Client ID** and **Client Secret**
5. Add them to your `.env`

> ⚠️ **Note:** Spotify Premium is required for playback control features.

### 6) Run the server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

### 7) Verify setup

The server should be running at:
http://localhost:8000

Test the auth route:
http://localhost:8000/api/auth/spotify

If everything is configured correctly:
- Spotify login page should open
- You should receive a JWT after successful login

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and test them.
4. Submit a pull request with a clear description of your changes.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

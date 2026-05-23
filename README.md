# Relay

Anonymous real-time communication platform built with React, WebRTC, Socket.IO, Node.js, Redis, Docker, and Nginx.

## Features

- Real-time anonymous text chat
- Peer-to-peer video/audio communication using WebRTC
- Redis-backed random matchmaking queue
- Instant session switching ("Next Stranger")
- Socket.IO-based real-time signaling
- Responsive dark-mode UI
- Docker-based deployment setup
- Nginx reverse proxy with WebSocket support

---

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- WebRTC APIs (`RTCPeerConnection`, ICE, SDP)

### Backend
- Node.js
- Express.js
- Socket.IO

### Infrastructure
- Redis
- Docker
- Docker Compose
- Nginx

---

## High-Level Architecture

```text
Client A ──┐
           │
           ▼
     Socket.IO Server
           │
           ▼
      Redis Pub/Sub
           │
           ▼
     Socket.IO Server
           │
           ▼
Client B <── WebRTC P2P Connection
```

---

## Local Development

### Start Services

Make sure Docker is installed.

```bash
docker-compose up -d
```

This starts Redis and PostgreSQL containers.

---

### Run Backend

```bash
cd server
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

### Run Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

---

## Production Notes

### TURN Server

For reliable WebRTC connections across strict NATs or mobile networks, a TURN server is recommended.

Update the ICE server configuration in:

```text
client/src/hooks/useWebRTC.js
```

with your TURN server credentials.

---

## Nginx Setup

The included `nginx.conf` handles:

- Static hosting for the React frontend
- Reverse proxying to the backend
- WebSocket upgrade handling for Socket.IO

---

## Docker Build

```bash
docker build -t relay-client -f Dockerfile.client ./client

docker build -t relay-server -f Dockerfile.server ./server
```

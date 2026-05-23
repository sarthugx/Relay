# Omegle Clone MVP

A production-ready anonymous random chat platform built with React, WebRTC, Socket.IO, Node.js, and Redis.

## Features
- Real-time text chat
- Real-time peer-to-peer video/audio chat via WebRTC
- Random matchmaking queue backed by Redis
- Instant "Next Stranger" functionality
- Responsive dark-mode UI
- Docker and Nginx deployment configurations

## Architecture
- **Frontend**: React, Vite, Tailwind CSS, WebRTC (`RTCPeerConnection`).
- **Backend**: Node.js, Express, Socket.IO.
- **Matchmaking / Scaling**: Redis (using `@socket.io/redis-adapter` for scaling across Node instances).
- **Reverse Proxy**: Nginx (configured for static hosting and WebSockets).

## Local Development Setup

### 1. Start Services
Make sure you have Docker installed.
```bash
docker-compose up -d
```
This starts Redis (port 6379) and PostgreSQL (port 5432).

### 2. Run Backend
```bash
cd server
npm install
npm run dev
```
Backend runs on `http://localhost:5000`.

### 3. Run Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

## Production Deployment

This project includes Dockerfiles for building production images. 

### WebRTC Notes for Production
In production, especially across strict networks or mobile data, STUN servers are often not enough to establish a peer-to-peer connection. You **MUST** run a TURN server (like Coturn).
Update `client/src/hooks/useWebRTC.js` ICE servers configuration to include your TURN server credentials.

### Deployment with Nginx
The provided `nginx.conf` sets up:
1. Static hosting for the built React app.
2. Reverse proxy to the backend API.
3. WebSocket upgrade support for Socket.IO.

To run the full stack in production:
1. Build the images:
   ```bash
   docker build -t omegle-client -f Dockerfile.client ./client
   docker build -t omegle-server -f Dockerfile.server ./server
   ```
2. Update the `docker-compose.yml` (or deploy to Kubernetes) to run the `nginx` reverse proxy, scaling the `server` containers as needed. Ensure `ip_hash` is enabled in Nginx if using multiple Node instances (or rely on the Redis adapter).

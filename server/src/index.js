require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('./redis');
const setupSocketHandlers = require('./socket');

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST']
}));
app.use(helmet());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  
  // Handle match making across Redis instances.
  // We subscribe to 'match_made' on the subClient. ANY of our Node servers could have
  // published this event when they found a match.
  subClient.subscribe('match_made', (message) => {
    try {
      const { user1, user2, roomId, mode } = JSON.parse(message);
      
      // Attempt to force the sockets to join the newly created room.
      // `io.in(socketId).socketsJoin(roomId)` is a special Socket.IO v4+ feature that works 
      // across the Redis Adapter. Even if user1 is on Server A and user2 is on Server B,
      // this command ensures both join the shared Redis-backed Socket.IO room.
      io.in(user1.socketId).socketsJoin(roomId);
      io.in(user2.socketId).socketsJoin(roomId);
      
      // Emit the 'match_found' event to each user.
      // We pass the roomId, their specific role (WebRTC requires one person to 'initiate' the call),
      // the stranger's name, and whether it's a text or video chat.
      io.to(user1.socketId).emit('match_found', { 
        roomId, 
        role: 'initiator', 
        strangerName: user2.username,
        mode
      });
      io.to(user2.socketId).emit('match_found', { 
        roomId, 
        role: 'receiver', 
        strangerName: user1.username,
        mode
      });
      
      // If it's a video chat, we need to start the WebRTC handshake.
      // We give the frontend a brief moment (500ms) to render the ChatRoom component,
      // request camera permissions, and get ready before we tell the 'initiator' to send an Offer.
      if (mode === 'video') {
        setTimeout(() => {
          io.to(user1.socketId).emit('webrtc_initiate');
        }, 500);
      }

    } catch (err) {
      console.error(err);
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    setupSocketHandlers(io, socket);
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to connect to Redis:", err);
});

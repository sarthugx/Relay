const Matchmaker = require('./matchmaking');

/**
 * Initializes all Socket.IO event listeners for a newly connected client.
 * @param {import('socket.io').Server} io - The main Socket.IO server instance.
 * @param {import('socket.io').Socket} socket - The individual client's socket connection.
 */
module.exports = function setupSocketHandlers(io, socket) {
  
  // ==========================================
  // MATCHMAKING EVENTS
  // ==========================================
  
  /**
   * Triggered when a user clicks "Text" or "Video" on the home screen.
   * We attach their chosen username and mode to the socket object so we
   * can reference it later if they disconnect unexpectedly.
   */
  socket.on('join_queue', async ({ username, mode }) => {
    socket.data.username = username || 'Stranger';
    socket.data.mode = mode || 'video';
    console.log(`User ${socket.id} joining ${mode} queue as ${username}`);
    
    // Add them to the Redis queue to await a match.
    Matchmaker.joinQueue(
      socket,
      io,
      socket.data.username,
      socket.data.mode
    );
  });

  /**
   * Triggered when a user explicitly clicks "Stop / Leave" or "Next Stranger".
   */
  socket.on('leave_room', ({ roomId }) => {
    // Remove the socket from the Socket.IO room.
    socket.leave(roomId);
    // Broadcast to the OTHER person in the room that this user left.
    socket.to(roomId).emit('stranger_disconnected');
  });

  // ==========================================
  // DISCONNECTION HANDLING
  // ==========================================
  
  /**
   * 'disconnecting' fires right BEFORE the socket is fully destroyed.
   * This allows us to inspect `socket.rooms` and notify any active chat partners.
   */
  socket.on('disconnecting', async () => {
    // Loop through all rooms this socket is currently in.
    // (Note: socket.rooms always contains the socket's own ID as the first room).
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        // Notify the stranger that the user closed the tab / lost connection.
        socket.to(room).emit('stranger_disconnected');
      }
    }
    // Also try to remove them from the matchmaking queue just in case they were waiting.
    Matchmaker.leaveQueue(socket.id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // ==========================================
  // WEBRTC SIGNALING EVENTS
  // ==========================================
  // These events act as a "Post Office" to pass WebRTC connection data 
  // (Offers, Answers, and ICE candidates) between the two peers in the room.
  
  socket.on('webrtc_ready', ({ roomId }) => {
    // Client indicates their local camera/mic is ready.
    // The server handles initiating the connection elsewhere (in index.js via match_made).
  });

  socket.on('webrtc_offer', ({ roomId, offer }) => {
    // Forward the WebRTC Offer to the other person in the room.
    socket.to(roomId).emit('webrtc_offer', { offer });
  });

  socket.on('webrtc_answer', ({ roomId, answer }) => {
    // Forward the WebRTC Answer back to the initiator.
    socket.to(roomId).emit('webrtc_answer', { answer });
  });

  socket.on('webrtc_ice_candidate', ({ roomId, candidate }) => {
    // Forward network routing info (ICE candidates) so peers can establish a direct connection.
    socket.to(roomId).emit('webrtc_ice_candidate', { candidate });
  });

  // ==========================================
  // TEXT CHAT EVENTS
  // ==========================================
  
  /**
   * Relays text messages to the other person in the room.
   */
  socket.on('chat_message', ({ roomId, text }) => {
    socket.to(roomId).emit('chat_message', { 
      sender: 'stranger', // Used by frontend to differentiate bubble styling
      text, 
      timestamp: new Date().toISOString() 
    });
  });
};

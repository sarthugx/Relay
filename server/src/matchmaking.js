const { pubClient } = require('./redis');
const { v4: uuidv4 } = require('uuid');

const QUEUE_TEXT = 'omegle_queue_text';
const QUEUE_VIDEO = 'omegle_queue_video';

class Matchmaker {
  /**
   * Adds a user to the Redis matchmaking queue.
   * @param {string} socketId - The socket connection ID of the user.
   * @param {string} username - The chosen username.
   * @param {string} mode - The chat mode ('text' or 'video').
   */
  static async joinQueue(socketId, username, mode) {
    // Determine which queue to put the user in based on their selected mode.
    const queueKey = mode === 'video' ? QUEUE_VIDEO : QUEUE_TEXT;
    
    // We store user info as a JSON string to keep the username tied to the socket in the queue.
    const userData = JSON.stringify({ socketId, username, mode });
    
    // Add the user data to the end (left side) of the Redis list.
    await pubClient.lPush(queueKey, userData);
    
    // Immediately attempt to find a match since a new user was just added.
    await this.tryMatch(queueKey);
  }

  /**
   * Removes a user from both queues if they disconnect before a match is found.
   * @param {string} socketId - The socket connection ID of the user.
   */
  static async leaveQueue(socketId) {
    // This is inefficient but functional for MVP: remove user from both queues if they disconnect.
    // In a production environment with millions of users, you would keep a separate Redis Hash
    // mapping `socketId -> mode` to avoid scanning both lists entirely.
    
    // Fetch all items from both queues.
    const textQueue = await pubClient.lRange(QUEUE_TEXT, 0, -1);
    const videoQueue = await pubClient.lRange(QUEUE_VIDEO, 0, -1);

    // Iterate through text queue and remove the string that contains the disconnected socketId.
    for (const item of textQueue) {
      if (item.includes(socketId)) {
        await pubClient.lRem(QUEUE_TEXT, 0, item);
      }
    }
    
    // Iterate through video queue and remove the string that contains the disconnected socketId.
    for (const item of videoQueue) {
      if (item.includes(socketId)) {
        await pubClient.lRem(QUEUE_VIDEO, 0, item);
      }
    }
  }

  /**
   * Attempts to pop two users off the queue and match them together.
   * @param {string} queueKey - The specific queue (text or video) to check.
   */
  static async tryMatch(queueKey) {
    // Check if there are at least 2 people waiting in this specific queue.
    const queueLength = await pubClient.lLen(queueKey);
    if (queueLength >= 2) {
      
      // Pop the oldest 2 users from the front (right side) of the Redis list.
      // RPOP ensures First-In-First-Out (FIFO) ordering.
      const u1Data = await pubClient.rPop(queueKey);
      const u2Data = await pubClient.rPop(queueKey);

      if (u1Data && u2Data) {
        // Parse the stored JSON strings back into objects.
        const user1 = JSON.parse(u1Data);
        const user2 = JSON.parse(u2Data);
        
        // Generate a unique room ID for their private chat session.
        const roomId = uuidv4();
        
        // Publish an event across the entire Redis cluster.
        // This is crucial because User 1 might be connected to Node Server A, 
        // while User 2 might be connected to Node Server B.
        // The 'match_made' event tells all servers to check if they hold these sockets.
        await pubClient.publish('match_made', JSON.stringify({ 
          user1, 
          user2, 
          roomId,
          mode: user1.mode
        }));
        
        // Recursively call tryMatch in case there are 4, 6, 8+ people waiting in the queue.
        await this.tryMatch(queueKey);
      } else {
        // Race condition fallback: If we thought there were 2 people, but popped null
        // (meaning another node instance matched them first), we push whoever we did get back into the queue.
        if (u1Data) await pubClient.rPush(queueKey, u1Data);
        if (u2Data) await pubClient.rPush(queueKey, u2Data);
      }
    }
  }
}

module.exports = Matchmaker;

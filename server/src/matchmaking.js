const { v4: uuidv4 } = require('uuid');

const queues = {
  text: [],
  video: [],
};

class Matchmaker {
  static joinQueue(socket, io, username, mode) {
    const queue = mode === 'video'
      ? queues.video
      : queues.text;

    // Prevent duplicate queue entries
    const alreadyQueued = queue.find(
      (user) => user.socket.id === socket.id
    );

    if (alreadyQueued) return;

    queue.push({
      socket,
      username,
      mode,
    });

    this.tryMatch(io, mode);
  }

  static leaveQueue(socketId) {
    queues.text = queues.text.filter(
      (user) => user.socket.id !== socketId
    );

    queues.video = queues.video.filter(
      (user) => user.socket.id !== socketId
    );
  }

  static tryMatch(io, mode) {
    const queue =
      mode === 'video'
        ? queues.video
        : queues.text;

    while (queue.length >= 2) {
      const user1 = queue.shift();
      const user2 = queue.shift();

      const roomId = uuidv4();

      user1.socket.join(roomId);
      user2.socket.join(roomId);

      io.to(user1.socket.id).emit('match_found', {
        roomId,
        role: 'initiator',
        strangerName: user2.username,
        mode,
      });

      io.to(user2.socket.id).emit('match_found', {
        roomId,
        role: 'receiver',
        strangerName: user1.username,
        mode,
      });

      if (mode === 'video') {
        setTimeout(() => {
          io.to(user1.socket.id).emit('webrtc_initiate');
        }, 2000);
      }
    }
  }
}

module.exports = Matchmaker;
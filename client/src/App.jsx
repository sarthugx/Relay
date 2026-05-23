import React, { useState, useEffect } from 'react';
import socket from './lib/socket';
import Home from './pages/Home';
import ChatRoom from './pages/ChatRoom';

/**
 * App is the root component that manages the global state of the application.
 * It determines whether to show the Home screen (where you pick a mode) or
 * the ChatRoom (where you are matched with someone).
 */
function App() {
  // Global State
  const [inRoom, setInRoom] = useState(false); // Are we currently chatting?
  const [roomId, setRoomId] = useState(null); // The socket.io room ID
  const [mode, setMode] = useState('video'); // 'video' or 'text'
  const [username, setUsername] = useState(''); // The user's chosen name
  const [strangerName, setStrangerName] = useState('Stranger'); // The matched person's name

  useEffect(() => {
    // ----------------------------------------------------
    // SOCKET LISTENERS
    // ----------------------------------------------------
    
    // Triggered when the backend Matchmaker finds a pair.
    socket.on('match_found', ({ roomId, strangerName, mode: roomMode }) => {
      setRoomId(roomId);
      setStrangerName(strangerName || 'Stranger');
      setMode(roomMode || 'video');
      // Setting inRoom to true unmounts Home and mounts ChatRoom
      setInRoom(true);
    });

    // Triggered if the other person clicks "Stop" or closes their tab.
    socket.on('stranger_disconnected', () => {
      setInRoom(false);
      setRoomId(null);
      alert("Stranger disconnected.");
    });

    // Cleanup listeners when component unmounts
    return () => {
      socket.off('match_found');
      socket.off('stranger_disconnected');
    };
  }, []);

  /**
   * Called from Home.jsx when the user clicks "Text" or "Video".
   */
  const handleStart = (name, selectedMode) => {
    setUsername(name);
    setMode(selectedMode);
    // Tell the backend to put us in the Redis queue.
    socket.emit('join_queue', { username: name, mode: selectedMode });
  };

  /**
   * Called from ChatRoom.jsx when the user clicks "Stop / Leave".
   */
  const handleLeave = () => {
    socket.emit('leave_room', { roomId });
    setInRoom(false);
    setRoomId(null);
  };

  /**
   * Called from ChatRoom.jsx when the user clicks "Next Stranger".
   * This leaves the current room and immediately requeues.
   */
  const handleNext = () => {
    socket.emit('leave_room', { roomId });
    setInRoom(false);
    setRoomId(null);
    socket.emit('join_queue', { username, mode });
  };

  return (
    <div className="w-full h-screen flex flex-col bg-dark-900 text-white overflow-hidden">
      {!inRoom ? (
        // If not in a room, show the landing page.
        <Home onStart={handleStart} />
      ) : (
        // If in a room, show the chat interface.
        <ChatRoom 
          roomId={roomId} 
          mode={mode}
          strangerName={strangerName}
          onLeave={handleLeave}
          onNext={handleNext}
        />
      )}
    </div>
  );
}

export default App;

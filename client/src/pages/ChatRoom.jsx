import React, { useEffect, useRef, useState } from 'react';
import socket from '../lib/socket';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoPlayer from '../components/VideoPlayer';
import ChatBox from '../components/ChatBox';

/**
 * ChatRoom Component
 * The main interface for communicating with a matched stranger.
 * 
 * @param {Object} props
 * @param {string} props.roomId - The unique Socket.IO room ID for this chat session.
 * @param {string} props.mode - The chat mode ('text' or 'video'). Determines if we render video players.
 * @param {string} props.strangerName - The name of the person you matched with.
 * @param {Function} props.onLeave - Callback to leave the room entirely.
 * @param {Function} props.onNext - Callback to skip the current stranger and requeue.
 */
export default function ChatRoom({ roomId, mode, strangerName, onLeave, onNext }) {
  // Custom hook that manages the complex WebRTC connection state.
  // It handles requesting camera permissions, creating peer connections, and signaling.
  const {
    localStream,
    remoteStream,
    toggleAudio,
    toggleVideo,
    isAudioMuted,
    isVideoMuted
  } = useWebRTC(
    roomId,
    socket,
    mode === 'video'
    );
  
  // Local state to store the history of text messages in this room.
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    /**
     * Listener for incoming chat messages from the Socket.IO server.
     * @param {Object} msg - The message object containing sender, text, and timestamp.
     */
    const handleNewMessage = (msg) => {
      // Append the new message to the existing array of messages.
      setMessages((prev) => [...prev, msg]);
    };
    
    socket.on('chat_message', handleNewMessage);
    
    // Cleanup listener on unmount
    return () => socket.off('chat_message', handleNewMessage);
  }, []);

  // Prevent accidental refresh
  useEffect(() => {
    /**
     * Listener attached to the browser's window to intercept refresh/close events.
     * This stops the user from accidentally destroying their active WebRTC/Socket session.
     */
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // Standard way to trigger the native browser confirmation prompt.
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  /**
   * Handles sending a new text message.
   * @param {string} text - The typed message.
   */
  const sendMessage = (text) => {
    // Optimistically render the message locally before the server confirms it.
    const msg = { sender: 'me', text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, msg]);
    
    // Emit to the server so it gets forwarded to the stranger.
    socket.emit('chat_message', { roomId, text });
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-white overflow-hidden text-black">
      {/* Video Area (Left Column) - Only render if mode is video */}
      {mode === 'video' && (
        <div className="flex-none w-full md:w-[350px] lg:w-[400px] flex flex-col p-2 bg-[#e0e0e0] h-[50dvh] md:h-full gap-2 border-r border-[#ccc]">
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <div className="w-full flex-1 overflow-hidden relative bg-[#1c1c1c] shadow-sm">
               <VideoPlayer stream={remoteStream} label={strangerName} muted={false} />
            </div>
            <div className="w-full flex-1 overflow-hidden relative bg-[#1c1c1c] shadow-sm">
               <VideoPlayer stream={localStream} label="You" muted={true} />
               {/* Controls overlay */}
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-1.5 rounded-full backdrop-blur-md z-10">
                 <button onClick={toggleAudio} className={`p-1.5 px-3 text-xs rounded-full transition text-white ${isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'}`}>
                   {isAudioMuted ? 'Unmute' : 'Mute'}
                 </button>
                 <button onClick={toggleVideo} className={`p-1.5 px-3 text-xs rounded-full transition text-white ${isVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'}`}>
                   {isVideoMuted ? 'Show Video' : 'Hide Video'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area (Right Column) */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden ${mode === 'video' ? 'h-[50dvh] md:h-full' : 'h-full'}`}>
        <ChatBox 
          messages={messages} 
          strangerName={strangerName}
          onSendMessage={sendMessage} 
          onNext={onNext}
          onLeave={onLeave}
        />
      </div>
    </div>
  );
}

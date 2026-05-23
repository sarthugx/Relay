import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

/**
 * ChatBox Component
 * Renders the text chat interface, including the message history and the input form.
 * 
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects { sender, text, timestamp }.
 * @param {string} props.strangerName - The matched user's name.
 * @param {Function} props.onSendMessage - Callback triggered when the user submits a message.
 * @param {Function} props.onNext - Callback to skip the current stranger.
 * @param {Function} props.onLeave - Callback to leave the room entirely.
 */
export default function ChatBox({ messages, strangerName, onSendMessage, onNext, onLeave }) {
  // Local state for the text input field
  const [input, setInput] = useState('');
  
  // Reference to the bottom of the chat list, used to auto-scroll
  const endRef = useRef(null);

  /**
   * Handles the submission of the chat form.
   */
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the page from reloading on form submit
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput(''); // Clear the input field after sending
    }
  };

  /**
   * Automatically scroll to the bottom of the chat window whenever
   * a new message is added to the `messages` array.
   */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white text-black">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-sans text-sm md:text-base">
        {messages.map((msg, idx) => {
          const isMe = msg.sender === 'me';
          return (
            <div key={idx} className="leading-relaxed">
              <span className={`font-bold ${isMe ? 'text-blue-600' : 'text-red-600'}`}>
                {isMe ? 'You: ' : `${strangerName || 'Stranger'}: `}
              </span>
              <span>{msg.text}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="p-2 border-t border-[#ccc] bg-[#f0f0f0] flex flex-col md:flex-row gap-2">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={onLeave}
            className="flex-1 md:flex-none bg-white border border-[#ccc] hover:bg-gray-50 text-black px-4 py-2 text-sm md:text-base font-semibold shadow-sm min-w-[80px]"
          >
            Stop
          </button>
          <button
            onClick={onNext}
            className="flex-[2] md:flex-none bg-blue-500 hover:bg-blue-600 text-white border border-blue-600 px-4 py-2 text-sm md:text-base font-semibold shadow-sm min-w-[80px]"
          >
            New
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border border-[#ccc] px-3 py-2 text-sm md:text-base focus:outline-none focus:border-blue-500 shadow-inner"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-white border border-[#ccc] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-black px-6 py-2 text-sm md:text-base font-semibold shadow-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Video, MessageSquare, ShieldAlert } from 'lucide-react';

/**
 * Home Component
 * This is the landing page where users choose their username and chat mode.
 * 
 * @param {Object} props
 * @param {Function} props.onStart - Callback function triggered when a user clicks a chat mode button.
 */
export default function Home({ onStart }) {
  // Local state to manage UI loading spinner
  const [loading, setLoading] = useState(false);
  // Local state to store the user's chosen name
  const [username, setUsername] = useState('');

  /**
   * Handles the click event for either the "Text" or "Video" buttons.
   * @param {string} mode - The selected chat mode ('text' or 'video').
   */
  const handleStartClick = (mode) => {
  // Prevent empty or whitespace-only usernames
  if (!username.trim()) return;
  setLoading(true);
  // Remove extra spaces from start/end
  onStart(username.trim(), mode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f2f2f2] text-black p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-3000">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Video className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-blue-600">Relay</h1>
          <p className="text-gray-600 mb-6">Meet random strangers anonymously.</p>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors text-black"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleStartClick('text')}
              disabled={loading || !username.trim()}
              className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-4 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  Text
                </>
              )}
            </button>
            <button
              onClick={() => handleStartClick('video')}
              disabled={loading || !username.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Video
                </>
              )}
            </button>
          </div>
        </div>
        <div className="bg-gray-100 p-4 border-t border-gray-300 text-sm text-gray-600 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <p>
            By using this service, you agree to our terms. Please be respectful and do not share personal information.
            Video and audio are transmitted peer-to-peer and are not stored.
          </p>
        </div>
      </div>
    </div>
  );
}

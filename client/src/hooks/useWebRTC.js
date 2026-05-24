import { useState, useEffect, useRef } from 'react';

// Free STUN servers provided by Google.
// These servers help the browser discover its own public IP address and 
// bypass NAT/firewall restrictions to establish a direct P2P connection.
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Custom React hook that encapsulates the complex WebRTC setup and signaling process.
 * 
 * @param {string} roomId - The Socket.IO room ID.
 * @param {import('socket.io-client').Socket} socket - The connected Socket.IO client.
 * @returns {Object} localStream, remoteStream, toggle functions, and mute states.
 */
export function useWebRTC(roomId, socket) {
  // State to hold the user's own camera/mic stream
  const [localStream, setLocalStream] = useState(null);
  // State to hold the stranger's camera/mic stream
  const [remoteStream, setRemoteStream] = useState(null);
  // UI states for mute buttons
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  
  // Ref to hold the active WebRTC PeerConnection without causing React re-renders
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    let stream = null;

    /**
     * Main initialization function for WebRTC.
     */
    const initWebRTC = async () => {
      try {
        // 1. Request access to the user's camera and microphone
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        // 2. Initialize the WebRTC Peer Connection with Google's STUN servers
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // 3. Attach our local media tracks to the WebRTC connection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const inboundStream = new MediaStream();

        setRemoteStream(inboundStream);

        pc.ontrack = (event) => {
          console.log('Received remote track');

          event.streams[0].getTracks().forEach((track) => {
            inboundStream.addTrack(track);
          }); 
        };

        // 5. ICE Candidate Gathering
        // As the STUN server discovers network routing paths (ICE candidates),
        // we must send them to the stranger via our Socket.IO server.
        pc.onicecandidate = (event) => {
          console.log('Sending ICE candidate');
          if (event.candidate) {
            socket.emit('webrtc_ice_candidate', {
              roomId,
              candidate: event.candidate,
            });
          }
        };

        // ==========================================
        // SIGNALING: Socket.IO Event Listeners
        // ==========================================

        // When the stranger sends us an "Offer" to connect:
        socket.off('webrtc_offer');

        socket.on('webrtc_offer', async ({ offer }) => {
          console.log('Received WebRTC offer');
          // Save their offer as the remote description
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          // Create an "Answer" to their offer
          const answer = await pc.createAnswer();
          // Save our answer as the local description
          await pc.setLocalDescription(answer);
          // Send the answer back through the socket
          socket.emit('webrtc_answer', { roomId, answer });
        });

        // When the stranger replies to our Offer with an "Answer":
        socket.off('webrtc_answer');

        socket.on('webrtc_answer', async ({ answer }) => {
          console.log('Received WebRTC answer');
          // Save their answer as the remote description. The connection is now established!
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        // When the stranger sends us their network routing info (ICE Candidate):
        socket.off('webrtc_ice_candidate');

        socket.on('webrtc_ice_candidate', async ({ candidate }) => {
          console.log('Received ICE candidate');
          try {
            // Add their routing info to our connection so we know how to reach them
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        });

        // Tell the server we have acquired camera permissions and are ready
        socket.emit('webrtc_ready', { roomId });

        // The server decides who the "Initiator" is and tells them to start the handshake
        socket.off('webrtc_initiate');

        socket.on('webrtc_initiate', async () => {
          console.log('Initiating WebRTC connection');
          // Create the initial WebRTC connection Offer
          const offer = await pc.createOffer();
          // Save it locally
          await pc.setLocalDescription(offer);
          // Send it to the stranger
          socket.emit('webrtc_offer', { roomId, offer });
        });

      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    };

    initWebRTC();

    // Cleanup function runs when the component unmounts (user clicks Stop or Next)
    return () => {
      // Turn off the camera/mic hardware
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Close the P2P connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      // Remove all socket listeners to prevent memory leaks
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('webrtc_initiate');
      socket.off('webrtc_ready');
    };
  }, [roomId, socket]);

  /**
   * Toggles the local microphone on/off.
   */
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
      setIsAudioMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  /**
   * Toggles the local camera on/off.
   */
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
      setIsVideoMuted(!localStream.getVideoTracks()[0].enabled);
    }
  };

  return { localStream, remoteStream, toggleAudio, toggleVideo, isAudioMuted, isVideoMuted };
}

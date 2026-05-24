import React, { useEffect, useRef } from 'react';

export default function VideoPlayer({ stream, label, muted }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-[#1c1c1c] overflow-hidden border border-dark-700">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        controls={false}
        disablePictureInPicture
        className="w-full h-full object-contain"
      />
      <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 text-xs font-medium backdrop-blur-sm text-white">
        {label}
      </div>
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="w-8 h-8 border-4 border-dark-700 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

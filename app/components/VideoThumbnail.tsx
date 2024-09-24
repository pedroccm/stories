// components/VideoThumbnail.tsx

import React, { useRef } from 'react';

interface VideoThumbnailProps {
  src: string;
  poster: string;
  onClick: () => void;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ src, poster, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden cursor-pointer" onClick={onClick}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        playsInline
        muted={false}  // Som habilitado
        preload="metadata"
        controls  // Habilita os controles nativos de vídeo
      />
    </div>
  );
};

export default VideoThumbnail;

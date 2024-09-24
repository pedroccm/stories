// components/VideoThumbnail.tsx

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface VideoThumbnailProps {
  src: string;
  poster: string;
  onClick: () => void;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ src, poster, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedData = () => {
        video.play()
          .then(() => {
            setTimeout(() => {
              video.pause();
            }, 1000); // Pausa após 1 segundo
          })
          .catch(error => {
            console.error('Erro ao tentar reproduzir o vídeo:', error);
          });
      };

      video.addEventListener('loadeddata', handleLoadedData);

      // Limpeza do event listener
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, [src]);

  return (
    <div className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden cursor-pointer" onClick={onClick}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        playsInline
        muted
        preload="metadata"
        controls={false}
      />
      {/* Opcional: Adicionar um ícone de play sobre o vídeo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <X className="text-white opacity-50" size={32} />
      </div>
    </div>
  );
};

export default VideoThumbnail;

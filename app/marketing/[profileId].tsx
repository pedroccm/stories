'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { Menu, X, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import Image from 'next/image';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const bucketName = "nbapedroccm";
const region = "us-east-2";
const basePath = `https://${bucketName}.s3.${region}.amazonaws.com/`;

interface Profile {
  id: number;
  user_id: number;
  instagram_id: string;
  id_profile: string;
}

interface StoryData {
  files: string[];
}

const INITIAL_LOAD = 50;
const LOAD_MORE = 20;
const MIN_THUMBNAIL_WIDTH = 100;
const MAX_THUMBNAIL_WIDTH = 300;
const ZOOM_STEP = 20;

export default function FoodProfilePage() {
  const router = useRouter();
  const { profileId } = router.query;  // Pega o ID do perfil da URL
  const [menuOpen, setMenuOpen] = useState(false);
  const [visibleMediaFiles, setVisibleMediaFiles] = useState<string[]>([]);
  const [allMediaFiles, setAllMediaFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [thumbnailWidth, setThumbnailWidth] = useState(200);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showPhotos, setShowPhotos] = useState(true);
  const [showVideos, setShowVideos] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(getYesterday());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const loader = useRef(null);

  function getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  const loadMediaForProfile = useCallback((profileId: string) => {
    setLoading(true);
    fetch(`/storiesJson/${profileId}.json`)  // Ajuste aqui para a URL do seu JSON por perfil
      .then(response => response.json())
      .then((data: StoryData) => {
        const reversedFiles = [...data.files].reverse();
        setAllMediaFiles(reversedFiles);
        setVisibleMediaFiles(reversedFiles.slice(0, INITIAL_LOAD));
        setHasMore(reversedFiles.length > INITIAL_LOAD);
      })
      .catch(error => console.error('Error loading profile data:', error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (profileId) {
      setSelectedProfile(profileId as string);
      loadMediaForProfile(profileId as string);
    }
  }, [profileId, loadMediaForProfile]);

  const loadMoreItems = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    const currentLength = visibleMediaFiles.length;
    const more = allMediaFiles.slice(currentLength, currentLength + LOAD_MORE);
    
    setVisibleMediaFiles(prev => [...prev, ...more]);
    setHasMore(currentLength + LOAD_MORE < allMediaFiles.length);
    setLoading(false);
  }, [loading, hasMore, visibleMediaFiles, allMediaFiles]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore) {
        loadMoreItems();
      }
    }, options);

    const currentLoader = loader.current; 

    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) { 
        observer.unobserve(currentLoader);
      }
    };
  }, [loadMoreItems, hasMore]);

  const handleZoomIn = () => {
    setThumbnailWidth(prev => Math.min(MAX_THUMBNAIL_WIDTH, prev + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setThumbnailWidth(prev => Math.max(MIN_THUMBNAIL_WIDTH, prev - ZOOM_STEP));
  };

  const isVideo = (filename: string): boolean => filename.endsWith('.mp4');

  const togglePhotos = () => {
    setShowPhotos(!showPhotos);
  };

  const toggleVideos = () => {
    setShowVideos(!showVideos);
  };

  const filteredMediaFiles = visibleMediaFiles.filter(file => {
    const isVideoFile = isVideo(file);
    return (isVideoFile && showVideos) || (!isVideoFile && showPhotos);
  });

  const formatDate = (filename: string) => {
    const match = filename.match(/(\d{4}-\d{2}-\d{2}) at (\d{2}\.\d{2}\.\d{2} [AP]M)/);
    if (match) {
      const [, datePart, timePart] = match;
      const [, month, day] = datePart.split('-'); 
      const [time] = timePart.split(' ');
      const [hours, minutes] = time.split('.');

      const formattedDate = `${day}/${month} - ${hours}:${minutes}`;
      
      if (selectedProfile) {
        return `${selectedProfile}\n${formattedDate}`;
      } else {
        const profileMatch = filename.match(/([^/]+)\/([^/]+)\//);
        if (profileMatch) {
          const profileName = profileMatch[2];
          return `@${profileName}\n${formattedDate}`;
        }
      }
    }
    return '';
  };

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <Menu className="mr-4 cursor-pointer" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="text-red-600 font-bold text-xl">Time</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCalendarOpen(!calendarOpen)}
            className="bg-gray-800 p-2 rounded-full"
          >
            <Calendar size={24} />
          </button>
          <ZoomOut onClick={handleZoomOut} className="cursor-pointer" />
          <ZoomIn onClick={handleZoomIn} className="cursor-pointer" />
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex space-x-4 p-4 border-b border-gray-700">
        <button 
          className={`px-4 py-2 rounded-full ${showPhotos ? 'bg-white text-black' : 'border border-gray-500 text-white'}`}
          onClick={togglePhotos}
        >
          Photos
        </button>
        <button 
          className={`px-4 py-2 rounded-full ${showVideos ? 'bg-white text-black' : 'border border-gray-500 text-white'}`}
          onClick={toggleVideos}
        >
          Videos
        </button>
      </nav>

      {/* Media grid */}
      <main className="relative p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailWidth}px, 1fr))` }}>
          {filteredMediaFiles.map((file, index) => (
            <div key={index} className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden">
              {isVideo(file) ? (
                <video
                  src={`${basePath}${file}`}
                  poster={`${basePath}thumbnails/${file}.jpg`} // Ajuste para o caminho correto da thumbnail
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  loop
                  controls
                  preload="metadata"
                />
              ) : (
                <Image
                  src={`${basePath}${file}`}
                  alt={`Short ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                  className="cursor-pointer"
                  onClick={() => setFullscreenImage(`${basePath}${file}`)}
                />
              )}
              <div className="absolute bottom-2 left-2 text-white text-xs">
                <p className="bg-black bg-opacity-50 p-1 rounded">
                  {formatDate(file)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Loading indicator */}
        <div ref={loader} className="flex justify-center my-4">
          {loading && <p>Carregando mais...</p>}
          {!loading && !hasMore && <p>Não há mais itens para carregar</p>}
        </div>

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative w-full h-full">
              <Image
                src={fullscreenImage}
                alt="Fullscreen image"
                layout="fill"
                objectFit="contain"
              />
              <button
                className="absolute top-4 right-4 text-white text-2xl"
                onClick={() => setFullscreenImage(null)}
              >
                <X size={32} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation'; // Pega o profileId da URL
import Image from 'next/image';
import { Menu, X, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const bucketName = "nbapedroccm";
const region = "us-east-2";
const basePath = `https://${bucketName}.s3.${region}.amazonaws.com/`;

interface StoryData {
  files: string[];
}

const INITIAL_LOAD = 50;
const LOAD_MORE = 20;
const MIN_THUMBNAIL_WIDTH = 100;
const MAX_THUMBNAIL_WIDTH = 300;
const ZOOM_STEP = 20;

export default function ProfilePage() {
  const pathname = usePathname();
  const profileId = pathname.split('/').pop(); // Pega o último segmento da URL
  
  const [visibleMediaFiles, setVisibleMediaFiles] = useState<string[]>([]);
  const [allMediaFiles, setAllMediaFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [thumbnailWidth, setThumbnailWidth] = useState(200);
  const [showPhotos, setShowPhotos] = useState(true);
  const [showVideos, setShowVideos] = useState(true);
  const loader = useRef(null);

  const loadMediaForProfile = useCallback((profileId: string) => {
    setLoading(true);
    fetch(`/storiesJson/${profileId}.json`)
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
      loadMediaForProfile(profileId);
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

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <Menu className="mr-4 cursor-pointer" />
          <span className="text-red-600 font-bold text-xl">{profileId}</span>
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
                  poster={`${basePath}thumbnails/${file}.jpg`}
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
                  alt={`Media ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Loading indicator */}
        <div ref={loader} className="flex justify-center my-4">
          {loading && <p>Loading more...</p>}
          {!loading && !hasMore && <p>No more items to load</p>}
        </div>
      </main>
    </div>
  );
}

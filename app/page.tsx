'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import Image from 'next/image';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(() => import('../components/VideoPlayer'), { ssr: false });

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

export default function Home() {
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

  const loadMediaForDate = useCallback((date: Date) => {
    setLoading(true);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
    fetch(`/datas/${formattedDate}.json`)
      .then(response => response.json())
      .then((data: StoryData) => {
        const reversedFiles = [...data.files].reverse();
        setAllMediaFiles(reversedFiles);
        setVisibleMediaFiles(reversedFiles.slice(0, INITIAL_LOAD));
        setHasMore(reversedFiles.length > INITIAL_LOAD);
      })
      .catch(error => console.error('Error loading media files:', error))
      .finally(() => setLoading(false));
  }, []);

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
    if (selectedDate) {
      loadMediaForDate(selectedDate);
    }
  }, [selectedDate, loadMediaForDate]);

  useEffect(() => {
    fetch('/profiles.json')
      .then(response => response.json())
      .then((data: Profile[]) => {
        setProfiles(data);
      })
      .catch(error => console.error('Error loading profiles:', error));
  }, []);

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

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedProfile(null);
    setCalendarOpen(false);
    if (date) {
      loadMediaForDate(date);
    }
  };

  const isVideo = (filename: string): boolean => filename.endsWith('.mp4');

  const handleZoomIn = () => {
    setThumbnailWidth(prev => Math.min(MAX_THUMBNAIL_WIDTH, prev + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setThumbnailWidth(prev => Math.max(MIN_THUMBNAIL_WIDTH, prev - ZOOM_STEP));
  };

  const handleProfileSelect = (instagramId: string) => {
    setSelectedProfile(instagramId);
    setSelectedDate(null);
    setVisibleMediaFiles([]);
    setLoading(true);
    setMenuOpen(false);
    fetch(`/storiesJson/${instagramId}.json`)
      .then(response => response.json())
      .then((data: StoryData) => {
        const reversedFiles = [...data.files].reverse();
        setAllMediaFiles(reversedFiles);
        setVisibleMediaFiles(reversedFiles.slice(0, INITIAL_LOAD));
        setHasMore(reversedFiles.length > INITIAL_LOAD);
      })
      .catch(error => console.error('Error loading profile data:', error))
      .finally(() => setLoading(false));
  };

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

  const filteredProfiles = profiles.filter(profile => 
    profile.instagram_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <Menu className="mr-4 cursor-pointer" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="text-red-600 font-bold text-xl">Stories</span>
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

      {/* Date Picker */}
      {calendarOpen && (
        <div className="absolute right-0 mt-2 z-50">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            inline
            calendarClassName="bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
          />
        </div>
      )}

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

      {/* Main content */}
      <main className="relative p-4">
        {/* Side menu */}
        <div className={`fixed top-0 left-0 h-full w-64 bg-gray-900 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-20 flex flex-col`}>
          <div className="flex flex-col justify-between p-4 border-b border-gray-700 bg-gray-900 sticky top-0">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Profiles</span>
              <X className="cursor-pointer" onClick={() => setMenuOpen(false)} />
            </div>
            <input
              type="text"
              placeholder="Search profiles..."
              className="w-full px-3 py-2 bg-gray-800 text-white rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ul className="p-4 overflow-y-auto flex-grow">
            {filteredProfiles.map(profile => (
              <li 
                key={profile.id} 
                className={`py-2 cursor-pointer hover:bg-gray-800 ${selectedProfile === profile.instagram_id ? 'bg-gray-700' : ''} flex items-center`}
                onClick={() => handleProfileSelect(profile.instagram_id)}
              >
                <Image
                  src={`/instagram_profile/${profile.instagram_id}.jpg`}
                  alt={`${profile.instagram_id} profile`}
                  width={24}
                  height={24}
                  className="rounded-full mr-2"
                />
                <span>{profile.instagram_id}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Media grid */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailWidth}px, 1fr))` }}>
          {filteredMediaFiles.map((file, index) => (
            <div key={index} className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden">
              {isVideo(file) ? (
                <VideoPlayer
                  src={`${basePath}${file}`}
                  poster=""  {/* String vazia se não houver poster */}
                />
              ) : (
                <Image
                  src={`${basePath}${file}`}
                  alt={`Short ${index + 1}`}
                  fill
                  sizes={`${thumbnailWidth}px`}
                  style={{ objectFit: 'cover' }}
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
                fill
                style={{ objectFit: 'contain' }}
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
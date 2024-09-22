'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

interface MediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video';
  timestamp: string;
  profileName: string;
}

interface ApiResponse {
  items: MediaItem[];
  nextCursor: string | null;
}

const ITEMS_PER_PAGE = 30;
const MIN_THUMBNAIL_WIDTH = 100;
const MAX_THUMBNAIL_WIDTH = 300;
const ZOOM_STEP = 20;

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [thumbnailWidth, setThumbnailWidth] = useState(200);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showPhotos, setShowPhotos] = useState(true);
  const [showVideos, setShowVideos] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(getYesterday());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const loader = useRef(null);

  function getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  const fetchMediaItems = useCallback(async (date: Date, cursor: string | null = null) => {
    setLoading(true);
    setError(null);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
    try {
      const response = await fetch(`/api/media?date=${formattedDate}&cursor=${cursor || ''}&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) throw new Error('Failed to fetch media items');
      const data: ApiResponse = await response.json();
      return data;
    } catch (err) {
      setError('Error loading media. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMediaForDate = useCallback(async (date: Date) => {
    const data = await fetchMediaItems(date);
    if (data) {
      setMediaItems(data.items);
      setNextCursor(data.nextCursor);
    }
  }, [fetchMediaItems]);

  const loadMoreItems = useCallback(async () => {
    if (loading || !nextCursor || !selectedDate) return;
    const data = await fetchMediaItems(selectedDate, nextCursor);
    if (data) {
      setMediaItems(prev => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    }
  }, [loading, nextCursor, selectedDate, fetchMediaItems]);

  useEffect(() => {
    if (selectedDate) {
      loadMediaForDate(selectedDate);
    }
  }, [selectedDate, loadMediaForDate]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetch('/api/profiles');
        if (!response.ok) throw new Error('Failed to fetch profiles');
        const data: Profile[] = await response.json();
        setProfiles(data);
      } catch (err) {
        setError('Error loading profiles. Please try again.');
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 1.0
    };

    const observer = new IntersectionObserver((entities) => {
      const target = entities[0];
      if (target.isIntersecting && !loading && nextCursor) {
        loadMoreItems();
      }
    }, options);

    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [loadMoreItems, loading, nextCursor]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedProfile(null);
    setCalendarOpen(false);
    if (date) {
      loadMediaForDate(date);
    }
  };

  const handleZoomIn = () => {
    setThumbnailWidth(prev => Math.min(MAX_THUMBNAIL_WIDTH, prev + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setThumbnailWidth(prev => Math.max(MIN_THUMBNAIL_WIDTH, prev - ZOOM_STEP));
  };

  const handleProfileSelect = async (instagramId: string) => {
    setSelectedProfile(instagramId);
    setSelectedDate(null);
    setMediaItems([]);
    setLoading(true);
    try {
      const response = await fetch(`/api/profile-media?instagramId=${instagramId}&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) throw new Error('Failed to fetch profile media');
      const data: ApiResponse = await response.json();
      setMediaItems(data.items);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError('Error loading profile media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePhotos = () => setShowPhotos(!showPhotos);
  const toggleVideos = () => setShowVideos(!showVideos);

  const filteredMediaItems = mediaItems.filter(item => 
    (item.type === 'photo' && showPhotos) || (item.type === 'video' && showVideos)
  );

  const filteredProfiles = profiles.filter(profile => 
    profile.instagram_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-black text-white">
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <Menu className="mr-4 cursor-pointer" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="text-red-600 font-bold text-xl">Premium</span>
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

      <main className="relative p-4">
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

        {error && (
          <div className="bg-red-500 text-white p-4 mb-4 rounded">
            {error}
          </div>
        )}

        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailWidth}px, 1fr))` }}>
          {filteredMediaItems.map((item) => (
            <div key={item.id} className="aspect-w-9 aspect-h-16 relative">
              {item.type === 'video' ? (
                <div className="w-full h-full cursor-pointer" onClick={(e) => {
                  const video = e.currentTarget.querySelector('video') as HTMLVideoElement;
                  if (video.paused) {
                    video.play();
                  } else {
                    video.pause();
                  }
                }}>
                  <video
                    src={`${basePath}${item.url}`}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    loop
                  />
                </div>
              ) : (
                <Image
                  src={`${basePath}${item.url}`}
                  alt={`Media ${item.id}`}
                  fill
                  sizes={`${thumbnailWidth}px`}
                  className="object-cover cursor-pointer"
                  onClick={() => setFullscreenImage(`${basePath}${item.url}`)}
                />
              )}
              <div className="absolute bottom-2 left-2 text-white text-sm">
                <p className="bg-black bg-opacity-50 p-1 inline-block whitespace-pre-line">
                  {`@${item.profileName}\n${new Date(item.timestamp).toLocaleTimeString()}`}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div ref={loader} className="flex justify-center my-4">
          {loading && <p>Carregando mais...</p>}
        </div>

        {fullscreenImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative w-full h-full">
              <Image
                src={fullscreenImage}
                alt="Fullscreen image"
                fill
                sizes="100vw"
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
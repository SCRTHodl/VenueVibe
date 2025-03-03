import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Video, FileImage, Filter, MapPin, Music, 
  Sticker, Tag, Send, Check, Sparkles, Download,
  Camera as FlipCamera, LightbulbOff as FlashOff, 
  Zap as Flash, ZapOff as FlashAuto, ChevronLeft,
  ChevronRight, Smile
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserStory } from '../../types';
import { STORY_FILTERS } from './Filters/filters';
import { StoryFilter } from './Filters/StoryFilter';
import { StoryEnhancements } from './Controls/StoryEnhancements';
import { checkContentModeration } from '../../lib/ai';

interface StoryModalProps {
  onClose: () => void;
  onStoryCreated?: (story: UserStory) => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ onClose, onStoryCreated }) => {
  // State for media capture and upload
  const [activeTab, setActiveTab] = useState<'camera' | 'video' | 'upload'>('camera');
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  
  // Camera controls state
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | null>(null);
  
  // Story content state
  const [caption, setCaption] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [addedStickers, setAddedStickers] = useState<{id: string, x: number, y: number, emoji: string}[]>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  
  // Add state for multiple media items
  const [mediaItems, setMediaItems] = useState<Array<{
    type: 'image' | 'video';
    url: string;
  }>>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Add state for emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  
  // Publishing state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);

  // Initialize camera with better error handling
  useEffect(() => {
    if (activeTab === 'camera' || activeTab === 'video') {
      let currentStream: MediaStream | null = null;

      const initializeCamera = async () => {
        try {
          // Stop any existing streams
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
          }

          const constraints: MediaStreamConstraints = {
            video: {
              facingMode: cameraFacing,
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            },
            audio: activeTab === 'video'
          };

          console.log('Requesting camera with constraints:', constraints);
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Camera stream obtained:', stream);
          
          currentStream = stream;
          mediaStreamRef.current = stream;

          if (videoRef.current && mountedRef.current) {
            console.log('Setting up video element');
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.muted = true;

            try {
              await videoRef.current.play();
              console.log('Video playback started');
            } catch (err) {
              console.error('Error playing video:', err);
              if (err.name !== 'AbortError' && mountedRef.current) {
                setActiveTab('upload');
              }
            }
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          if (mountedRef.current) {
            alert('Unable to access camera. Please ensure camera permissions are granted and try again.');
            setActiveTab('upload');
          }
        }
      };

      // Only initialize camera if tab is visible
      if (!document.hidden) {
        console.log('Initializing camera');
        initializeCamera();
      }

      return () => {
        console.log('Cleaning up camera');
        mountedRef.current = false;

        // Clean up video element
        if (videoRef.current) {
          const video = videoRef.current;
          video.pause();
          video.srcObject = null;
        }

        // Stop all tracks
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }

        // Clear recording timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Clear recorded chunks
        recordedChunksRef.current = [];
      };
    }
  }, [activeTab, cameraFacing]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Stop camera when tab becomes hidden
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
      } else if ((activeTab === 'camera' || activeTab === 'video') && !capturedMedia) {
        // Add small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        // Reinitialize camera when tab becomes visible
        if (videoRef.current) {
          try {
            const constraints: MediaStreamConstraints = {
              video: {
                facingMode: cameraFacing,
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
              },
              audio: activeTab === 'video'
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          } catch (err) {
            console.error('Error reinitializing camera:', err);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab, cameraFacing, capturedMedia]);

  // Capture photo with proper sizing
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Apply selected filter
        if (selectedFilter) {
          ctx.filter = STORY_FILTERS.find(f => f.id === selectedFilter)?.style || 'none';
        }
        
        // Flip horizontally if using front camera
        if (cameraFacing === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);
        
        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Get image data with proper quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedMedia(dataUrl);
      }
    }
  };

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        
        // Auto-stop after 60 seconds
        if (recordingTime >= 60) {
          stopRecording();
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, recordingTime]);

  // Media capture functions
  const startRecording = () => {
    if (mediaStreamRef.current) {
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setCapturedMedia(videoUrl);
        setIsRecording(false);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Handle file selection for multiple images/videos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const fileType = file.type;
      const isVideo = fileType.startsWith('video/');
      const isImage = fileType.startsWith('image/');
      
      if (isVideo || isImage) {
        const url = URL.createObjectURL(file);
        setMediaItems(prev => [...prev, {
          type: isVideo ? 'video' : 'image',
          url
        }]);
      }
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const resetCapture = () => {
    setCapturedMedia(null);
    setSelectedFilter(null);
    setCaption('');
    setSelectedLocation(null);
    setAddedStickers([]);
    setSelectedTags([]);
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmojis(prev => [...prev, emoji]);
    setShowEmojiPicker(false);
  };

  // Tag management
  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setShowTagPicker(false);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // Story publishing with improved error handling
  const publishStory = async () => {
    if (mediaItems.length === 0) {
      alert('Please add at least one photo or video to your story');
      return;
    }

    setIsUploading(true);
    
    try {
      // Check content moderation
      const moderationResult = await checkContentModeration(
        'story',
        caption,
        mediaItems[0].url
      );

      if (moderationResult.status === 'rejected') {
        alert('Your content may violate our community guidelines. Please review and try again.');
        setIsUploading(false);
        return;
      }

      // Generate proper UUID for story
      const storyId = crypto.randomUUID();

      // Create story with enhanced content
      const newStory: UserStory = {
        id: storyId, // Use proper UUID
        userId: 'user-123',
        userName: 'Me',
        userAvatar: '😎',
        media: mediaItems,
        caption: caption ? `${selectedEmojis.join('')} ${caption}` : undefined,
        location: selectedLocation || undefined,
        music: selectedMusic || undefined,
        stickers: [
          ...addedStickers,
          ...selectedEmojis.map((emoji, index) => ({
            id: crypto.randomUUID(), // Use proper UUID for sticker IDs
            emoji,
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10
          }))
        ],
        filter: selectedFilter || undefined,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        viewCount: 0,
        viewedBy: [],
        tokenBalance: 0,
        gifts: []
      };

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsPublished(true);
              if (onStoryCreated) {
                onStoryCreated(newStory);
              }
              setTimeout(() => onClose(), 1500);
            }, 500);
          }
          return Math.min(100, prev + 5);
        });
      }, 100);
      
    } catch (error) {
      console.error('Error publishing story:', error);
      alert('Failed to publish story. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Hidden canvas for photo processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />
      
      {/* Main container */}
      <div className="w-full h-full md:w-[480px] md:h-[85vh] bg-black relative flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X size={20} />
            </button>
            
            {!capturedMedia && activeTab !== 'upload' && (
              <>
                <button 
                  onClick={() => setFlashMode(mode => {
                    switch (mode) {
                      case 'off': return 'on';
                      case 'on': return 'auto';
                      default: return 'off';
                    }
                  })}
                  className="p-2 rounded-full bg-black/50 text-white"
                >
                  {flashMode === 'off' && <FlashOff size={20} />}
                  {flashMode === 'on' && <Flash size={20} />}
                  {flashMode === 'auto' && <FlashAuto size={20} />}
                </button>
                
                <button 
                  onClick={() => setCameraFacing(facing => 
                    facing === 'user' ? 'environment' : 'user'
                  )}
                  className="p-2 rounded-full bg-black/50 text-white"
                >
                  <FlipCamera size={20} />
                </button>
              </>
            )}
          </div>
          
          {capturedMedia && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-full ${
                  showFilters ? 'bg-[--color-accent-primary] text-white' : 'bg-black/50 text-white'
                }`}
              >
                <Filter size={20} />
              </button>
              
              <button 
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = capturedMedia;
                  a.download = `story-${Date.now()}.${capturedMedia.startsWith('data:image') ? 'jpg' : 'webm'}`;
                  a.click();
                }}
                className="p-2 rounded-full bg-black/50 text-white"
              >
                <Download size={20} />
              </button>
            </div>
          )}
        </div>
        
        {/* Main content area */}
        <div className="flex-1 relative bg-black">
          {mediaItems.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Media preview carousel */}
              <div className="w-full h-full relative">
                {mediaItems.map((item, index) => (
                  <div 
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img 
                        src={item.url} 
                        alt={`Story media ${index + 1}`}
                        className="w-full h-full object-contain"
                        style={{ filter: STORY_FILTERS.find(f => f.id === selectedFilter)?.style }}
                      />
                    ) : (
                      <video 
                        src={item.url}
                        className="w-full h-full object-contain"
                        autoPlay 
                        loop 
                        muted={isMuted}
                        style={{ filter: STORY_FILTERS.find(f => f.id === selectedFilter)?.style }}
                      />
                    )}
                  </div>
                ))}

                {/* Navigation arrows */}
                {mediaItems.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 text-white"
                      disabled={currentSlide === 0}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setCurrentSlide(prev => Math.min(mediaItems.length - 1, prev + 1))}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 text-white"
                      disabled={currentSlide === mediaItems.length - 1}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>

              {/* Emoji stickers */}
              {selectedEmojis.map((emoji, index) => (
                <div
                  key={`emoji-${index}`}
                  className="absolute cursor-move"
                  style={{
                    left: `${Math.random() * 80 + 10}%`,
                    top: `${Math.random() * 80 + 10}%`,
                    fontSize: '2rem'
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          ) : (
            <div className="relative w-full h-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${
                  cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 bg-red-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-white text-sm">{formatRecordingTime(recordingTime)}</span>
                </div>
              )}
              
              {/* Zoom slider */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  className="h-32 -rotate-90"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {mediaItems.length > 0 ? (
            <div className="space-y-4">
              {/* Caption input with emoji picker */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-full bg-white/10 text-white"
                >
                  <Smile size={24} />
                </button>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="flex-1 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
                />
              </div>

              {/* Emoji picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 right-0 bg-[#1a2234] p-4 rounded-t-lg border-t border-gray-700">
                  <div className="grid grid-cols-8 gap-2">
                    {['😊', '😂', '🥳', '❤️', '🔥', '✨', '🎉', '👍', '🙌', '💯', '🎵', '🎨', '📸', '🎬', '🌟', '💫'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-2xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Story enhancements */}
              <StoryEnhancements
                showLocationPicker={showLocationPicker}
                showMusicPicker={showMusicPicker}
                showTagPicker={showTagPicker}
                showStickerPicker={showStickerPicker}
                onToggleLocation={() => setShowLocationPicker(!showLocationPicker)}
                onToggleMusic={() => setShowMusicPicker(!showMusicPicker)}
                onToggleTag={() => setShowTagPicker(!showTagPicker)}
                onToggleSticker={() => setShowStickerPicker(!showStickerPicker)}
              />
              
              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setMediaItems([]);
                    setSelectedEmojis([]);
                    setCaption('');
                    setSelectedLocation(null);
                  }}
                  className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  Retake
                </button>
                
                <button
                  onClick={publishStory}
                  className="px-4 py-2 rounded-full bg-[--color-accent-primary] text-white font-medium hover:bg-[--color-accent-primary]/90"
                >
                  Share Story
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={handleUploadClick}
                className="p-4 rounded-full bg-white/10 text-white"
              >
                <FileImage size={24} />
              </button>
              
              {activeTab === 'video' ? (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-6 rounded-full ${
                    isRecording ? 'bg-red-600' : 'bg-red-500 animate-pulse'
                  }`}
                >
                  <div className={`w-6 h-6 ${
                    isRecording ? 'bg-white rounded' : 'rounded-full bg-white'
                  }`}></div>
                </button>
              ) : (
                <button
                  onClick={capturePhoto}
                  className="p-6 rounded-full border-4 border-white"
                >
                  <div className="w-6 h-6 rounded-full bg-white"></div>
                </button>
              )}
              
              <button
                onClick={() => setActiveTab(activeTab === 'video' ? 'camera' : 'video')}
                className="p-4 rounded-full bg-white/10 text-white"
              >
                {activeTab === 'video' ? <Camera size={24} /> : <Video size={24} />}
              </button>
            </div>
          )}
        </div>
        
        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              {isPublished ? (
                <div className="flex flex-col items-center">
                  <Check size={48} className="text-green-500 mb-2" />
                  <p className="text-white">Story published!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-t-[--color-accent-primary] border-gray-600 rounded-full animate-spin mb-2"></div>
                  <p className="text-white">Publishing story... {uploadProgress}%</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
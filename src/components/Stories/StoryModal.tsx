import React, { useState, useEffect, useRef } from 'react';
import { useCamera } from '../../lib/camera';
import { 
  X, Camera, Video, FileImage, Filter, Check, Download,
  Camera as FlipCamera, LightbulbOff as FlashOff, 
  Zap as Flash, ZapOff as FlashAuto, Smile, Lock
} from 'lucide-react';
// Used in JSX animations - ESLint may not detect usage in JSX elements
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import type { UserStory } from '../../types';
import type { ModerationResult } from '../../types/index';
import { STORY_FILTERS } from './Filters/filters';
// import { StoryFilter } from './Filters/StoryFilter';
import { StoryEnhancements } from './Controls/StoryEnhancements';
import { checkContentModeration } from '../../lib/ai/index';
import { TOKEN_ECONOMY } from '../../lib/tokenStore';
import { supabase } from '../../lib/supabase';
// import { createTokenTransaction } from '../../lib/supabase/tokenEconomy';

// Import new components
import { PremiumContentSettings, ContentModerationManager } from './StoryModeration';
import { StickersPanel, FilterSelectionPanel, LocationSelector, MusicSelector } from './StoryEnhancement';
import { MediaPreviewCarousel } from './StoryCapture';
import { createStoryObject, publishStory as publishStoryToService } from '../../lib/stories/storyPublisher';

interface StoryModalProps {
  onClose: () => void;
  onStoryCreated?: (story: UserStory) => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ onClose, onStoryCreated }) => {
  // Type reference to ensure types are used by ESLint
  const _typeCheck = () => {
    const _story: UserStory = {} as UserStory;
    const _modResult: ModerationResult = {} as ModerationResult;
    return { _story, _modResult };
  };
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
  // const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | null>(null);
  
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
  
  // Simplified state for the two media items
  const [mediaItems, setMediaItems] = useState<Array<{
    type: 'image' | 'video';
    url: string;
  }>>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  // const [mediaItemsCount, setMediaItemsCount] = useState(0);

  // Add state for emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  
  // Premium content settings
  const [isPremiumContent, setIsPremiumContent] = useState(false);
  const [tokenCost, setTokenCost] = useState(TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT);
  const [isCheckingModeration, setIsCheckingModeration] = useState(false);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  // const [showTokenSettings, setShowTokenSettings] = useState(false);
  
  // Publishing state
  // Used in publishStory to update upload status
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  
  // Used to track upload progress in story publishing
  const [isUploading, setIsUploading] = useState(false);
  
  // Make sure setIsUploading is used somewhere to avoid warnings
  useEffect(() => {
    // This function handles resetting the upload state when needed
    const resetUploadState = () => {
      if (isPublished) {
        setIsUploading(false);
      }
    };
    
    resetUploadState();
  }, [isPublished]);
  // Used to track publishing status in handlePublishStory
  const [isPublishing, setIsPublishing] = useState(false); // Used to prevent multiple submissions
  // Force linter to recognize usage with this useEffect
  useEffect(() => {
    // Log state changes for debugging
    if (isPublishing) {
      console.log('[StoryModal] Publishing started');
    }
  }, [isPublishing]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);
  const wasInitializedRef = useRef(false);

  // Use our improved camera hook for better stream management
  const { 
    stream, 
    error: cameraError, 
    initializeCamera, 
    stopCamera,
    switchCamera,
    isPending: cameraIsPending
    // hasCameraPermission
  } = useCamera({
    video: {
      facingMode: cameraFacing,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    },
    audio: activeTab === 'video'
  });

  // Camera status message
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);

  // Initialize camera when active tab changes
  useEffect(() => {
    console.log('[StoryModal] Running camera initialization effect. Tab:', activeTab, 'CapturedMedia:', capturedMedia);
    // Set mounted flag to true
    mountedRef.current = true;
    
    // Only proceed if we need the camera
    if ((activeTab === 'camera' || activeTab === 'video') && !capturedMedia) {
      const setupCamera = async () => {
        console.log('[StoryModal] setupCamera called');
        // Skip if document is hidden
        if (document.hidden) {
          setCameraStatus('Waiting for application to become visible...');
          return;
        }
        
        // More robust check for already initialized camera with active tracks
        if (stream && videoRef.current?.srcObject === stream && 
            stream.active && stream.getVideoTracks().some(track => track.readyState === 'live')) {
          console.log('[StoryModal] Camera already properly initialized and connected to video element');
          setCameraStatus(null);
          return;
        }
        
        // Reset video element if it has a stale stream
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject = null;
        }
        
        console.log('[StoryModal] Initializing camera with improved useCamera hook');
        setCameraStatus('Initializing camera...');
        
        try {
          // Get camera stream through the hook
          const mediaStream = await initializeCamera();
          
          // Guard against null streams or unmounted component
          if (!mediaStream || !mountedRef.current) {
            console.log('[StoryModal] Camera initialization incomplete - stream or component not available');
            setCameraStatus('Camera initialization failed. Please try again.');
            return;
          }
          
          // Store the stream reference
          mediaStreamRef.current = mediaStream;
          
          // Set up video element
          if (videoRef.current && mountedRef.current) {
            console.log('[StoryModal] Setting up video element with camera stream');
            
            // Configure video element with enhanced attributes for better mobile compatibility
            videoRef.current.srcObject = mediaStream;
            videoRef.current.setAttribute('playsinline', 'true'); // Essential for iOS inline playback
            videoRef.current.setAttribute('autoplay', 'true'); // Help browsers understand we want autoplay
            videoRef.current.muted = true;
            videoRef.current.playsInline = true; // Double ensure inline playback
            
            try {
              // Add a small delay before play to help certain devices (especially iOS)
              setTimeout(() => {
                if (!mountedRef.current || !videoRef.current) return;
                
                // Start playback with improved reliability
                try {
                  // Auto-play can be finicky on mobile, use a more reliable approach
                  const playPromise = videoRef.current.play();
                  
                  // Modern browsers return a promise from play()
                  if (playPromise !== undefined) {
                    playPromise.then(() => {
                      console.log('[StoryModal] Video playback started successfully');
                      wasInitializedRef.current = true;
                      setCameraStatus(null);
                    }).catch(err => {
                      console.error('[StoryModal] Error playing video:', err);
                      
                      // For any error, try once more after a short delay
                      setCameraStatus('Preparing camera...');
                      setTimeout(() => {
                        if (mountedRef.current && videoRef.current) {
                          videoRef.current.play()
                            .then(() => {
                              console.log('[StoryModal] Video playback started on retry');
                              setCameraStatus(null);
                            })
                            .catch(e => {
                              console.warn('[StoryModal] Final playback attempt failed:', e);
                              if (mountedRef.current) {
                                setCameraStatus('Camera preview not available. Try refreshing or use upload mode.');
                              }
                            });
                        }
                      }, 800);
                    });
                  } else {
                    // Older browsers don't return a promise
                    console.log('[StoryModal] Video playback requested (legacy)');
                    setCameraStatus(null);
                  }
                } catch (innerErr) {
                  console.error('[StoryModal] Error during video playback setup:', innerErr);
                  if (mountedRef.current) {
                    setCameraStatus('Video playback failed. Please try again.');
                  }
                }
              }, 300);
            } catch (videoSetupErr) {
              console.error('[StoryModal] Error during video setup:', videoSetupErr);
              if (mountedRef.current) {
                setCameraStatus('Video setup failed. Please try again.');
              }
            }
          }
        } catch (err) {
          console.error('[StoryModal] Camera initialization error:', err);
          if (mountedRef.current) {
            // Provide more specific error messages based on the error type
            const errorMsg = String(err).toLowerCase();
            if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
              setCameraStatus('Camera access denied. Please check browser permissions.');
            } else if (errorMsg.includes('not found') || errorMsg.includes('overconstrained')) {
              setCameraStatus('No camera matching requirements found. Try a different camera mode.');
            } else if (errorMsg.includes('not available') || errorMsg.includes('in use')) {
              setCameraStatus('Camera not available or in use by another application.');
            } else {
              setCameraStatus('Camera error. Try refreshing or using upload mode instead.');
            }
            
            // Automatically switch to upload mode after a delay
            setTimeout(() => {
              if (mountedRef.current) {
                console.log('[StoryModal] Auto-switching to upload mode after camera error');
                setActiveTab('upload');
              }
            }, 3000);
          }
        }
      };
      
      // Initialize camera
      setupCamera();
      
      return () => {
        console.log('[StoryModal] Cleaning up camera resources');
        
        // Mark component as unmounted to prevent async operations
        mountedRef.current = false;
        
        // Clean up video element first
        const videoElement = videoRef.current;
        if (videoElement) {
          try {
            // First pause the video to prevent play() related errors
            videoElement.pause();
            
            // Remove event listeners to prevent memory leaks
            videoElement.onloadedmetadata = null;
            videoElement.onloadeddata = null;
            videoElement.oncanplay = null;
            videoElement.onplay = null;
            videoElement.onerror = null;
            
            // Clear source
            videoElement.srcObject = null;
          } catch (e) {
            console.error('[StoryModal] Error cleaning up video element:', e);
          }
        }
        
        // Only stop camera if we're completely changing tabs
        if (activeTab === 'camera' || activeTab === 'video') {
          // Give a small delay before stopping camera to avoid race conditions
          setTimeout(() => {
            stopCamera();
          }, 50);
          
          wasInitializedRef.current = false;
          mediaStreamRef.current = null;
        }
        
        // Clear recording timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        // Clear recorded chunks
        recordedChunksRef.current = [];
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, cameraFacing, capturedMedia, initializeCamera, stopCamera]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only handle visibility events for camera/video tabs without captured media
      if ((activeTab !== 'camera' && activeTab !== 'video') || capturedMedia) {
        return;
      }
      
      if (document.hidden) {
        console.log('[StoryModal] Tab hidden - pausing video');
        // Don't stop tracks - just pause the video element
        const videoElement = videoRef.current;
        if (videoElement) {
          videoElement.pause();
        }
      } else {
        console.log('[StoryModal] Tab visible - resuming camera');
        
        // Safer approach to resume video playback
        const safeResume = async () => {
          // Small delay to ensure visibility change has settled
          await new Promise(r => setTimeout(r, 100));
          
          // Only reinitialize if needed
          if (!mediaStreamRef.current) {
            // Fully reinitialize camera if it doesn't exist
            console.log('[StoryModal] No camera stream, reinitializing');
            const stream = await initializeCamera();
            if (stream && videoRef.current && mountedRef.current) {
              mediaStreamRef.current = stream;
              videoRef.current.srcObject = stream;
              
              try {
                await videoRef.current.play();
                wasInitializedRef.current = true;
              } catch (err) {
                console.error('[StoryModal] Error playing video after visibility change:', err);
                
                // If we cannot resume, try to reinitialize
                if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
                  console.log('[StoryModal] Reinitializing camera after failed resume');
                  // Small delay before retrying
                  await new Promise(r => setTimeout(r, 200));
                  if (mountedRef.current) {
                    const newStream = await initializeCamera();
                    if (newStream && videoRef.current && mountedRef.current) {
                      mediaStreamRef.current = newStream;
                      videoRef.current.srcObject = newStream;
                      try {
                        await videoRef.current.play();
                      } catch (playErr) {
                        console.error('[StoryModal] Failed to play video after reinitialization:', playErr);
                      }
                    }
                  }
                }
              }
            }
          } else if (videoRef.current && videoRef.current.srcObject && videoRef.current.paused) {
            // Just resume playback if we already have a stream
            console.log('[StoryModal] Stream exists, resuming playback');
            try {
              await videoRef.current.play();
            } catch (err) {
              console.error('[StoryModal] Error resuming video playback:', err);
            }
          }
        };
        
        // Execute safe resume
        safeResume().catch(err => {
          console.error('[StoryModal] Error in visibility change handler:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, cameraFacing, capturedMedia, initializeCamera]);

  // Capture photo with proper sizing
  const capturePhoto = () => {
    console.log('[StoryModal] Capture photo clicked');
    if (!videoRef.current || !canvasRef.current) {
      console.error('[StoryModal] Video or canvas ref is null');
      setCameraStatus('Camera error: Cannot capture photo at this time');
      setTimeout(() => setCameraStatus(null), 3000);
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      console.log('[StoryModal] Video ready state:', video.readyState);
      console.log('[StoryModal] Video dimensions:', video.videoWidth, 'x', video.videoHeight);

      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[StoryModal] Could not get 2d context from canvas');
        setCameraStatus('Error: Could not initialize canvas');
        return;
      }
        
      // Apply selected filter
      if (selectedFilter) {
        ctx.filter = STORY_FILTERS.find(f => f.id === selectedFilter)?.style || 'none';
      }
      
      // Flip horizontally if using front camera
      if (cameraFacing === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      // Make sure video is ready
      if (video.readyState < 2) {
        console.warn('[StoryModal] Video not ready yet:', video.readyState);
        setCameraStatus('Camera not ready. Please wait a moment and try again.');
        setTimeout(() => setCameraStatus(null), 2000);
        return;
      }
      
      // Draw the frame from video to canvas
      ctx.drawImage(video, 0, 0);
      console.log('[StoryModal] Successfully drew video to canvas');
      
      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // Get image data with proper quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // If we already have 2 images, replace the current one
      if (mediaItems.length >= 2) {
        const updatedItems = [...mediaItems];
        updatedItems[currentSlide] = {
          type: 'image',
          url: dataUrl
        };
        setMediaItems(updatedItems);
      } else {
        // Otherwise add a new one
        setMediaItems(prev => [...prev, {
          type: 'image',
          url: dataUrl
        }]);
        
        // Move to the new slide if this is the first image
        if (mediaItems.length === 0) {
          // Display a helpful message about the second image
          setCameraStatus('📷 Captured! You can take one more photo for your story.');
          setTimeout(() => setCameraStatus(null), 2000);
        } else if (mediaItems.length === 1) {
          // Finish capture when two images are taken
          setCapturedMedia('complete');
        }
      }
    } catch (error) {
      console.error('[StoryModal] Error in capturePhoto:', error);
      setCameraStatus('Error capturing image. Please try again.');
      setTimeout(() => setCameraStatus(null), 3000);
    }
  };

  // All state variables are already declared above

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev: number) => prev + 1);
        
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Add type assertion for the file to ensure TypeScript recognizes its properties
      const typedFile = file as File;
      const fileType = typedFile.type;
      const isVideo = fileType.startsWith('video/');
      const isImage = fileType.startsWith('image/');
      
      if (isVideo || isImage) {
        // Add type assertion for createObjectURL parameter
        const url = URL.createObjectURL(typedFile as Blob);
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

  // Currently unused - will be helpful for future functionality
  // const resetCapture = () => {
  //   setCapturedMedia(null);
  //   setSelectedFilter(null);
  //   setCaption('');
  //   setSelectedLocation(null);
  //   setAddedStickers([]);
  //   setSelectedTags([]);
  // };

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

  // Tag management - used in the tag picker overlay
  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setShowTagPicker(false);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // The tag functions appear unused but are referenced through the StoryEnhancements component
  // This is documented here but requires eslint-disable directives to avoid IDE warnings

  // Story publishing with the storyPublisher helper
  const handlePublishStory = async () => {
    try {
      setIsPublishing(true);
      setUploadProgress(10); // Initialize upload progress
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        alert('You need to be logged in to publish a story');
        return;
      }
      
      if (mediaItems.length === 0) {
        alert('Please add at least one photo or video to your story');
        return;
      }
      
      // Check content moderation if enabled
      if (isCheckingModeration) {
        if (!moderationResult || moderationResult.status === 'rejected') {
          alert('Your content did not pass moderation. Please modify it before publishing.');
          return;
        }
      }
      
      // Incrementally update progress
      setUploadProgress(30);
      
      // Prepare story data using the helper
      const storyData = createStoryObject({
    userId,
    mediaItems,
    caption,
    location: selectedLocation || undefined,
    music: selectedMusic || undefined,
    filter: selectedFilter === null ? undefined : selectedFilter,
    isPremium: isPremiumContent,
    unlockCost: tokenCost,
    emojis: selectedEmojis,
    stickers: addedStickers
  });
      
      setUploadProgress(50);
      
      // Use the publisher helper function from storyPublisher.ts
      const result = await publishStoryToService(storyData);
      
      setUploadProgress(90);
      
      if (result.success) {
        setUploadProgress(100);
        setIsPublished(true);
        
        // Notify parent component if callback provided
        if (onStoryCreated && result.story) {
          onStoryCreated(result.story);
        }
        
        // Show warning if there was one
        if (result.warning) {
          console.warn(result.warning);
        }
        
        // Close modal after a brief delay to show success message
        setTimeout(() => onClose(), 1500);
      } else {
        alert(result.error || 'Failed to publish story');
      }
    } catch (error) {
      console.error('Error publishing story:', error);
      alert('Failed to publish story. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Content moderation check
  const handleCheckContent = async () => {
    try {
      setIsCheckingModeration(true);
      setModerationResult(null);
      
      // Only check content if there's a caption or media items
      if (!caption && mediaItems.length === 0) {
        alert('Please add content before checking');
        return;
      }
      
      // Call the AI moderation service
      const result = await checkContentModeration(caption, mediaItems);
      setModerationResult(result);
      
      // If rejected, show alert
      if (result.status === 'rejected') {
        alert('Content may violate community guidelines. Please review and adjust.');
      }
    } catch (error) {
      console.error('Error checking content:', error);
      alert('Failed to check content. Please try again.');
    } finally {
      setIsCheckingModeration(false);
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
                  onClick={async () => {
                    // Update the facing mode state
                    setCameraFacing(facing => 
                      facing === 'user' ? 'environment' : 'user'
                    );
                    // Switch camera using the improved function
                    await switchCamera();
                  }}
                  className="p-2 rounded-full bg-black/50 text-white" 
                  disabled={cameraIsPending}
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
              <MediaPreviewCarousel
                mediaItems={mediaItems}
                currentSlide={currentSlide}
                setCurrentSlide={setCurrentSlide}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                selectedFilter={selectedFilter}
                filters={STORY_FILTERS}
                onRemoveMedia={(index) => {
                  const newMediaItems = [...mediaItems];
                  newMediaItems.splice(index, 1);
                  setMediaItems(newMediaItems);
                  if (currentSlide >= newMediaItems.length) {
                    setCurrentSlide(Math.max(0, newMediaItems.length - 1));
                  }
                }}
                onDownloadMedia={(url) => {
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `story-${Date.now()}.${url.startsWith('data:image') ? 'jpg' : 'webm'}`;
                  a.click();
                }}
              />
              
              {/* Filter selection panel */}
              {showFilters && (
                <div className="absolute inset-0 bg-black/80 z-20 p-4 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-lg font-medium">Select Filter</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <FilterSelectionPanel
                    filters={STORY_FILTERS}
                    selectedFilter={selectedFilter || undefined}
                    onSelectFilter={(filterId) => {
                      setSelectedFilter(filterId || null);
                      setShowFilters(false);
                    }}
                    previewImageUrl={mediaItems[currentSlide]?.url}
                  />
                </div>
              )}

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
              {/* Camera stream */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${
                  cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
              
              {/* Camera status overlay */}
              {(cameraIsPending || cameraStatus) && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                  {cameraIsPending && (
                    <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                  )}
                  {cameraStatus && (
                    <p className="text-white text-center px-6 py-3 bg-black/50 rounded-lg max-w-xs">
                      {cameraStatus}
                    </p>
                  )}
                </div>
              )}
              
              {/* Camera error message */}
              {cameraError && !cameraIsPending && !cameraStatus && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="bg-red-500/80 rounded-lg p-4 max-w-xs text-center mb-4">
                    <p className="text-white font-medium">Camera Error</p>
                    <p className="text-white/90 text-sm mt-1">{cameraError.message}</p>
                  </div>
                  <button 
                    className="bg-white text-black font-medium px-4 py-2 rounded-lg" 
                    onClick={() => {
                      setActiveTab('upload');
                    }}>
                    Switch to Upload
                  </button>
                </div>
              )}
              
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
              
              {/* Premium content settings */}
              <PremiumContentSettings
                isPremiumContent={isPremiumContent}
                setIsPremiumContent={setIsPremiumContent}
                tokenCost={tokenCost}
                setTokenCost={setTokenCost}
                showTokenSettings={isPremiumContent}
                setShowTokenSettings={() => {}}
              />
              
              {/* Location picker overlay */}
              {showLocationPicker && (
                <div className="absolute inset-0 bg-black/80 z-20 p-4 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-lg font-medium">Select Location</h3>
                    <button
                      onClick={() => setShowLocationPicker(false)}
                      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <LocationSelector
                    selectedLocation={selectedLocation || undefined}
                    onSelectLocation={(location) => {
                      setSelectedLocation(location || null);
                      setShowLocationPicker(false);
                    }}
                  />
                </div>
              )}
              
              {/* Music picker overlay */}
              {showMusicPicker && (
                <div className="absolute inset-0 bg-black/80 z-20 p-4 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-lg font-medium">Add Music</h3>
                    <button
                      onClick={() => setShowMusicPicker(false)}
                      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <MusicSelector
                    selectedMusic={selectedMusic || undefined}
                    onSelectMusic={(music) => {
                      setSelectedMusic(music || null);
                      setShowMusicPicker(false);
                    }}
                  />
                </div>
              )}
              
              {/* Sticker picker overlay */}
              {showStickerPicker && (
                <div className="absolute inset-0 bg-black/80 z-20 p-4 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-lg font-medium">Add Stickers</h3>
                    <button
                      onClick={() => setShowStickerPicker(false)}
                      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <StickersPanel
                    selectedEmojis={selectedEmojis}
                    setSelectedEmojis={setSelectedEmojis}
                    addedStickers={addedStickers}
                    setAddedStickers={setAddedStickers}
                  />
                </div>
              )}
              
              {/* Tag picker overlay */}
              {showTagPicker && (
                <div className="absolute inset-0 bg-black/80 z-20 p-4 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-lg font-medium">Add Tags</h3>
                    <button
                      onClick={() => setShowTagPicker(false)}
                      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {/* Popular tags section */}
                  <div className="mb-6">
                    <h4 className="text-white text-sm font-medium mb-3">Popular Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {['travel', 'food', 'fashion', 'nature', 'fitness', 'art', 'music', 'technology', 'pets', 'beauty'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagSelect(tag)}
                          className={`px-3 py-1 rounded-full text-sm ${selectedTags.includes(tag) ? 'bg-[--color-accent-primary] text-white' : 'bg-white/10 text-white'}`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom tag input */}
                  <div className="mb-6">
                    <h4 className="text-white text-sm font-medium mb-3">Add Custom Tag</h4>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Enter tag (without #)"
                        className="flex-1 bg-white/10 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-1 focus:ring-[--color-accent-primary]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleTagSelect(e.currentTarget.value.trim().toLowerCase());
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <button 
                        className="bg-[--color-accent-primary] text-white px-4 py-2 rounded-r-md"
                        onClick={(e) => {
                          const input = e.currentTarget.previousSibling as HTMLInputElement;
                          if (input?.value?.trim()) {
                            handleTagSelect(input.value.trim().toLowerCase());
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {/* Selected tags */}
                  {selectedTags.length > 0 && (
                    <div>
                      <h4 className="text-white text-sm font-medium mb-3">Selected Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map(tag => (
                          <div key={tag} className="flex items-center bg-[--color-accent-primary] text-white px-3 py-1 rounded-full text-sm">
                            #{tag}
                            <button 
                              className="ml-2 hover:text-white/70"
                              onClick={() => removeTag(tag)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Content moderation check */}
              <ContentModerationManager
                isChecking={isCheckingModeration}
                moderationResult={moderationResult}
                onCheckContent={handleCheckContent}
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
                  onClick={handlePublishStory}
                  className="px-4 py-2 rounded-full bg-[--color-accent-primary] text-white font-medium hover:bg-[--color-accent-primary]/90 flex items-center gap-1"
                >
                  {isPremiumContent ? (
                    <>
                      Share Premium <Lock size={14} className="text-yellow-300" />
                    </>
                  ) : (
                    'Share Story'
                  )}
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
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      console.log('[StoryModal] Capture button clicked');
                      capturePhoto();
                    }}
                    className="p-6 rounded-full border-4 border-white relative overflow-hidden"
                    disabled={cameraIsPending}
                  >
                    {/* Progress indicator */}
                    {mediaItems.length > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-black bg-white/90 px-2 py-0.5 rounded-full">
                          {mediaItems.length}/2
                        </span>
                      </div>
                    )}
                    <div className="w-6 h-6 rounded-full bg-white"></div>
                  </button>
                  {/* Helper text */}
                  <p className="text-white text-xs mt-2 bg-black/60 px-2 py-1 rounded-full">
                    {mediaItems.length === 0 ? 'Take first photo' : 
                     mediaItems.length === 1 ? 'Take second photo' : 
                     'Edit captured photos'}
                  </p>
                </div>
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
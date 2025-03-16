import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, ZapOff, Zap, Volume2, VolumeX } from 'lucide-react';
import { useCamera } from '../../../lib/hooks/useCamera';

interface MediaCapturePanelProps {
  activeTab: 'camera' | 'video' | 'upload';
  isRecording: boolean;
  recordingTime: number;
  isMuted: boolean;
  flashMode: 'off' | 'on' | 'auto';
  cameraFacing: 'user' | 'environment';
  zoomLevel: number;
  onCapture: (mediaSrc: string, type: 'image' | 'video') => void;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onChangeFlashMode: (mode: 'off' | 'on' | 'auto') => void;
  onChangeCameraFacing: (facing: 'user' | 'environment') => void;
  onChangeZoomLevel: (level: number) => void;
  onToggleMute: () => void;
}

export const MediaCapturePanel: React.FC<MediaCapturePanelProps> = ({
  activeTab,
  isRecording,
  recordingTime,
  isMuted,
  flashMode,
  cameraFacing,
  zoomLevel,
  onCapture,
  onRecordingStart,
  onRecordingStop,
  onChangeFlashMode,
  onChangeCameraFacing,
  onChangeZoomLevel,
  onToggleMute
}) => {
  // Local state for handling camera visuals
  const [cameraMessage, setCameraMessage] = useState<string>('Initializing camera...');
  const [streamActive, setStreamActive] = useState(false);

  // Component mounted state to prevent memory leaks
  const mountedRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Use our camera hook
  const {
    initializeCamera,
    releaseCamera,
    stream,
    error: cameraError
  } = useCamera();

  // Format recording time as MM:SS
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize camera when active tab changes
  useEffect(() => {
    // Set mounted flag to true
    mountedRef.current = true;
    
    // Only proceed if we need the camera
    if (activeTab === 'camera' || activeTab === 'video') {
      const setupCamera = async () => {
        try {
          // Skip if document is hidden
          if (document.hidden) {
            setCameraMessage('Camera ready when you return to this tab');
            return;
          }
          
          // Skip if camera is already initialized for this session
          if (videoRef.current?.srcObject && streamActive) {
            return;
          }
          
          setCameraMessage('Initializing camera...');
          
          // Get camera stream through the hook
          await initializeCamera(cameraFacing);
          
          // Guard against null streams or unmounted component
          if (!stream || !mountedRef.current) {
            return;
          }
          
          setCameraMessage('');
          
          // Store the stream reference
          setStreamActive(true);
          
          // Set up video element
          if (videoRef.current && stream) {
            const videoElement = videoRef.current;
            
            // Configure video element
            videoElement.srcObject = stream;
            videoElement.muted = true; // Always mute preview to prevent feedback
            videoElement.playsInline = true; // Helps with iOS Safari
            
            // Start playback
            try {
              // Auto-play can be finicky on mobile, use a more reliable approach
              videoElement.play()
                .then(() => {
                  // Modern browsers return a promise from play()
                  if (mountedRef.current) {
                    setCameraMessage('');
                  }
                })
                .catch(err => {
                  console.error('Error playing video:', err);
                  
                  // For any error, try once more after a short delay
                  setTimeout(() => {
                    if (videoRef.current && mountedRef.current) {
                      videoRef.current.play()
                        .then(() => {
                          setCameraMessage('');
                        })
                        .catch(playErr => {
                          console.error('Second attempt failed:', playErr);
                          setCameraMessage('Tap to enable camera');
                          
                          // Add a click handler to try again
                          videoElement.addEventListener('click', () => {
                            videoElement.play().catch(e => {
                              console.error('User-initiated play failed:', e);
                            });
                          });
                        });
                    }
                  }, 200);
                });
            } catch (e) {
              // Older browsers don't return a promise
              console.error('Legacy play() error:', e);
              setCameraMessage('Tap to enable camera');
              
              videoElement.addEventListener('playing', () => {
                if (mountedRef.current) {
                  setCameraMessage('');
                }
              });
              
              videoElement.addEventListener('click', () => {
                videoElement.play();
              });
            }
          }
        } catch (err) {
          console.error('Camera setup error:', err);
          setCameraMessage('Camera access denied or not available');
        }
      };
      
      // Initialize camera
      setupCamera();
    }
    
    // Cleanup function
    return () => {
      // Mark component as unmounted to prevent async operations
      mountedRef.current = false;
      
      // Clean up video element first
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          // First pause the video to prevent play() related errors
          videoRef.current.pause();
          
          // Remove event listeners to prevent memory leaks
          videoRef.current.onloadedmetadata = null;
          videoRef.current.onloadeddata = null;
          videoRef.current.onplaying = null;
          videoRef.current.onerror = null;
          
          // Clear source
          videoRef.current.srcObject = null;
        } catch (err) {
          console.error('Error cleaning up video element:', err);
        }
      }
      
      // Only stop camera if we're completely changing tabs
      if (activeTab !== 'camera' && activeTab !== 'video') {
        // Give a small delay before stopping camera to avoid race conditions
        setTimeout(() => {
          releaseCamera();
          setStreamActive(false);
        }, 100);
      }
      
      // Clear recording timer
      if (isRecording) {
        onRecordingStop();
      }
      
      // Clear recorded chunks
      recordedChunksRef.current = [];
    };
  }, [activeTab, cameraFacing, initializeCamera, isRecording, onRecordingStop, releaseCamera, stream]);

  useEffect(() => {
    // Update camera message when we have an error
    if (cameraError) {
      setCameraMessage(`Camera error: ${cameraError}`);
    }
  }, [cameraError]);

  // Function to handle capturing a photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !streamActive) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      // Set canvas size to match video dimensions
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Draw the video frame to the canvas
      context.drawImage(video, 0, 0, width, height);
      
      // Apply filters if needed (can be implemented later)
      
      // Get the image data URL
      const imageDataURL = canvas.toDataURL('image/jpeg', 0.92);
      
      // Send the captured photo back
      onCapture(imageDataURL, 'image');
    } catch (err) {
      console.error('Error capturing photo:', err);
      setCameraMessage('Failed to capture photo');
    }
  };

  // Function to start video recording
  const startRecording = () => {
    if (!videoRef.current || !streamActive || !stream) return;
    
    try {
      // Reset recorded chunks
      recordedChunksRef.current = [];
      
      // Create media recorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      } catch (e) {
        console.error('MediaRecorder not supported with these options. Trying fallback.', e);
        
        // Fallback options
        const fallbackOptions = { mimeType: 'video/webm' };
        try {
          mediaRecorderRef.current = new MediaRecorder(stream, fallbackOptions);
        } catch (e2) {
          console.error('MediaRecorder still not supported. Last attempt.', e2);
          mediaRecorderRef.current = new MediaRecorder(stream);
        }
      }
      
      // Set up data handler
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      // Set up stop handler
      mediaRecorderRef.current.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const videoURL = URL.createObjectURL(blob);
          onCapture(videoURL, 'video');
        }
      };
      
      // Start recording
      mediaRecorderRef.current.start(1000); // Collect data every second
      onRecordingStart();
    } catch (err) {
      console.error('Error starting recording:', err);
      setCameraMessage('Failed to start recording');
    }
  };

  // Function to stop video recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      onRecordingStop();
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      {/* Video preview */}
      <video 
        ref={videoRef} 
        className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`} 
        playsInline 
        autoPlay
      />
      
      {/* Canvas for photo capture (hidden) */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera message overlay */}
      {cameraMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <p className="text-white text-center max-w-xs">{cameraMessage}</p>
        </div>
      )}
      
      {/* Camera controls */}
      <div className="absolute bottom-4 w-full px-4">
        <div className="flex justify-between items-center mb-4">
          {/* Flash control */}
          <button 
            type="button" 
            onClick={() => {
              const modes: Array<'off' | 'on' | 'auto'> = ['off', 'on', 'auto'];
              const currentIndex = modes.indexOf(flashMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              onChangeFlashMode(modes[nextIndex]);
            }}
            className="p-2 rounded-full bg-black/50 text-white"
          >
            {flashMode === 'off' ? (
              <ZapOff size={20} />
            ) : flashMode === 'on' ? (
              <Zap size={20} className="text-yellow-400" />
            ) : (
              <Zap size={20} className="text-blue-400" />
            )}
          </button>
          
          {/* Capture button or recording indicator */}
          {activeTab === 'camera' ? (
            <button 
              type="button"
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-white"></div>
            </button>
          ) : (
            <button 
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isRecording ? 'border-4 border-red-500' : 'border-4 border-white'
              }`}
            >
              <div className={`${
                isRecording ? 'w-8 h-8 rounded-sm bg-red-500' : 'w-14 h-14 rounded-full bg-red-500'
              }`}>
                {isRecording && (
                  <span className="absolute -bottom-8 text-white text-xs">
                    {formatRecordingTime(recordingTime)}
                  </span>
                )}
              </div>
            </button>
          )}
          
          {/* Camera switch or mute toggle */}
          {activeTab === 'video' ? (
            <button 
              type="button"
              onClick={onToggleMute}
              className="p-2 rounded-full bg-black/50 text-white"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => onChangeCameraFacing(cameraFacing === 'user' ? 'environment' : 'user')}
              className="p-2 rounded-full bg-black/50 text-white"
            >
              <RefreshCw size={20} />
            </button>
          )}
        </div>
        
        {/* Zoom slider */}
        <div className="flex items-center justify-center">
          <input 
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => onChangeZoomLevel(parseFloat(e.target.value))}
            className="w-3/4"
          />
        </div>
      </div>
    </div>
  );
};

export default MediaCapturePanel;

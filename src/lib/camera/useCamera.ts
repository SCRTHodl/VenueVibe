/**
 * useCamera hook
 * 
 * React hook for managing camera access in components.
 * Provides a simplified interface to the camera manager.
 * 
 * Enhanced with better error handling, device detection, and reliable initialization
 * across different browsers and devices.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { cameraManager } from './cameraManager';
import { detectEnvironment } from './deviceDetection';
import { CameraDevice, CameraError, CameraHookResult, CameraOptions } from './types';

/**
 * Hook for camera access and management
 */
export function useCamera(options: CameraOptions = { video: true }): CameraHookResult {
  // Generate a unique ID for this hook instance
  const id = useRef<string>(uuidv4());
  const optionsRef = useRef<CameraOptions>(options);
  const mountedRef = useRef<boolean>(true);
  const attemptCountRef = useRef<number>(0);
  const lastErrorRef = useRef<Error | null>(null);
  const environmentRef = useRef(detectEnvironment());
  
  // State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraCapabilities, setCameraCapabilities] = useState<MediaTrackCapabilities | null>(null);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
  // Load initial device list
  useEffect(() => {
    let mounted = true;
    
    const loadDevices = async () => {
      try {
        const deviceList = await cameraManager.getDevices();
        if (mounted) {
          setDevices(deviceList);
        }
      } catch (err) {
        console.error('Error loading camera devices:', err);
      }
    };
    
    const checkPermission = async () => {
      try {
        const permissionState = await cameraManager.getPermissionState();
        if (mounted) {
          setHasCameraPermission(permissionState);
        }
      } catch (err) {
        console.error('Error checking camera permission:', err);
      }
    };
    
    loadDevices();
    checkPermission();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  /**
   * Initialize the camera with improved error handling and recovery
   */
  const initializeCamera = useCallback(async (): Promise<MediaStream | null> => {
    // Enhanced check for already initialized and functioning properly
    if (isInitialized && stream && stream.active && 
        stream.getVideoTracks().some(track => track.readyState === 'live' && track.enabled)) {
      console.log('[useCamera] Using existing active stream');
      return stream;
    }
    
    // Mark as pending
    setIsPending(true);
    setError(null);
    attemptCountRef.current += 1;
    
    // Reset camera if tracks exist but are in bad state
    if (stream) {
      // Check if we have inactive tracks or tracks in bad state
      const hasBadTracks = stream.getTracks().some(track => 
        !track.enabled || track.readyState !== 'live'
      );
      
      if (hasBadTracks) {
        console.log('[useCamera] Existing stream has bad tracks, cleaning up');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    
    try {
      // Request stream from camera manager with environment-specific optimizations
      console.log('[useCamera] Requesting camera stream, attempt:', attemptCountRef.current);
      const newStream = await cameraManager.requestStream(id.current, optionsRef.current);
      
      // Verify stream is active and has video tracks
      if (newStream && newStream.active && newStream.getVideoTracks().length > 0) {
        // Get camera capabilities for the active track
        const videoTrack = newStream.getVideoTracks()[0];
        if (videoTrack) {
          try {
            const capabilities = videoTrack.getCapabilities();
            setCameraCapabilities(capabilities);
          } catch (capError) {
            console.warn('[useCamera] Could not get camera capabilities:', capError);
          }
        }
        
        // Update state if still mounted
        if (mountedRef.current) {
          console.log('[useCamera] Stream initialized successfully');
          setStream(newStream);
          setIsInitialized(true);
          setIsPending(false);
          lastErrorRef.current = null;
          attemptCountRef.current = 0; // Reset attempts on success
          
          // Update permission state
          setHasCameraPermission(true);
          
          // Refresh device list
          const deviceList = await cameraManager.getDevices();
          setDevices(deviceList);
        }
      } else {
        throw new Error('Camera stream is not active or missing video tracks');
      }
      
      return newStream;
    } catch (err) {
      console.error('[useCamera] Error initializing camera:', err);
      lastErrorRef.current = err as Error;
      
      // Update error state if still mounted
      if (mountedRef.current) {
        // Clear any existing stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        setError(err as CameraError);
        setIsPending(false);
        setIsInitialized(false);
        
        // Update permission state if denied
        if ((err as any).type === 'permission_denied') {
          setHasCameraPermission(false);
        }
        
        // Enhanced automatic recovery for a wider range of errors
        const errorMessage = String(err).toLowerCase();
        const canAutoRecover = (
          attemptCountRef.current <= 3 && 
          (errorMessage.includes('not found') || 
           errorMessage.includes('not available') ||
           errorMessage.includes('busy') ||
           errorMessage.includes('already in use') ||
           errorMessage.includes('failed to allocate') ||
           errorMessage.includes('starting video') ||
           errorMessage.includes('hardware') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('denied') && attemptCountRef.current === 1) // Only retry once for permission issues
        );
        
        if (canAutoRecover) {
          console.log(`[useCamera] Attempting automatic recovery (${attemptCountRef.current}/3)...`);
          // Enhanced recovery strategy with progressive fallbacks
          const retryOptions = { ...optionsRef.current };
          const env = environmentRef.current;
          
          // Apply strategy based on attempt count and environment
          if (typeof retryOptions.video === 'object') {
            // First attempt: simplify constraints but keep facing mode
            if (attemptCountRef.current === 1) {
              const simpleConstraints: MediaTrackConstraints = {};
              
              // Keep facing mode if specified
              if (retryOptions.video.facingMode) {
                simpleConstraints.facingMode = retryOptions.video.facingMode;
              }
              
              // Use moderate resolution to balance quality and compatibility
              simpleConstraints.width = { ideal: 640 };
              simpleConstraints.height = { ideal: 480 };
              
              // Remove frameRate if on mobile safari which can be picky
              if (env.isSafari && env.isMobile) {
                console.log('[useCamera] Removing frameRate for mobile Safari compatibility');
              } else {
                simpleConstraints.frameRate = { ideal: 24 };
              }
              
              retryOptions.video = simpleConstraints;
            } 
            // Second attempt: minimal constraints
            else if (attemptCountRef.current === 2) {
              // Try with the simplest possible constraints
              retryOptions.video = true;
            }
            // Final attempt: use device detection to apply device-specific workarounds
            else {
              console.log('[useCamera] Applying device-specific workarounds for final attempt');
              retryOptions.video = true;
              
              // For iOS, try enabling audio as this sometimes helps video initialization
              if (env.isIOS && !retryOptions.audio) {
                retryOptions.audio = true;
              }
            }
          }
          
          // Enhanced retry scheduling with progressive backoff
          const backoffTime = attemptCountRef.current * 1000; // 1s, 2s, 3s
          
          console.log(`[useCamera] Scheduling recovery attempt ${attemptCountRef.current} in ${backoffTime}ms`);
          setTimeout(() => {
            if (mountedRef.current) {
              console.log('[useCamera] Executing recovery attempt with options:', retryOptions);
              
              // For multiple attempts, ensure camera manager is cleaned up before retry
              if (attemptCountRef.current > 1) {
                cameraManager.releaseStream(id.current);
              }
              
              optionsRef.current = retryOptions;
              initializeCamera().catch(e => {
                console.warn('[useCamera] Recovery attempt failed:', e);
                
                // If we've exhausted all attempts, provide more detailed error to user
                if (attemptCountRef.current >= 3) {
                  const detailedError = {
                    ...e,
                    message: `Camera initialization failed after multiple attempts. ${e.message}`,
                    details: {
                      environment: environmentRef.current,
                      lastError: String(e),
                      originalOptions: options,
                      finalOptions: retryOptions
                    }
                  };
                  setError(detailedError as CameraError);
                }
              });
            }
          }, backoffTime);
        } else if (attemptCountRef.current > 3) {
          console.warn('[useCamera] Too many failed attempts, giving up automatic recovery');
        }
      }
      
      return null;
    }
  }, [isInitialized, stream]);
  
  /**
   * Stop the camera
   */
  const stopCamera = useCallback((): void => {
    // Release stream from camera manager
    cameraManager.releaseStream(id.current);
    
    // Clear state
    setStream(null);
    setIsInitialized(false);
  }, []);
  
  /**
   * Switch camera (e.g., from front to back)
   */
  const switchCamera = useCallback(async (): Promise<MediaStream | null> => {
    // Find current facing mode
    const currentFacingMode = optionsRef.current.video && 
      typeof optionsRef.current.video !== 'boolean' && 
      optionsRef.current.video.facingMode;
    
    // Determine new facing mode
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    // Create new options
    const newOptions: CameraOptions = {
      ...optionsRef.current,
      video: typeof optionsRef.current.video === 'boolean' 
        ? { facingMode: newFacingMode }
        : { ...optionsRef.current.video, facingMode: newFacingMode }
    };
    
    // Update options ref
    optionsRef.current = newOptions;
    
    // Release current stream
    stopCamera();
    
    // Initialize with new options
    return initializeCamera();
  }, [initializeCamera, stopCamera]);
  
  /**
   * Get available cameras
   */
  const getAvailableCameras = useCallback(async (): Promise<CameraDevice[]> => {
    return cameraManager.getDevices();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Mark as unmounted
      mountedRef.current = false;
      
      // Release stream
      cameraManager.releaseStream(id.current);
    };
  }, []);
  
  return {
    stream,
    error,
    isInitialized,
    isPending,
    devices,
    hasCameraPermission,
    initializeCamera,
    stopCamera,
    switchCamera,
    getAvailableCameras
  };
}

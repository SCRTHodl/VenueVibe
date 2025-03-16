/**
 * useCamera hook
 * 
 * React hook for managing camera access in components.
 * Provides a simplified interface to the camera manager.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { cameraManager } from './cameraManager';
import { CameraDevice, CameraError, CameraHookResult, CameraOptions } from './types';

/**
 * Hook for camera access and management
 */
export function useCamera(options: CameraOptions = { video: true }): CameraHookResult {
  // Generate a unique ID for this hook instance
  const id = useRef<string>(uuidv4());
  const optionsRef = useRef<CameraOptions>(options);
  const mountedRef = useRef<boolean>(true);
  
  // State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
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
   * Initialize the camera
   */
  const initializeCamera = useCallback(async (): Promise<MediaStream | null> => {
    // Skip if already initialized
    if (isInitialized && stream) {
      return stream;
    }
    
    // Mark as pending
    setIsPending(true);
    setError(null);
    
    try {
      // Request stream from camera manager
      const newStream = await cameraManager.requestStream(id.current, optionsRef.current);
      
      // Update state if still mounted
      if (mountedRef.current) {
        setStream(newStream);
        setIsInitialized(!!newStream);
        setIsPending(false);
        
        // Update permission state
        setHasCameraPermission(true);
        
        // Refresh device list
        const deviceList = await cameraManager.getDevices();
        setDevices(deviceList);
      }
      
      return newStream;
    } catch (err) {
      // Update error state if still mounted
      if (mountedRef.current) {
        setError(err as CameraError);
        setIsPending(false);
        setIsInitialized(false);
        
        // Update permission state if denied
        if ((err as any).type === 'permission_denied') {
          setHasCameraPermission(false);
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

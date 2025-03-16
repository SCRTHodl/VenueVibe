import { CameraContext, CameraDevice, CameraOptions } from './types';

/**
 * Detect browser/device environment to apply appropriate workarounds
 */
export function detectEnvironment(): CameraContext {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  
  // Detect mobile
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  
  // Detect Android
  const isAndroid = /android/i.test(userAgent);
  
  // Detect Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  
  // Get browser version (simplified)
  const browserVersion = (() => {
    const match = userAgent.match(/(chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    return parseInt(match[2], 10) || 0;
  })();
  
  // Check for WebRTC support
  const hasWebRTCSupport = !!(
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia && 
    window.RTCPeerConnection
  );
  
  // Determine best default facing mode
  // Mobile devices typically have both front/back cameras, desktop usually has only one
  const bestFacingMode = isMobile ? 'environment' : 'user';
  
  return {
    isMobile,
    isIOS,
    isAndroid,
    isSafari,
    browserVersion,
    hasWebRTCSupport,
    bestFacingMode
  };
}

/**
 * Apply device-specific workarounds to camera options
 */
export function applyCameraOptionsWorkarounds(
  options: CameraOptions,
  context: CameraContext
): CameraOptions {
  const result = { ...options };
  const videoConstraints = typeof options.video === 'boolean' 
    ? (options.video ? {} : false) 
    : { ...(options.video || {}) };
  
  // Only apply workarounds if video is enabled
  if (videoConstraints !== false) {
    // iOS Safari has issues with exact constraints
    if (context.isIOS && context.isSafari) {
      // Convert any 'exact' constraints to 'ideal' to avoid errors
      if (videoConstraints.width && 'exact' in (videoConstraints.width as any)) {
        videoConstraints.width = { ideal: (videoConstraints.width as any).exact };
      }
      
      if (videoConstraints.height && 'exact' in (videoConstraints.height as any)) {
        videoConstraints.height = { ideal: (videoConstraints.height as any).exact };
      }
      
      if (videoConstraints.frameRate && 'exact' in (videoConstraints.frameRate as any)) {
        videoConstraints.frameRate = { ideal: (videoConstraints.frameRate as any).exact };
      }
    }
    
    // On older Android browsers, reduce quality expectations
    if (context.isAndroid && context.browserVersion < 80) {
      // Simplify constraints to avoid issues
      if (videoConstraints.width && typeof videoConstraints.width !== 'boolean') {
        videoConstraints.width = { ideal: 1280 };
      }
      
      if (videoConstraints.height && typeof videoConstraints.height !== 'boolean') {
        videoConstraints.height = { ideal: 720 };
      }
      
      // Limit frame rate on older devices
      if (videoConstraints.frameRate && typeof videoConstraints.frameRate !== 'boolean') {
        videoConstraints.frameRate = { ideal: 24, max: 30 };
      }
    }
    
    // For iOS, ensure we use the full range of camera capabilities
    if (context.isIOS) {
      // iOS sometimes works better with aspect ratio than specific dimensions
      videoConstraints.aspectRatio = { ideal: 16/9 };
    }
    
    result.video = videoConstraints;
  }
  
  // Mobile-specific audio constraints
  if (options.audio && context.isMobile) {
    const audioConstraints = typeof options.audio === 'boolean' 
      ? {} : { ...options.audio };
      
    // Optimize for voice on mobile
    audioConstraints.echoCancellation = true;
    audioConstraints.noiseSuppression = true;
    audioConstraints.autoGainControl = true;
    
    result.audio = audioConstraints;
  }
  
  return result;
}

/**
 * Get available camera devices
 */
export async function getAvailableCameras(): Promise<CameraDevice[]> {
  try {
    // Check if media devices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.warn('MediaDevices API not supported in this browser');
      return [];
    }
    
    // Try to get permissions first to ensure labels are available
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (err) {
      // Ignore permission errors here, we'll just get limited device info
      console.warn('Could not get camera permission, device labels may be unavailable', err);
    }
    
    // Get all media devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // Filter to just video input devices
    const videoDevices = devices
      .filter(device => device.kind === 'videoinput')
      .map(device => {
        // Determine facing mode based on label heuristics
        const label = device.label.toLowerCase();
        let facingMode: 'user' | 'environment' | undefined = undefined;
        
        if (
          label.includes('back') || 
          label.includes('rear') || 
          label.includes('environment')
        ) {
          facingMode = 'environment';
        } else if (
          label.includes('front') || 
          label.includes('face') || 
          label.includes('user')
        ) {
          facingMode = 'user';
        }
        
        return {
          deviceId: device.deviceId,
          kind: device.kind,
          label: device.label || `Camera ${device.deviceId.substring(0, 5)}...`,
          facingMode
        };
      });
    
    return videoDevices;
  } catch (error) {
    console.error('Error getting camera devices:', error);
    return [];
  }
}

/**
 * Creates a camera error with the appropriate type
 */
export function createCameraError(originalError: Error): Error {
  const error = new Error(originalError.message);
  
  // Copy properties from original error
  Object.assign(error, originalError);
  
  error.name = 'CameraError';
  
  // Determine error type based on the original error
  if (originalError.name === 'NotAllowedError' || originalError.message.includes('Permission denied')) {
    (error as any).type = 'permission_denied';
  } else if (originalError.name === 'NotFoundError' || originalError.message.includes('Requested device not found')) {
    (error as any).type = 'device_not_found';
  } else if (originalError.name === 'NotReadableError' || originalError.message.includes('Could not start video source')) {
    (error as any).type = 'not_readable';
  } else if (originalError.name === 'OverconstrainedError') {
    (error as any).type = 'overconstrained';
  } else if (originalError.name === 'AbortError') {
    (error as any).type = 'aborted';
  } else if (originalError.name === 'SecurityError') {
    (error as any).type = 'security_error';
  } else if (originalError.name === 'ConstraintNotSatisfiedError') {
    (error as any).type = 'constraint_not_satisfied';
  } else {
    (error as any).type = 'unknown_error';
  }
  
  // Include the original error for debugging
  (error as any).originalError = originalError;
  
  return error;
}

/**
 * Check if the browser has camera permission
 */
export async function checkCameraPermission(): Promise<boolean> {
  if (!navigator.permissions || !navigator.permissions.query) {
    // Permissions API not supported, fall back to getUserMedia
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      return false;
    }
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state === 'granted';
  } catch (err) {
    console.warn('Error checking camera permission:', err);
    return false;
  }
}

/**
 * Camera module types
 */

/**
 * Camera options for initialization
 */
export interface CameraOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

/**
 * Camera device information
 */
export interface CameraDevice {
  deviceId: string;
  kind: string;
  label: string;
  facingMode?: 'user' | 'environment';
}

/**
 * Error reasons for camera failures
 */
export enum CameraErrorType {
  PERMISSION_DENIED = 'permission_denied',
  DEVICE_NOT_FOUND = 'device_not_found',
  CONSTRAINT_NOT_SATISFIED = 'constraint_not_satisfied',
  TRACK_START_FAILURE = 'track_start_failure',
  NOT_READABLE = 'not_readable',
  OVERCONSTRAINED = 'overconstrained',
  ABORTED = 'aborted',
  SECURITY_ERROR = 'security_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Enhanced camera error with additional context
 */
export interface CameraError extends Error {
  type: CameraErrorType;
  originalError?: Error;
}

/**
 * Camera hook return type
 */
export interface CameraHookResult {
  stream: MediaStream | null;
  error: CameraError | null;
  isInitialized: boolean;
  isPending: boolean;
  devices: CameraDevice[];
  hasCameraPermission: boolean | null;
  initializeCamera: () => Promise<MediaStream | null>;
  stopCamera: () => void;
  switchCamera: () => Promise<MediaStream | null>;
  getAvailableCameras: () => Promise<CameraDevice[]>;
}

/**
 * Camera manager stream request
 */
export interface StreamRequest {
  id: string;
  options: CameraOptions;
  resolve: (stream: MediaStream | null) => void;
  reject: (error: Error) => void;
}

/**
 * Camera operating context
 */
export interface CameraContext {
  // Device type
  isMobile: boolean;
  isIOS: boolean;
  isIPad: boolean;
  isAndroid: boolean;
  androidVersion: number;
  iOSVersion: number;
  
  // Browser detection
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isSamsungBrowser: boolean;
  
  // Browser version info
  browserInfo: {
    name: string;
    version: number;
  };
  
  // Feature detection
  hasWebRTCSupport: boolean;
  hasAdvancedConstraints: boolean;
  hasVisibilityDetection: boolean;
  
  // Camera preferences
  bestFacingMode: 'user' | 'environment';
}

/**
 * Configuration for camera behavior
 */
export interface CameraConfig {
  cleanupDelay: number;
  initRateLimit: number;
  permissionTimeout: number;
  deviceRefreshInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
}

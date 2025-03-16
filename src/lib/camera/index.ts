/**
 * Camera module exports
 */

// Export the hook and types
export { useCamera } from './useCamera';
export type { 
  CameraOptions,
  CameraDevice,
  CameraError,
  CameraErrorType,
  CameraHookResult,
  CameraContext
} from './types';

// Export the camera manager for advanced usage
export { cameraManager } from './cameraManager';

// Export utility functions
export { 
  detectEnvironment,
  applyCameraOptionsWorkarounds,
  getAvailableCameras,
  checkCameraPermission,
  createCameraError
} from './deviceDetection';

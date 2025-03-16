/**
 * This is a compatibility layer that forwards to the new camera module.
 * 
 * For new code, import directly from the camera module instead:
 * import { useCamera } from '../camera';
 */

// Re-export from the new location
export { useCamera } from '../camera';

// Re-export types for compatibility
export type { CameraOptions, CameraError, CameraHookResult } from '../camera/types';

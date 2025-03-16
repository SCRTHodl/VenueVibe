/**
 * Camera Manager
 * 
 * Handles global camera stream allocation and resource management.
 * Ensures only one MediaStream is active at a time and manages 
 * reference counting for proper resource cleanup.
 */

import { applyCameraOptionsWorkarounds, checkCameraPermission, createCameraError, detectEnvironment, getAvailableCameras } from './deviceDetection';
import { CameraConfig, CameraContext, CameraDevice, CameraOptions, StreamRequest } from './types';

// Default configuration
const DEFAULT_CONFIG: CameraConfig = {
  cleanupDelay: 500,       // ms to wait before cleaning up after last user disconnects
  initRateLimit: 1000,     // min ms between camera initializations
  permissionTimeout: 10000, // ms to wait for permission dialog
  deviceRefreshInterval: 10000, // ms between device list refreshes
  reconnectAttempts: 3,    // number of times to attempt reconnection
  reconnectDelay: 1000     // ms to wait between reconnection attempts
};

/**
 * Global camera manager singleton
 */
class CameraManager {
  private static instance: CameraManager;
  
  // Stream management
  private activeStream: MediaStream | null = null;
  private users: Set<string> = new Set();
  private pendingCleanup: NodeJS.Timeout | null = null;
  
  // Initialization state
  private initializing: boolean = false;
  private lastInitTime: number = 0;
  private initPromise: Promise<MediaStream | null> | null = null;
  
  // Queue for stream requests
  private streamRequests: StreamRequest[] = [];
  
  // Device cache
  private deviceList: CameraDevice[] = [];
  private deviceRefreshTimer: NodeJS.Timeout | null = null;
  private permissionState: boolean | null = null;
  
  // Environment context
  public context: CameraContext;
  
  // Configuration
  public config: CameraConfig;
  
  private constructor() {
    this.context = detectEnvironment();
    this.config = { ...DEFAULT_CONFIG };
    
    // Start device polling if supported
    this.startDeviceMonitoring();
    
    // Listen for visibility changes to handle page focus/unfocus
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager();
    }
    return CameraManager.instance;
  }
  
  /**
   * Request a camera stream with the given options
   */
  public async requestStream(
    id: string, 
    options: CameraOptions
  ): Promise<MediaStream | null> {
    console.log(`[CameraManager] Stream requested by ${id}`);
    
    // Add to active users
    this.users.add(id);
    
    // Clear any pending cleanup
    this.cancelPendingCleanup();
    
    // If we already have an active stream, return it
    if (this.activeStream) {
      console.log(`[CameraManager] Returning existing stream to ${id}`);
      return this.activeStream;
    }
    
    // If initialization is already in progress, wait for it
    if (this.initializing && this.initPromise) {
      console.log(`[CameraManager] Waiting for in-progress initialization for ${id}`);
      return this.initPromise;
    }
    
    // Apply device-specific workarounds to options
    const enhancedOptions = applyCameraOptionsWorkarounds(options, this.context);
    
    // Create a new promise for this request
    return new Promise<MediaStream | null>((resolve, reject) => {
      // Check for rate limiting
      const now = Date.now();
      const timeSinceLastInit = now - this.lastInitTime;
      
      if (timeSinceLastInit < this.config.initRateLimit) {
        console.log(`[CameraManager] Rate limiting stream request from ${id}`);
        
        // Queue this request
        this.streamRequests.push({
          id,
          options: enhancedOptions,
          resolve,
          reject
        });
        
        // Schedule processing
        setTimeout(() => {
          this.processStreamRequests();
        }, this.config.initRateLimit - timeSinceLastInit);
        
        return;
      }
      
      // Set up immediately
      this.doInitializeCamera(id, enhancedOptions)
        .then(resolve)
        .catch(reject);
    });
  }
  
  /**
   * Release a camera stream for a specific user
   */
  public releaseStream(id: string): void {
    // Remove from active users
    this.users.delete(id);
    
    console.log(`[CameraManager] Stream released by ${id}, ${this.users.size} users remaining`);
    
    // If no more users, schedule cleanup
    if (this.users.size === 0 && this.activeStream) {
      this.scheduleCameraCleanup();
    }
  }
  
  /**
   * Get available camera devices
   */
  public async getDevices(): Promise<CameraDevice[]> {
    // If we have a cached list and it's recent, use it
    if (this.deviceList.length > 0) {
      return [...this.deviceList];
    }
    
    // Otherwise refresh the list
    const devices = await getAvailableCameras();
    this.deviceList = devices;
    return [...devices];
  }
  
  /**
   * Check camera permission state
   */
  public async getPermissionState(): Promise<boolean | null> {
    // If we already checked, return cached state
    if (this.permissionState !== null) {
      return this.permissionState;
    }
    
    // Check permission
    const hasPermission = await checkCameraPermission();
    this.permissionState = hasPermission;
    return hasPermission;
  }
  
  /**
   * Switch to a different camera
   */
  public async switchCamera(
    id: string,
    options: CameraOptions
  ): Promise<MediaStream | null> {
    // Close existing stream
    await this.closeActiveStream();
    
    // Initialize with new options
    return this.requestStream(id, options);
  }
  
  /**
   * Process any queued stream requests
   */
  private async processStreamRequests(): Promise<void> {
    // If no requests, do nothing
    if (this.streamRequests.length === 0) {
      return;
    }
    
    // Take the first request
    const request = this.streamRequests.shift()!;
    
    try {
      // Initialize camera
      const stream = await this.doInitializeCamera(request.id, request.options);
      request.resolve(stream);
    } catch (err) {
      request.reject(err as Error);
    }
    
    // If more requests are pending, schedule them
    if (this.streamRequests.length > 0) {
      setTimeout(() => {
        this.processStreamRequests();
      }, this.config.initRateLimit);
    }
  }
  
  /**
   * Core camera initialization logic
   */
  private async doInitializeCamera(
    id: string,
    options: CameraOptions
  ): Promise<MediaStream | null> {
    // Update state
    this.initializing = true;
    this.lastInitTime = Date.now();
    
    // Create initialization promise
    this.initPromise = new Promise<MediaStream | null>(async (resolve, reject) => {
      try {
        console.log(`[CameraManager] Initializing camera for ${id}`);
        
        // Try to get user media with a timeout for the permission dialog
        let permissionTimeout: NodeJS.Timeout | null = null;
        
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
          permissionTimeout = setTimeout(() => {
            reject(new Error('Camera permission request timed out'));
          }, this.config.permissionTimeout);
        });
        
        // Race between getUserMedia and timeout
        const newStream = await Promise.race([
          navigator.mediaDevices.getUserMedia(options),
          timeoutPromise
        ]);
        
        // Clear timeout if it's still active
        if (permissionTimeout) {
          clearTimeout(permissionTimeout);
        }
        
        // Update permission state
        this.permissionState = true;
        
        // Store the new stream
        this.activeStream = newStream;
        
        // Refresh device list after successful camera access
        this.refreshDevices();
        
        console.log(`[CameraManager] Camera initialized successfully for ${id}`);
        resolve(newStream);
      } catch (err) {
        // Clear the active stream
        this.activeStream = null;
        
        // Format error
        const formattedError = createCameraError(err as Error);
        
        // If permission denied, update permission state
        if ((formattedError as any).type === 'permission_denied') {
          this.permissionState = false;
        }
        
        console.error(`[CameraManager] Camera initialization failed for ${id}:`, formattedError);
        reject(formattedError);
      } finally {
        // Reset initialization state
        this.initializing = false;
        this.initPromise = null;
      }
    });
    
    // Return the initialization promise
    return this.initPromise;
  }
  
  /**
   * Close the active stream and clean up resources
   */
  private async closeActiveStream(): Promise<void> {
    // Cancel any pending cleanup
    this.cancelPendingCleanup();
    
    // If no active stream, nothing to do
    if (!this.activeStream) {
      return;
    }
    
    console.log('[CameraManager] Closing active camera stream');
    
    try {
      // Stop all tracks
      this.activeStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('[CameraManager] Error stopping track:', e);
        }
      });
    } catch (e) {
      console.error('[CameraManager] Error stopping camera tracks:', e);
    }
    
    // Clear the active stream
    this.activeStream = null;
  }
  
  /**
   * Schedule camera cleanup after delay
   */
  private scheduleCameraCleanup(): void {
    // Cancel any existing cleanup
    this.cancelPendingCleanup();
    
    // Schedule new cleanup
    console.log(`[CameraManager] Scheduling camera cleanup in ${this.config.cleanupDelay}ms`);
    this.pendingCleanup = setTimeout(() => {
      // Only proceed if no users are using the camera
      if (this.users.size === 0) {
        this.closeActiveStream();
      }
    }, this.config.cleanupDelay);
  }
  
  /**
   * Cancel any pending cleanup
   */
  private cancelPendingCleanup(): void {
    if (this.pendingCleanup) {
      clearTimeout(this.pendingCleanup);
      this.pendingCleanup = null;
    }
  }
  
  /**
   * Start device monitoring to keep device list updated
   */
  private startDeviceMonitoring(): void {
    // Initial device refresh
    this.refreshDevices();
    
    // Set up device change listener
    navigator.mediaDevices?.addEventListener?.('devicechange', () => {
      console.log('[CameraManager] Device change detected, refreshing device list');
      this.refreshDevices();
    });
    
    // Set up periodic refresh as a fallback for browsers that don't support devicechange
    this.deviceRefreshTimer = setInterval(() => {
      this.refreshDevices();
    }, this.config.deviceRefreshInterval);
  }
  
  /**
   * Refresh the device list
   */
  private async refreshDevices(): Promise<void> {
    try {
      const devices = await getAvailableCameras();
      this.deviceList = devices;
    } catch (err) {
      console.error('[CameraManager] Error refreshing device list:', err);
    }
  }
  
  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      // Page is hidden, schedule cleanup to free camera resources
      if (this.activeStream) {
        this.scheduleCameraCleanup();
      }
    } else if (document.visibilityState === 'visible') {
      // Page is visible again, cancel any pending cleanup
      this.cancelPendingCleanup();
    }
  }
  
  /**
   * Clean up manager resources
   */
  public dispose(): void {
    // Stop device refresh timer
    if (this.deviceRefreshTimer) {
      clearInterval(this.deviceRefreshTimer);
      this.deviceRefreshTimer = null;
    }
    
    // Close stream
    this.closeActiveStream();
    
    // Clear pending timers
    this.cancelPendingCleanup();
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

// Export the singleton instance
export const cameraManager = CameraManager.getInstance();

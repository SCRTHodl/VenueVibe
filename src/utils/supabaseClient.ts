// Re-export the supabase client from lib/supabase.ts
import { supabase } from '../lib/supabase';

// Import adminService for server-side admin operations
import { adminService } from '../lib/adminService';

// Export a wrapper for admin operations that uses serverless functions
// This approach avoids exposing the service role key in client-side code
export const getAdminClient = () => {
  console.warn('Direct admin client access is deprecated.');
  console.warn('Please use adminService for secure admin operations.');
  
  // Just return the regular client since admin operations are now handled by serverless functions
  return supabase;
};

// Export the admin service for use in components
export { adminService, supabase };

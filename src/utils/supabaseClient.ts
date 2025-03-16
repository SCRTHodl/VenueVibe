// Re-export the supabase client from lib/supabase.ts
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Export the service role client for token economy operations
export const getAdminClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  // Check for both service key variable names (handle potential inconsistency)
  const supabaseServiceKey = 
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
    import.meta.env.VITE_SUPABASE_SERVICE_KEY || 
    '';
  
  if (!supabaseServiceKey) {
    console.warn('Service role key not found, using anonymous client instead');
    console.warn('Please ensure VITE_SUPABASE_SERVICE_ROLE_KEY is set in your .env file');
    return supabase;
  }
  
  try {
    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Log initialization in dev mode
    if (import.meta.env.DEV) {
      console.log('Admin client initialized with service role');
    }
    
    return adminClient;
  } catch (error) {
    console.error('Failed to create admin client:', error);
    return supabase; // Fallback to regular client
  }
};

export { supabase };

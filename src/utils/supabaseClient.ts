// Re-export the supabase client from lib/supabase.ts
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Export the service role client for token economy operations
export const getAdminClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseServiceKey) {
    console.warn('Service role key not found, using anonymous client instead');
    return supabase;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

export { supabase };

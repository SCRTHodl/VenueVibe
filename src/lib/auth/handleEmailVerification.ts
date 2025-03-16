import { supabase } from '../supabase';

/**
 * Handles email verification from URL hash fragments
 * This function should be called when the application loads
 * to check if there's an email verification token in the URL
 */
export const handleEmailVerification = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Check if we have a hash fragment that might contain auth info
    const hash = window.location.hash;
    
    if (hash && (hash.includes('type=signup') || hash.includes('type=recovery'))) {
      console.log('Processing authentication callback from hash fragment:', hash);
      
      // First try to directly get the session - this should work if the hash was automatically processed
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
      }
      
      // If we don't have a session yet, try to extract tokens from the hash and set the session
      if (!sessionData?.session) {
        console.log('No session found, trying to extract from URL hash');
        
        // Try parsing the hash for direct access token handling
        if (hash.includes('access_token')) {
          try {
            // Extract access token
            const accessToken = new URLSearchParams(hash.substring(1)).get('access_token');
            const refreshToken = new URLSearchParams(hash.substring(1)).get('refresh_token');
            
            if (accessToken && refreshToken) {
              console.log('Found tokens in URL, setting session directly');
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (setSessionError) {
                console.error('Error setting session from tokens:', setSessionError);
                return {
                  success: false,
                  message: `Verification failed while setting session: ${setSessionError.message}`
                };
              }
            }
          } catch (parseError) {
            console.error('Error parsing hash fragment:', parseError);
          }
        }
      }
      
      // Check if we have a session now
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error handling auth callback:', error);
        return {
          success: false,
          message: `Verification failed: ${error.message}`
        };
      }
      
      if (data.session) {
        console.log('Session established from email verification');
        // Clear the hash fragment to avoid processing it again on page refresh
        window.history.replaceState(null, '', window.location.pathname);
        
        return {
          success: true,
          message: 'Email verification successful. You are now signed in.'
        };
      } else {
        return {
          success: false,
          message: 'Email link processed but no session was created.'
        };
      }
    }
    
    return {
      success: false,
      message: 'No verification link detected'
    };
  } catch (error) {
    console.error('Error in handleEmailVerification:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred during email verification.'
    };
  }
};

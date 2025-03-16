/**
 * Debug utility for email verification
 * This file provides tools to test email verification in development when actual emails
 * might not be delivered to your inbox
 */
import { supabase } from '../lib/supabase';
import { getAdminClient } from '../utils/supabaseClient';

/**
 * Manually simulate email verification for the specified user
 * In development, Supabase may not send actual emails, making testing difficult
 * This function helps simulate email verification for testing purposes
 */
export const simulateEmailVerification = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Attempting to simulate email verification for:', email);
    
    // First check if the user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.error('User not found:', userError);
      return { 
        success: false, 
        message: `User with email ${email} not found in database`
      };
    }
    
    console.log('Found user:', userData);
    
    // In development, we can use the admin client to directly update user's verification status
    // This simulates clicking the verification link in the email
    try {
      const adminClient = getAdminClient();
      if (!adminClient) {
        return {
          success: false,
          message: 'Admin client not available. Check your VITE_SUPABASE_SERVICE_ROLE_KEY environment variable.'
        };
      }
      
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        userData.id,
        { email_confirm: true }
      );
      
      if (updateError) throw updateError;
    } catch (updateError) {
      console.error('Failed to simulate email verification:', updateError);
      return {
        success: false,
        message: `Failed to verify email: ${updateError instanceof Error ? updateError.message : String(updateError)}`
      };
    }
    
    // This section is now handled in the try/catch block above
    
    console.log('Email verification simulated successfully for:', email);
    return {
      success: true,
      message: `Email verification simulated for ${email}. You can now sign in.`
    };
  } catch (error) {
    console.error('Error in simulateEmailVerification:', error);
    return {
      success: false,
      message: `An error occurred: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Get verification status for a user by email
 */
export const checkVerificationStatus = async (email: string): Promise<{ 
  isVerified: boolean; 
  message: string;
  user?: any;
}> => {
  try {
    // First try to check the user in the public users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('Error checking user in database:', userError);
    }
    
    // Try to check user in auth table using admin client if available
    try {
      const adminClient = getAdminClient();
      if (!adminClient) {
        return {
          isVerified: false,
          message: 'Could not access admin features to check verification. Check service role key.'
        };
      }
      
      const { data, error } = await adminClient.auth.admin.listUsers();
      
      if (error) {
        console.error('Error checking verification status:', error);
        return {
          isVerified: false,
          message: `Error checking status: ${error.message}`
        };
      }
      
      const user = data.users.find(u => u.email === email);
      
      if (user) {
        return {
          isVerified: !!user.email_confirmed_at,
          message: user.email_confirmed_at 
            ? `Email verified on ${new Date(user.email_confirmed_at).toLocaleString()}` 
            : 'Email not yet verified',
          user
        };
      }
    } catch (adminError) {
      console.error('Error using admin client:', adminError);
      // Continue to fallback method if admin client fails
    }
    
    // If we couldn't use admin or couldn't find user, check if the user exists in the public table
    if (userData) {
      // We can't check email_confirmed_at directly without admin, so provide a less detailed response
      return {
        isVerified: false,  // We can't know for sure without admin access
        message: `User exists but verification status can't be determined without admin access`,
        user: userData
      };
    }
    
    return {
      isVerified: false,
      message: `No user found with email ${email}`
    };
  } catch (error) {
    console.error('Error in checkVerificationStatus:', error);
    return {
      isVerified: false,
      message: `An error occurred: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Debug function to get the current Supabase session
 */
export const debugCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { error: error.message };
    }
    
    return { 
      hasSession: !!data.session,
      session: data.session,
      user: data.session?.user
    };
  } catch (error) {
    console.error('Error in debugCurrentSession:', error);
    return { error: String(error) };
  }
};

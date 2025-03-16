/**
 * Email verification helper functions
 * 
 * These utilities provide functions for handling email verification
 * without requiring admin privileges in development environments
 */
import { supabase } from '../lib/supabase';
import { getAdminClient } from './supabaseClient';
import { toast } from 'react-hot-toast';

/**
 * Manually trigger email verification link resend
 * This is useful in development where email delivery might be unreliable
 */
export const resendVerificationEmail = async (email: string): Promise<{ 
  success: boolean; 
  message: string 
}> => {
  try {
    console.log('Resending verification email to:', email);
    
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    
    console.log('Verification email resent:', data);
    return {
      success: true,
      message: `Verification email sent to ${email}. Please check your inbox or spam folder.`
    };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      message: `Failed to resend verification email: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Check if a user exists in the public users table
 * This avoids the infinite recursion issue with RLS policies
 */
export const checkUserExists = async (email: string): Promise<{
  exists: boolean;
  userId?: string;
  message: string;
}> => {
  try {
    // Try to find the user in auth.users table via the public profile
    // Use a minimal query to avoid schema mismatches
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      // If we hit the infinite recursion error, try a different approach
      if (error.message.includes('infinite recursion')) {
        console.warn('Infinite recursion detected in users policy, trying alternative approach');
        
        // Try to sign in to check if the user exists (this won't actually sign in if unverified)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: 'dummy-password-just-to-check-existence'
        });
        
        // If we get "Email not confirmed" error, the user exists but is unverified
        if (signInError && signInError.message.includes('Email not confirmed')) {
          return {
            exists: true,
            message: 'User exists but email is not verified'
          };
        }
        
        // If we get an invalid credentials error, user likely exists
        if (signInError && signInError.message.includes('Invalid')) {
          return {
            exists: true,
            message: 'User exists (determined from auth error)'
          };
        }
        
        return {
          exists: false,
          message: 'Unable to determine if user exists due to policy restriction'
        };
      }
      
      throw error;
    }
    
    return {
      exists: !!data,
      userId: data?.id,
      message: data
        ? `User found with email ${email}`
        : `No user found with email ${email}`
    };
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return {
      exists: false,
      message: `Error checking user: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Get the current user session if available
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return {
      hasSession: !!data.session,
      user: data.session?.user,
      isVerified: !!data.session?.user?.email_confirmed_at
    };
  } catch (error) {
    console.error('Error getting current session:', error);
    return {
      hasSession: false,
      isVerified: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Init user token balance with proper schema access
 * Uses the remembered approach for token_economy schema access
 */
export const initUserTokenBalance = async (userId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    // Get admin client with service role permissions
    const adminClient = getAdminClient();
    
    if (!adminClient) {
      return {
        success: false,
        message: 'Admin client not available. Check your environment variables.'
      };
    }
    
    // Get the token economy schema name from env or use default
    const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
    
    // Use .schema() before .from() as per memory
    const { error } = await adminClient
      .schema(tokenEconomySchema)
      .from('user_token_balances')
      .insert([
        {
          user_id: userId,
          balance: 500, // Default starting balance
          last_updated: new Date().toISOString()
        }
      ]);
    
    if (error) throw error;
    
    return {
      success: true,
      message: `Token balance initialized for user ${userId}`
    };
  } catch (error) {
    console.error('Error initializing token balance:', error);
    return {
      success: false,
      message: `Failed to initialize token balance: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Helper function to show development debug info with toast
 */
export const showDevDebugInfo = (message: string, data: any) => {
  if (import.meta.env.DEV) {
    console.log(message, data);
    toast(message, {
      icon: '🛠️',
      duration: 4000
    });
  }
};

/**
 * Force verify a user by directly updating their auth record
 * This is ONLY for development/testing purposes
 */
export const forceVerifyUser = async (email: string): Promise<{
  success: boolean;
  message: string;
  error?: any;
}> => {
  try {
    // Get admin client with service role permissions
    const adminClient = getAdminClient();
    
    console.log('Attempting to force verify user:', email);
    console.log('Using admin client with service role');
    
    // First try to list users with this email
    const { data: userList, error: userError } = await adminClient.auth.admin.listUsers();
    
    if (userError || !userList?.users?.length) {
      console.error('Error listing users:', userError);
      return { 
        success: false, 
        message: `Failed to find user with email ${email}`,
        error: userError 
      };
    }
    
    // Find the user with matching email
    const user = userList.users.find(u => u.email === email);
    
    if (!user) {
      return {
        success: false,
        message: `No user found with email ${email}`
      };
    }
    
    console.log('Found user:', user.id);
    
    // Update the user with email_confirm=true to verify them
    const { error } = await adminClient.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (error) {
      console.error('Error updating user verification status:', error);
      return { 
        success: false, 
        message: `Failed to update verification status: ${error.message}`,
        error 
      };
    }
    
    console.log('Successfully verified user:', email);
    return { 
      success: true,
      message: `User ${email} has been verified successfully. Try logging in now.`
    };
  } catch (error) {
    console.error('Unexpected error in force verify:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getAdminClient } from '../utils/supabaseClient';
import { User, ActivityEvent, AppTheme } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { TEST_USERS } from '../mockData';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAdmin: boolean;
  isLoading: boolean;
  showUserSettings: boolean;
  setShowUserSettings: React.Dispatch<React.SetStateAction<boolean>>;
  activityEvents: ActivityEvent[];
  setActivityEvents: React.Dispatch<React.SetStateAction<ActivityEvent[]>>;
  userTheme: AppTheme;
  updateUserTheme: (theme: AppTheme) => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  checkAdmin: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showUserSettings, setShowUserSettings] = useState<boolean>(false);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  
  // Default theme settings
  const [userTheme, setUserTheme] = useState<AppTheme>({
    primary: '#3b82f6',     // Blue
    secondary: '#10b981',   // Green
    accent: '#8b5cf6',      // Purple
    background: '#000000',  // Black
    cardBackground: '#18181b', // Dark gray
    textPrimary: '#ffffff', // White
    textSecondary: '#a1a1aa' // Light gray
  });

  // Check for existing session and load user data
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setIsLoading(false);
          return;
        }
        
        if (sessionData?.session?.user) {
          const userId = sessionData.session.user.id;
          
          // Get user details from database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (userError) {
            console.error('Error getting user data:', userError);
            setIsLoading(false);
            return;
          }
          
          // Get user token balance from public schema with te_ prefix
          const { data: tokenData, error } = await supabase
            .from('te_user_token_balances') // Use the migrated table in public schema
            .select('balance')
            .eq('user_id', userId)
            .maybeSingle(); // Use maybeSingle to avoid errors if no record exists
            
          if (error) {
            console.error('Error getting token data:', error);
            // Continue anyway - tokens are optional
          }
          
          // User object from database
          const user: User = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar_url,
            isAdmin: userData.is_admin,
            tokens: tokenData?.balance || 0,
            lastLogin: new Date().toISOString()
          };
          
          setCurrentUser(user);
          setIsAdmin(userData.is_admin || false);
          
          // Also create an activity event for login if none exists
          const newEvent: ActivityEvent = {
            id: uuidv4(),
            type: 'login',
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            content: 'logged in',
            createdAt: new Date().toISOString()
          };
          
          setActivityEvents(prev => [newEvent, ...prev]);
        } else {
          // No session found, use a mock user for demo purposes
          const mockUser = TEST_USERS[0];
          setCurrentUser(mockUser);
        }
      } catch (error) {
        console.error('Error in loadUserSession:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserSession();
  }, []);

  const checkAdmin = useCallback(async (): Promise<boolean> => {
    try {
      // Verify user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }
      
      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (userError || !userData?.is_admin) {
        return false;
      }
      
      return Boolean(userData.is_admin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Get user details from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (userError) throw userError;
        
        // Get user token balance using admin client for token_economy schema
        const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
        const adminClient = getAdminClient();
        const { data: tokenData } = await adminClient
          .schema(tokenEconomySchema)
          .from('tokens')
          .select('balance')
          .eq('user_id', data.user.id)
          .single();
        
        // User object from database
        const user: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar_url,
          isAdmin: userData.is_admin,
          tokens: tokenData?.balance || 0,
          lastLogin: new Date().toISOString()
        };
        
        setCurrentUser(user);
        setIsAdmin(userData.is_admin || false);
        
        // Create an activity event for login
        const newEvent: ActivityEvent = {
          id: uuidv4(),
          type: 'login',
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          content: 'logged in',
          createdAt: new Date().toISOString()
        };
        
        setActivityEvents(prev => [newEvent, ...prev]);
        
        toast.success('Login successful!');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      
      // Check if Supabase URL and key are properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }
      
      console.log('Initiating signup with:', { email, name, redirectTo: window.location.origin });
      
      // Sign up with Supabase Auth
      // Updated to use the root URL as the redirect to properly handle email verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin, // Use root URL for proper hash fragment handling
          data: {
            name: name,
          }
        }
      });
      
      console.log('Signup response:', { data, error, confirmationSent: data?.user?.identities?.[0]?.identity_data });
      
      // If there's no error but email confirmation was needed
      if (data?.user && !error) {
        console.log('User created:', data.user.id);
        console.log('Email confirmation status:', data.user.email_confirmed_at ? 'Confirmed' : 'Not confirmed');
        console.log('Check Supabase dashboard for confirmation emails in development');
        
        // Show toast with more specific information
        if (!data.user.email_confirmed_at) {
          toast.success(
            'Account created! Please check your email for verification link. ' +
            'Note: In development, emails may be viewable in Supabase dashboard instead.'
          );
        }
      }
      
      if (error) throw error;
      
      if (data.user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              name,
              avatar_url: `https://api.dicebear.com/6.x/avataaars/svg?seed=${data.user.id}`,
              is_admin: false,
            }
          ]);
        
        if (profileError) throw profileError;
        
        // Initialize token balance using admin client for token_economy schema
        try {
          console.log('Initializing token balance for new user:', data.user.id);
          const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
          
          // Important: For accessing token_economy schema, we need the service role client
          // As per user memory: "The correct approach for accessing the token_economy schema in Supabase
          // is to use a service role client with appropriate permissions."
          console.log('Getting admin client for token economy access');
          const adminClient = getAdminClient();
          
          if (!adminClient) {
            console.error('Admin client not available - check VITE_SUPABASE_SERVICE_ROLE_KEY in env');
            throw new Error('Cannot initialize token balance: Admin client not available');
          }
          
          // As per user memory: "For querying tables in the token_economy schema in Supabase, 
          // we need to use the .schema('token_economy') method before calling .from()"
          console.log(`Using schema('${tokenEconomySchema}') before from() for token economy operations`);
          
          // Properly access token_economy schema using .schema() method before .from()
          const { data: tokenData, error: tokenError } = await adminClient
            .schema(tokenEconomySchema)
            .from('user_token_balances') // Using the actual table name from tokenEconomy.ts
            .insert([
              {
                user_id: data.user.id,
                balance: 50, // Starting balance
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select();
            
          console.log('Token initialization response:', { data: tokenData, error: tokenError });
          
          if (tokenError) {
            console.error('Error initializing token balance:', tokenError);
            throw tokenError;
          }
          
          console.log('Token balance initialized successfully:', tokenData);
        } catch (tokenInitError) {
          console.error('Failed to initialize token balance:', tokenInitError);
          // Don't block signup completion if token initialization fails
          toast.error('Account created, but initial token balance could not be set.');
        }
        
        // Create user object
        const newUser: User = {
          id: data.user.id,
          name,
          email,
          avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${data.user.id}`,
          isAdmin: false,
          tokens: 50,
          lastLogin: new Date().toISOString()
        };
        
        setCurrentUser(newUser);
        
        // Create an activity event for signup
        const newEvent: ActivityEvent = {
          id: uuidv4(),
          type: 'signup',
          userId: newUser.id,
          userName: newUser.name,
          userAvatar: newUser.avatar,
          content: 'joined the platform',
          createdAt: new Date().toISOString()
        };
        
        setActivityEvents(prev => [newEvent, ...prev]);
        
        toast.success('Account created successfully!');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      
      // More detailed error logging to help troubleshoot
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if ('code' in error) {
          console.error('Error code:', (error as any).code);
        }
      }
      
      // Provide more specific error messages based on the error
      if (error instanceof Error) {
        if (error.message.includes('email')) {
          toast.error('Email verification failed. Please check your email configuration.');
        } else if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please try logging in.');
        } else if (error.message.includes('token')) {
          toast.error('Error initializing token balance. Please try again.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Create an activity event for logout
      if (currentUser) {
        const newEvent: ActivityEvent = {
          id: uuidv4(),
          type: 'logout',
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          content: 'logged out',
          createdAt: new Date().toISOString()
        };
        
        setActivityEvents(prev => [newEvent, ...prev]);
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Reset to demo user
      setCurrentUser(TEST_USERS[0]);
      setIsAdmin(false);
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Function to update user theme
  const updateUserTheme = async (theme: AppTheme) => {
    // Set the new theme in state
    setUserTheme(theme);
    
    try {
      if (currentUser) {
        // Save theme to user settings in public schema
        const { error } = await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: currentUser.id,
            theme: theme,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (error) throw error;
        toast.success('Theme updated successfully');
        
        // Update activity feed
        const activityEvent: ActivityEvent = {
          id: uuidv4(),
          type: 'theme_update',
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          content: 'Updated their theme',
          createdAt: new Date().toISOString()
        };
        
        setActivityEvents(prev => [activityEvent, ...prev]);
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Failed to save theme settings');
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAdmin,
        isLoading,
        showUserSettings,
        setShowUserSettings,
        activityEvents,
        setActivityEvents,
        userTheme,
        updateUserTheme,
        login,
        signup,
        logout,
        checkAdmin
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
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
        
        // Get user token balance
        const { data: tokenData } = await supabase
          .from('token_economy.tokens')
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
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
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
        
        // Initialize token balance
        const { error: tokenError } = await supabase
          .from('token_economy.tokens')
          .insert([
            {
              user_id: data.user.id,
              balance: 50, // Starting balance
            }
          ]);
        
        if (tokenError) throw tokenError;
        
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
      toast.error(error instanceof Error ? error.message : 'Signup failed');
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

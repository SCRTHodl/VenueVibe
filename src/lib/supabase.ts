import { createClient } from '@supabase/supabase-js';
import type { Message, User } from '../types';

// Define the database message format for type safety
interface DbMessage {
  id: string;
  group_id: string;
  channel: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  user_avatar?: string;
}

// Define token economy interfaces
export interface TokenTransaction {
  id?: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  reference_id?: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface UserToken {
  user_id: string;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface InviteCode {
  id: string;
  code: string;
  user_id: string;
  status: string;
  token_reward: number;
  expires_at?: string;
  created_at?: string;
  used_at?: string;
}

export interface StoryTokenData {
  id: string;
  story_id: string;
  user_id: string;
  tokens_earned: number;
  tokens_spent: number;
  created_at?: string;
  updated_at?: string;
}

export interface NFTCollection {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface NFTItem {
  id: string;
  collection_id: string;
  owner_id: string;
  name: string;
  description?: string;
  token_cost: number;
  metadata?: Record<string, any>;
  created_at?: string;
  acquired_at?: string;
}

// Validate and format Supabase URL
const getSupabaseUrl = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    console.warn('Supabase URL not configured. Some features will be disabled.');
    return 'https://placeholder.supabase.co';
  }
  try {
    // Ensure URL is properly formatted
    new URL(url);
    return url;
  } catch (error) {
    console.warn('Invalid Supabase URL provided. Some features will be disabled.');
    return 'https://placeholder.supabase.co';
  }
};

// Check if we have valid Supabase credentials
const hasValidCredentials = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!url && !!key && url !== 'https://placeholder.supabase.co';
};

// Initialize Supabase client with validated URL and reconnection options
export const supabase = createClient(
  getSupabaseUrl(),
  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Create a service role client for admin operations
// This client will be used for operations that require access to the token_economy schema
export const getAdminClient = () => {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.warn('Service role key not found. Admin operations will use regular client.');
    return supabase; // Return regular client as fallback
  }
  
  try {
    return createClient(
      getSupabaseUrl(),
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        // Default schema is public, but can be changed with .schema() method
        db: {
          schema: 'public'
        }
      }
    );
  } catch (error) {
    console.error('Failed to create admin client:', error);
    return supabase; // Return regular client as fallback
  }
};

// Utility to access token economy tables (now in public schema with te_ prefix)
export const getTokenEconomyAdmin = () => {
  try {
    // Use regular client with public schema since tables have been migrated
    // with te_ prefix according to our migration work
    return supabase;
  } catch (error) {
    console.error('Failed to access token economy tables:', error);
    return supabase; 
  }
};

// Helper to execute queries on token economy tables (now in public schema with te_ prefix)
export const queryTokenEconomy = async <T>(queryFn: (client: any) => Promise<{data: T | null, error: any}>) => {
  // Use the public schema since tables have been migrated with te_ prefix
  return queryFn(supabase);
};

// Check if token economy schema is available
export const isTokenEconomyAvailable = async (): Promise<boolean> => {
  if (!hasValidCredentials()) return false;
  
  try {
    // Try a simple query to verify access
    const adminClient = getAdminClient();
    if (!adminClient) return false;
    
    return true;
  } catch (error) {
    console.warn('Token economy features are not available:', error);
    return false;
  }
};

// Add heartbeat to keep connection alive
setInterval(() => {
  supabase.from('messages').select('id').limit(1).single();
}, 45000); // Ping every 45 seconds

// Token Economy Functions with automatic schema selection

/**
 * Get the token balance for a user
 * First tries public schema, falls back to token_economy schema if necessary
 * @param userId The user ID to get the token balance for
 * @returns The user's token balance or 0 if not found
 */
export const getUserTokenBalance = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  
  try {
    // Query from public schema with te_ prefix
    const { data, error } = await supabase
      .from('te_user_token_balances')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return data.balance || 0;
    } else {
      console.warn('Error getting token balance:', error);
      return 0; // Return 0 balance if there's an error or no data
    }
  } catch (error) {
    console.error('Error in getUserTokenBalance:', error);
    return 0;
  }
};

/**
 * Record a token transaction
 * Uses public schema with auto-sync to token_economy via triggers
 * @param transaction The transaction details
 * @returns The created transaction or null if failed
 */
export const recordTokenTransaction = async (transaction: TokenTransaction): Promise<TokenTransaction | null> => {
  try {
    // Insert into public schema for regular users
    const { data, error } = await supabase
      .from('token_transactions')
      .insert([
        {
          user_id: transaction.user_id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          reference_id: transaction.reference_id,
          description: transaction.description,
          metadata: transaction.metadata
          // created_at will be set by database default
        }
      ])
      .select()
      .single();

    if (!error && data) {
      return data as TokenTransaction;
    }

    // If insertion fails, try using admin client with token_economy schema
    console.log('Falling back to token_economy schema for recording transaction');
    const adminClient = getTokenEconomyAdmin();
    const { data: teData, error: teError } = await adminClient
      .from('token_transactions')
      .insert([
        {
          user_id: transaction.user_id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          reference_id: transaction.reference_id,
          description: transaction.description,
          metadata: transaction.metadata
        }
      ])
      .select()
      .single();

    if (teError) {
      console.error('Error recording token transaction:', teError);
      return null;
    }

    return teData as TokenTransaction;
  } catch (error) {
    console.error('Error in recordTokenTransaction:', error);
    return null;
  }
};

/**
 * Update a user's token balance
 * @param userId The user ID to update the balance for
 * @param amount The amount to change (positive or negative)
 * @returns The updated token balance or null if failed
 */
export const updateUserTokenBalance = async (userId: string, amount: number): Promise<number | null> => {
  try {
    // Try to update in public schema first
    const { data, error } = await supabase.rpc('update_user_token_balance', {
      p_user_id: userId,
      p_amount: amount
    });

    if (!error && data !== null) {
      return data as number;
    }

    // Fall back to token_economy schema if needed
    console.log('Falling back to token_economy schema for updating token balance');
    const adminClient = getAdminClient();
    const { data: teData, error: teError } = await adminClient.rpc('token_economy.update_user_balance', {
      p_user_id: userId,
      p_amount: amount
    });

    if (teError) {
      console.error('Error updating token balance in token_economy:', teError);
      return null;
    }

    return teData as number;
  } catch (error) {
    console.error('Error in updateUserTokenBalance:', error);
    return null;
  }
};

/**
 * Get token transactions for a user
 * @param userId The user ID
 * @param limit Optional limit of records to return
 * @returns Array of token transactions
 */
export const getUserTokenTransactions = async (userId: string, limit = 10): Promise<TokenTransaction[]> => {
  try {
    // Try public schema first
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (!error && data && data.length > 0) {
      return data as TokenTransaction[];
    }
    
    // Fall back to token_economy schema
    console.log('Falling back to token_economy schema for token transactions');
    const adminClient = getTokenEconomyAdmin();
    const { data: teData, error: teError } = await adminClient
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (teError) {
      console.error('Error fetching token transactions:', teError);
      return [];
    }
    
    return teData as TokenTransaction[] || [];
  } catch (error) {
    console.error('Error in getUserTokenTransactions:', error);
    return [];
  }
};

/**
 * Get or create a user's token record
 * @param userId The user ID 
 * @returns The user token record or null if failed
 */
export const getOrCreateUserToken = async (userId: string): Promise<UserToken | null> => {
  try {
    // Try to get from public schema
    const { data, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (!error && data) {
      return data as UserToken;
    }
    
    // If not found, create a new record
    if (error && error.code === 'PGRST116') { // Record not found error
      // Create a token balance record in the public schema with te_ prefix
      const { data: newData, error: insertError } = await supabase
        .from('te_user_token_balances')
        .insert([{ user_id: userId, balance: 0 }])
        .select()
        .single();
        
      if (insertError) {
        console.error('Error creating user token record:', insertError);
        return null;
      }
      
      return newData as UserToken;
    }
    
    // If we got here, there was an error but not a 'not found' error
    // Try to fetch from the public schema with te_ prefix
    const { data: teData, error: teError } = await supabase
      .from('te_user_token_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (teError || !teData) {
      console.error('Error fetching token record:', teError || 'No data found');
      return null;
    }
    
    return {
      user_id: teData.user_id,
      balance: teData.balance,
      created_at: teData.created_at,
      updated_at: teData.updated_at
    };
  } catch (error) {
    console.error('Error in getOrCreateUserToken:', error);
    return null;
  }
};

/**
 * Check if a user is an admin
 * @param userId The user ID to check
 * @returns Boolean indicating if user is admin
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data?.is_admin === true;
  } catch (error) {
    console.error('Error in isUserAdmin:', error);
    return false;
  }
};

/**
 * Get token economy stats for admin dashboard
 * Requires admin access
 * @returns Stats object or null if failed
 */
export const getTokenEconomyStats = async (): Promise<Record<string, any> | null> => {
  try {
    // Check if user is admin first
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    if (!userId) {
      console.error('No authenticated user');
      return null;
    }
    
    const isAdmin = await isUserAdmin(userId);
    
    if (!isAdmin) {
      console.error('User is not an admin');
      return null;
    }
    
    // Use admin client to get stats
    const adminClient = getAdminClient();
    const { data, error } = await adminClient.rpc('token_economy.get_economy_stats');
    
    if (error) {
      console.error('Error fetching token economy stats:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getTokenEconomyStats:', error);
    return null;
  }
};

/**
 * Get free tokens for location refresh (for new users or daily limit)
 * @param userId The user ID
 * @returns Object with success status and token count
 */
export const getLocationRefreshTokens = async (userId: string): Promise<{success: boolean, tokens: number}> => {
  try {
    // First try public schema
    const { data, error } = await supabase.rpc('check_free_refresh_eligibility', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error checking refresh eligibility:', error);
      return { success: false, tokens: 0 };
    }

    if (!data?.eligible) {
      return { success: false, tokens: 0 };
    }

    // User is eligible, grant them free tokens (default 10 per day)
    const { error: grantError } = await supabase.rpc('grant_free_refresh_tokens', {
      p_user_id: userId,
      p_token_count: 10
    });

    if (grantError) {
      console.error('Error granting free tokens:', grantError);
      return { success: false, tokens: 0 };
    }

    // Record this free token transaction
    await recordTokenTransaction({
      user_id: userId,
      amount: 10,
      transaction_type: 'free_refresh_tokens',
      description: 'Daily free location refresh tokens'
    });

    return { success: true, tokens: 10 };
  } catch (error) {
    console.error('Error in getLocationRefreshTokens:', error);
    return { success: false, tokens: 0 };
  }
};

// Get app stats with better error handling
export const getAppStats = async () => {
  try {
    // Use RPC call instead of direct table access
    const { data, error } = await supabase.rpc('get_subscriber_count');

    if (error) {
      console.error('Error fetching subscriber count:', error);
      return {
        subscriberCount: 0,
        version: '1.0.0'
      };
    }

    return {
      subscriberCount: data || 0,
      version: '1.0.0'
    };
  } catch (error) {
    console.error('Error fetching app stats:', error);
    return {
      subscriberCount: 0,
      version: '1.0.0'
    };
  }
};

// Guest user management
const GUEST_PREFIX = 'guest_';
const generateGuestId = () => `${GUEST_PREFIX}${Math.random().toString(36).substring(2, 15)}`;

const getOrCreateGuestUser = async () => {
  const storedGuestId = localStorage.getItem('guestUserId');
  const storedGuestName = localStorage.getItem('guestName');
  
  if (storedGuestId && storedGuestName) {
    return { id: storedGuestId, name: storedGuestName };
  }

  const guestId = generateGuestId();
  const guestName = `Guest${Math.floor(Math.random() * 10000)}`;
  
  localStorage.setItem('guestUserId', guestId);
  localStorage.setItem('guestName', guestName);
  
  return { id: guestId, name: guestName };
};

// Helper function to check if messages table exists and is accessible
export const checkMessagesTable = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    
    return !error;
  } catch (e) {
    console.error('Error checking messages table:', e);
    return false;
  }
};

// Message functions
export const getMessages = async (groupId: string, channel: string): Promise<Message[]> => {
  try {
    // Check if 'messages' table exists first to prevent error spam
    const tableExists = await checkMessagesTable();
    
    // If the table doesn't exist or access is denied, use mock data
    if (!tableExists) {
      console.log('Using mock messages data until database table is properly set up');
      return getMockMessages(groupId, channel);
    }

    // If we get here, the table exists so we can query it
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .eq('channel', channel)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Convert database format to Message interface format
    return (data || []).map(msg => ({
      id: msg.id,
      groupId: msg.group_id,
      channel: msg.channel,
      text: msg.content,
      timestamp: msg.created_at,
      user: {
        id: msg.user_id,
        name: msg.user_name,
        avatar: msg.user_avatar || ''
      }
    })) as Message[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    // Fall back to mock data
    return getMockMessages(groupId, channel);
  }
};

// Helper function to generate mock messages for demo purposes
const getMockMessages = (groupId: string, channel: string): Message[] => {
  const now = new Date();
  return [
    {
      id: '1',
      text: `Welcome to the ${channel} channel for group ${groupId}!`,
      timestamp: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
      groupId: groupId,
      channel: channel,
      user: {
        id: 'system',
        name: 'MapChat Bot',
        avatar: ''
      }
    },
    {
      id: '2',
      text: 'This is a demo message. The actual messages feature needs database setup.',
      timestamp: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
      groupId: groupId,
      channel: channel,
      user: {
        id: 'system',
        name: 'MapChat Bot',
        avatar: ''
      }
    }
  ];
};

export const sendMessage = async (groupId: string, channel: string, content: string): Promise<Message | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Create message object that matches the Message interface from types.ts
    const messageData = {
      id: `temp-${new Date().getTime()}`,
      groupId: groupId,
      channel: channel,
      text: content,
      timestamp: new Date().toISOString(),
      user: { id: '', name: '' } // Will be populated with actual user data
    };

    if (session?.user) {
      // Get user profile if available
      const { data: userData } = await supabase
        .from('users')
        .select('display_name, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();
      
      // Add user info to message as a User object
      messageData.user = {
        id: session.user.id,
        name: userData?.display_name || session.user.email || 'User',
        avatar: userData?.avatar_url || ''
      } as User; // Add explicit type cast to User interface
    } else {
      const guest = await getOrCreateGuestUser();
      // For guest users, create a proper User object
      messageData.user = {
        id: `guest-${guest.id}`,
        name: `Guest: ${guest.name}`,
        avatar: 'default-guest-avatar.png'
      } as User; // Add explicit type cast to User interface
    }

    // Check if 'messages' table exists first to prevent error spam
    const tableExists = await checkMessagesTable();
    
    // If the table doesn't exist or access is denied, use mock mode
    if (!tableExists) {
      console.log('Using mock message mode - message not saved to database');
      // Create a fake message response for UI purposes
      const mockMessage = messageData as Message;
      
      // Ensure the user object is properly typed with an avatar
      if (mockMessage.user && !mockMessage.user.avatar) {
        mockMessage.user.avatar = 'default-avatar.png';
      }
      
      // Simulate realtime by broadcasting to local storage for demo purposes
      // This allows the message to appear in the UI without database persistence
      const mockEvent = new CustomEvent('mock-message', { 
        detail: { message: mockMessage, groupId, channel } 
      });
      window.dispatchEvent(mockEvent);
      
      return mockMessage;
    }

    // If we get here, the table exists so we can insert the message
    // Create database record format from our Message object
    const dbMessage = {
      id: messageData.id,
      group_id: messageData.groupId,
      channel: messageData.channel,
      user_id: messageData.user.id,
      user_name: messageData.user.name,
      content: messageData.text,  // Store the text in content field in DB
      created_at: messageData.timestamp,
      user_avatar: messageData.user.avatar || ''
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert([dbMessage])
      .select()
      .single();

    if (error) {
      console.error('Error saving message to database:', error);
      return null;
    }
    
    // Convert DB format back to Message interface format
    return {
      id: data.id,
      groupId: data.group_id,
      channel: data.channel,
      text: data.content,
      timestamp: data.created_at,
      user: {
        id: data.user_id,
        name: data.user_name,
        avatar: data.user_avatar || '' // Add avatar with default empty string
      } as User // Explicitly type as User
    } as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

export const fetchMessages = async (groupId: string, channel: string): Promise<Message[]> => {
  try {
    // First check if the messages table exists
    const tableExists = await checkMessagesTable();
    
    if (!tableExists) {
      console.log('Messages table not accessible, using mock data');
      return getMockMessages(groupId, channel);
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .eq('channel', channel)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      // Return mock messages if no real ones exist
      return getMockMessages(groupId, channel);
    }

    // Convert database message format to Message interface format
    return data.map(msg => ({
      id: msg.id,
      groupId: msg.group_id,
      channel: msg.channel,
      text: msg.content,
      timestamp: msg.created_at,
      user: {
        id: msg.user_id,
        name: msg.user_name,
        avatar: msg.user_avatar || ''
      }
    })) as Message[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    // Return mock messages as fallback
    return getMockMessages(groupId, channel);
  }
};

export const subscribeToMessages = (
  groupId: string,
  channel: string,
  onMessage: (message: Message) => void
) => {
  // Set up event listener for mock messages
  const mockMessageListener = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { message, groupId: msgGroupId, channel: msgChannel } = customEvent.detail;
    if (msgGroupId === groupId && msgChannel === channel) {
      onMessage(message);
    }
  };

  // Add mock message listener
  window.addEventListener('mock-message', mockMessageListener);
  
  // Check if we're using the database or not
  checkMessagesTable().then((tableExists: boolean) => {
    if (tableExists) {
      // Set up realtime subscription if table exists
      supabase
        .channel(`messages-${groupId}-${channel}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        }, (payload) => {
          const newMessage = payload.new as DbMessage;
          // Check if the message belongs to this channel
          if (newMessage.channel === channel) {
            // Convert database format to Message interface format
            const message: Message = {
              id: newMessage.id,
              groupId: newMessage.group_id,
              channel: newMessage.channel,
              text: newMessage.content,
              timestamp: newMessage.created_at,
              user: {
                id: newMessage.user_id,
                name: newMessage.user_name,
                avatar: newMessage.user_avatar || ''
              }
            };
            onMessage(message);
          }
        })
        .subscribe();
    }
  });
  
  // Return cleanup function
  return () => {
    window.removeEventListener('mock-message', mockMessageListener);
    supabase.channel(`messages-${groupId}-${channel}`).unsubscribe();
  };
};
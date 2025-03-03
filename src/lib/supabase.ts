import { createClient } from '@supabase/supabase-js';
import type { Message } from '../types';

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

// Add heartbeat to keep connection alive
setInterval(() => {
  supabase.from('messages').select('id').limit(1).single();
}, 45000); // Ping every 45 seconds

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

// Message functions
export const getMessages = async (groupId: string, channel: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .eq('channel', channel)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const sendMessage = async (groupId: string, channel: string, content: string): Promise<Message | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const messageData: Partial<Message> = {
      group_id: groupId,
      channel,
      content
    };

    if (session?.user) {
      messageData.user_id = session.user.id;
      messageData.username = session.user.email;
    } else {
      const guest = await getOrCreateGuestUser();
      messageData.guest_id = guest.id;
      messageData.guest_name = guest.name;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

export const subscribeToMessages = (
  groupId: string,
  channel: string,
  onMessage: (message: Message) => void
) => {
  const subscription = supabase
    .channel(`messages:${groupId}:${channel}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        const message = payload.new as Message;
        if (message.channel === channel) {
          onMessage(message);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Message } from '../../types';

export const useMessages = (groupId: string, channel: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('messages')
        .select()
        .eq('group_id', groupId)
        .eq('channel', channel)
        .gt('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, channel]);

  useEffect(() => {
    fetchMessages();

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
            setMessages(prev => [message, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [groupId, channel, fetchMessages]);

  const sendMessage = async (content: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const messageData: Partial<Message> = {
        group_id: groupId,
        channel,
        content
      };

      if (session?.user) {
        messageData.user_id = session.user.id;
      } else {
        const guestId = localStorage.getItem('guestId') || `guest_${Date.now()}`;
        const guestName = localStorage.getItem('guestName') || `Guest${Math.floor(Math.random() * 1000)}`;
        
        localStorage.setItem('guestId', guestId);
        localStorage.setItem('guestName', guestName);
        
        messageData.guest_id = guestId;
        messageData.guest_name = guestName;
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refreshMessages: fetchMessages
  };
};
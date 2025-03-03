import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Plus, Smile, Image } from 'lucide-react';
import { ChannelList } from './ChannelList';
import { ChatMessage } from './ChatMessage';
import { ChannelContent } from './ChannelContent';
import { channels } from '../../constants';
import { supabase, sendMessage, getMessages, subscribeToMessages } from '../../lib/supabase';
import type { Group, Message, Channel } from '../../types';

interface ChatPanelProps {
  group: Group;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ group, onClose }) => {
  const [activeChannel, setActiveChannel] = useState<Channel['id']>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const fetchedMessages = await getMessages(group.id, activeChannel);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
    
    // Subscribe to new messages
    const unsubscribe = subscribeToMessages(group.id, activeChannel, (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    return () => {
      unsubscribe();
    };
  }, [group.id, activeChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await sendMessage(group.id, activeChannel, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleChannelSelect = (channelId: Channel['id']) => {
    setActiveChannel(channelId);
  };

  return (
    <div className="flex flex-col h-full bg-[#121826] rounded-t-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a2234] border-b border-gray-700 p-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-blue-900/30 text-gray-200 hover:bg-blue-900/50"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h3 className="font-semibold text-white">{group.name}</h3>
              <p className="text-xs text-gray-400">{group.participants} participants</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Channel Selection */}
      <ChannelList 
        channels={channels} 
        activeChannel={activeChannel}
        onChannelSelect={handleChannelSelect}
      />
      
      <div className="flex-1 overflow-y-auto bg-[#0f1623] p-4">
        {activeChannel === 'general' ? (
          <>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center mb-3">
                  <Send size={24} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No Messages Yet</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  Be the first to start a conversation! Messages expire after 5 minutes.
                </p>
              </div>
            )}
          </>
        ) : (
          <ChannelContent
            channel={activeChannel}
            messages={messages}
            group={group}
            isLoading={isLoading}
          />
        )}
      </div>
      
      {/* Message Input (only show in general channel) */}
      {activeChannel === 'general' && (
        <div className="border-t border-gray-700 p-3 bg-[#1a2234]">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button 
              type="button"
              className="p-2 rounded-full bg-[#121826] text-gray-400 hover:text-blue-400"
            >
              <Plus size={20} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 bg-[#121826] text-white placeholder-gray-400 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button 
              type="button"
              className="p-2 rounded-full bg-[#121826] text-gray-400 hover:text-blue-400"
            >
              <Smile size={20} />
            </button>
            <button 
              type="button"
              className="p-2 rounded-full bg-[#121826] text-gray-400 hover:text-blue-400"
            >
              <Image size={20} />
            </button>
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
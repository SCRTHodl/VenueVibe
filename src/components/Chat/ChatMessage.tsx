import React from 'react';
import { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const displayName = message.guest_name || message.username || 'Anonymous';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex gap-2 sm:gap-3 animate-fade-in">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0 shadow-lg">
        {avatarLetter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-200 truncate">
            {displayName}
          </p>
          <span className="text-xs text-gray-400">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="bg-[#121826] rounded-lg shadow-md p-3 break-words border border-gray-700/50">
          <p className="text-sm text-gray-200 whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
};
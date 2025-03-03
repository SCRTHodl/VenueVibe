import React from 'react';
import * as Icons from 'lucide-react';
import { Channel } from '../../types';

interface ChannelListProps {
  channels: Channel[];
  activeChannel: Channel['id'];
  onChannelSelect: (channelId: Channel['id']) => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannel,
  onChannelSelect
}) => {
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')];
    return Icon ? <Icon size={18} /> : null;
  };

  const mainChannel = channels.find(c => c.id === 'general');
  const otherChannels = channels.filter(c => c.id !== 'general');

  return (
    <div className="px-2 py-1">
      {mainChannel && (
        <button
          key={mainChannel.id}
          onClick={() => onChannelSelect(mainChannel.id)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors mb-1
            ${activeChannel === mainChannel.id 
              ? 'bg-blue-900/50 text-blue-400 border border-blue-800/50' 
              : 'text-gray-300 hover:bg-[#121826]/70'}`}
        >
          <div className={`p-2 rounded-lg ${activeChannel === mainChannel.id 
            ? 'bg-blue-800/30' 
            : 'bg-[#121826]'}`}>
            {getIcon(mainChannel.icon)}
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">{mainChannel.name}</div>
            <div className="text-xs text-gray-400">{mainChannel.description}</div>
          </div>
          {activeChannel === mainChannel.id && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
          )}
        </button>
      )}

      {activeChannel === 'general' ? (
        <div className="flex gap-1 px-4 py-1">
          {otherChannels.map(channel => (
            <button
              key={channel.id}
              onClick={() => onChannelSelect(channel.id)}
              className="p-2 rounded-lg hover:bg-[#121826]/70 transition-colors"
              title={channel.name}
            >
              <div className="text-gray-400">
                {getIcon(channel.icon)}
              </div>
            </button>
          ))}
        </div>
      ) : (
        otherChannels.map(channel => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors mb-1
              ${activeChannel === channel.id 
                ? 'bg-blue-900/50 text-blue-400 border border-blue-800/50' 
                : 'text-gray-300 hover:bg-[#121826]/70'}`}
          >
            <div className={`p-2 rounded-lg ${activeChannel === channel.id 
              ? 'bg-blue-800/30' 
              : 'bg-[#121826]'}`}>
              {getIcon(channel.icon)}
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">{channel.name}</div>
              <div className="text-xs text-gray-400">{channel.description}</div>
            </div>
            {activeChannel === channel.id && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            )}
          </button>
        ))
      )}
    </div>
  );
};
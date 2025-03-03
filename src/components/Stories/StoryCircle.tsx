import React, { useState } from 'react';
import { Group } from '../../types';
import { StoryView } from './StoryView';

interface StoryCircleProps {
  group: Group;
  isPromoting?: boolean;
}

export const StoryCircle: React.FC<StoryCircleProps> = ({ group, isPromoting = false }) => {
  const [isViewingStory, setIsViewingStory] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substr(0, 2)
      .toUpperCase();
  };

  // Create a mock story from group data with proper UUID
  const mockStory = {
    id: crypto.randomUUID(), // Use proper UUID format
    userId: 'group-story',
    userName: group.name,
    userAvatar: getInitials(group.name),
    media: group.photos?.map(url => ({
      type: 'image' as const,
      url
    })) || [],
    caption: group.description,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    viewCount: 0,
    viewedBy: []
  };
  
  return (
    <>
      <div 
        className="flex flex-col items-center snap-start"
        onClick={() => setIsViewingStory(true)}
      >
        <div 
          className={`w-16 h-16 rounded-full flex-shrink-0 p-[2px] ${
            isPromoting ? 'bg-gradient-to-tr from-yellow-500 via-orange-500 to-pink-500' : 'bg-blue-600'
          }`}
        >
          <div className="w-full h-full bg-[#1a2234] rounded-full p-[2px] flex items-center justify-center overflow-hidden">
            {group.photos && group.photos.length > 0 ? (
              <img
                src={group.photos[0]}
                alt={group.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(group.name)}
              </div>
            )}
          </div>
        </div>
        <p className="text-white text-xs mt-1 max-w-16 truncate">
          {group.name.split(' ')[0]}
        </p>
      </div>
      
      {isViewingStory && mockStory.media.length > 0 && (
        <StoryView 
          story={mockStory} 
          onClose={() => setIsViewingStory(false)} 
        />
      )}
    </>
  );
};
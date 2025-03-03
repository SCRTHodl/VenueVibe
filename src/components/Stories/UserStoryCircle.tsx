import React, { useState } from 'react';
import { UserStory } from '../../types';
import { UserStoryView } from './UserStoryView';

interface UserStoryCircleProps {
  story: UserStory;
}

export const UserStoryCircle: React.FC<UserStoryCircleProps> = ({ story }) => {
  const [isViewingStory, setIsViewingStory] = useState(false);
  
  return (
    <>
      <div 
        className="flex flex-col items-center snap-start"
        onClick={() => setIsViewingStory(true)}
      >
        <div 
          className="w-16 h-16 rounded-full flex-shrink-0 p-[2px] bg-gradient-to-tr from-[--color-accent-primary] via-[--color-accent-secondary] to-[--color-accent-primary]"
        >
          <div className="w-full h-full bg-[#1a2234] rounded-full p-[2px] flex items-center justify-center overflow-hidden">
            {story.media && story.media.length > 0 ? (
              <img
                src={story.media[0].url}
                alt="User story"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-semibold text-sm">
                {story.userAvatar}
              </div>
            )}
          </div>
        </div>
        <p className="text-white text-xs mt-1 max-w-16 truncate">
          {story.userName}
        </p>
      </div>
      
      {isViewingStory && (
        <UserStoryView 
          story={story} 
          onClose={() => setIsViewingStory(false)} 
        />
      )}
    </>
  );
};
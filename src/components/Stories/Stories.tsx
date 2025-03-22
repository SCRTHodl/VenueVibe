import React, { useState } from 'react';
import { StoryCircle } from './StoryCircle';
import { StoryModal } from './StoryModal';
import { UserStoryCircle } from './UserStoryCircle';
import type { Group, UserStory } from '../../types';

interface StoriesProps {
  groups: Group[];
  userStories?: UserStory[];
  onCreateStory?: () => void;
}

export const Stories: React.FC<StoriesProps> = ({ 
  groups,
  userStories = [],
  onCreateStory 
}) => {
  const [showStoryModal, setShowStoryModal] = useState(false);

  const handleAddStory = () => {
    if (onCreateStory) {
      onCreateStory();
    } else {
      setShowStoryModal(true);
    }
  };

  // Create a map of unique stories by ID to prevent duplicates
  const uniqueUserStories = userStories.reduce((acc, story) => {
    acc.set(story.id, story);
    return acc;
  }, new Map<string, UserStory>());

  return (
    <div className="p-3 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex gap-4 pb-1">
        {/* Add story button */}
        <div className="flex flex-col items-center space-y-1 min-w-16">
          <button 
            className="w-16 h-16 rounded-full bg-[#0f1623] border-2 border-dashed border-gray-500 flex items-center justify-center"
            onClick={handleAddStory}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-400">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
          <p className="text-xs text-gray-400 whitespace-nowrap">Add story</p>
        </div>

        {/* User's own stories - use unique stories map */}
        {Array.from(uniqueUserStories.values()).map((story) => (
          <UserStoryCircle 
            key={story.id}
            story={story} 
          />
        ))}

        {/* Group stories */}
        {groups.map((group) => (
          <StoryCircle 
            key={`group-${group.id}`}
            group={group} 
            isPromoting={group.isPromoting} 
          />
        ))}
      </div>
      
      {/* Story Modal */}
      {showStoryModal && (
        <StoryModal 
          onClose={() => setShowStoryModal(false)}
          onStoryCreated={(story) => {
            if (onCreateStory) {
              onCreateStory();
            }
            setShowStoryModal(false);
          }}
        />
      )}
    </div>
  );
};
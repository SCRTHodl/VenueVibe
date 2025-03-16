import React from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import type { Group } from '../../types';

interface GroupSelectorProps {
  currentGroup: Group;
  groups: Group[];
  onSelectGroup: (group: Group) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  currentGroup,
  groups,
  onSelectGroup,
  isOpen,
  onToggle
}) => {
  // Filter out the current group from the dropdown options
  const otherGroups = groups.filter(group => group.id !== currentGroup.id);
  
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 bg-[#1a2234] px-3 py-2 rounded-lg text-white w-full"
      >
        <div className="flex-1 text-left flex items-center gap-2">
          <MapPin size={16} className="text-blue-400" />
          <span className="font-medium truncate">{currentGroup.name}</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2234] rounded-lg shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 uppercase px-2 py-1">Other Venues</div>
            {otherGroups.length > 0 ? (
              otherGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => {
                    onSelectGroup(group);
                    onToggle();
                  }}
                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-blue-900/30 text-white w-full text-left"
                >
                  <MapPin size={16} className="text-blue-400" />
                  <div className="flex-1">
                    <div className="font-medium">{group.name}</div>
                    <div className="text-xs text-gray-400">{group.participants} participants</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-sm text-gray-400 px-2 py-2">No other venues available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

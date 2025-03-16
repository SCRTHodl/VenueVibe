import React from 'react';
import { Clock, Users, ArrowRight, MessageCircle, Map } from 'lucide-react';
import { Group } from '../../types';

interface MapPopupProps {
  group: Group;
  onDetails: () => void;
  onViewPosts?: () => void;
}

export const MapPopup: React.FC<MapPopupProps> = ({ group, onDetails, onViewPosts }) => {
  const getStatusColor = () => {
    if (!group.popularTimes) return 'bg-gray-500';
    
    switch (group.popularTimes.now) {
      case 'Very Busy':
        return 'bg-red-500';
      case 'Busy':
        return 'bg-orange-500';
      case 'Steady':
        return 'bg-amber-500';
      default:
        return 'bg-green-500';
    }
  };
  
  return (
    <div className="w-64">
      <h3 className="font-semibold text-white text-base mb-1">{group.name}</h3>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300">
          {group.category}
        </span>
        
        {group.popularTimes && (
          <div className="flex items-center gap-1 text-xs">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span className="text-gray-300">{group.popularTimes.now}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 text-xs text-gray-300 mb-2">
        <div className="flex items-center gap-1">
          <Users size={12} className="text-purple-400" />
          <span>{group.participants} people</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-purple-400" />
          <span>{group.time.replace('Opens ', '')}</span>
        </div>
      </div>
      
      {group.popularTimes && group.popularTimes.waitTime && (
        <div className="text-xs text-gray-400 mb-3">
          Current wait: <span className="text-white font-medium">{group.popularTimes.waitTime}</span>
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetails();
          }}
          className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors"
        >
          <Map size={12} />
          <span>Details</span>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewPosts?.();
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors"
        >
          <MessageCircle size={12} />
          <span>Posts & Chat</span>
        </button>
      </div>
    </div>
  );
};
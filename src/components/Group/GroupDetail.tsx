import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, Star, Users, DollarSign, TrendingUp, TrendingDown, ChevronLeft, MessageSquare } from 'lucide-react';
import { ChatPanel } from '../Chat/ChatPanel';
import { TEST_GROUPS } from '../../constants';
import type { Group, Post } from '../../types';

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
  allGroups?: Group[];
  autoOpenChat?: boolean; // Open chat automatically
  venuePosts?: Post[]; // Posts tagged with this venue
  onClickOutside?: () => void; // Handler for clicking outside
  onPostComment?: (postId: string, comment: string) => Promise<any>; // Handler for posting comments
  onCreatePost?: (content: string, venueId: string) => Promise<any>; // Handler for creating new posts
}

export const GroupDetail: React.FC<GroupDetailProps> = ({ 
  group, 
  onBack, 
  allGroups = TEST_GROUPS, 
  autoOpenChat = false, 
  venuePosts = [],
  onClickOutside,
  onPostComment,
  onCreatePost
}) => {
  const [showChat, setShowChat] = useState(autoOpenChat);
  const detailRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to dismiss the detail panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailRef.current && !detailRef.current.contains(event.target as Node)) {
        onClickOutside && onClickOutside();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClickOutside]);
  
  const getCategoryColor = (category: string) => {
    const colors = {
      italian: 'bg-red-600 text-red-100',
      bar: 'bg-amber-600 text-amber-100',
      gastropub: 'bg-blue-600 text-blue-100',
      'wine-bar': 'bg-purple-600 text-purple-100',
      latin: 'bg-emerald-600 text-emerald-100'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-600 text-gray-200';
  };

  const getPopularityBadge = () => {
    if (!group.popularTimes) return null;
    
    const { now } = group.popularTimes;
    
    let bgColor = '';
    
    if (now === 'Very Busy') {
      bgColor = 'bg-red-600/20 text-red-200';
    } else if (now === 'Busy') {
      bgColor = 'bg-orange-600/20 text-orange-200';
    } else if (now === 'Steady') {
      bgColor = 'bg-amber-600/20 text-amber-200';
    } else {
      bgColor = 'bg-green-600/20 text-green-200';
    }
    
    const TrendIcon = group.popularTimes.trend === 'up' 
      ? TrendingUp 
      : group.popularTimes.trend === 'down' 
        ? TrendingDown
        : ChevronLeft;
    
    return (
      <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${bgColor}`}>
        <TrendIcon size={12} />
        <span>{now}</span>
      </div>
    );
  };
  
  if (showChat) {
    return (
      <ChatPanel 
        group={group} 
        onClose={() => setShowChat(false)} 
        allGroups={allGroups} 
        venuePosts={venuePosts}
        onPostComment={onPostComment}
        onCreatePost={onCreatePost}
      />
    );
  }
  
  return (
    <div ref={detailRef} className="flex flex-col h-full bg-[#121826] overflow-hidden rounded-lg shadow-xl border border-gray-700">
      {/* Header */}
      <div className="bg-[#1a2234] border-b border-gray-700 p-4 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-blue-900/30 text-gray-200 hover:bg-blue-900/50"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-white">{group.name}</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Hero image */}
        {group.photos && group.photos.length > 0 && (
          <div className="aspect-[16/9] relative">
            <img 
              src={group.photos[0]} 
              alt={group.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#121826] to-transparent h-16"></div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 -mt-4 relative">
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(group.category)}`}>
              {group.category}
            </span>
            
            {getPopularityBadge()}
          </div>
          
          <h1 className="text-xl font-bold text-white mt-2">{group.name}</h1>
          
          <div className="flex flex-wrap gap-4 my-3">
            {group.rating && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={16} fill="currentColor" />
                <span className="font-medium">{group.rating.toFixed(1)}</span>
              </div>
            )}
            
            {group.priceRange && (
              <div className="flex items-center gap-1 text-green-400">
                <DollarSign size={16} />
                <span className="font-medium">{group.priceRange}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-blue-400">
              <Users size={16} />
              <span>{group.participants} people</span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-400">
              <Clock size={16} />
              <span>{group.time}</span>
            </div>
          </div>
          
          <p className="text-gray-300 my-4">{group.description}</p>
          
          {/* Wait time info */}
          {group.popularTimes && (
            <div className="bg-[#1a2234] rounded-lg p-3 border border-blue-900/30 mb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium text-white">Current Wait Time</div>
                {getPopularityBadge()}
              </div>
              <div className="text-lg font-bold text-white">{group.popularTimes.waitTime}</div>
              <div className="text-xs text-gray-400 mt-1">
                {group.popularTimes.trend === 'up' ? 'Wait time increasing' : 
                 group.popularTimes.trend === 'down' ? 'Wait time decreasing' : 
                'Wait time stable'}
              </div>
            </div>
          )}
          
          {/* Location info */}
          <div className="bg-[#1a2234] rounded-lg p-3 border border-blue-900/30 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={18} className="text-blue-400" />
              <div className="text-sm font-medium text-white">Location</div>
            </div>
            <div className="aspect-video relative rounded-lg overflow-hidden mb-2">
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+1d4ed8(${group.longitude},${group.latitude})/${group.longitude},${group.latitude},14,0/600x300@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
                alt="Map location"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              Get Directions
            </button>
          </div>
        </div>
      </div>
      
      {/* Venue Posts button */}
      <div className="border-t border-gray-700 p-4">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            setShowChat(true);
          }}
          className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <MessageSquare size={20} />
          View Posts & Comments
        </button>
      </div>
    </div>
  );
};
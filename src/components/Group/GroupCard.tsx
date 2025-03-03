import React from 'react';
import { Map, Users, Star, MapPin, Clock, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import type { Group } from '../../types';

interface GroupCardProps {
  group: Group;
  onSelect: () => void;
  showMapButton?: boolean;
  onMapViewToggle?: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ 
  group, 
  onSelect, 
  showMapButton = false,
  onMapViewToggle
}) => {
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

  const getPopularityBadge = (group: Group) => {
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
        : ChevronRight;
    
    return (
      <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${bgColor}`}>
        <TrendIcon size={12} />
        <span>{now}</span>
      </div>
    );
  };
  
  return (
    <div className="bg-[#121826]/80 rounded-xl border border-blue-900/30 overflow-hidden mb-4 shadow-md">
      <div className="p-3 border-b border-blue-900/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-blue-400" />
          <h3 className="font-medium text-white">Popular Places Near You</h3>
        </div>
        {showMapButton && onMapViewToggle && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onMapViewToggle();
            }}
            className="bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded-lg text-white text-xs flex items-center gap-1.5"
          >
            <Map size={14} />
            Map View
          </button>
        )}
      </div>
      
      <div 
        className="cursor-pointer transition-all duration-200 hover:bg-blue-900/20" 
        onClick={onSelect}
      >
        {/* Venue photo */}
        {group.photos && group.photos.length > 0 && (
          <div className="aspect-[16/9] overflow-hidden">
            <img 
              src={group.photos[0]} 
              alt={group.name} 
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="p-3 space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-white text-base">{group.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(group.category)}`}>
              {group.category}
            </span>
          </div>
          
          <p className="text-sm text-gray-300 line-clamp-2">{group.description}</p>
          
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {group.rating && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={14} fill="currentColor" strokeWidth={0} />
                <span className="font-medium">{group.rating.toFixed(1)}</span>
              </div>
            )}
            
            {group.priceRange && (
              <div className="text-green-400 font-medium">
                {group.priceRange}
              </div>
            )}
            
            <div className="flex items-center gap-1 text-gray-400">
              <Users size={14} />
              <span>{group.participants}</span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-400">
              <Clock size={14} />
              <span>{group.time.replace('Opens ', '')}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            {getPopularityBadge(group)}
            
            <button 
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              onClick={onSelect}
            >
              View Details
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Search, MapPin, Users, Star, Compass, TrendingUp, X } from 'lucide-react';
import type { Group } from '../../types';

interface SearchViewProps {
  groups: Group[];
  onGroupSelect: (group: Group) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ groups, onGroupSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const categories = [
    { id: 'trending', name: 'Trending', icon: <TrendingUp size={16} className="text-red-400" /> },
    { id: 'italian', name: 'Italian', icon: '🍕' },
    { id: 'bar', name: 'Bars', icon: '🍸' },
    { id: 'gastropub', name: 'Gastropubs', icon: '🍔' },
    { id: 'wine-bar', name: 'Wine Bars', icon: '🍷' },
    { id: 'latin', name: 'Latin', icon: '🌮' }
  ];
  
  const filteredGroups = groups.filter(group => {
    if (searchQuery) {
      return group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
             group.category.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    if (activeCategory && activeCategory !== 'trending') {
      return group.category === activeCategory;
    }
    
    return true;
  });
  
  // Sort trending groups by popularity if "trending" selected
  const sortedGroups = activeCategory === 'trending'
    ? [...filteredGroups].sort((a, b) => b.participants - a.participants)
    : filteredGroups;
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121826]">
      {/* Search header */}
      <div className="p-3 sticky top-0 z-10 bg-[#121826] shadow-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places, categories..."
            className="w-full bg-[#1a2234] text-white py-2.5 pl-10 pr-10 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Categories */}
      <div className="px-3 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1.5
                ${activeCategory === category.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#1a2234] text-gray-300 hover:bg-[#242e44]'}`}
            >
              {typeof category.icon === 'string' ? category.icon : category.icon}
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3">
        {searchQuery && filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Search size={40} className="text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No Results Found</h3>
            <p className="text-sm text-gray-400">Try different keywords 
 or try a different category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedGroups.map(group => (
              <div 
                key={group.id}
                onClick={() => onGroupSelect(group)}
                className="bg-[#1a2234] rounded-lg overflow-hidden shadow-md border border-blue-900/30 hover:border-blue-600/50 cursor-pointer transition-all"
              >
                <div className="flex">
                  {/* Group image */}
                  <div className="w-24 h-24 relative">
                    {group.photos && group.photos.length > 0 ? (
                      <img 
                        src={group.photos[0]} 
                        alt={group.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-900/40 flex items-center justify-center">
                        <MapPin size={20} className="text-blue-400" />
                      </div>
                    )}
                    
                    {/* Category badge */}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs rounded bg-black/50 backdrop-blur-sm text-white">
                      {group.category}
                    </div>
                  </div>
                  
                  {/* Group info */}
                  <div className="p-3 flex-1">
                    <h3 className="font-medium text-white mb-1">{group.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-1 mb-2">{group.description}</p>
                    
                    <div className="flex items-center gap-3 text-xs">
                      {group.rating && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star size={12} fill="currentColor" strokeWidth={0} />
                          <span>{group.rating.toFixed(1)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-blue-400">
                        <Users size={12} />
                        <span>{group.participants}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-400">
                        <Compass size={12} />
                        <span>2.3 mi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
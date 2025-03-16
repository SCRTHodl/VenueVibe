import React, { useState } from 'react';
import { Marker } from 'react-map-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Clock, MessageCircle } from 'lucide-react';
import { Group } from '../../types';

// Define a minimal GroupActivity interface locally to avoid import errors
interface GroupActivity {
  id: string;
  level: number;
  surgeCount: number;
}

interface MapMarkerProps {
  group: Group;
  activity: GroupActivity;
  isSelected: boolean;
  onSelect: (group: Group) => void;
  scale?: number;
  onViewPosts?: (group: Group) => void; // Added prop for viewing posts & chat
}

export const MapMarker: React.FC<MapMarkerProps> = ({ 
  group, 
  // activity not used but included in props for type compatibility
  isSelected, 
  onSelect,
  scale = 1,
  onViewPosts
}) => {
  const [showPreview, setShowPreview] = useState(false);
  
  // All group markers now use blue color
  const markerColor = '#3b82f6'; // blue-500
  
  // Calculate size based on participants and scale (used for marker dimensions)
  const markerSize = Math.min(50, 30 + (Math.log(group.participants) * 5)) * scale;
  
  const handleMouseEnter = () => {
    // Only show preview on desktop
    if (window.innerWidth > 768) {
      setShowPreview(true);
    }
  };
  
  const handleMouseLeave = () => {
    setShowPreview(false);
  };
  
  const handleClick = () => {
    onSelect(group);
  };
  
  return (
    <Marker
      latitude={group.latitude}
      longitude={group.longitude}
      onClick={handleClick}
    >
      <motion.div 
        className="relative cursor-pointer"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: isSelected ? 1.1 : 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="marker-container">
          <div 
            className={`marker-pin ${isSelected ? 'selected' : ''}`}
            style={{ 
              color: isSelected ? '#8b5cf6' : markerColor,
              width: `${markerSize}px`,
              height: `${markerSize}px`
            }}
          >
            <MapPin size={32 * scale} className="drop-shadow-lg" />
            
            <div className="absolute top-0 left-0 -mt-1 -ml-1 bg-white/80 backdrop-blur-sm rounded-full shadow-md px-1.5 py-0.5 text-xs font-bold text-gray-900 flex items-center justify-center min-w-[20px]">
              {group.participants}
            </div>
          </div>
        </div>
        
        {/* Hover Preview Card - only show on desktop */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-48 bg-[#121826]/90 backdrop-blur-md rounded-lg shadow-lg border border-blue-900/30 overflow-hidden z-10"
            >
              {group.photos && group.photos.length > 0 && (
                <div className="h-20 overflow-hidden">
                  <img 
                    src={group.photos[0]} 
                    alt={group.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121826]/80" data-component-name="MapMarker"></div>
                </div>
              )}
              
              {/* Quick Chat Access Button - Original size and position with improved functionality */}
              {onViewPosts && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Chat button clicked for venue:', group.name);
                    // Immediately close the popup and go to chat
                    onViewPosts(group);
                    // Prevent any other events from firing
                    e.nativeEvent.stopImmediatePropagation();
                    return false;
                  }}
                  className="absolute top-1 right-1 bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-full flex items-center justify-center shadow-lg z-30"
                >
                  <MessageCircle size={16} />
                </button>
              )}
              
              <div className="p-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-white text-sm">{group.name}</h3>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-900/40 text-blue-200">
                    {group.category}
                  </span>
                </div>
                
                <div className="flex items-center text-xs text-gray-300 gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock size={10} className="text-blue-400" />
                    <span>{group.time.replace('Opens ', '')}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Users size={10} className="text-blue-400" />
                    <span>{group.participants}</span>
                  </div>
                </div>
                
                {group.popularTimes && (
                  <div className="mt-1.5 text-[10px] text-gray-400">
                    {group.popularTimes.waitTime} wait time • {group.popularTimes.now}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Marker>
  );
};
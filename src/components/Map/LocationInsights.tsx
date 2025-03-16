import React, { useState, useEffect } from 'react';
import { Map, TrendingUp, MapPin, Calendar, Compass, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocationInsights as LocationInsightsType } from '../../lib/ai/locationContent';

interface LocationInsightsProps {
  locationName: string;
  insights: LocationInsightsType | null;
  isLoading: boolean;
  onClose: () => void;
  onSearchLocation: (query: string) => void;
}

export const LocationInsights: React.FC<LocationInsightsProps> = ({
  locationName,
  insights,
  isLoading,
  onClose,
  onSearchLocation
}) => {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset expanded state when location changes
  useEffect(() => {
    setExpanded(false);
  }, [locationName]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchLocation(searchQuery);
    }
  };

  return (
    <motion.div 
      className="absolute bottom-0 left-0 right-0 bg-[#121826] text-white rounded-t-2xl p-4 shadow-lg z-10"
      initial={{ y: expanded ? 500 : 350 }}
      animate={{ y: expanded ? 0 : 350 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Map size={20} className="text-[--color-accent-primary]" />
          <h3 className="text-lg font-bold">Location Insights</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="py-2 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-[10px] text-gray-400" />
            <input
              type="text"
              placeholder="Search another location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <button 
            type="submit"
            className="bg-[--color-accent-primary] hover:bg-opacity-90 py-2 px-4 rounded-lg text-sm font-medium"
          >
            Go
          </button>
        </form>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="rounded-xl bg-gray-800 p-4">
              <h4 className="font-medium text-lg">{locationName}</h4>
              {isLoading ? (
                <div className="h-16 flex items-center justify-center">
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-2 bg-gray-700 rounded"></div>
                      <div className="h-2 bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ) : insights ? (
                <p className="text-gray-300 mt-1">{insights.summary}</p>
              ) : (
                <p className="text-gray-300 mt-1">No insights available for this location yet.</p>
              )}
            </div>

            {insights && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-[--color-accent-primary]" />
                      <h4 className="font-medium">Trending Topics</h4>
                    </div>
                    {insights.trendingTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {insights.trendingTopics.map((topic, index) => (
                          <span 
                            key={index}
                            className="text-sm bg-gray-700 text-white px-2 py-1 rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No trending topics yet</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-gray-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-[--color-accent-primary]" />
                      <h4 className="font-medium">Popular Venues</h4>
                    </div>
                    {insights.recommendations.venues.length > 0 ? (
                      <ul className="text-sm space-y-1 mt-2">
                        {insights.recommendations.venues.map((venue, index) => (
                          <li key={index} className="text-gray-300">{venue}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">No popular venues yet</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-[--color-accent-primary]" />
                      <h4 className="font-medium">Events</h4>
                    </div>
                    {insights.recommendations.events.length > 0 ? (
                      <ul className="text-sm space-y-1 mt-2">
                        {insights.recommendations.events.map((event, index) => (
                          <li key={index} className="text-gray-300">{event}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">No events found</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-gray-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Compass size={16} className="text-[--color-accent-primary]" />
                      <h4 className="font-medium">Activities</h4>
                    </div>
                    {insights.recommendations.activities.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {insights.recommendations.activities.map((activity, index) => (
                          <span 
                            key={index}
                            className="text-sm bg-gray-700 text-white px-2 py-1 rounded"
                          >
                            {activity}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No activities found</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-gray-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Map size={16} className="text-[--color-accent-primary]" />
                    <h4 className="font-medium">Highlights</h4>
                  </div>
                  {insights.highlights.length > 0 ? (
                    <ul className="space-y-1 mt-2">
                      {insights.highlights.map((highlight, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-[--color-accent-primary] mt-1.5"></span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">No highlights available</p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && (
        <div className="h-12 flex items-center justify-center">
          <div 
            className="w-16 h-1 bg-gray-600 rounded-full cursor-pointer"
            onClick={() => setExpanded(true)}
          ></div>
        </div>
      )}
    </motion.div>
  );
};

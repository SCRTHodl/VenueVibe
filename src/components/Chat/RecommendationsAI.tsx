import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Clock, Star, DollarSign, Users, ArrowRight } from 'lucide-react';
import type { Group } from '../../types';
import { TEST_GROUPS } from '../../constants';

interface RecommendationsAIProps {
  group: Group;
}

export const RecommendationsAI: React.FC<RecommendationsAIProps> = ({ group }) => {
  const [recommendations, setRecommendations] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPreference, setUserPreference] = useState('');

  // Simulate loading recommendations
  useEffect(() => {
    const timer = setTimeout(() => {
      // Filter groups to exclude the current one and sort by rating
      const similarVenues = TEST_GROUPS
        .filter(venue => venue.id !== group.id)
        .sort((a, b) => {
          // Prioritize same category
          if (a.category === group.category && b.category !== group.category) return -1;
          if (a.category !== group.category && b.category === group.category) return 1;
          
          // Then by rating if available
          if (a.rating && b.rating) return b.rating - a.rating;
          return 0;
        })
        .slice(0, 3);
      
      setRecommendations(similarVenues);
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [group.id, group.category]);

  const handlePreferenceChange = (preference: string) => {
    setUserPreference(preference);
    setIsLoading(true);
    
    // Simulate filtering based on preference
    setTimeout(() => {
      let filteredVenues = TEST_GROUPS.filter(venue => venue.id !== group.id);
      
      if (preference === 'nearby') {
        // Sort by proximity (simulated)
        filteredVenues = filteredVenues.sort(() => Math.random() - 0.5);
      } else if (preference === 'popular') {
        // Sort by number of participants
        filteredVenues = filteredVenues.sort((a, b) => b.participants - a.participants);
      } else if (preference === 'similar') {
        // Sort by same category first
        filteredVenues = filteredVenues.sort((a, b) => {
          if (a.category === group.category && b.category !== group.category) return -1;
          if (a.category !== group.category && b.category === group.category) return 1;
          return 0;
        });
      }
      
      setRecommendations(filteredVenues.slice(0, 3));
      setIsLoading(false);
    }, 800);
  };

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

  return (
    <div className="space-y-4">
      <div className="bg-blue-900/30 rounded-xl p-4 shadow-sm border border-blue-900/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-full bg-blue-500/20">
            <Bot size={20} className="text-blue-400" />
          </div>
          <h3 className="font-semibold text-white">AI Recommendations</h3>
        </div>
        
        <p className="text-sm text-gray-300 mb-4">
          Based on your interest in <span className="text-white font-medium">{group.name}</span>, 
          here are some places you might enjoy:
        </p>
        
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => handlePreferenceChange('nearby')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              userPreference === 'nearby' 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#121826] text-gray-300 hover:bg-blue-900/30'
            }`}
          >
            Nearby
          </button>
          <button 
            onClick={() => handlePreferenceChange('popular')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              userPreference === 'popular' 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#121826] text-gray-300 hover:bg-blue-900/30'
            }`}
          >
            Most Popular
          </button>
          <button 
            onClick={() => handlePreferenceChange('similar')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              userPreference === 'similar' 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#121826] text-gray-300 hover:bg-blue-900/30'
            }`}
          >
            Similar Vibe
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((venue) => (
              <div 
                key={venue.id} 
                className="p-3 bg-[#121826] rounded-lg border border-blue-900/20 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {venue.photos && venue.photos.length > 0 ? (
                    <img 
                      src={venue.photos[0]} 
                      alt={venue.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Sparkles size={24} className="text-blue-500" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-white text-sm">{venue.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(venue.category)}`}>
                        {venue.category}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1 mb-2">
                      {venue.description}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs">
                      {venue.rating && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star size={12} fill="currentColor" />
                          <span>{venue.rating.toFixed(1)}</span>
                        </div>
                      )}
                      
                      {venue.priceRange && (
                        <span className="text-green-400">{venue.priceRange}</span>
                      )}
                      
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users size={12} />
                        <span>{venue.participants}</span>
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
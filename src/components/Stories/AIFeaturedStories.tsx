import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { UserStory } from '../../types';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { updateContentMetrics } from '../../lib/ai/contentMetrics';

interface AIFeaturedStoriesProps {
  onSelectStory?: (story: UserStory) => void;
  className?: string;
}

export const AIFeaturedStories: React.FC<AIFeaturedStoriesProps> = ({ 
  onSelectStory,
  className = '' 
}) => {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturedStories = async () => {
      setLoading(true);
      try {
        // First check if we can get featured stories with proper sorting
        // Using a try-catch approach to handle potential schema differences
        try {
          // Try to get AI-featured stories with priority sorting
          const { data: priorityData, error: priorityError } = await supabase
            .from('featured_content')
            .select(`
              id,
              content_id,
              priority,
              ai_generated,
              ai_insights,
              metadata,
              stories:content_id(*)
            `)
            .eq('content_type', 'stories')
            .eq('active', true)
            .order('priority', { ascending: false })
            .limit(6);
            
          // If successful, use this data
          if (!priorityError && priorityData) {
            // Process and return the data with priority
            handleFeaturedData(priorityData);
            return;
          }
        } catch (priorityError) {
          console.log('Priority field not available, using fallback query');
        }
        
        // Fallback: Get featured stories without priority sorting
        const { data, error } = await supabase
          .from('featured_content')
          .select(`
            id,
            content_id,
            ai_generated,
            ai_insights,
            metadata,
            stories:content_id(*)
          `)
          .eq('content_type', 'stories')
          .eq('active', true)
          .limit(6);
          
        if (error) throw error;
        
        // Process data if available
        if (data?.length) {
          handleFeaturedData(data);
        }
    };
    
    // Process featured content data into story format
    const handleFeaturedData = (data: any[]) => {
      if (!data?.length) return;
      
      try {
        // Extract story data and add featured info
        const featuredStories = data
          .filter(item => item.stories) // Filter out any invalid relations
          .map(item => ({
            ...item.stories,
            featuredId: item.id,
            aiInsights: item.ai_insights,
            aiGenerated: item.ai_generated
          }));
          
        setStories(featuredStories);
        
        // Update impression metrics for these stories
        for (const story of featuredStories) {
          updateContentMetrics(story.id, 'stories', 'impression');
        }
      } catch (err) {
        console.error('Error processing featured stories data:', err);
        setError('Failed to process featured stories');
      }
      } catch (err) {
        console.error('Error loading featured stories:', err);
        setError('Failed to load featured stories');
      } finally {
        setLoading(false);
      }
    };
    
    loadFeaturedStories();
  }, []);
  
  const handleStoryClick = (story: UserStory) => {
    // Update click metrics
    updateContentMetrics(story.id, 'stories', 'click');
    
    // Pass to parent handler if provided
    if (onSelectStory) {
      onSelectStory(story);
    }
  };
  
  if (loading) {
    return (
      <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="text-purple-500" size={18} />
          <h3 className="text-lg font-medium">AI-Curated Stories</h3>
        </div>
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-purple-500" size={24} />
        </div>
      </div>
    );
  }
  
  if (error || stories.length === 0) {
    return null; // Don't show anything if there's an error or no featured stories
  }
  
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-purple-500" size={18} />
          <h3 className="text-lg font-medium">AI-Curated Stories</h3>
        </div>
        <button className="text-sm text-purple-600 flex items-center">
          View all <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stories.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.02 }}
            className="relative rounded-lg overflow-hidden cursor-pointer bg-gray-100 aspect-[4/3]"
            onClick={() => handleStoryClick(story)}
          >
            {story.thumbnail_url ? (
              <img 
                src={story.thumbnail_url} 
                alt={story.title || 'Story thumbnail'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <span className="text-purple-500 text-sm">{story.title || 'No preview'}</span>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-3">
              <h4 className="text-white font-semibold text-sm line-clamp-2">
                {story.title || 'Untitled Story'}
              </h4>
              
              {story.aiGenerated && (
                <div className="mt-1 flex items-center">
                  <Sparkles className="text-purple-300 mr-1" size={12} />
                  <span className="text-purple-300 text-xs">AI Recommended</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

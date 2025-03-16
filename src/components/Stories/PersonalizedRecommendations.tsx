import React, { useState, useEffect } from 'react';
import { UserStory } from '../../types';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Heart, MessagesSquare, BarChart3 } from 'lucide-react';
import { updateContentMetrics } from '../../lib/ai/contentMetrics';

interface PersonalizedRecommendationsProps {
  onSelectStory?: (story: UserStory) => void;
  className?: string;
  userId?: string;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  onSelectStory,
  className = '',
  userId
}) => {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonalizedRecommendations = async () => {
      setLoading(true);
      
      try {
        // Get user data to personalize recommendations
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user && !userId) {
          throw new Error("User not authenticated");
        }
        
        const activeUserId = userId || user?.id;
        
        // Get user interaction data to power recommendations
        const { data: interactionData, error: interactionError } = await supabase
          .from('user_content_interactions')
          .select('content_id, interaction_type, count')
          .eq('user_id', activeUserId)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (interactionError) {
          console.error("Error fetching user interaction data:", interactionError);
        }
        
        // Extract content IDs the user has interacted with
        const interactedContentIds = interactionData
          ? interactionData.map(item => item.content_id)
          : [];
          
        // Get personalized content recommendations
        // prioritizing AI-featured content that matches user interests
        const { data: recommendedContent, error: recommendationError } = await supabase
          .from('ai_recommended_content')
          .select(`
            featured_id,
            content_id,
            content_type,
            content_name,
            performance_score,
            metadata
          `)
          .eq('content_type', 'stories')
          .eq('active', true)
          .order('performance_score', { ascending: false })
          .limit(6);
          
        if (recommendationError) {
          throw recommendationError;
        }
        
        if (!recommendedContent || recommendedContent.length === 0) {
          // Fall back to featured content if no personalized recommendations
          const { data: featuredContent, error: featuredError } = await supabase
            .from('featured_content')
            .select(`
              id,
              content_id,
              content_type,
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
            
          if (featuredError) {
            throw featuredError;
          }
          
          if (featuredContent?.length) {
            // Transform featured content to story format
            const featuredStories = featuredContent
              .filter(item => item.stories)
              .map(item => ({
                ...item.stories,
                featuredId: item.id,
                aiGenerated: item.ai_generated,
                aiInsights: item.ai_insights,
                isPersonalized: false
              }));
              
            setStories(featuredStories);
            
            // Record impressions for analytics
            for (const story of featuredStories) {
              updateContentMetrics(story.id, 'stories', 'impression');
            }
          }
        } else {
          // Fetch the full story data for each recommended content
          const storyIds = recommendedContent.map(item => item.content_id);
          
          const { data: storyData, error: storyError } = await supabase
            .from('stories')
            .select('*')
            .in('id', storyIds);
            
          if (storyError) {
            throw storyError;
          }
          
          if (storyData) {
            // Map the full story data with recommendation data
            const personalizedStories = storyData.map(story => {
              const recommendation = recommendedContent.find(r => r.content_id === story.id);
              return {
                ...story,
                featuredId: recommendation?.featured_id,
                isPersonalized: true,
                performanceScore: recommendation?.performance_score || 0
              };
            });
            
            // Sort by performance score
            personalizedStories.sort((a, b) => 
              (b.performanceScore || 0) - (a.performanceScore || 0)
            );
            
            setStories(personalizedStories);
            
            // Record impressions for analytics
            for (const story of personalizedStories) {
              updateContentMetrics(story.id, 'stories', 'impression');
            }
          }
        }
      } catch (err) {
        console.error('Error loading personalized recommendations:', err);
        setError('Failed to load personalized recommendations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPersonalizedRecommendations();
  }, [userId]);
  
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
          <h3 className="text-lg font-medium">Recommended For You</h3>
        </div>
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-purple-500" size={24} />
        </div>
      </div>
    );
  }
  
  if (error || stories.length === 0) {
    return null; // Don't show anything if there's an error or no stories
  }

  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="text-purple-500" size={18} />
        <h3 className="text-lg font-medium">Recommended For You</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {stories.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer rounded-lg overflow-hidden shadow-md relative"
            onClick={() => handleStoryClick(story)}
          >
            {/* Thumbnail */}
            <div className="aspect-video relative">
              {story.thumbnail_url ? (
                <img 
                  src={story.thumbnail_url} 
                  alt={story.title || 'Story thumbnail'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-300 flex items-center justify-center">
                  <span className="text-purple-700">{story.title?.substring(0, 1) || '?'}</span>
                </div>
              )}
              
              {/* AI Recommendation Badge */}
              {story.isPersonalized && (
                <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                  <Sparkles size={12} className="mr-1" />
                  For You
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="p-3 bg-white">
              <h4 className="font-medium text-gray-900 line-clamp-2">
                {story.title || 'Untitled Story'}
              </h4>
              
              {story.description && (
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {story.description}
                </p>
              )}
              
              {/* Engagement Stats */}
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                <div className="flex items-center">
                  <Heart size={14} className="mr-1" />
                  {story.likes || 0}
                </div>
                <div className="flex items-center">
                  <MessagesSquare size={14} className="mr-1" />
                  {story.comments || 0}
                </div>
                <div className="flex items-center">
                  <BarChart3 size={14} className="mr-1" />
                  {story.views || 0}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

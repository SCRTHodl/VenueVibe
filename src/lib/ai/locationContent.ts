import { AgentMemory, MemoryContextType } from '../agent/types';
import { getAgentCoordinator } from '../agent/agentCoordinator';
import { supabase } from '../supabase';

// Interface for location-based content
export interface LocationBasedContent {
  id: string;
  type: 'post' | 'story';
  content: string;
  media?: string[];
  locationName: string;
  latitude: number;
  longitude: number;
  category?: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  popularity: number; // 1-10 scale based on likes, comments, etc.
  distance?: number; // distance from user's location in miles
}

// Interface for AI location-based insights
export interface LocationInsights {
  highlights: string[]; // Key insights about the area
  trendingTopics: string[]; // Popular topics in the area
  recommendations: {
    venues: string[];
    events: string[];
    activities: string[];
  };
  summary: string; // Summary of the area based on content
}

// Distance calculation using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Gets location-based content within a certain radius
 */
export const getLocationBasedContent = async (
  latitude: number,
  longitude: number,
  radius: number = 25, // miles
  limit: number = 50,
  contentTypes: ('post' | 'story')[] = ['post', 'story']
): Promise<LocationBasedContent[]> => {
  try {
    // For demo purposes, we'll simulate this data from Supabase
    // In production, this would query your database with geo queries
    
    // Get posts within radius
    const combinedResults: LocationBasedContent[] = [];
    
    // Get posts and venues separately, then join them in memory
    if (contentTypes.includes('post')) {
      // First, get all venue data
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select(`
          id,
          name,
          latitude,
          longitude,
          category
        `);
      
      if (venuesError) {
        console.error('Error fetching venues:', venuesError);
      }
      
      // Then get posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_urls,
          venue_id,
          user:profiles(user_name, avatar_url),
          created_at,
          likes,
          comments
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (postsError) throw postsError;
      
      if (posts && venues) {
        // Join posts with venues based on venue_id
        const filteredPosts = posts
          .map(post => {
            // Find the matching venue for this post
            const venue = venues.find(v => v.id === post.venue_id);
            
            // Only include posts with valid venue data
            if (!venue || !venue.latitude || !venue.longitude) return null;
            
            // Calculate distance from current location to the venue
            const distance = calculateDistance(
              latitude,
              longitude,
              venue.latitude,
              venue.longitude
            );
            
            // Only include posts within the specified radius
            if (distance > radius) return null;
            
            // Return the post with venue data attached
            return {
              ...post,
              venue,
              distance
            };
          })
          .filter((post): post is NonNullable<typeof post> => post !== null)
          .map(post => {
            // Distance was already calculated in previous step
            // Calculate popularity score (1-10) based on likes and comments
            const likesWeight = 0.7;
            const commentsWeight = 0.3;
            const rawScore = 
              (post.likes || 0) * likesWeight + 
              (post.comments?.length || 0) * commentsWeight;
            const popularity = Math.min(10, Math.max(1, Math.ceil(rawScore / 10)));
            
            return {
              id: post.id,
              type: 'post' as const,
              content: post.content,
              media: post.media_urls,
              locationName: post.venue?.name || 'Unknown Location',
              latitude: post.venue.latitude,
              longitude: post.venue.longitude,
              category: post.venue?.category,
              userName: post.user?.user_name || 'Anonymous',
              userAvatar: post.user?.avatar_url,
              createdAt: post.created_at,
              popularity,
              distance
            };
          });
          
        combinedResults.push(...filteredPosts);
      }
    }
    
    // Get stories
    if (contentTypes.includes('story')) {
      // First get locations data if not already fetched
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          latitude,
          longitude,
          category
        `);
      
      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
      }
      
      // Then get stories
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id,
          caption,
          media,
          location_id,
          user:profiles(user_name, avatar_url),
          created_at,
          view_count,
          reaction_count
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (storiesError) throw storiesError;
      
      if (stories && locations) {
        // Join stories with locations based on location_id
        const filteredStories = stories
          .map(story => {
            // Find the matching location for this story
            const location = locations.find(l => l.id === story.location_id);
            
            // Only include stories with valid location data
            if (!location || !location.latitude || !location.longitude) return null;
            
            // Calculate distance from current location
            const distance = calculateDistance(
              latitude,
              longitude,
              location.latitude,
              location.longitude
            );
            
            // Only include stories within the specified radius
            if (distance > radius) return null;
            
            // Return the story with location data attached
            return {
              ...story,
              location_data: location,
              distance
            };
          })
          .filter((story): story is NonNullable<typeof story> => story !== null)
          .map(story => {
            // Distance was already calculated in previous step
            
            // Calculate popularity score (1-10) based on views and reactions
            const viewWeight = 0.3;
            const reactionWeight = 0.7;
            const rawScore = 
              (story.view_count || 0) * viewWeight + 
              (story.reaction_count || 0) * reactionWeight;
            const popularity = Math.min(10, Math.max(1, Math.ceil(rawScore / 50)));
            
            return {
              id: story.id,
              type: 'story' as const,
              content: story.caption || '',
              media: story.media?.map((m: any) => m.url),
              locationName: story.location_data?.name || story.location || 'Unknown Location',
              latitude: story.location_data.latitude,
              longitude: story.location_data.longitude,
              category: story.location_data?.category,
              userName: story.user?.user_name || 'Anonymous',
              userAvatar: story.user?.avatar_url,
              createdAt: story.created_at,
              popularity,
              distance
            };
          });
          
        combinedResults.push(...filteredStories);
      }
    }
    
    // Sort by distance
    return combinedResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } catch (error) {
    console.error('Error fetching location-based content:', error);
    return [];
  }
};

/**
 * Saves location exploration as a memory for the agent
 */
export const saveLocationExploration = async (
  userId: string,
  latitude: number,
  longitude: number,
  locationName: string,
  insights: LocationInsights
): Promise<void> => {
  try {
    const agentCoordinator = getAgentCoordinator();
    
    if (!agentCoordinator) {
      console.error('Agent coordinator not initialized');
      return;
    }
    
    // Create memory of the location exploration
    await agentCoordinator.memoryManager.createMemory({
      userId,
      contextType: 'environment' as MemoryContextType,
      content: {
        text: `Explored location: ${locationName}`,
        metadata: {
          latitude,
          longitude,
          locationName,
          insights,
          exploredAt: new Date().toISOString()
        }
      },
      importance: 6, // Medium-high importance for location context
    });
  } catch (error) {
    console.error('Error saving location exploration to memory:', error);
  }
};

/**
 * Generates AI insights about a location based on content
 */
export const generateLocationInsights = async (
  locationContent: LocationBasedContent[],
  locationName: string
): Promise<LocationInsights> => {
  try {
    if (locationContent.length === 0) {
      return {
        highlights: ['No recent content in this area'],
        trendingTopics: [],
        recommendations: {
          venues: [],
          events: [],
          activities: []
        },
        summary: `There isn't much activity in ${locationName} on SottoCity yet. Be the first to share your experiences!`
      };
    }
    
    // Analyze location content
    const contentText = locationContent
      .map(item => item.content)
      .join(' ');
      
    const categories = locationContent
      .map(item => item.category)
      .filter(Boolean) as string[];
      
    const uniqueCategories = [...new Set(categories)];
    
    const locationNames = locationContent
      .map(item => item.locationName)
      .filter(Boolean) as string[];
      
    const uniqueLocations = [...new Set(locationNames)];
    
    // In a real implementation, you would use an AI model to analyze the content
    // Here, we'll simulate the AI analysis with some basic NLP techniques
    
    // Extract popular topics
    const topicKeywords = [
      'food', 'music', 'art', 'nightlife', 'cocktails', 'beer', 'wine',
      'coffee', 'brunch', 'dinner', 'lunch', 'shopping', 'festival',
      'concert', 'exhibition', 'party', 'happy hour', 'special', 'event'
    ];
    
    const topics: Record<string, number> = {};
    topicKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = contentText.match(regex);
      if (matches) topics[keyword] = matches.length;
    });
    
    const sortedTopics = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic)
      .slice(0, 5);
    
    // Generate popular venues based on frequency
    const venueCounts: Record<string, number> = {};
    locationContent.forEach(item => {
      if (venueCounts[item.locationName]) {
        venueCounts[item.locationName] += 1;
      } else {
        venueCounts[item.locationName] = 1;
      }
    });
    
    const popularVenues = Object.entries(venueCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([venue]) => venue)
      .slice(0, 5);
    
    // Generate recommendations
    const categoryBasedVenues = uniqueCategories
      .slice(0, 3)
      .map(category => {
        const venuesInCategory = locationContent
          .filter(item => item.category === category)
          .map(item => item.locationName);
          
        return [...new Set(venuesInCategory)][0];
      })
      .filter(Boolean);
    
    // Return structured insights
    return {
      highlights: [
        `${uniqueLocations.length} locations with recent activity`,
        `Most popular venue: ${popularVenues[0] || 'N/A'}`,
        `Most discussed topic: ${sortedTopics[0] || 'N/A'}`
      ],
      trendingTopics: sortedTopics,
      recommendations: {
        venues: popularVenues,
        events: locationContent
          .filter(item => item.content.toLowerCase().includes('event') || 
                          item.content.toLowerCase().includes('tonight') ||
                          item.content.toLowerCase().includes('tomorrow'))
          .map(item => item.locationName)
          .slice(0, 3),
        activities: uniqueCategories
      },
      summary: generateAreaSummary(locationName, uniqueCategories, sortedTopics, popularVenues)
    };
  } catch (error) {
    console.error('Error generating location insights:', error);
    return {
      highlights: [],
      trendingTopics: [],
      recommendations: {
        venues: [],
        events: [],
        activities: []
      },
      summary: `Unable to generate insights for ${locationName}`
    };
  }
};

/**
 * Generates a natural language summary of an area
 */
const generateAreaSummary = (
  locationName: string,
  categories: string[],
  topics: string[],
  venues: string[]
): string => {
  const categoriesText = categories.length > 0
    ? `known for ${categories.slice(0, 3).join(', ')}`
    : 'with diverse offerings';
    
  const topicsText = topics.length > 0
    ? `People are talking about ${topics.slice(0, 3).join(', ')}.`
    : '';
    
  const venuesText = venues.length > 0
    ? `Popular spots include ${venues.slice(0, 3).join(', ')}.`
    : '';
    
  return `${locationName} is an area ${categoriesText}. ${topicsText} ${venuesText} Explore the map to discover more!`;
};

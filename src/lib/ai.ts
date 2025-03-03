import { supabase } from './supabase';

// Content moderation types
interface ModerationResult {
  status: 'approved' | 'pending' | 'rejected';
  score: number;
  categories: {
    spam: number;
    offensive: number;
    adult: number;
    violence: number;
  };
}

// Check content moderation
export const checkContentModeration = async (
  contentType: 'story' | 'post' | 'comment',
  text: string,
  mediaUrl?: string
): Promise<ModerationResult> => {
  try {
    // First check if there are any active AI instructions
    const { data: aiInstructions } = await supabase
      .from('ai_instructions')
      .select('content_filters')
      .single();

    // If AI instructions exist, use their content filters
    if (aiInstructions?.content_filters?.[contentType]) {
      const filters = aiInstructions.content_filters[contentType];
      
      // Check against filters
      const textLower = text.toLowerCase();
      const hasProhibitedKeywords = filters.keywords.some(
        keyword => textLower.includes(keyword.toLowerCase())
      );

      if (hasProhibitedKeywords) {
        return {
          status: 'rejected',
          score: 0.9,
          categories: {
            spam: 0.1,
            offensive: 0.9,
            adult: 0.1,
            violence: 0.1
          }
        };
      }
    }

    // Call the moderation RPC function
    const { data, error } = await supabase.rpc('check_content_moderation', {
      p_content_type: contentType,
      p_content_text: text || '',
      p_content_media_url: mediaUrl
    });

    if (error) throw error;

    return data as ModerationResult;
  } catch (error) {
    console.error('Error checking content moderation:', error);
    // Return default "pending" result on error for manual review
    return {
      status: 'pending',
      score: 0.5,
      categories: {
        spam: 0,
        offensive: 0,
        adult: 0,
        violence: 0
      }
    };
  }
};

// Create a new post with moderation
export const createPost = async (
  content: string,
  mediaUrls: string[],
  venueId: string,
  tags: string[] = []
): Promise<{ success: boolean; error?: string; postId?: string }> => {
  try {
    // Check content moderation first
    const moderationResult = await checkContentModeration('post', content, mediaUrls[0]);

    if (moderationResult.status === 'rejected') {
      return {
        success: false,
        error: 'Content violates community guidelines'
      };
    }

    // Create the post
    const { data, error } = await supabase
      .from('posts')
      .insert({
        content,
        media_urls: mediaUrls,
        venue_id: venueId,
        tags,
        moderation_status: moderationResult.status,
        moderation_score: moderationResult.score
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      postId: data.id
    };
  } catch (error) {
    console.error('Error creating post:', error);
    return {
      success: false,
      error: 'Failed to create post'
    };
  }
};

// Create a new story with moderation
export const createStory = async (
  media: { type: 'image' | 'video'; url: string }[],
  caption?: string,
  location?: string,
  music?: string,
  stickers?: { id: string; emoji: string; x: number; y: number }[],
  filter?: string
): Promise<{ success: boolean; error?: string; storyId?: string }> => {
  try {
    // Check content moderation first
    const moderationResult = await checkContentModeration('story', caption || '', media[0].url);

    if (moderationResult.status === 'rejected') {
      return {
        success: false,
        error: 'Content violates community guidelines'
      };
    }

    // Create the story using the RPC function
    const { data, error } = await supabase.rpc('submit_story', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_media: media,
      p_caption: caption,
      p_location: location,
      p_music: music,
      p_stickers: stickers,
      p_filter: filter
    });

    if (error) throw error;

    return {
      success: true,
      storyId: data.story_id
    };
  } catch (error) {
    console.error('Error creating story:', error);
    return {
      success: false,
      error: 'Failed to create story'
    };
  }
};
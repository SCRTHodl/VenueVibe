import { supabase } from '../supabase';
import { getAdminClient } from '../../utils/supabaseClient';
import { UserStory, ModerationResult } from '../../types';
import { TOKEN_ECONOMY } from '../tokenStore';
import { isContentTypeSupported, SupportedContentType } from '../ai/index';

/**
 * Handle premium content configuration when publishing a story
 */
export const setupPremiumContent = async (
  storyId: string, 
  userId: string, 
  isPremiumContent: boolean, 
  tokenCost: number
) => {
  if (!isPremiumContent) return;
  
  console.log('[StoryPublisher] Creating premium content with cost:', tokenCost);
  try {
    // Ensure story_token_data entry exists using admin client for token_economy schema
    const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
    const adminClient = getAdminClient();
    const { error } = await adminClient
      .schema(tokenEconomySchema)
      .from('story_token_data')
      .upsert({
        story_id: storyId,
        creator_id: userId,
        premium_content: true,
        unlock_cost: tokenCost
      });
    
    if (error) {
      console.error('[StoryPublisher] Error setting premium content status:', error);
      throw error;
    }
  } catch (err) {
    console.error('[StoryPublisher] Failed to set premium content:', err);
    throw err;
  }
};

/**
 * User story object
 */
export interface UserStory {
  id: string;
  userId: string;
  caption?: string;
  contentUrl: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  filter?: string;
  expiresAt?: string;
  viewed?: boolean;
  viewedBy?: string[];
  isPremium?: boolean;
  unlockCost?: number;
  isMonetized?: boolean;
  monetizationStatus?: string;
  moderationStatus?: string;
  visibility?: string;
  gifts?: number;
  analytics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  tags?: string[];
  comments?: {
    count: number;
    latest: Array<{
      id: string;
      userId: string;
      content: string;
      createdAt: string;
    }>;
  };
  stickers?: Array<{
    id: string;
    x: number;
    y: number;
    emoji: string;
  }>;
}

/**
 * Create a complete story object with all necessary fields
 */
export const createStoryObject = ({
  caption,
  mediaItems,
  location,
  filter,
  isPremium,
  unlockCost,
  tags,
  stickers,
}: {
  caption: string;
  mediaItems: Array<{ type: 'image' | 'video'; url: string }>;
  location?: string;
  filter?: string;
  isPremium?: boolean;
  unlockCost?: number;
  tags?: string[];
  stickers?: Array<{ id: string; x: number; y: number; emoji: string }>;
}): UserStory => {
  const mediaItem = mediaItems[0];
  
  return {
    id: crypto.randomUUID(),
    userId: '', // Will be set by the API
    caption,
    contentUrl: mediaItem.url,
    location,
    filter,
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    viewed: false,
    viewedBy: [],
    isPremium,
    unlockCost,
    isMonetized: false,
    monetizationStatus: 'pending',
    moderationStatus: 'pending',
    visibility: 'public',
    gifts: 0,
    analytics: {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    },
    tags,
    comments: {
      count: 0,
      latest: [],
    },
    stickers,
  };
};

/**
 * Complete story publishing process
 */
export const publishStory = async (storyData: UserStory) => {
  try {
    console.log('[StoryPublisher] Publishing story:', storyData.id);
    
    // First publish the story
    const { error } = await supabase
      .from('stories')
      .insert(storyData);
    
    if (error) {
      console.error('[StoryPublisher] Error publishing story:', error);
      return { success: false, error: error.message };
    }
    
    // Setup premium content if needed
    if (storyData.isPremium) {
      try {
        await setupPremiumContent(
          storyData.id,
          storyData.userId,
          storyData.isPremium,
          storyData.unlockCost || TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT
        );
      } catch (premiumError) {
        console.error('[StoryPublisher] Error setting premium content:', premiumError);
        // Story was already published, so we don't fail the whole operation
        // But we log the error and include it in the response
        return { 
          success: true, 
          story: storyData, 
          warning: 'Story published but premium settings may not be applied correctly.'
        };
      }
    }
    
    return { success: true, story: storyData };
  } catch (error) {
    console.error('[StoryPublisher] Unexpected error publishing story:', error);
    return { success: false, error: 'Failed to publish story. Please try again.' };
  }
};

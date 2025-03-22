import { supabase } from '../supabase';
import { getAdminClient } from '../../utils/supabaseClient';
import { UserStory } from '../../types/index';
import { TOKEN_ECONOMY } from '../tokenStore';

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
 * Create a complete story object with all necessary fields
 */
export const createStoryObject = (params: {
  userId: string,
  mediaItems: Array<{type: 'image' | 'video', url: string}>,
  caption?: string,
  location?: string | null,
  music?: string | null,
  filter?: string,
  isPremium?: boolean,
  unlockCost?: number,
  emojis?: string[],
  stickers?: Array<{id: string, emoji: string, x: number, y: number}>
}): UserStory => {
  const {
    userId,
    mediaItems,
    caption,
    location,
    music,
    filter,
    isPremium = false,
    unlockCost = TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT,
    emojis = [],
    stickers = []
  } = params;
  
  // Generate a unique story ID
  const storyId = crypto.randomUUID();
  
  // Get user info from userId (in a real app, you'd fetch this from the database)
  // For now we're using placeholders
  const userName = 'User ' + userId.slice(0, 5);
  const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  
  return {
    id: storyId,
    userId: userId,
    userName: userName,
    userAvatar: userAvatar,
    media: mediaItems,
    caption: caption ? `${emojis.join('')} ${caption}` : undefined,
    location: location || undefined,
    music: music || undefined,
    stickers: [
      ...(stickers || []),
      ...emojis.map((emoji) => ({
        id: crypto.randomUUID(),
        emoji,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      }))
    ],
    filter: filter || undefined,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    viewCount: 0,
    viewedBy: [],
    tokenBalance: 0,
    gifts: [],
    isPremium: isPremium,
    unlockCost: isPremium ? unlockCost : 0
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

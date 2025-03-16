import { useState } from 'react';
import { ModerationResult } from '../../types';
import { checkContentModeration, isContentTypeSupported, SupportedContentType } from '../ai/index';
import { TOKEN_ECONOMY } from '../tokenStore';

/**
 * Custom hook for managing content moderation and premium content settings
 * This centralizes moderation-related functionality to improve code organization
 */
export const useModerationHelper = () => {
  // Moderation state
  const [isCheckingModeration, setIsCheckingModeration] = useState(false);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  
  // Premium content state
  const [isPremiumContent, setIsPremiumContent] = useState(false);
  const [tokenCost, setTokenCost] = useState(TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT);
  const [showTokenSettings, setShowTokenSettings] = useState(false);

  /**
   * Check content against moderation guidelines
   * @param caption The story caption text to check
   * @param mediaItems Media items to check (currently just uses filenames)
   */
  const checkContent = async (
    caption: string, 
    mediaItems: Array<{type: 'image' | 'video', url: string}>
  ) => {
    try {
      setIsCheckingModeration(true);
      setModerationResult(null);
      
      // Only check content if there's a caption or media items
      if (!caption && mediaItems.length === 0) {
        throw new Error('Please add content before checking');
      }
      
      // Call the AI moderation service
      const result = await checkContentModeration(caption, mediaItems);
      setModerationResult(result);
      
      return result;
    } catch (error) {
      console.error('Error checking content:', error);
      throw error;
    } finally {
      setIsCheckingModeration(false);
    }
  };
  
  /**
   * Toggle premium content setting
   */
  const togglePremiumContent = () => {
    setIsPremiumContent(prev => !prev);
    if (!isPremiumContent) {
      setShowTokenSettings(true);
    }
  };
  
  /**
   * Update the token cost for premium content
   */
  const updateTokenCost = (cost: number) => {
    setTokenCost(Math.max(TOKEN_ECONOMY.COSTS.MIN_PREMIUM, Math.min(cost, TOKEN_ECONOMY.COSTS.MAX_PREMIUM)));
  };
  
  /**
   * Toggle token settings visibility
   */
  const toggleTokenSettings = () => {
    setShowTokenSettings(prev => !prev);
  };
  
  /**
   * Check if content passes moderation
   */
  const passesModeration = () => {
    return !isCheckingModeration && 
      (moderationResult === null || moderationResult.status === 'approved');
  };

  return {
    // Moderation state
    isCheckingModeration,
    setIsCheckingModeration,
    moderationResult,
    setModerationResult,
    checkContent,
    passesModeration,
    
    // Premium content state
    isPremiumContent,
    setIsPremiumContent,
    tokenCost,
    setTokenCost,
    showTokenSettings,
    setShowTokenSettings,
    togglePremiumContent,
    updateTokenCost,
    toggleTokenSettings
  };
};

import { ModerationResult } from '../../types';

/**
 * Check content against moderation guidelines
 * @param text Text content to moderate
 * @param mediaItems Media files to check
 * @returns ModerationResult with status and details
 */
export const checkContentModeration = async (
  text: string,
  mediaItems: Array<{type: 'image' | 'video', url: string}>
): Promise<ModerationResult> => {
  console.log('[AI] Checking content moderation for:', { text, mediaCount: mediaItems.length });
  
  // This is a mock implementation - in a real app, you would call an actual AI moderation service
  return new Promise((resolve) => {
    // Simulate API call delay
    setTimeout(() => {
      // Check for potentially problematic content
      const hasOffensiveContent = 
        /\b(hate|violent|explicit|offensive|inappropriate)\b/i.test(text.toLowerCase());
      
      // Simple mock scoring
      const getRandomScore = () => Math.random() * 0.4; // Scores below 0.5 for normal content
      
      if (hasOffensiveContent) {
        resolve({
          status: 'rejected',
          reason: 'Content may violate community guidelines',
          score: 0.8,
          categories: {
            spam: getRandomScore(),
            offensive: 0.8,
            adult: getRandomScore(),
            violence: getRandomScore(),
          },
          timestamp: new Date().toISOString()
        });
      } else {
        resolve({
          status: 'approved',
          score: 0.2,
          categories: {
            spam: getRandomScore(),
            offensive: getRandomScore(),
            adult: getRandomScore(),
            violence: getRandomScore()
          },
          timestamp: new Date().toISOString()
        });
      }
    }, 1000);
  });
};

/**
 * Valid content types that can be moderated
 */
export type SupportedContentType = 'story' | 'post' | 'comment';

/**
 * Helper function to check if content type is allowed for moderation
 */
export const isContentTypeSupported = (contentType: string): contentType is SupportedContentType => {
  const supportedTypes: SupportedContentType[] = [
    'story',
    'post',
    'comment'
  ];
  
  return supportedTypes.includes(contentType as SupportedContentType);
};

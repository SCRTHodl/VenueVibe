/**
 * Configuration for AI content analysis features
 */

export const aiContentConfig = {
  /**
   * Token costs for different AI operations
   */
  tokenCosts: {
    contentAnalysis: 1,
    recommendations: 2,
    naturalLanguageQuery: 3
  },
  
  /**
   * Content types that can be analyzed by the AI
   */
  supportedContentTypes: [
    'stories',
    'posts',
    'articles',
    'comments',
    'profiles'
  ],
  
  /**
   * How long to cache AI insights to avoid redundant processing
   */
  cacheTTL: {
    analysis: 24 * 60 * 60 * 1000, // 24 hours
    recommendations: 4 * 60 * 60 * 1000, // 4 hours
    queries: 30 * 60 * 1000 // 30 minutes
  },
  
  /**
   * Performance thresholds for triggering content promotions
   */
  performanceThresholds: {
    impressions: {
      low: 10,
      medium: 50,
      high: 200
    },
    ctr: {
      low: 1.0,
      medium: 3.0,
      high: 5.0
    },
    engagementScore: {
      low: 20,
      medium: 50,
      high: 80
    }
  },
  
  /**
   * Auto-feature threshold - when content exceeds this score, it's automatically featured
   */
  autoFeatureThreshold: 75,
  
  /**
   * Audiences used for content targeting
   */
  targetAudiences: [
    'new_users',
    'active_creators',
    'casual_readers',
    'power_users',
    'returning_users'
  ],
  
  /**
   * Recommendation contexts for different scenarios
   */
  recommendationContexts: {
    homepage: {
      diversityWeight: 0.4,
      recencyWeight: 0.3,
      popularityWeight: 0.3
    },
    userProfile: {
      diversityWeight: 0.2,
      recencyWeight: 0.2,
      popularityWeight: 0.6
    },
    trending: {
      diversityWeight: 0.1,
      recencyWeight: 0.6,
      popularityWeight: 0.3
    }
  },
  
  /**
   * Default number of recommendations to generate
   */
  defaultRecommendationCount: 6,
  
  /**
   * Analytics tracking settings
   */
  analyticsTracking: {
    enabled: true,
    trackImpressions: true,
    trackClicks: true,
    trackConversions: true,
    trackEngagementTime: true
  }
};

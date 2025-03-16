import { supabase } from '../supabase';
import { createTokenTransaction } from '../supabase/tokenEconomy';

// Types for content analysis
export interface ContentInsight {
  contentId: string;
  contentType: string;
  score: number;
  reason: string;
  keywords: string[];
  audiences: string[];
  engagement_prediction: {
    level: 'low' | 'medium' | 'high';
    score: number;
  };
  timestamp: string;
}

export interface ContentRecommendation {
  contentId: string;
  contentType: string;
  title: string;
  description: string;
  reason: string;
  score: number;
  confidence: number;
}

// Cache for content insights to reduce API calls
const insightsCache = new Map<string, { insight: ContentInsight, timestamp: number }>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Analyzes content using AI to provide insights about engagement potential
 */
export async function analyzeContent(
  contentId: string, 
  contentType: string,
  userId?: string
): Promise<ContentInsight | null> {
  try {
    // Check cache first
    const cacheKey = `${contentType}:${contentId}`;
    const cachedItem = insightsCache.get(cacheKey);
    
    if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_EXPIRY)) {
      return cachedItem.insight;
    }
    
    // Get content data from database
    const { data: contentData, error } = await supabase
      .from(contentType)
      .select('*')
      .eq('id', contentId)
      .single();
    
    if (error || !contentData) {
      console.error('Error fetching content for analysis:', error);
      return null;
    }
    
    // In a production app, this would call an actual AI service like OpenAI or a custom model
    // For this demo, we'll simulate AI insights
    
    // This would be the payload to send to the AI service
    const analysisData = {
      content: {
        id: contentId,
        type: contentType,
        title: contentData.title || contentData.name,
        description: contentData.description,
        metadata: contentData.metadata || {},
        created_at: contentData.created_at
      }
    };
    
    // Simulate AI response with some randomized but plausible insights
    const insight: ContentInsight = {
      contentId,
      contentType,
      score: Math.round((6 + Math.random() * 4) * 10) / 10, // 6.0-10.0 score
      reason: generateInsightReason(contentType, contentData),
      keywords: generateKeywords(contentData),
      audiences: generateAudiences(),
      engagement_prediction: {
        level: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        score: Math.round((5 + Math.random() * 5) * 10) / 10 // 5.0-10.0 score
      },
      timestamp: new Date().toISOString()
    };
    
    // Store in cache
    insightsCache.set(cacheKey, {
      insight,
      timestamp: Date.now()
    });
    
    // If user provided, record the transaction in token economy
    if (userId) {
      await createTokenTransaction({
        user_id: userId,
        amount: -1, // Cost 1 token for content analysis
        transaction_type: 'ai_content_analysis',
        metadata: { contentId, contentType }
      });
      
      // Store the insights in the database for future reference
      await supabase
        .from('featured_content')
        .upsert({
          content_id: contentId,
          content_type: contentType,
          ai_insights: insight,
          ai_generated: true,
          added_by: userId,
          priority: Math.round(insight.score) // Set priority based on AI score
        }, {
          onConflict: 'content_id, content_type'
        });
    }
    
    return insight;
    
  } catch (error) {
    console.error('Error analyzing content:', error);
    return null;
  }
}

/**
 * Gets AI-powered content recommendations based on specified criteria
 */
export async function getContentRecommendations(
  options: {
    contentType?: string;
    count?: number;
    userId?: string;
    targetAudience?: string;
    context?: string;
  } = {}
): Promise<ContentRecommendation[]> {
  const {
    contentType = 'stories',
    count = 5,
    userId,
    targetAudience,
    context
  } = options;
  
  try {
    // Get content data
    const { data: contentItems, error } = await supabase
      .from(contentType)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20); // Get more than we need for analysis
    
    if (error || !contentItems) {
      console.error('Error fetching content for recommendations:', error);
      return [];
    }
    
    // In production, this would call an AI service
    // Here we'll simulate analysis and sorting logic
    
    // Create simulated recommendations with confidence scores
    const recommendations: ContentRecommendation[] = contentItems
      .map(item => ({
        contentId: item.id,
        contentType,
        title: item.title || item.name || 'Untitled',
        description: item.description || '',
        reason: generateRecommendationReason(context),
        score: Math.round((5 + Math.random() * 5) * 10) / 10, // 5.0-10.0
        confidence: Math.round((6 + Math.random() * 4) * 10) / 10 // 6.0-10.0
      }))
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, count); // Take only requested count
      
    // If user provided, record the transaction
    if (userId) {
      await createTokenTransaction({
        user_id: userId,
        amount: -2, // Cost 2 tokens for recommendations
        transaction_type: 'ai_content_recommendations',
        metadata: { count, contentType, context }
      });
      
      // Store the top recommendations as featured content
      for (const rec of recommendations.slice(0, 3)) { // Top 3 only
        await supabase
          .from('featured_content')
          .upsert({
            content_id: rec.contentId,
            content_type: contentType,
            ai_generated: true,
            ai_insights: rec,
            added_by: userId,
            priority: Math.round(rec.score),
            metadata: { 
              reason: rec.reason,
              confidence: rec.confidence,
              context
            }
          }, {
            onConflict: 'content_id, content_type'
          });
      }
    }
    
    return recommendations;
    
  } catch (error) {
    console.error('Error getting content recommendations:', error);
    return [];
  }
}

/**
 * Process a natural language query about content and provide AI-powered suggestions
 */
export async function processContentQuery(
  query: string,
  userId?: string
): Promise<{
  response: string;
  recommendations?: ContentRecommendation[];
}> {
  try {
    // In production, this would use an LLM to interpret the natural language query
    // For this demo, we're simulating responses based on keywords
    
    let response = '';
    let contentType: string = 'stories';
    let context = '';
    
    // Simple keyword matching to simulate AI understanding
    if (query.toLowerCase().includes('trending')) {
      response = 'Based on current trends, I recommend featuring content related to urban exploration and sustainable living. These topics are showing increased engagement across platforms.';
      context = 'trending';
    } else if (query.toLowerCase().includes('engagement')) {
      response = 'To increase engagement, I suggest featuring premium content with interactive elements. Users have shown higher completion rates with these types of stories.';
      context = 'engagement';
    } else if (query.toLowerCase().includes('events')) {
      response = 'Event content with location-based information and early-bird discounts is performing well. Consider featuring upcoming weekend events in urban areas.';
      contentType = 'events';
      context = 'events';
    } else {
      response = `I've analyzed your query: "${query}". Based on your current content performance, I recommend featuring stories that highlight community experiences and premium content with visual elements.`;
      context = query;
    }
    
    // Get some recommendations based on the interpreted query
    const recommendations = await getContentRecommendations({
      contentType,
      count: 3,
      userId,
      context
    });
    
    // Add recommendation details to the response
    if (recommendations.length > 0) {
      response += '\n\nTop recommended content to feature:';
      recommendations.forEach((rec, index) => {
        response += `\n${index + 1}. "${rec.title}" - ${rec.reason} (confidence: ${rec.confidence}/10)`;
      });
    }
    
    // If user provided, record the transaction
    if (userId) {
      await createTokenTransaction({
        user_id: userId,
        amount: -3, // Cost 3 tokens for NL processing
        transaction_type: 'ai_content_query',
        metadata: { query, contentType }
      });
    }
    
    return {
      response,
      recommendations
    };
    
  } catch (error) {
    console.error('Error processing content query:', error);
    return {
      response: 'Sorry, I encountered an error processing your query. Please try again later.'
    };
  }
}

// Helper functions for generating realistic content insights
function generateInsightReason(contentType: string, contentData: any): string {
  const reasons = [
    `This ${contentType === 'stories' ? 'story' : contentType === 'events' ? 'event' : 'location'} has strong visual elements that tend to drive higher engagement.`,
    `Content aligns well with current trending topics in your user community.`,
    `The specific topic of this content has shown consistent engagement across multiple platforms.`,
    `This content has qualities that make it highly shareable among your target demographic.`,
    `Based on historical performance of similar content, this has high potential for user interaction.`
  ];
  
  return reasons[Math.floor(Math.random() * reasons.length)];
}

function generateKeywords(contentData: any): string[] {
  const allKeywords = [
    'premium', 'engaging', 'visual', 'trending', 'community',
    'interactive', 'authentic', 'local', 'innovative', 'sustainable',
    'creative', 'exclusive', 'inspiring', 'educational', 'entertaining'
  ];
  
  // Select 3-5 random keywords
  const count = 3 + Math.floor(Math.random() * 3);
  const keywords: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomKeyword = allKeywords[Math.floor(Math.random() * allKeywords.length)];
    if (!keywords.includes(randomKeyword)) {
      keywords.push(randomKeyword);
    }
  }
  
  return keywords;
}

function generateAudiences(): string[] {
  const allAudiences = [
    'young adults', 'content creators', 'urban explorers',
    'professionals', 'students', 'community leaders',
    'tech enthusiasts', 'local residents', 'travelers',
    'artists', 'entrepreneurs', 'environmental advocates'
  ];
  
  // Select 2-3 random audiences
  const count = 2 + Math.floor(Math.random() * 2);
  const audiences: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomAudience = allAudiences[Math.floor(Math.random() * allAudiences.length)];
    if (!audiences.includes(randomAudience)) {
      audiences.push(randomAudience);
    }
  }
  
  return audiences;
}

function generateRecommendationReason(context?: string): string {
  const reasons = [
    'High engagement potential based on similar content performance',
    'Aligns with current trending topics in your community',
    'Visual elements suggest strong user interaction',
    'Topic has shown consistent growth in user interest',
    'Premium content quality with strong narrative elements',
    'Matches current seasonal interests of your user base',
    'Content type has historically performed well with your audience',
    'Balances well with your existing featured content'
  ];
  
  // If context provided, add some specific reasons
  if (context) {
    if (context.includes('trending')) {
      reasons.push('Currently trending with similar audiences');
      reasons.push('Shows growth in engagement metrics over the past week');
    } else if (context.includes('engagement')) {
      reasons.push('Has interactive elements that drive user participation');
      reasons.push('Content structure promotes longer view durations');
    }
  }
  
  return reasons[Math.floor(Math.random() * reasons.length)];
}

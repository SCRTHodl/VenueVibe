import { supabase } from '../supabase';
import { getAdminClient } from '../../utils/supabaseClient';
import { 
  analyzeContent, 
  getContentRecommendations, 
  processContentQuery 
} from '../ai/contentAnalysis';

/**
 * API handler for content analysis endpoints
 */
export const contentAiApi = {
  /**
   * Analyze a specific content item
   */
  analyzeContent: async (req: Request) => {
    try {
      const { contentId, contentType } = await req.json();
      
      // Validate request
      if (!contentId || !contentType) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: contentId and contentType' }),
          { status: 400 }
        );
      }
      
      // Get user for token transaction
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401 }
        );
      }
      
      // Call the AI analysis function
      const insights = await analyzeContent(contentId, contentType, user.id);
      
      if (!insights) {
        return new Response(
          JSON.stringify({ error: 'Failed to analyze content' }),
          { status: 500 }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, insights }),
        { status: 200 }
      );
      
    } catch (error) {
      console.error('Error in content analysis API:', error);
      return new Response(
        JSON.stringify({ error: 'Server error processing content analysis' }),
        { status: 500 }
      );
    }
  },
  
  /**
   * Get content recommendations
   */
  getRecommendations: async (req: Request) => {
    try {
      const { contentType, count, targetAudience, context } = await req.json();
      
      // Get user for token transaction
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401 }
        );
      }
      
      // Call the recommendations function
      const recommendations = await getContentRecommendations({
        contentType,
        count,
        userId: user.id,
        targetAudience,
        context
      });
      
      return new Response(
        JSON.stringify({ success: true, recommendations }),
        { status: 200 }
      );
      
    } catch (error) {
      console.error('Error in recommendations API:', error);
      return new Response(
        JSON.stringify({ error: 'Server error processing recommendations' }),
        { status: 500 }
      );
    }
  },
  
  /**
   * Process a natural language query about content strategy
   */
  processQuery: async (req: Request) => {
    try {
      const { query } = await req.json();
      
      // Validate request
      if (!query) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameter: query' }),
          { status: 400 }
        );
      }
      
      // Get user for token transaction
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401 }
        );
      }
      
      // Process the query
      const result = await processContentQuery(query, user.id);
      
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200 }
      );
      
    } catch (error) {
      console.error('Error in content query API:', error);
      return new Response(
        JSON.stringify({ error: 'Server error processing content query' }),
        { status: 500 }
      );
    }
  },
  
  /**
   * Check if the user has sufficient tokens for AI operations
   */
  checkTokenBalance: async (req: Request) => {
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401 }
        );
      }
      
      // Get token balance from token_economy schema using admin client
      const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
      const adminClient = getAdminClient();
      const { data, error } = await adminClient
        .schema(tokenEconomySchema)
        .from('user_token_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching token balance:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to retrieve token balance' }),
          { status: 500 }
        );
      }
      
      // Return balance info and costs for different operations
      return new Response(
        JSON.stringify({
          success: true,
          balance: data?.balance || 0,
          costs: {
            contentAnalysis: 1,
            recommendations: 2,
            naturalLanguageQuery: 3
          }
        }),
        { status: 200 }
      );
      
    } catch (error) {
      console.error('Error in token balance API:', error);
      return new Response(
        JSON.stringify({ error: 'Server error checking token balance' }),
        { status: 500 }
      );
    }
  }
};

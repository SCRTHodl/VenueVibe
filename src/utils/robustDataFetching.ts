import { supabase } from '../lib/supabase';

/**
 * RobustDataFetching - A utility to make Supabase queries more resilient in production
 * 
 * This utility provides methods that handle database schema differences between
 * environments, missing tables, and missing relationships by providing fallbacks
 * and alternative query paths.
 */

/**
 * Fetches data with fallback options if the primary query fails
 * @param tableName The table to query
 * @param primaryQuery The main query to execute first (with relationships)
 * @param fallbackQuery A simpler query to use if the primary fails
 * @param mockData Optional mock data to use in development if both queries fail
 */
export const fetchWithFallback = async <T>(
  tableName: string,
  primaryQuery: string,
  fallbackQuery: string,
  mockData?: T[]
): Promise<T[]> => {
  const isDev = import.meta.env.DEV;
  
  try {
    // Try the primary query first (with relationships)
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(primaryQuery);
      
      if (!error && data && data.length > 0) {
        console.log(`Successfully fetched data from ${tableName} with relationships`);
        return data as T[];
      }
    } catch (relationshipError) {
      console.log(`Relationship query failed for ${tableName}, trying fallback`, relationshipError);
    }
    
    // If primary query fails, try the fallback query
    const { data: fallbackData, error: fallbackError } = await supabase
      .from(tableName)
      .select(fallbackQuery);
    
    if (!fallbackError && fallbackData && fallbackData.length > 0) {
      console.log(`Successfully fetched data from ${tableName} using fallback query`);
      return fallbackData as T[];
    }
    
    throw fallbackError || new Error(`No data returned from ${tableName}`);
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    
    // In development, use mock data as last resort
    if (isDev && mockData) {
      console.log(`Using mock data for ${tableName} in development`);
      return mockData;
    }
    
    // In production, return empty array instead of failing completely
    return [] as T[];
  }
};

/**
 * Checks if a table exists in the database
 * @param tableName The table to check
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    // Try to fetch a single row with minimal columns
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    // If no error, the table exists
    return !error;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Execute a database function with proper error handling for production
 * @param functionName The name of the database function to call
 * @param params The parameters to pass to the function
 */
export const safeRpcCall = async <T>(
  functionName: string, 
  params: Record<string, any>
): Promise<T | null> => {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      return null;
    }
    
    return data as T;
  } catch (error) {
    console.error(`Exception calling ${functionName}:`, error);
    return null;
  }
};

/**
 * Retrieves featured content with proper handling of schema differences
 * @param contentType The type of content to fetch (stories, events, etc)
 * @param limit Maximum number of items to return
 */
export const getFeaturedContent = async <T>(
  contentType: string,
  limit: number = 10
): Promise<T[]> => {
  try {
    // Try with priority field first
    try {
      const { data, error } = await supabase
        .from('featured_content')
        .select(`
          id,
          content_id,
          priority,
          ai_generated,
          ai_insights,
          metadata
        `)
        .eq('content_type', contentType)
        .eq('active', true)
        .order('priority', { ascending: false })
        .limit(limit);
        
      if (!error && data) {
        return data as unknown as T[];
      }
    } catch (priorityError) {
      console.log('Featured content priority field not available, using fallback');
    }
    
    // Fallback without priority ordering
    const { data, error } = await supabase
      .from('featured_content')
      .select(`
        id,
        content_id,
        ai_generated,
        ai_insights,
        metadata
      `)
      .eq('content_type', contentType)
      .eq('active', true)
      .limit(limit);
      
    if (error) throw error;
    return data as unknown as T[];
  } catch (error) {
    console.error(`Error fetching featured ${contentType}:`, error);
    return [];
  }
};

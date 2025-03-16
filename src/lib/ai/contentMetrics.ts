import { supabase } from '../supabase';

/**
 * Metric types for AI content performance tracking
 */
export type MetricType = 'impression' | 'click' | 'conversion' | 'engagement';

/**
 * Updates engagement metrics for content which helps train the AI 
 * to better understand what content is performing well
 */
export async function updateContentMetrics(
  contentId: string,
  contentType: string,
  metricType: MetricType,
  value: number = 1
): Promise<void> {
  if (!contentId || !contentType || !metricType) return;
  
  try {
    // Call the RPC function to update metrics
    const { error } = await supabase.rpc(
      'update_content_metrics',
      {
        p_content_id: contentId,
        p_content_type: contentType,
        p_metric_type: metricType,
        p_value: value
      }
    );
    
    if (error) {
      console.error('Error updating content metrics:', error);
    }
  } catch (err) {
    console.error('Exception in updateContentMetrics:', err);
  }
}

/**
 * Retrieves performance metrics for a specific content item
 */
export async function getContentMetrics(
  contentId: string,
  contentType: string
): Promise<{
  impressions: number;
  clicks: number;
  conversions: number;
  engagement_duration?: number;
  ctr?: number; // Click-through rate
} | null> {
  try {
    const { data, error } = await supabase
      .from('ai_content_metrics')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single();
      
    if (error) {
      console.error('Error fetching content metrics:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Calculate click-through rate if there are impressions
    const ctr = data.impressions > 0 
      ? (data.clicks / data.impressions) * 100 
      : 0;
      
    return {
      ...data,
      ctr: Math.round(ctr * 100) / 100 // Round to 2 decimal places
    };
    
  } catch (err) {
    console.error('Exception in getContentMetrics:', err);
    return null;
  }
}

/**
 * Get aggregated performance metrics for AI-recommended content
 */
export async function getAggregatedMetrics(
  options: {
    contentType?: string;
    timeframe?: 'day' | 'week' | 'month';
    limit?: number;
  } = {}
): Promise<{
  topPerforming: Array<{
    content_id: string;
    content_name: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
} | null> {
  const {
    contentType,
    timeframe = 'week',
    limit = 5
  } = options;
  
  try {
    // This would typically be a more complex query or stored procedure
    // For simplicity, we're doing some basic aggregation here
    
    // Get metrics for all content items, filtering by type if provided
    const query = supabase
      .from('ai_content_metrics')
      .select(`
        content_id,
        content_type,
        impressions,
        clicks,
        conversions,
        featured_id
      `);
      
    if (contentType) {
      query.eq('content_type', contentType);
    }
    
    // Apply timeframe filter - in a real app this would be more sophisticated
    if (timeframe === 'day') {
      query.gte('measured_at', new Date(Date.now() - 86400000).toISOString());
    } else if (timeframe === 'week') {
      query.gte('measured_at', new Date(Date.now() - 604800000).toISOString());
    } else if (timeframe === 'month') {
      query.gte('measured_at', new Date(Date.now() - 2592000000).toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching aggregated metrics:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return {
        topPerforming: [],
        totalImpressions: 0,
        totalClicks: 0,
        averageCTR: 0
      };
    }
    
    // Calculate totals
    const totalImpressions = data.reduce((sum, item) => sum + (item.impressions || 0), 0);
    const totalClicks = data.reduce((sum, item) => sum + (item.clicks || 0), 0);
    const averageCTR = totalImpressions > 0 
      ? (totalClicks / totalImpressions) * 100 
      : 0;
      
    // Get content names for content_ids
    const contentIds = data.map(item => item.content_id);
    
    // For simplicity, we'll just use the AI view to get content names
    const { data: contentNames } = await supabase
      .from('ai_recommended_content')
      .select('content_id, content_name')
      .in('content_id', contentIds);
      
    const nameMap = new Map(
      (contentNames || []).map(item => [item.content_id, item.content_name])
    );
    
    // Calculate CTR for each item and prepare top performing list
    const withCTR = data.map(item => ({
      ...item,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
      content_name: nameMap.get(item.content_id) || 'Unknown Content'
    }));
    
    // Sort by CTR and limit
    const topPerforming = withCTR
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, limit)
      .map(item => ({
        content_id: item.content_id,
        content_name: item.content_name,
        impressions: item.impressions || 0,
        clicks: item.clicks || 0,
        ctr: Math.round(item.ctr * 100) / 100
      }));
      
    return {
      topPerforming,
      totalImpressions,
      totalClicks,
      averageCTR: Math.round(averageCTR * 100) / 100
    };
    
  } catch (err) {
    console.error('Exception in getAggregatedMetrics:', err);
    return null;
  }
}

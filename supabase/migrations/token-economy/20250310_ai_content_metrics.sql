-- Create AI content metrics function and view 
-- This enhances our featured content system with better metrics tracking

-- First, create the metrics table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS ai_content_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  featured_id UUID REFERENCES featured_content(id) ON DELETE SET NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  engagement_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_id, content_type)
);

-- Create RLS policies
ALTER TABLE ai_content_metrics ENABLE ROW LEVEL SECURITY;

-- Everyone can read metrics
CREATE POLICY "Metrics are viewable by everyone" 
ON ai_content_metrics FOR SELECT 
USING (true);

-- Only service role or admins can modify metrics
CREATE POLICY "Only service_role or admins can modify metrics" 
ON ai_content_metrics FOR ALL
USING (
  (auth.role() = 'service_role') OR 
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
);

-- Create the update_content_metrics function for tracking engagement
CREATE OR REPLACE FUNCTION update_content_metrics(
  p_content_id UUID,
  p_content_type TEXT,
  p_metric_type TEXT,
  p_value INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  -- Create a new metrics record if it doesn't exist
  INSERT INTO ai_content_metrics (content_id, content_type)
  VALUES (p_content_id, p_content_type)
  ON CONFLICT (content_id, content_type) DO NOTHING;
  
  -- Update the appropriate metric based on the metric_type
  IF p_metric_type = 'impression' THEN
    UPDATE ai_content_metrics
    SET 
      impressions = impressions + p_value,
      measured_at = NOW()
    WHERE 
      content_id = p_content_id AND
      content_type = p_content_type;
      
  ELSIF p_metric_type = 'click' THEN
    UPDATE ai_content_metrics
    SET 
      clicks = clicks + p_value,
      measured_at = NOW()
    WHERE 
      content_id = p_content_id AND
      content_type = p_content_type;
      
  ELSIF p_metric_type = 'conversion' THEN
    UPDATE ai_content_metrics
    SET 
      conversions = conversions + p_value,
      measured_at = NOW()
    WHERE 
      content_id = p_content_id AND
      content_type = p_content_type;
      
  ELSIF p_metric_type = 'engagement' THEN
    UPDATE ai_content_metrics
    SET 
      engagement_duration = engagement_duration + p_value,
      measured_at = NOW()
    WHERE 
      content_id = p_content_id AND
      content_type = p_content_type;
  END IF;
  
  -- If this content is featured, update the featured_id reference
  UPDATE ai_content_metrics m
  SET featured_id = f.id
  FROM featured_content f
  WHERE 
    m.content_id = p_content_id AND
    m.content_type = p_content_type AND
    f.content_id = p_content_id AND
    f.content_type = p_content_type AND
    f.active = true AND
    m.featured_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for AI recommended content with metrics
CREATE OR REPLACE VIEW ai_recommended_content AS
SELECT
  f.id AS featured_id,
  f.content_id,
  f.content_type,
  f.ai_generated,
  f.ai_insights,
  f.priority,
  f.active,
  f.created_at,
  
  -- Content specific fields extracted from metadata
  COALESCE(
    (f.metadata->>'title'),
    (f.metadata->>'name'),
    'Untitled Content'
  ) AS content_name,
  
  COALESCE(
    (f.metadata->>'description'),
    (f.metadata->>'summary'),
    ''
  ) AS content_description,
  
  COALESCE(
    (f.metadata->>'image_url'),
    (f.metadata->>'thumbnail_url'),
    NULL
  ) AS content_image_url,
  
  -- Metrics
  COALESCE(m.impressions, 0) AS impressions,
  COALESCE(m.clicks, 0) AS clicks,
  COALESCE(m.conversions, 0) AS conversions,
  
  -- Calculated metrics
  CASE
    WHEN COALESCE(m.impressions, 0) > 0 THEN
      (COALESCE(m.clicks, 0)::FLOAT / COALESCE(m.impressions, 0)) * 100
    ELSE 0
  END AS ctr,
  
  CASE
    WHEN COALESCE(m.clicks, 0) > 0 THEN
      (COALESCE(m.conversions, 0)::FLOAT / COALESCE(m.clicks, 0)) * 100
    ELSE 0
  END AS conversion_rate,
  
  -- Performance score (algorithm can be adjusted)
  (
    (COALESCE(m.impressions, 0) * 0.2) +
    (COALESCE(m.clicks, 0) * 0.5) +
    (COALESCE(m.conversions, 0) * 1.0) +
    (CASE
      WHEN COALESCE(m.impressions, 0) > 0 THEN
        (COALESCE(m.clicks, 0)::FLOAT / COALESCE(m.impressions, 0)) * 100 * 0.5
      ELSE 0
    END)
  ) AS performance_score
  
FROM
  featured_content f
LEFT JOIN
  ai_content_metrics m ON f.content_id = m.content_id AND f.content_type = m.content_type
WHERE
  f.ai_generated = true OR f.ai_insights IS NOT NULL;

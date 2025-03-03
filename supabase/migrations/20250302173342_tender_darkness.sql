-- Create story analytics table
CREATE TABLE IF NOT EXISTS story_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  total_views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  completion_rate float8 DEFAULT 0,
  avg_view_time float8 DEFAULT 0,
  engagement_score float8 DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create story engagement events table
CREATE TABLE IF NOT EXISTS story_engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL CHECK (event_type IN ('view', 'complete', 'share', 'exit')),
  view_time float8,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE story_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_engagement_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Story creators can view analytics"
  ON story_analytics FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_analytics.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "System can update analytics"
  ON story_analytics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Record engagement events"
  ON story_engagement_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_analytics_story 
  ON story_analytics(story_id);
CREATE INDEX IF NOT EXISTS idx_story_engagement_story 
  ON story_engagement_events(story_id, event_type);
CREATE INDEX IF NOT EXISTS idx_story_engagement_user 
  ON story_engagement_events(user_id, created_at);

-- Create function to record story view
CREATE OR REPLACE FUNCTION record_story_view(
  p_story_id uuid,
  p_user_id uuid,
  p_view_time float8 DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_analytics_exists boolean;
BEGIN
  -- Check if analytics record exists
  SELECT EXISTS (
    SELECT 1 FROM story_analytics WHERE story_id = p_story_id
  ) INTO v_analytics_exists;
  
  -- Create or update analytics
  IF v_analytics_exists THEN
    UPDATE story_analytics
    SET 
      total_views = total_views + 1,
      unique_views = (
        SELECT COUNT(DISTINCT user_id)
        FROM story_engagement_events
        WHERE story_id = p_story_id
        AND event_type = 'view'
      ),
      avg_view_time = CASE
        WHEN p_view_time IS NOT NULL THEN
          (avg_view_time * total_views + p_view_time) / (total_views + 1)
        ELSE avg_view_time
      END,
      updated_at = now()
    WHERE story_id = p_story_id;
  ELSE
    INSERT INTO story_analytics (
      story_id,
      total_views,
      unique_views,
      avg_view_time
    ) VALUES (
      p_story_id,
      1,
      1,
      p_view_time
    );
  END IF;
  
  -- Record engagement event
  INSERT INTO story_engagement_events (
    story_id,
    user_id,
    event_type,
    view_time
  ) VALUES (
    p_story_id,
    p_user_id,
    'view',
    p_view_time
  );
  
  -- Update story view count
  UPDATE stories
  SET view_count = view_count + 1
  WHERE id = p_story_id;
END;
$$;

-- Create function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_story_engagement(p_story_id uuid)
RETURNS float8
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_views integer;
  v_completion_rate float8;
  v_avg_view_time float8;
  v_engagement_score float8;
BEGIN
  -- Get story metrics
  SELECT 
    total_views,
    COALESCE(
      (SELECT COUNT(*)::float8 / NULLIF(total_views, 0)
       FROM story_engagement_events
       WHERE story_id = p_story_id
       AND event_type = 'complete'),
      0
    ) * 100 as completion_rate,
    COALESCE(avg_view_time, 0) as avg_view_time
  INTO v_total_views, v_completion_rate, v_avg_view_time
  FROM story_analytics
  WHERE story_id = p_story_id;
  
  -- Calculate engagement score (0-100)
  -- 40% weight on views, 40% on completion rate, 20% on avg view time
  v_engagement_score := (
    (LEAST(v_total_views, 1000) / 1000 * 40) +
    (v_completion_rate * 0.4) +
    (LEAST(v_avg_view_time, 15) / 15 * 20)
  );
  
  -- Update analytics
  UPDATE story_analytics
  SET 
    completion_rate = v_completion_rate,
    engagement_score = v_engagement_score,
    updated_at = now()
  WHERE story_id = p_story_id;
  
  RETURN v_engagement_score;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_story_view TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_story_engagement TO authenticated;
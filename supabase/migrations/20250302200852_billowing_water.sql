-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS record_story_view CASCADE;
DROP FUNCTION IF EXISTS handle_story_expiration CASCADE;

-- Create optimized record_story_view function with reduced stack depth
CREATE OR REPLACE FUNCTION record_story_view(
  p_story_id uuid,
  p_user_id uuid,
  p_view_time float8 DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update story view count directly
  UPDATE stories
  SET 
    view_count = view_count + 1,
    viewed_by = array_append(
      CASE 
        WHEN viewed_by @> ARRAY[p_user_id] THEN viewed_by 
        ELSE COALESCE(viewed_by, ARRAY[]::uuid[])
      END,
      p_user_id
    )
  WHERE id = p_story_id;

  -- Update or insert analytics in a single query
  INSERT INTO story_analytics (
    story_id,
    total_views,
    unique_views,
    avg_view_time,
    updated_at
  ) VALUES (
    p_story_id,
    1,
    1,
    p_view_time,
    now()
  )
  ON CONFLICT (story_id) DO UPDATE
  SET
    total_views = story_analytics.total_views + 1,
    unique_views = (
      SELECT COUNT(DISTINCT unnest(s.viewed_by))
      FROM stories s
      WHERE s.id = p_story_id
    ),
    avg_view_time = CASE
      WHEN p_view_time IS NOT NULL 
      THEN (story_analytics.avg_view_time * story_analytics.total_views + p_view_time) / (story_analytics.total_views + 1)
      ELSE story_analytics.avg_view_time
    END,
    updated_at = now();

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
END;
$$;

-- Create optimized story expiration function
CREATE OR REPLACE FUNCTION handle_story_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate expired stories in batches
  WITH expired_stories AS (
    SELECT id 
    FROM stories 
    WHERE expires_at <= now() 
    AND is_active = true 
    LIMIT 1000
  )
  UPDATE stories s
  SET is_active = false
  FROM expired_stories e
  WHERE s.id = e.id;
  
  RETURN NULL;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS check_story_expiration ON stories;
CREATE TRIGGER check_story_expiration
  AFTER INSERT OR UPDATE ON stories
  FOR EACH STATEMENT
  EXECUTE FUNCTION handle_story_expiration();

-- Add indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_stories_expiry 
  ON stories(expires_at) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_story_analytics_story_views 
  ON story_analytics(story_id, total_views);

-- Add cascade delete to handle orphaned records
ALTER TABLE story_likes
  DROP CONSTRAINT IF EXISTS story_likes_story_id_fkey,
  ADD CONSTRAINT story_likes_story_id_fkey 
    FOREIGN KEY (story_id) 
    REFERENCES stories(id) 
    ON DELETE CASCADE;

ALTER TABLE story_comments
  DROP CONSTRAINT IF EXISTS story_comments_story_id_fkey,
  ADD CONSTRAINT story_comments_story_id_fkey 
    FOREIGN KEY (story_id) 
    REFERENCES stories(id) 
    ON DELETE CASCADE;

-- Create function to safely handle story interactions
CREATE OR REPLACE FUNCTION handle_story_interaction(
  p_story_id uuid,
  p_user_id uuid,
  p_interaction_type text,
  p_content text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result_id uuid;
BEGIN
  -- Verify story exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM stories 
    WHERE id = p_story_id 
    AND is_active = true 
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Story not found or expired';
  END IF;

  -- Handle different interaction types
  CASE p_interaction_type
    WHEN 'like' THEN
      INSERT INTO story_likes (story_id, user_id)
      VALUES (p_story_id, p_user_id)
      ON CONFLICT (story_id, user_id) DO NOTHING
      RETURNING id INTO v_result_id;
      
    WHEN 'comment' THEN
      IF p_content IS NULL THEN
        RAISE EXCEPTION 'Comment content is required';
      END IF;
      
      INSERT INTO story_comments (story_id, user_id, content)
      VALUES (p_story_id, p_user_id, p_content)
      RETURNING id INTO v_result_id;
  END CASE;

  RETURN v_result_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_story_view TO authenticated;
GRANT EXECUTE ON FUNCTION handle_story_interaction TO authenticated;
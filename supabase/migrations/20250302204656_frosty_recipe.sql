-- Drop existing functions to avoid conflicts
DO $$ 
BEGIN
  DROP FUNCTION IF EXISTS record_story_view_v1 CASCADE;
  DROP FUNCTION IF EXISTS record_story_view_v2 CASCADE;
  DROP FUNCTION IF EXISTS handle_story_interaction_v1 CASCADE;
  DROP FUNCTION IF EXISTS handle_story_interaction_v2 CASCADE;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create optimized record_story_view function with minimal recursion
CREATE OR REPLACE FUNCTION record_story_view_v3(
  p_story_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unique_viewers integer;
BEGIN
  -- Update story and get unique viewers count atomically
  WITH story_update AS (
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
    WHERE id = p_story_id
    RETURNING viewed_by
  )
  SELECT array_length(array(
    SELECT DISTINCT unnest(viewed_by) 
    FROM story_update
  ), 1) INTO v_unique_viewers;

  -- Update analytics
  INSERT INTO story_analytics (
    story_id,
    total_views,
    unique_views,
    updated_at
  ) VALUES (
    p_story_id,
    1,
    1,
    now()
  )
  ON CONFLICT (story_id) DO UPDATE
  SET
    total_views = story_analytics.total_views + 1,
    unique_views = v_unique_viewers,
    updated_at = now();

  -- Record engagement event
  INSERT INTO story_engagement_events (
    story_id,
    user_id,
    event_type
  )
  VALUES (
    p_story_id,
    p_user_id,
    'view'
  );
END;
$$;

-- Create optimized story interaction function with minimal recursion
CREATE OR REPLACE FUNCTION handle_story_interaction_v3(
  p_story_id uuid,
  p_user_id uuid,
  p_interaction_type text,
  p_content text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interaction_id uuid;
BEGIN
  -- Verify story exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM stories 
    WHERE id = p_story_id 
    AND is_active = true 
    AND expires_at > now()
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Story not found or expired'
    );
  END IF;

  -- Handle interaction
  CASE p_interaction_type
    WHEN 'like' THEN
      INSERT INTO story_likes (story_id, user_id)
      VALUES (p_story_id, p_user_id)
      ON CONFLICT (story_id, user_id) DO NOTHING
      RETURNING id INTO v_interaction_id;
      
    WHEN 'comment' THEN
      IF p_content IS NULL THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Comment content is required'
        );
      END IF;
      
      INSERT INTO story_comments (story_id, user_id, content)
      VALUES (p_story_id, p_user_id, p_content)
      RETURNING id INTO v_interaction_id;
  END CASE;

  -- Record engagement event if interaction was successful
  IF v_interaction_id IS NOT NULL THEN
    INSERT INTO story_engagement_events (
      story_id,
      user_id,
      event_type
    ) VALUES (
      p_story_id,
      p_user_id,
      p_interaction_type
    );
  END IF;

  RETURN jsonb_build_object(
    'success', v_interaction_id IS NOT NULL,
    'interaction_id', v_interaction_id,
    'interaction_type', p_interaction_type
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_story_view_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION handle_story_interaction_v3 TO authenticated;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_stories_view_stats 
  ON stories(id, view_count)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_story_analytics_views 
  ON story_analytics(story_id, total_views, unique_views);

CREATE INDEX IF NOT EXISTS idx_story_engagement_recent 
  ON story_engagement_events(story_id, event_type, created_at DESC);
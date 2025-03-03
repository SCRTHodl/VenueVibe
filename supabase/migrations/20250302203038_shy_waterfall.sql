-- Create stories table first (if not exists)
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  media jsonb NOT NULL,
  caption text,
  location text,
  music text,
  stickers jsonb,
  filter text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  view_count integer DEFAULT 0,
  viewed_by uuid[] DEFAULT ARRAY[]::uuid[],
  moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_feedback text,
  is_active boolean DEFAULT true
);

-- Create story likes table with proper foreign key
CREATE TABLE IF NOT EXISTS story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT story_likes_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  UNIQUE(story_id, user_id)
);

-- Create story comments table with proper foreign key
CREATE TABLE IF NOT EXISTS story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT story_comments_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Create story analytics table
CREATE TABLE IF NOT EXISTS story_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  total_views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  avg_view_time float8 DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(story_id)
);

-- Create story engagement events table
CREATE TABLE IF NOT EXISTS story_engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL CHECK (event_type IN ('view', 'like', 'comment', 'share')),
  view_time float8,
  created_at timestamptz DEFAULT now()
);

-- Create optimized record_story_view function with unique name
CREATE OR REPLACE FUNCTION record_story_view_v2(
  p_story_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_viewed_already boolean;
BEGIN
  -- Check if user has already viewed
  SELECT EXISTS (
    SELECT 1 FROM stories 
    WHERE id = p_story_id 
    AND viewed_by @> ARRAY[p_user_id]
  ) INTO v_viewed_already;

  -- Update story view count
  UPDATE stories
  SET 
    view_count = view_count + 1,
    viewed_by = CASE 
      WHEN v_viewed_already THEN viewed_by
      ELSE array_append(COALESCE(viewed_by, ARRAY[]::uuid[]), p_user_id)
    END
  WHERE id = p_story_id;

  -- Update analytics
  INSERT INTO story_analytics (story_id, total_views, unique_views)
  VALUES (p_story_id, 1, CASE WHEN v_viewed_already THEN 0 ELSE 1 END)
  ON CONFLICT (story_id) 
  DO UPDATE SET
    total_views = story_analytics.total_views + 1,
    unique_views = story_analytics.unique_views + CASE WHEN v_viewed_already THEN 0 ELSE 1 END,
    updated_at = now();

  -- Record engagement event
  INSERT INTO story_engagement_events (story_id, user_id, event_type)
  VALUES (p_story_id, p_user_id, 'view');
END;
$$;

-- Create optimized story interaction function with unique name
CREATE OR REPLACE FUNCTION handle_story_interaction_v2(
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
  v_result jsonb;
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

  -- Record engagement event
  INSERT INTO story_engagement_events (
    story_id, 
    user_id, 
    event_type
  ) VALUES (
    p_story_id,
    p_user_id,
    p_interaction_type
  );

  RETURN jsonb_build_object(
    'success', true,
    'interaction_id', v_interaction_id,
    'interaction_type', p_interaction_type
  );
END;
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_active_expiry 
  ON stories(is_active, expires_at)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_story_likes_story_user 
  ON story_likes(story_id, user_id);

CREATE INDEX IF NOT EXISTS idx_story_comments_story 
  ON story_comments(story_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_engagement_story 
  ON story_engagement_events(story_id, event_type);

-- Grant permissions
GRANT EXECUTE ON FUNCTION record_story_view_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION handle_story_interaction_v2 TO authenticated;
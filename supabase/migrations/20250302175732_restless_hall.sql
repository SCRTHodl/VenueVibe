-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies for stories
  DROP POLICY IF EXISTS "Stories read access policy" ON stories;
  DROP POLICY IF EXISTS "Stories create policy" ON stories;
  DROP POLICY IF EXISTS "Stories update policy" ON stories;
  DROP POLICY IF EXISTS "stories_view_policy" ON stories;
  DROP POLICY IF EXISTS "stories_insert_policy" ON stories;
  DROP POLICY IF EXISTS "stories_update_policy" ON stories;
  
  -- Drop policies for story likes
  DROP POLICY IF EXISTS "Story likes read policy" ON story_likes;
  DROP POLICY IF EXISTS "Story likes create policy" ON story_likes;
  DROP POLICY IF EXISTS "story_likes_view_policy" ON story_likes;
  DROP POLICY IF EXISTS "story_likes_insert_policy" ON story_likes;
  
  -- Drop policies for story comments
  DROP POLICY IF EXISTS "Story comments read policy" ON story_comments;
  DROP POLICY IF EXISTS "Story comments create policy" ON story_comments;
  DROP POLICY IF EXISTS "story_comments_view_policy" ON story_comments;
  DROP POLICY IF EXISTS "story_comments_insert_policy" ON story_comments;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies with unique names
CREATE POLICY "stories_access_policy_v3"
  ON stories FOR SELECT
  TO public
  USING (
    is_active = true AND 
    expires_at > now() AND 
    moderation_status != 'rejected'
  );

CREATE POLICY "stories_insert_policy_v3"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update_policy_v3"
  ON stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new policies for likes with unique names
CREATE POLICY "story_likes_read_policy_v3"
  ON story_likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "story_likes_insert_policy_v3"
  ON story_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create new policies for comments with unique names
CREATE POLICY "story_comments_read_policy_v3"
  ON story_comments FOR SELECT
  TO public
  USING (moderation_status = 'approved');

CREATE POLICY "story_comments_insert_policy_v3"
  ON story_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to record story view with unique name
CREATE OR REPLACE FUNCTION record_story_view_v3(
  p_story_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update story view count
  UPDATE stories
  SET 
    view_count = view_count + 1,
    viewed_by = array_append(viewed_by, p_user_id)
  WHERE id = p_story_id
  AND NOT (p_user_id = ANY(viewed_by));
  
  -- Record analytics
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
    unique_views = (
      SELECT COUNT(DISTINCT unnest(stories.viewed_by))
      FROM stories
      WHERE id = p_story_id
    ),
    updated_at = now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_story_view_v3 TO authenticated;
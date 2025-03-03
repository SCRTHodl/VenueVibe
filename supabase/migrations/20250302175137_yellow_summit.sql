-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies for stories
  DROP POLICY IF EXISTS "stories_view_policy" ON stories;
  DROP POLICY IF EXISTS "stories_insert_policy" ON stories;
  DROP POLICY IF EXISTS "stories_update_policy" ON stories;
  DROP POLICY IF EXISTS "Stories read access policy" ON stories;
  DROP POLICY IF EXISTS "Stories create policy" ON stories;
  DROP POLICY IF EXISTS "Stories update policy" ON stories;
  
  -- Drop policies for story likes
  DROP POLICY IF EXISTS "story_likes_view_policy" ON story_likes;
  DROP POLICY IF EXISTS "story_likes_insert_policy" ON story_likes;
  DROP POLICY IF EXISTS "Story likes read policy" ON story_likes;
  DROP POLICY IF EXISTS "Story likes create policy" ON story_likes;
  
  -- Drop policies for story comments
  DROP POLICY IF EXISTS "story_comments_view_policy" ON story_comments;
  DROP POLICY IF EXISTS "story_comments_insert_policy" ON story_comments;
  DROP POLICY IF EXISTS "Story comments read policy" ON story_comments;
  DROP POLICY IF EXISTS "Story comments create policy" ON story_comments;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies with unique names
CREATE POLICY "stories_access_policy_v2"
  ON stories FOR SELECT
  TO public
  USING (
    is_active = true AND 
    expires_at > now() AND 
    moderation_status != 'rejected'
  );

CREATE POLICY "stories_insert_policy_v2"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update_policy_v2"
  ON stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new policies for likes with unique names
CREATE POLICY "story_likes_read_policy_v2"
  ON story_likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "story_likes_insert_policy_v2"
  ON story_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create new policies for comments with unique names
CREATE POLICY "story_comments_read_policy_v2"
  ON story_comments FOR SELECT
  TO public
  USING (moderation_status = 'approved');

CREATE POLICY "story_comments_insert_policy_v2"
  ON story_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle story expiration
CREATE OR REPLACE FUNCTION handle_story_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate expired stories
  UPDATE stories
  SET is_active = false
  WHERE expires_at <= now()
  AND is_active = true;
  
  RETURN NULL;
END;
$$;

-- Create function to handle story moderation
CREATE OR REPLACE FUNCTION moderate_story_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_moderation_result jsonb;
BEGIN
  -- Check content moderation
  SELECT check_content_moderation(
    'story',
    NEW.caption,
    NEW.media->0->>'url'
  ) INTO v_moderation_result;
  
  -- Update story with moderation result
  UPDATE stories
  SET 
    moderation_status = v_moderation_result->>'status',
    moderation_feedback = CASE 
      WHEN v_moderation_result->>'status' = 'rejected' 
      THEN 'Content violates community guidelines'
      ELSE NULL
    END
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create function to handle comment moderation
CREATE OR REPLACE FUNCTION moderate_story_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_moderation_result jsonb;
BEGIN
  -- Check content moderation
  SELECT check_content_moderation(
    'comment',
    NEW.content
  ) INTO v_moderation_result;
  
  -- Update comment with moderation result
  UPDATE story_comments
  SET moderation_status = v_moderation_result->>'status'
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;
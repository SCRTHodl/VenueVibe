-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies for stories
  DROP POLICY IF EXISTS "Anyone can view active stories" ON stories;
  DROP POLICY IF EXISTS "Users can create stories" ON stories;
  DROP POLICY IF EXISTS "Users can update their own stories" ON stories;
  
  -- Drop policies for story likes
  DROP POLICY IF EXISTS "Anyone can view story likes" ON story_likes;
  DROP POLICY IF EXISTS "Authenticated users can like stories" ON story_likes;
  
  -- Drop policies for story comments
  DROP POLICY IF EXISTS "Anyone can view approved comments" ON story_comments;
  DROP POLICY IF EXISTS "Authenticated users can comment" ON story_comments;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create stories table if it doesn't exist
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

-- Create story likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Create story comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

-- Create new policies for stories
CREATE POLICY "Stories read access policy"
  ON stories FOR SELECT
  TO public
  USING (
    is_active = true AND 
    expires_at > now() AND 
    moderation_status != 'rejected'
  );

CREATE POLICY "Stories create policy"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stories update policy"
  ON stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new policies for likes
CREATE POLICY "Story likes read policy"
  ON story_likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Story likes create policy"
  ON story_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create new policies for comments
CREATE POLICY "Story comments read policy"
  ON story_comments FOR SELECT
  TO public
  USING (moderation_status = 'approved');

CREATE POLICY "Story comments create policy"
  ON story_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_active_status 
  ON stories(is_active, moderation_status, expires_at);
CREATE INDEX IF NOT EXISTS idx_story_likes_story 
  ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story 
  ON story_comments(story_id, moderation_status);

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

-- Create trigger for story expiration
DROP TRIGGER IF EXISTS check_story_expiration ON stories;
CREATE TRIGGER check_story_expiration
  AFTER INSERT OR UPDATE ON stories
  FOR EACH STATEMENT
  EXECUTE FUNCTION handle_story_expiration();

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

-- Create trigger for story moderation
DROP TRIGGER IF EXISTS moderate_new_story ON stories;
CREATE TRIGGER moderate_new_story
  AFTER INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION moderate_story_content();

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

-- Create trigger for comment moderation
DROP TRIGGER IF EXISTS moderate_new_comment ON story_comments;
CREATE TRIGGER moderate_new_comment
  AFTER INSERT ON story_comments
  FOR EACH ROW
  EXECUTE FUNCTION moderate_story_comment();
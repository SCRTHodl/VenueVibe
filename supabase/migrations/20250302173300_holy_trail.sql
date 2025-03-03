-- Create stories schema
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

CREATE TABLE IF NOT EXISTS story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(story_id, user_id)
);

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

-- Create policies
CREATE POLICY "stories_view_policy"
  ON stories FOR SELECT
  TO public
  USING (
    is_active = true AND 
    expires_at > now() AND 
    moderation_status != 'rejected'
  );

CREATE POLICY "stories_insert_policy"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update_policy"
  ON stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for likes
CREATE POLICY "story_likes_view_policy"
  ON story_likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "story_likes_insert_policy"
  ON story_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for comments
CREATE POLICY "story_comments_view_policy"
  ON story_comments FOR SELECT
  TO public
  USING (moderation_status = 'approved');

CREATE POLICY "story_comments_insert_policy"
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
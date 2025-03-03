-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  venue_id text NOT NULL,
  photos text[] DEFAULT ARRAY[]::text[],
  tags text[] DEFAULT ARRAY[]::text[],
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_score float8
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view approved posts"
  ON posts FOR SELECT
  TO public
  USING (moderation_status != 'rejected');

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle post creation with moderation
CREATE OR REPLACE FUNCTION create_post(
  p_content text,
  p_venue_id text,
  p_photos text[],
  p_tags text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_id uuid;
  v_moderation_result jsonb;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Check content moderation
  SELECT check_content_moderation(
    'post',
    p_content,
    p_photos[1]
  ) INTO v_moderation_result;

  -- Create post
  INSERT INTO posts (
    user_id,
    content,
    venue_id,
    photos,
    tags,
    moderation_status,
    moderation_score
  ) VALUES (
    v_user_id,
    p_content,
    p_venue_id,
    p_photos,
    p_tags,
    v_moderation_result->>'status',
    (v_moderation_result->>'score')::float8
  )
  RETURNING id INTO v_post_id;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'post_id', v_post_id,
    'moderation_status', v_moderation_result->>'status'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_post TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_user 
  ON posts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_venue 
  ON posts(venue_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_moderation 
  ON posts(moderation_status, created_at DESC);
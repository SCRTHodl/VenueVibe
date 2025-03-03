-- Create table for content moderation
CREATE TABLE IF NOT EXISTS content_moderation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('story', 'post', 'comment')),
  content_id text NOT NULL,
  content_text text,
  content_media_url text,
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_score float8,
  moderation_categories jsonb,
  moderation_feedback text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create table for user interests and preferences
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  interests jsonb DEFAULT '[]'::jsonb,
  categories jsonb DEFAULT '[]'::jsonb,
  location_preferences jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create table for content recommendations
CREATE TABLE IF NOT EXISTS content_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  content_type text NOT NULL CHECK (content_type IN ('story', 'post', 'venue', 'event')),
  content_id text NOT NULL,
  score float8 NOT NULL,
  reason jsonb,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now()
);

-- Create table for recommendation feedback
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid REFERENCES content_recommendations(id),
  user_id uuid REFERENCES auth.users(id),
  feedback_type text NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'hide', 'report')),
  feedback_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Content creators can view their moderation status"
  ON content_moderation FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their interests"
  ON user_interests FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their recommendations"
  ON content_recommendations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can provide recommendation feedback"
  ON recommendation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_moderation_status 
  ON content_moderation(content_type, moderation_status);

CREATE INDEX IF NOT EXISTS idx_content_recommendations_user 
  ON content_recommendations(user_id, content_type, expires_at);

CREATE INDEX IF NOT EXISTS idx_user_interests_categories 
  ON user_interests USING gin((categories->'categories'));

-- Create function to check content moderation
CREATE OR REPLACE FUNCTION check_content_moderation(
  p_content_type text,
  p_content_text text,
  p_content_media_url text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_score float8;
  v_categories jsonb;
BEGIN
  -- Simulate AI moderation check
  -- In production, this would call an external AI service
  v_score := random();
  v_categories := jsonb_build_object(
    'spam', random(),
    'offensive', random(),
    'adult', random(),
    'violence', random()
  );
  
  v_result := jsonb_build_object(
    'status', CASE 
      WHEN v_score > 0.8 THEN 'rejected'
      WHEN v_score > 0.2 THEN 'pending'
      ELSE 'approved'
    END,
    'score', v_score,
    'categories', v_categories
  );
  
  -- Record moderation result
  INSERT INTO content_moderation (
    content_type,
    content_text,
    content_media_url,
    moderation_status,
    moderation_score,
    moderation_categories,
    processed_at
  ) VALUES (
    p_content_type,
    p_content_text,
    p_content_media_url,
    v_result->>'status',
    (v_result->>'score')::float8,
    v_result->'categories',
    now()
  );
  
  RETURN v_result;
END;
$$;

-- Create function to generate recommendations
CREATE OR REPLACE FUNCTION generate_recommendations(
  p_user_id uuid,
  p_content_type text,
  p_limit integer DEFAULT 10
) RETURNS SETOF content_recommendations
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_interests jsonb;
  v_location_prefs jsonb;
  v_recommendation record;
BEGIN
  -- Get user interests
  SELECT interests, location_preferences 
  INTO v_user_interests, v_location_prefs
  FROM user_interests 
  WHERE user_id = p_user_id;
  
  -- Delete expired recommendations
  DELETE FROM content_recommendations 
  WHERE user_id = p_user_id 
  AND expires_at < now();
  
  -- Generate new recommendations
  FOR v_recommendation IN 
    SELECT 
      gen_random_uuid() as id,
      p_user_id as user_id,
      p_content_type as content_type,
      -- This would be replaced with actual content selection logic
      'content-' || i as content_id,
      random() as score,
      jsonb_build_object(
        'interests_match', random(),
        'location_match', random(),
        'popularity', random()
      ) as reason,
      now() + interval '24 hours' as expires_at,
      now() as created_at
    FROM generate_series(1, p_limit) i
  LOOP
    RETURN NEXT v_recommendation;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_content_moderation TO authenticated;
GRANT EXECUTE ON FUNCTION generate_recommendations TO authenticated;
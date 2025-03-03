-- Create admin API schema
CREATE SCHEMA IF NOT EXISTS admin_api;

-- Create admin API views
CREATE OR REPLACE VIEW admin_api.story_analytics AS
SELECT 
  s.id as story_id,
  s.user_id,
  s.created_at,
  s.expires_at,
  s.view_count,
  sa.total_views,
  sa.unique_views,
  sa.completion_rate,
  sa.avg_view_time,
  sa.engagement_score,
  COUNT(sl.id) as likes,
  COUNT(sc.id) as comments
FROM stories s
LEFT JOIN story_analytics sa ON s.id = sa.story_id
LEFT JOIN story_likes sl ON s.id = sl.story_id
LEFT JOIN story_comments sc ON s.id = sc.story_id
GROUP BY s.id, sa.id;

CREATE OR REPLACE VIEW admin_api.moderation_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  moderation_status,
  COUNT(*) as count,
  AVG(moderation_score) as avg_score
FROM content_moderation
GROUP BY DATE_TRUNC('day', created_at), moderation_status;

-- Create admin API functions
CREATE OR REPLACE FUNCTION admin_api.get_user_stats(
  start_date timestamptz DEFAULT (now() - interval '30 days'),
  end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  date date,
  total_users bigint,
  active_users bigint,
  new_users bigint,
  stories_created bigint,
  total_engagement numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    DATE_TRUNC('day', d)::date as date,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE 
      WHEN au.last_sign_in_at >= d AND au.last_sign_in_at < d + interval '1 day'
      THEN u.id 
      END) as active_users,
    COUNT(DISTINCT CASE 
      WHEN u.created_at >= d AND u.created_at < d + interval '1 day'
      THEN u.id 
      END) as new_users,
    COUNT(DISTINCT s.id) as stories_created,
    COALESCE(SUM(sa.engagement_score), 0) as total_engagement
  FROM generate_series(start_date, end_date, interval '1 day') d
  LEFT JOIN auth.users u ON u.created_at < d + interval '1 day'
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN stories s ON s.user_id = u.id 
    AND s.created_at >= d 
    AND s.created_at < d + interval '1 day'
  LEFT JOIN story_analytics sa ON sa.story_id = s.id
  GROUP BY DATE_TRUNC('day', d)
  ORDER BY date;
$$;

-- Create admin API tokens table
CREATE TABLE IF NOT EXISTS admin_api.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token text NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  last_used_at timestamptz
);

-- Enable RLS
ALTER TABLE admin_api.api_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can manage API tokens"
  ON admin_api.api_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'));

-- Create function to generate API token
CREATE OR REPLACE FUNCTION admin_api.generate_api_token(
  p_name text,
  p_permissions jsonb DEFAULT '[]'::jsonb,
  p_expires_in interval DEFAULT interval '30 days'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Verify admin status
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Generate secure token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Store token
  INSERT INTO admin_api.api_tokens (
    name,
    token,
    permissions,
    expires_at,
    created_by
  ) VALUES (
    p_name,
    v_token,
    p_permissions,
    now() + p_expires_in,
    auth.uid()
  );
  
  RETURN v_token;
END;
$$;

-- Grant access to admin API schema
GRANT USAGE ON SCHEMA admin_api TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA admin_api TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA admin_api TO authenticated;
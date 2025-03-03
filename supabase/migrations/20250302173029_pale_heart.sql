-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('admin', 'moderator')),
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- Create moderation actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_users(id),
  content_type text NOT NULL CHECK (content_type IN ('story', 'post', 'comment')),
  content_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'delete')),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Create moderation queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('story', 'post', 'comment')),
  content_id text NOT NULL,
  priority integer DEFAULT 0,
  assigned_to uuid REFERENCES admin_users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can view admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can view moderation actions"
  ON moderation_actions FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can insert moderation actions"
  ON moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can view moderation queue"
  ON moderation_queue FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_users));

CREATE POLICY "Only admins can update moderation queue"
  ON moderation_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status 
  ON moderation_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_content 
  ON moderation_actions(content_type, content_id);

-- Create function to assign content to moderators
CREATE OR REPLACE FUNCTION assign_content_to_moderator(
  p_content_type text,
  p_content_id text,
  p_priority integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_moderator_id uuid;
  v_queue_id uuid;
BEGIN
  -- Find least busy moderator
  SELECT id INTO v_moderator_id
  FROM admin_users
  WHERE role = 'moderator'
  ORDER BY (
    SELECT COUNT(*)
    FROM moderation_queue
    WHERE assigned_to = admin_users.id
    AND status = 'in_progress'
  ) ASC
  LIMIT 1;
  
  -- Create queue entry
  INSERT INTO moderation_queue (
    content_type,
    content_id,
    priority,
    assigned_to,
    status
  ) VALUES (
    p_content_type,
    p_content_id,
    p_priority,
    v_moderator_id,
    'pending'
  )
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$;

-- Create function to record moderation action
CREATE OR REPLACE FUNCTION record_moderation_action(
  p_content_type text,
  p_content_id text,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_id uuid;
BEGIN
  -- Verify admin/moderator status
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Record action
  INSERT INTO moderation_actions (
    admin_id,
    content_type,
    content_id,
    action,
    reason
  ) VALUES (
    auth.uid(),
    p_content_type,
    p_content_id,
    p_action,
    p_reason
  )
  RETURNING id INTO v_action_id;
  
  -- Update content status based on action
  CASE p_content_type
    WHEN 'story' THEN
      UPDATE stories
      SET moderation_status = 
        CASE p_action
          WHEN 'approve' THEN 'approved'
          WHEN 'reject' THEN 'rejected'
          ELSE moderation_status
        END,
      moderation_feedback = p_reason
      WHERE id = p_content_id::uuid;
    
    WHEN 'comment' THEN
      UPDATE story_comments
      SET moderation_status = 
        CASE p_action
          WHEN 'approve' THEN 'approved'
          WHEN 'reject' THEN 'rejected'
          ELSE moderation_status
        END
      WHERE id = p_content_id::uuid;
  END CASE;
  
  -- Update queue status
  UPDATE moderation_queue
  SET 
    status = 'completed',
    updated_at = now()
  WHERE content_type = p_content_type
  AND content_id = p_content_id;
  
  RETURN v_action_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION assign_content_to_moderator TO authenticated;
GRANT EXECUTE ON FUNCTION record_moderation_action TO authenticated;
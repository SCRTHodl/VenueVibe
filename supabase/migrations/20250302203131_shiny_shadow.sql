-- Create function to handle story moderation with improved error handling
CREATE OR REPLACE FUNCTION handle_story_moderation(
  p_story_id uuid,
  p_admin_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_story record;
  v_result jsonb;
BEGIN
  -- Verify admin/moderator status
  IF NOT EXISTS (
    SELECT 1 FROM admin_panel.users
    WHERE id = p_admin_id AND role IN ('admin', 'moderator')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized - requires admin or moderator role'
    );
  END IF;

  -- Get story details
  SELECT * INTO v_story
  FROM stories
  WHERE id = p_story_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Story not found'
    );
  END IF;

  -- Validate action
  IF p_action NOT IN ('approve', 'reject', 'flag') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid moderation action'
    );
  END IF;

  -- Update story status
  UPDATE stories
  SET 
    moderation_status = CASE 
      WHEN p_action = 'approve' THEN 'approved'
      WHEN p_action = 'reject' THEN 'rejected'
      ELSE moderation_status
    END,
    moderation_feedback = CASE
      WHEN p_action IN ('reject', 'flag') AND p_reason IS NOT NULL 
      THEN p_reason
      ELSE moderation_feedback
    END,
    is_active = CASE
      WHEN p_action = 'reject' THEN false
      ELSE is_active
    END
  WHERE id = p_story_id;

  -- Log moderation action
  INSERT INTO admin_panel.activity_log (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    p_admin_id,
    'story_' || p_action,
    'story',
    p_story_id::text,
    jsonb_build_object(
      'previous_status', v_story.moderation_status,
      'new_status', CASE 
        WHEN p_action = 'approve' THEN 'approved'
        WHEN p_action = 'reject' THEN 'rejected'
        ELSE v_story.moderation_status
      END,
      'reason', p_reason,
      'story_data', jsonb_build_object(
        'user_id', v_story.user_id,
        'created_at', v_story.created_at,
        'expires_at', v_story.expires_at
      )
    )
  );

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'story_id', p_story_id,
    'action', p_action,
    'status', CASE 
      WHEN p_action = 'approve' THEN 'approved'
      WHEN p_action = 'reject' THEN 'rejected'
      ELSE v_story.moderation_status
    END
  );

  -- Add notification data if story was rejected
  IF p_action = 'reject' THEN
    v_result := v_result || jsonb_build_object(
      'should_notify', true,
      'notification_data', jsonb_build_object(
        'user_id', v_story.user_id,
        'reason', COALESCE(p_reason, 'Content violates community guidelines')
      )
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Create function to get moderation queue
CREATE OR REPLACE FUNCTION get_moderation_queue(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_status text DEFAULT 'pending'
)
RETURNS TABLE (
  story_id uuid,
  user_id uuid,
  content_type text,
  content text,
  media_url text,
  created_at timestamptz,
  expires_at timestamptz,
  moderation_status text,
  moderation_score float8,
  assigned_to uuid,
  priority integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as story_id,
    s.user_id,
    'story'::text as content_type,
    s.caption as content,
    s.media->0->>'url' as media_url,
    s.created_at,
    s.expires_at,
    s.moderation_status,
    cm.moderation_score,
    mq.assigned_to,
    COALESCE(mq.priority, 0) as priority
  FROM stories s
  LEFT JOIN content_moderation cm ON cm.content_id = s.id::text
  LEFT JOIN moderation_queue mq ON mq.content_id = s.id::text
  WHERE s.moderation_status = p_status
  AND s.expires_at > now()
  ORDER BY 
    COALESCE(mq.priority, 0) DESC,
    s.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create function to assign moderator
CREATE OR REPLACE FUNCTION assign_moderator(
  p_story_id uuid,
  p_moderator_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify moderator status
  IF NOT EXISTS (
    SELECT 1 FROM admin_panel.users
    WHERE id = p_moderator_id AND role IN ('admin', 'moderator')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid moderator ID'
    );
  END IF;

  -- Update or insert queue entry
  INSERT INTO moderation_queue (
    content_type,
    content_id,
    assigned_to,
    status
  ) VALUES (
    'story',
    p_story_id::text,
    p_moderator_id,
    'in_progress'
  )
  ON CONFLICT (content_id) DO UPDATE
  SET
    assigned_to = p_moderator_id,
    status = 'in_progress',
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'story_id', p_story_id,
    'moderator_id', p_moderator_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_story_moderation TO authenticated;
GRANT EXECUTE ON FUNCTION get_moderation_queue TO authenticated;
GRANT EXECUTE ON FUNCTION assign_moderator TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_moderation 
  ON stories(moderation_status, expires_at)
  WHERE moderation_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned 
  ON moderation_queue(assigned_to, status);
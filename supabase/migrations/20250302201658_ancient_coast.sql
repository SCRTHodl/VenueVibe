-- Create function to safely handle story submission
CREATE OR REPLACE FUNCTION submit_story(
  p_user_id uuid,
  p_media jsonb,
  p_caption text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_music text DEFAULT NULL,
  p_stickers jsonb DEFAULT NULL,
  p_filter text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_story_id uuid;
  v_moderation_result jsonb;
BEGIN
  -- Generate story ID
  v_story_id := gen_random_uuid();
  
  -- Check content moderation
  SELECT check_content_moderation(
    'story',
    p_caption,
    p_media->0->>'url'
  ) INTO v_moderation_result;
  
  -- Insert story with moderation status
  INSERT INTO stories (
    id,
    user_id,
    media,
    caption,
    location,
    music,
    stickers,
    filter,
    expires_at,
    moderation_status,
    moderation_feedback
  ) VALUES (
    v_story_id,
    p_user_id,
    p_media,
    p_caption,
    p_location,
    p_music,
    p_stickers,
    p_filter,
    now() + interval '24 hours',
    v_moderation_result->>'status',
    CASE 
      WHEN v_moderation_result->>'status' = 'rejected' 
      THEN 'Content violates community guidelines'
      ELSE NULL
    END
  );

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'story_id', v_story_id,
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

-- Create function to handle story moderation review
CREATE OR REPLACE FUNCTION review_story_moderation(
  p_story_id uuid,
  p_admin_id uuid,
  p_approved boolean,
  p_feedback text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_story_exists boolean;
BEGIN
  -- Verify admin status
  IF NOT EXISTS (
    SELECT 1 FROM admin_panel.users
    WHERE id = p_admin_id AND role IN ('admin', 'moderator')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;

  -- Check if story exists
  SELECT EXISTS (
    SELECT 1 FROM stories WHERE id = p_story_id
  ) INTO v_story_exists;

  IF NOT v_story_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Story not found'
    );
  END IF;

  -- Update story moderation status
  UPDATE stories
  SET 
    moderation_status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    moderation_feedback = p_feedback,
    is_active = p_approved
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
    CASE WHEN p_approved THEN 'approve_story' ELSE 'reject_story' END,
    'story',
    p_story_id::text,
    jsonb_build_object(
      'feedback', p_feedback,
      'previous_status', (SELECT moderation_status FROM stories WHERE id = p_story_id)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'story_id', p_story_id,
    'status', CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END
  );
END;
$$;

-- Create function to check story visibility
CREATE OR REPLACE FUNCTION check_story_visibility(p_story_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM stories
    WHERE id = p_story_id
    AND is_active = true
    AND expires_at > now()
    AND (
      moderation_status = 'approved'
      OR
      -- Allow pending stories to be visible to admins/moderators
      (moderation_status = 'pending' AND EXISTS (
        SELECT 1 FROM admin_panel.users
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
      ))
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION submit_story TO authenticated;
GRANT EXECUTE ON FUNCTION review_story_moderation TO authenticated;
GRANT EXECUTE ON FUNCTION check_story_visibility TO authenticated;

-- Create index for story visibility checks
CREATE INDEX IF NOT EXISTS idx_stories_visibility
  ON stories(is_active, moderation_status, expires_at)
  WHERE is_active = true;

-- Create policy for story visibility
CREATE POLICY "stories_visibility_policy"
  ON stories FOR SELECT
  TO authenticated
  USING (
    check_story_visibility(id)
  );
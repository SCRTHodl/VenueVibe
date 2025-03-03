-- Drop existing triggers if they exist
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS check_story_expiration ON stories;
  DROP TRIGGER IF EXISTS moderate_new_story ON stories;
  DROP TRIGGER IF EXISTS moderate_new_comment ON story_comments;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS handle_story_expiration();
DROP FUNCTION IF EXISTS moderate_story_content();
DROP FUNCTION IF EXISTS moderate_story_comment();

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

-- Create new triggers
CREATE TRIGGER check_story_expiration
  AFTER INSERT OR UPDATE ON stories
  FOR EACH STATEMENT
  EXECUTE FUNCTION handle_story_expiration();

CREATE TRIGGER moderate_new_story
  AFTER INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION moderate_story_content();

CREATE TRIGGER moderate_new_comment
  AFTER INSERT ON story_comments
  FOR EACH ROW
  EXECUTE FUNCTION moderate_story_comment();
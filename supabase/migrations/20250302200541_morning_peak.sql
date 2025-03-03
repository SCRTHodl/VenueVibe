-- Update content moderation function to require content_id
CREATE OR REPLACE FUNCTION check_content_moderation(
  p_content_type text,
  p_content_text text,
  p_content_media_url text DEFAULT NULL,
  p_content_id text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_score float8;
  v_categories jsonb;
  v_content_id text;
BEGIN
  -- Use provided content ID or generate one
  v_content_id := COALESCE(p_content_id, gen_random_uuid()::text);
  
  -- Simulate AI moderation check
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
    content_id,
    content_text,
    content_media_url,
    moderation_status,
    moderation_score,
    moderation_categories,
    processed_at
  ) VALUES (
    p_content_type,
    v_content_id,
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
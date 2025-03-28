-- Test the is_admin function
SELECT public.is_admin();

-- Test admin function to update user status
-- Replace the UUID with an actual user ID from your database
SELECT public.update_user_status(
  'ccba0009-db38-42df-9bb9-f87c5b4ecc96'::UUID, -- Replace with actual user ID
  'suspended',
  'Testing admin functions'
);

-- Test function to update settings
SELECT public.update_setting(
  'site.maintenance',
  '{"enabled": false, "message": "Site is operating normally"}'::JSONB,
  'Site maintenance mode settings'
);

-- View moderation actions to confirm logging
SELECT * FROM public.moderation_actions ORDER BY created_at DESC LIMIT 10;

-- Test relationships to see if they're working properly
SELECT 
  u.id, 
  u.email, 
  u.is_admin,
  (SELECT COUNT(*) FROM public.stories s WHERE s.user_id = u.id) as story_count
FROM 
  public.users u
LIMIT 10;

-- Fix the is_admin function to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Explicitly disable RLS checks
  RETURN (SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public' AND tablename = 'users'
  ) AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Alternative version using a simpler approach
-- Sometimes the simpler method works better
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_result BOOLEAN;
BEGIN
  SELECT (is_admin = true) INTO is_admin_result 
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

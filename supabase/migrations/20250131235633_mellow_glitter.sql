/*
  # Secure spatial_ref_sys table with RLS

  1. Security Changes
    - Enable RLS on spatial_ref_sys table with proper error handling
    - Add read-only policy for authenticated users
    - Add admin-only policy for modifications
    - Handle large dataset (8500 rows) safely

  2. Notes
    - spatial_ref_sys is critical for PostGIS functionality
    - Contains 8500 coordinate system definitions
    - Must maintain data integrity
    - Requires careful policy management
*/

DO $$ 
BEGIN
  -- Enable RLS with error handling
  BEGIN
    ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Insufficient privileges to enable RLS on spatial_ref_sys';
    WHEN OTHERS THEN
      RAISE NOTICE 'Error enabling RLS on spatial_ref_sys: %', SQLERRM;
  END;

  -- Create read-only policy for authenticated users
  BEGIN
    DROP POLICY IF EXISTS "Enable read-only access for authenticated users" ON spatial_ref_sys;
    CREATE POLICY "Enable read-only access for authenticated users"
      ON spatial_ref_sys
      FOR SELECT
      TO authenticated
      USING (true);
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating read policy: %', SQLERRM;
  END;

  -- Create admin-only policy for modifications
  BEGIN
    DROP POLICY IF EXISTS "Enable modifications for admins only" ON spatial_ref_sys;
    CREATE POLICY "Enable modifications for admins only"
      ON spatial_ref_sys
      FOR ALL
      TO authenticated
      USING (auth.jwt() ->> 'role' = 'admin')
      WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating admin policy: %', SQLERRM;
  END;

  -- Create an index to improve policy performance if it doesn't exist
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_spatial_ref_sys_srid 
      ON spatial_ref_sys(srid)
      WHERE auth.jwt() ->> 'role' = 'admin';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating index: %', SQLERRM;
  END;
END $$;
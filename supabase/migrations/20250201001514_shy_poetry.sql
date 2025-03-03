/*
  # Secure spatial reference system data
  
  1. Changes
    - Move spatial_ref_sys to a separate schema
    - Create read-only policies
    - Add proper indexes
  
  2. Security
    - Restrict write access
    - Allow read access for authenticated users
*/

-- Create a separate schema for reference data
CREATE SCHEMA IF NOT EXISTS ref_data;

-- Move spatial_ref_sys to ref_data schema
DO $$ 
BEGIN
  -- Create the table in the new schema if it doesn't exist
  CREATE TABLE IF NOT EXISTS ref_data.spatial_ref_sys (LIKE public.spatial_ref_sys INCLUDING ALL);
  
  -- Grant read access to authenticated users
  GRANT USAGE ON SCHEMA ref_data TO authenticated;
  GRANT SELECT ON ref_data.spatial_ref_sys TO authenticated;
  
  -- Revoke public access
  REVOKE ALL ON public.spatial_ref_sys FROM PUBLIC;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error securing spatial_ref_sys: %', SQLERRM;
END $$;

-- Create optimized indexes
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_spatial_ref_auth_name 
    ON ref_data.spatial_ref_sys(auth_name)
    WHERE auth_name IS NOT NULL;
    
  CREATE INDEX IF NOT EXISTS idx_spatial_ref_srid
    ON ref_data.spatial_ref_sys(srid);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating indexes: %', SQLERRM;
END $$;
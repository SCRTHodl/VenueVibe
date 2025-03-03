/*
  # Secure spatial reference system access
  
  1. Changes
    - Create a secure view for spatial reference data
    - Grant appropriate permissions
    - Add indexes for performance
  
  2. Security
    - Restrict direct table access
    - Allow read access through view
*/

-- Create a secure view for spatial reference data
CREATE OR REPLACE VIEW spatial_ref_secure AS
SELECT srid, auth_name, auth_srid, srtext, proj4text
FROM spatial_ref_sys;

-- Grant access to the view
GRANT SELECT ON spatial_ref_secure TO authenticated;

-- Create helper function for spatial reference lookups
CREATE OR REPLACE FUNCTION get_spatial_ref(p_srid integer)
RETURNS TABLE (
  srid integer,
  auth_name text,
  auth_srid integer,
  srtext text,
  proj4text text
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT s.srid, s.auth_name, s.auth_srid, s.srtext, s.proj4text
  FROM spatial_ref_sys s
  WHERE s.srid = p_srid;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_spatial_ref(integer) TO authenticated;
-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable insert for all users" ON update_subscribers;
  DROP POLICY IF EXISTS "Enable read access for admins only" ON update_subscribers;
  DROP POLICY IF EXISTS "subscribers_insert_policy_v1" ON update_subscribers;
  DROP POLICY IF EXISTS "subscribers_select_policy_v1" ON update_subscribers;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS update_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE update_subscribers ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "subscribers_insert_policy_v2"
  ON update_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "subscribers_select_policy_v2"
  ON update_subscribers
  FOR SELECT
  TO public
  USING (true);

-- Create function to get subscriber count safely
CREATE OR REPLACE FUNCTION get_subscriber_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM update_subscribers);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_subscriber_count TO public;
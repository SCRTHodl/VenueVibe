-- Create timestamp update function for token_economy schema
CREATE OR REPLACE FUNCTION token_economy.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

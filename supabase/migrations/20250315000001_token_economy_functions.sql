-- Migration for token_economy utility functions
-- Handles timestamp updates and other utility functions

-- Create timestamp update function
create or replace function token_economy.update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

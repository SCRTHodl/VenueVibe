-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Special events table
DROP TABLE IF EXISTS public.te_special_events CASCADE;
CREATE TABLE public.te_special_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  venue_id UUID,
  venue_name TEXT,
  image_url TEXT,
  capacity INTEGER,
  invite_code TEXT,
  theme_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Special offers table
DROP TABLE IF EXISTS public.te_special_offers;
CREATE TABLE public.te_special_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_amount DECIMAL(10, 2),
  discount_type TEXT,
  token_cost INTEGER,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  redemption_code TEXT,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint separately
ALTER TABLE public.te_special_offers
  ADD CONSTRAINT fk_special_offers_event
  FOREIGN KEY (event_id)
  REFERENCES public.te_special_events(id)
  ON DELETE CASCADE;

-- Add check constraint separately
ALTER TABLE public.te_special_offers
  ADD CONSTRAINT check_discount_type
  CHECK (discount_type IN ('percentage', 'fixed', 'tokenBased'));

-- Add RLS policies
ALTER TABLE public.te_special_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.te_special_offers ENABLE ROW LEVEL SECURITY;

-- Create view policies
DROP POLICY IF EXISTS "Allow all users to view special events" ON public.te_special_events;
CREATE POLICY "Allow all users to view special events"
  ON public.te_special_events
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow only admins to modify special events" ON public.te_special_events;
CREATE POLICY "Allow only admins to modify special events"
  ON public.te_special_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Allow all users to view special offers" ON public.te_special_offers;
CREATE POLICY "Allow all users to view special offers"
  ON public.te_special_offers
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow only admins to modify special offers" ON public.te_special_offers;
CREATE POLICY "Allow only admins to modify special offers"
  ON public.te_special_offers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

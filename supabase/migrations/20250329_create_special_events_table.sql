-- Create special_events table
CREATE TABLE IF NOT EXISTS public.special_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  venue_id TEXT,
  venue_name TEXT,
  image_url TEXT,
  capacity INTEGER,
  invite_code TEXT,
  is_active BOOLEAN DEFAULT true,
  theme_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.special_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for special_events
CREATE POLICY "Anyone can view active special events" 
  ON public.special_events FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can perform all operations on special events" 
  ON public.special_events 
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

-- Create special_offers table for the event offers
CREATE TABLE IF NOT EXISTS public.special_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.special_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_amount NUMERIC,
  discount_type TEXT DEFAULT 'percentage',
  token_cost INTEGER,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  redemption_code TEXT,
  max_redemptions INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for special_offers
CREATE POLICY "Anyone can view active special offers" 
  ON public.special_offers FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can perform all operations on special offers" 
  ON public.special_offers 
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

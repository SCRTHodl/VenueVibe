-- Create the featured_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.featured_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  featured_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  featured_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add the priority column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'featured_content' AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.featured_content ADD COLUMN priority INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for featured_content
CREATE POLICY "Anyone can view active featured content" 
  ON public.featured_content FOR SELECT 
  USING (active = true);

CREATE POLICY "Admins can perform all operations on featured content" 
  ON public.featured_content 
  USING (
    (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

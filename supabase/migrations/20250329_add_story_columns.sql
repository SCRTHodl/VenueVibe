-- Add missing columns to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS filter TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS viewed_by TEXT[] DEFAULT '{}';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS unlock_cost INTEGER DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_monetized BOOLEAN DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS monetization_status TEXT DEFAULT 'pending';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS gifts INTEGER DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS analytics JSONB DEFAULT '{}';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '{"count": 0, "latest": []}';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS stickers JSONB DEFAULT '[]';

-- Add comments to new columns
COMMENT ON COLUMN public.stories.caption IS 'Story caption/description';
COMMENT ON COLUMN public.stories.filter IS 'Applied filter effect';
COMMENT ON COLUMN public.stories.expires_at IS 'Story expiration timestamp';
COMMENT ON COLUMN public.stories.viewed IS 'Whether the story has been viewed';
COMMENT ON COLUMN public.stories.viewed_by IS 'Array of user IDs who have viewed the story';
COMMENT ON COLUMN public.stories.is_premium IS 'Whether the story is premium content';
COMMENT ON COLUMN public.stories.unlock_cost IS 'Cost in tokens to unlock premium content';
COMMENT ON COLUMN public.stories.is_monetized IS 'Whether the story is monetized';
COMMENT ON COLUMN public.stories.monetization_status IS 'Current monetization status';
COMMENT ON COLUMN public.stories.moderation_status IS 'Current moderation status';
COMMENT ON COLUMN public.stories.visibility IS 'Story visibility setting';
COMMENT ON COLUMN public.stories.gifts IS 'Number of gifts received';
COMMENT ON COLUMN public.stories.analytics IS 'Story analytics data';
COMMENT ON COLUMN public.stories.tags IS 'Array of story tags';
COMMENT ON COLUMN public.stories.comments IS 'Story comments data';
COMMENT ON COLUMN public.stories.stickers IS 'Story stickers data';

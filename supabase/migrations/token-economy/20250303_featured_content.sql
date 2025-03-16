-- Setup featured content table for AI-powered content management
CREATE TABLE IF NOT EXISTS public.featured_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('stories', 'events', 'locations')),
    priority INTEGER DEFAULT 10,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    metadata JSONB,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_insights JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions to authenticated users
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can modify featured content" 
ON public.featured_content
FOR ALL
USING (
    auth.uid() IN (
        SELECT user_id FROM public.admin_users WHERE active = TRUE
    )
);

CREATE POLICY "Anyone can view featured content" 
ON public.featured_content
FOR SELECT
USING (
    active = TRUE
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for timestamp updates
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.featured_content
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add index for faster queries
CREATE INDEX idx_featured_content_type ON public.featured_content(content_type);
CREATE INDEX idx_featured_content_active ON public.featured_content(active);

-- Create view for AI-recommended content
CREATE OR REPLACE VIEW ai_recommended_content AS
SELECT 
    fc.id,
    fc.content_id,
    fc.content_type,
    fc.priority,
    fc.ai_generated,
    fc.ai_insights,
    CASE 
        WHEN fc.content_type = 'stories' THEN (SELECT title FROM public.stories WHERE id = fc.content_id)
        WHEN fc.content_type = 'events' THEN (SELECT name FROM public.events WHERE id = fc.content_id)
        WHEN fc.content_type = 'locations' THEN (SELECT name FROM public.locations WHERE id = fc.content_id)
        ELSE 'Unknown'
    END AS content_name,
    fc.created_at,
    fc.updated_at
FROM 
    public.featured_content fc
WHERE 
    fc.active = TRUE
    AND fc.ai_generated = TRUE;

-- Create table to track AI content performance metrics
CREATE TABLE IF NOT EXISTS public.ai_content_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    engagement_duration INTERVAL,
    featured_id UUID REFERENCES public.featured_content(id),
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update AI content metrics
CREATE OR REPLACE FUNCTION update_content_metrics(
    p_content_id UUID,
    p_content_type TEXT,
    p_metric_type TEXT,
    p_value INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    IF p_metric_type = 'impression' THEN
        UPDATE public.ai_content_metrics
        SET impressions = impressions + p_value,
            measured_at = NOW()
        WHERE content_id = p_content_id AND content_type = p_content_type;
        
        -- Insert if doesn't exist
        IF NOT FOUND THEN
            INSERT INTO public.ai_content_metrics (content_id, content_type, impressions)
            VALUES (p_content_id, p_content_type, p_value);
        END IF;
    ELSIF p_metric_type = 'click' THEN
        UPDATE public.ai_content_metrics
        SET clicks = clicks + p_value,
            measured_at = NOW()
        WHERE content_id = p_content_id AND content_type = p_content_type;
        
        -- Insert if doesn't exist
        IF NOT FOUND THEN
            INSERT INTO public.ai_content_metrics (content_id, content_type, clicks)
            VALUES (p_content_id, p_content_type, p_value);
        END IF;
    ELSIF p_metric_type = 'conversion' THEN
        UPDATE public.ai_content_metrics
        SET conversions = conversions + p_value,
            measured_at = NOW()
        WHERE content_id = p_content_id AND content_type = p_content_type;
        
        -- Insert if doesn't exist
        IF NOT FOUND THEN
            INSERT INTO public.ai_content_metrics (content_id, content_type, conversions)
            VALUES (p_content_id, p_content_type, p_value);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add this to token economy schema permissions
GRANT USAGE ON SCHEMA public TO service_role, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.featured_content TO authenticated;
GRANT EXECUTE ON FUNCTION update_content_metrics TO authenticated;

-- Create table for AI instructions and knowledge base
CREATE TABLE IF NOT EXISTS ai_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code text REFERENCES invite_codes(code),
  name text NOT NULL,
  description text,
  instructions jsonb NOT NULL,
  knowledge_base jsonb,
  content_filters jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create table for AI-filtered content
CREATE TABLE IF NOT EXISTS ai_filtered_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction_id uuid REFERENCES ai_instructions(id),
  content_type text NOT NULL CHECK (content_type IN ('story', 'post', 'comment', 'venue')),
  content_id text NOT NULL,
  score float8 NOT NULL,
  matches jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_filtered_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage AI instructions"
  ON ai_instructions
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'));

CREATE POLICY "Anyone can view AI instructions"
  ON ai_instructions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "System can manage filtered content"
  ON ai_filtered_content
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_instructions_invite_code 
  ON ai_instructions(invite_code);
CREATE INDEX IF NOT EXISTS idx_ai_filtered_content_instruction 
  ON ai_filtered_content(instruction_id, content_type);

-- Create function to apply AI instructions
CREATE OR REPLACE FUNCTION apply_ai_instructions(
  p_content_type text,
  p_content_id text,
  p_content text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_instruction record;
  v_score float8;
  v_matches jsonb;
  v_result jsonb;
BEGIN
  -- Find matching instructions
  FOR v_instruction IN 
    SELECT * FROM ai_instructions 
    WHERE content_filters->p_content_type IS NOT NULL
  LOOP
    -- Apply content filters
    SELECT 
      -- Simulate AI scoring (0-1)
      random() as score,
      -- Simulate matching criteria
      jsonb_build_object(
        'keywords', v_instruction.content_filters->p_content_type->>'keywords',
        'categories', v_instruction.content_filters->p_content_type->>'categories',
        'sentiment', random()
      ) as matches
    INTO v_score, v_matches;
    
    -- Record filtered content
    INSERT INTO ai_filtered_content (
      instruction_id,
      content_type,
      content_id,
      score,
      matches
    ) VALUES (
      v_instruction.id,
      p_content_type,
      p_content_id,
      v_score,
      v_matches
    );
    
    -- Build result
    v_result := jsonb_build_object(
      'instruction_id', v_instruction.id,
      'score', v_score,
      'matches', v_matches,
      'should_show', v_score >= 0.5
    );
    
    -- Return first matching result
    RETURN v_result;
  END LOOP;
  
  -- No matching instructions
  RETURN jsonb_build_object(
    'score', 1,
    'should_show', true
  );
END;
$$;

-- Create function to get AI instructions for invite code
CREATE OR REPLACE FUNCTION get_ai_instructions(p_invite_code text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  instructions jsonb,
  knowledge_base jsonb,
  content_filters jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    name,
    description,
    instructions,
    knowledge_base,
    content_filters
  FROM ai_instructions
  WHERE invite_code = p_invite_code;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION apply_ai_instructions TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_instructions TO authenticated;

-- Insert sample AI instructions for Spring Training event
INSERT INTO ai_instructions (
  invite_code,
  name,
  description,
  instructions,
  knowledge_base,
  content_filters
) VALUES (
  'SPRING2025',
  'Spring Training 2025',
  'AI instructions for Spring Training content filtering and recommendations',
  jsonb_build_object(
    'content_types', ARRAY['story', 'post', 'comment', 'venue'],
    'tone', 'positive',
    'focus', 'baseball',
    'prohibited', ARRAY['politics', 'gambling', 'explicit']
  ),
  jsonb_build_object(
    'teams', ARRAY[
      'Arizona Diamondbacks',
      'Chicago Cubs',
      'Cincinnati Reds',
      'Cleveland Guardians',
      'Colorado Rockies',
      'Kansas City Royals',
      'Los Angeles Angels',
      'Los Angeles Dodgers',
      'Milwaukee Brewers',
      'Oakland Athletics',
      'San Diego Padres',
      'San Francisco Giants',
      'Seattle Mariners',
      'Texas Rangers',
      'Chicago White Sox'
    ],
    'venues', ARRAY[
      'American Family Fields of Phoenix',
      'Camelback Ranch',
      'Goodyear Ballpark',
      'Hohokam Stadium',
      'Peoria Sports Complex',
      'Salt River Fields',
      'Scottsdale Stadium',
      'Sloan Park',
      'Surprise Stadium',
      'Tempe Diablo Stadium'
    ],
    'events', ARRAY[
      'Fan Fest',
      'Autograph Sessions',
      'Meet & Greets',
      'Practice Sessions',
      'Exhibition Games'
    ]
  ),
  jsonb_build_object(
    'story', jsonb_build_object(
      'keywords', ARRAY['baseball', 'spring training', 'game', 'practice', 'stadium'],
      'categories', ARRAY['sports', 'baseball', 'events'],
      'min_score', 0.7
    ),
    'post', jsonb_build_object(
      'keywords', ARRAY['baseball', 'spring training', 'game', 'practice', 'stadium'],
      'categories', ARRAY['sports', 'baseball', 'events'],
      'min_score', 0.7
    ),
    'venue', jsonb_build_object(
      'keywords', ARRAY['stadium', 'ballpark', 'field', 'sports'],
      'categories', ARRAY['sports', 'baseball', 'dining'],
      'min_score', 0.6
    )
  )
) ON CONFLICT DO NOTHING;
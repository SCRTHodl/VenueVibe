-- Create tables for Agent Memory System
CREATE SCHEMA IF NOT EXISTS agent_system;

-- Main table for storing agent memories
CREATE TABLE agent_system.agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  context_type TEXT NOT NULL,
  content JSONB NOT NULL,
  importance INTEGER NOT NULL DEFAULT 5,
  vector_embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Create index on user_id for efficient queries
CREATE INDEX idx_agent_memories_user_id ON agent_system.agent_memories(user_id);

-- Create index on context_type for filtering by type
CREATE INDEX idx_agent_memories_context_type ON agent_system.agent_memories(context_type);

-- Create index on importance for prioritization
CREATE INDEX idx_agent_memories_importance ON agent_system.agent_memories(importance);

-- Create table for AI tools that agents can use
CREATE TABLE agent_system.agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tool_type TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"admin": true, "premium": true, "basic": false}'::jsonb,
  token_cost INTEGER NOT NULL DEFAULT 0,
  rate_limit JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for tracking tool usage
CREATE TABLE agent_system.tool_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tool_id UUID REFERENCES agent_system.agent_tools(id) NOT NULL,
  tokens_spent INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  request_data JSONB,
  result_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table to store agent behaviors linked to invite codes
CREATE TABLE agent_system.agent_behaviors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code_id UUID REFERENCES public.invite_codes(id),
  behavior_config JSONB NOT NULL,
  tools_allowed JSONB,
  memory_config JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE agent_system.agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_system.agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_system.tool_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_system.agent_behaviors ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can access only their own memories
CREATE POLICY "Users can access their own memories"
  ON agent_system.agent_memories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage tools
CREATE POLICY "Admins can manage tools"
  ON agent_system.agent_tools
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'));

-- Everyone can view tool information
CREATE POLICY "Everyone can view tools"
  ON agent_system.agent_tools
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can see their own tool usage history
CREATE POLICY "Users can see their own tool usage"
  ON agent_system.tool_usage_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage agent behaviors
CREATE POLICY "Admins can manage agent behaviors"
  ON agent_system.agent_behaviors
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users WHERE role = 'admin'));

-- Everyone can view agent behaviors
CREATE POLICY "Everyone can view agent behaviors"
  ON agent_system.agent_behaviors
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert some default tools
INSERT INTO agent_system.agent_tools (name, description, tool_type, token_cost)
VALUES
  ('web_search', 'Search the web for information', 'external_api', 5),
  ('image_generation', 'Generate images from text descriptions', 'ai_service', 10),
  ('database_query', 'Query internal database for information', 'internal_service', 2),
  ('summarization', 'Summarize large texts', 'ai_service', 3),
  ('group_chat', 'Participate in group conversations', 'social', 2);

-- Function to clean up expired memories
CREATE OR REPLACE FUNCTION agent_system.cleanup_expired_memories()
RETURNS void AS $$
BEGIN
  DELETE FROM agent_system.agent_memories
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prune low-importance memories when a user has too many
CREATE OR REPLACE FUNCTION agent_system.prune_low_importance_memories(p_user_id UUID, p_max_memories INTEGER DEFAULT 100)
RETURNS void AS $$
DECLARE
  memory_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO memory_count FROM agent_system.agent_memories WHERE user_id = p_user_id;
  
  IF memory_count > p_max_memories THEN
    DELETE FROM agent_system.agent_memories
    WHERE id IN (
      SELECT id FROM agent_system.agent_memories
      WHERE user_id = p_user_id
      ORDER BY importance ASC, created_at ASC
      LIMIT (memory_count - p_max_memories)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

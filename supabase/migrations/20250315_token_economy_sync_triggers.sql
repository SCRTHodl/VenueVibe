-- Migration: Token Economy Synchronization Triggers
-- Description: Creates triggers to keep public and token_economy schema data in sync

-- Safety check to make sure schemas exist
DO $$
DECLARE
  public_schema_exists boolean;
  token_economy_schema_exists boolean;
BEGIN
  -- Check if schemas exist
  SELECT EXISTS (
    SELECT FROM information_schema.schemata
    WHERE schema_name = 'public'
  ) INTO public_schema_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.schemata
    WHERE schema_name = 'token_economy'
  ) INTO token_economy_schema_exists;
  
  IF NOT token_economy_schema_exists THEN
    RAISE NOTICE 'token_economy schema does not exist, creating it now';
    CREATE SCHEMA token_economy;
  END IF;
END $$;

-- Create functions for synchronizing user tokens
CREATE OR REPLACE FUNCTION public.sync_user_token_to_token_economy()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync operation to avoid infinite loops
  IF (TG_ARGV[0]::boolean IS NOT NULL AND TG_ARGV[0]::boolean = TRUE) THEN
    RETURN NULL;
  END IF;

  -- For insert/update operations
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Insert or update the record in token_economy schema
    INSERT INTO token_economy.user_token_balances (
      user_id, balance, created_at, updated_at
    ) VALUES (
      NEW.user_id, NEW.balance, 
      COALESCE(NEW.created_at, NOW()), 
      COALESCE(NEW.updated_at, NOW())
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      balance = EXCLUDED.balance,
      updated_at = EXCLUDED.updated_at;
  -- For delete operations  
  ELSIF (TG_OP = 'DELETE') THEN
    -- Delete the record from token_economy schema
    DELETE FROM token_economy.user_token_balances
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION token_economy.sync_user_token_to_public()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync operation to avoid infinite loops
  IF (TG_ARGV[0]::boolean IS NOT NULL AND TG_ARGV[0]::boolean = TRUE) THEN
    RETURN NULL;
  END IF;

  -- For insert/update operations
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Insert or update the record in public schema
    INSERT INTO public.user_tokens (
      user_id, balance, created_at, updated_at
    ) VALUES (
      NEW.user_id, NEW.balance, 
      COALESCE(NEW.created_at, NOW()), 
      COALESCE(NEW.updated_at, NOW())
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      balance = EXCLUDED.balance,
      updated_at = EXCLUDED.updated_at;
  -- For delete operations  
  ELSIF (TG_OP = 'DELETE') THEN
    -- Delete the record from public schema
    DELETE FROM public.user_tokens
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create functions for synchronizing token transactions
CREATE OR REPLACE FUNCTION public.sync_token_transaction_to_token_economy()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync operation to avoid infinite loops
  IF (TG_ARGV[0]::boolean IS NOT NULL AND TG_ARGV[0]::boolean = TRUE) THEN
    RETURN NULL;
  END IF;

  -- For insert operations
  IF (TG_OP = 'INSERT') THEN
    -- Insert the record in token_economy schema
    INSERT INTO token_economy.token_transactions (
      id, user_id, amount, transaction_type, reference_id, description, metadata, created_at
    ) VALUES (
      NEW.id, NEW.user_id, NEW.amount, NEW.transaction_type, NEW.reference_id, NEW.description, NEW.metadata, 
      COALESCE(NEW.created_at, NOW())
    );
  -- For update operations  
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Update the record in token_economy schema
    UPDATE token_economy.token_transactions SET
      user_id = NEW.user_id,
      amount = NEW.amount,
      transaction_type = NEW.transaction_type,
      reference_id = NEW.reference_id,
      description = NEW.description,
      metadata = NEW.metadata
    WHERE id = NEW.id;
  -- For delete operations  
  ELSIF (TG_OP = 'DELETE') THEN
    -- Delete the record from token_economy schema
    DELETE FROM token_economy.token_transactions
    WHERE id = OLD.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION token_economy.sync_token_transaction_to_public()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync operation to avoid infinite loops
  IF (TG_ARGV[0]::boolean IS NOT NULL AND TG_ARGV[0]::boolean = TRUE) THEN
    RETURN NULL;
  END IF;

  -- For insert operations
  IF (TG_OP = 'INSERT') THEN
    -- Insert the record in public schema
    INSERT INTO public.token_transactions (
      id, user_id, amount, transaction_type, reference_id, description, metadata, created_at
    ) VALUES (
      NEW.id, NEW.user_id, NEW.amount, NEW.transaction_type, NEW.reference_id, NEW.description, NEW.metadata, 
      COALESCE(NEW.created_at, NOW())
    );
  -- For update operations  
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Update the record in public schema
    UPDATE public.token_transactions SET
      user_id = NEW.user_id,
      amount = NEW.amount,
      transaction_type = NEW.transaction_type,
      reference_id = NEW.reference_id,
      description = NEW.description,
      metadata = NEW.metadata
    WHERE id = NEW.id;
  -- For delete operations  
  ELSIF (TG_OP = 'DELETE') THEN
    -- Delete the record from public schema
    DELETE FROM public.token_transactions
    WHERE id = OLD.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create functions for synchronizing invite codes
CREATE OR REPLACE FUNCTION public.sync_invite_code_to_token_economy()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync operation to avoid infinite loops
  IF (TG_ARGV[0]::boolean IS NOT NULL AND TG_ARGV[0]::boolean = TRUE) THEN
    RETURN NULL;
  END IF;

  -- For insert/update operations
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Insert or update the record in token_economy schema
    INSERT INTO token_economy.invite_codes (
      id, code, user_id, status, token_reward, expires_at, created_at, used_at
    ) VALUES (
      NEW.id, NEW.code, NEW.user_id, NEW.status, NEW.token_reward, NEW.expires_at, 
      COALESCE(NEW.created_at, NOW()), NEW.used_at
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      code = EXCLUDED.code,
      user_id = EXCLUDED.user_id,
      status = EXCLUDED.status,
      token_reward = EXCLUDED.token_reward,
      expires_at = EXCLUDED.expires_at,
      used_at = EXCLUDED.used_at;
  -- For delete operations  
  ELSIF (TG_OP = 'DELETE') THEN
    -- Delete the record from token_economy schema
    DELETE FROM token_economy.invite_codes
    WHERE id = OLD.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION token_economy.sync_invite_code_to_public()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync operation to avoid infinite loops
  IF (TG_ARGV[0]::boolean IS NOT NULL AND TG_ARGV[0]::boolean = TRUE) THEN
    RETURN NULL;
  END IF;

  -- For insert/update operations
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Insert or update the record in public schema
    INSERT INTO public.invite_codes (
      id, code, user_id, status, token_reward, expires_at, created_at, used_at
    ) VALUES (
      NEW.id, NEW.code, NEW.user_id, NEW.status, NEW.token_reward, NEW.expires_at, 
      COALESCE(NEW.created_at, NOW()), NEW.used_at
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      code = EXCLUDED.code,
      user_id = EXCLUDED.user_id,
      status = EXCLUDED.status,
      token_reward = EXCLUDED.token_reward,
      expires_at = EXCLUDED.expires_at,
      used_at = EXCLUDED.used_at;
  -- For delete operations  
  ELSIF (TG_OP = 'DELETE') THEN
    -- Delete the record from public schema
    DELETE FROM public.invite_codes
    WHERE id = OLD.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create functions for synchronizing story token data
CREATE OR REPLACE FUNCTION public.sync_story_token_data_to_token_economy()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync operation to avoid infinite loops
  IF (TG_ARGV[0]::boolean IS NOT NULL AND TG_ARGV[0]::boolean = TRUE) THEN
    RETURN NULL;
  END IF;

  -- For insert/update operations
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Insert or update the record in token_economy schema
    INSERT INTO token_economy.story_token_data (
      id, story_id, user_id, tokens_earned, tokens_spent, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.story_id, NEW.user_id, NEW.tokens_earned, NEW.tokens_spent, 
      COALESCE(NEW.created_at, NOW()), COALESCE(NEW.updated_at, NOW())
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      story_id = EXCLUDED.story_id,
      user_id = EXCLUDED.user_id,
      tokens_earned = EXCLUDED.tokens_earned,
      tokens_spent = EXCLUDED.tokens_spent,
      updated_at = EXCLUDED.updated_at;
  -- For delete operations  
  ELSIF (TG_OP = 'DELETE') THEN
    -- Delete the record from token_economy schema
    DELETE FROM token_economy.story_token_data
    WHERE id = OLD.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION token_economy.sync_story_token_data_to_public()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if this is a sync operation to avoid infinite loops
  IF (TG_ARGV[0]::boolean IS NOT NULL AND TG_ARGV[0]::boolean = TRUE) THEN
    RETURN NULL;
  END IF;

  -- For insert/update operations
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Insert or update the record in public schema
    INSERT INTO public.story_token_data (
      id, story_id, user_id, tokens_earned, tokens_spent, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.story_id, NEW.user_id, NEW.tokens_earned, NEW.tokens_spent, 
      COALESCE(NEW.created_at, NOW()), COALESCE(NEW.updated_at, NOW())
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      story_id = EXCLUDED.story_id,
      user_id = EXCLUDED.user_id,
      tokens_earned = EXCLUDED.tokens_earned,
      tokens_spent = EXCLUDED.tokens_spent,
      updated_at = EXCLUDED.updated_at;
  -- For delete operations  
  ELSIF (TG_OP = 'DELETE') THEN
    -- Delete the record from public schema
    DELETE FROM public.story_token_data
    WHERE id = OLD.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the triggers on public schema tables
DO $$
DECLARE
  user_tokens_exists boolean;
  token_transactions_exists boolean;
  invite_codes_exists boolean;
  story_token_data_exists boolean;
BEGIN
  -- Check if public tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_tokens'
  ) INTO user_tokens_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'token_transactions'
  ) INTO token_transactions_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'invite_codes'
  ) INTO invite_codes_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'story_token_data'
  ) INTO story_token_data_exists;
  
  -- Create triggers on public tables if they exist
  IF user_tokens_exists THEN
    -- Drop existing triggers if they exist to avoid conflicts
    DROP TRIGGER IF EXISTS sync_user_tokens_trigger ON public.user_tokens;
    
    -- Create the new trigger
    CREATE TRIGGER sync_user_tokens_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_token_to_token_economy(FALSE);
    
    RAISE NOTICE 'Created sync trigger on public.user_tokens';
  END IF;
  
  IF token_transactions_exists THEN
    -- Drop existing triggers if they exist to avoid conflicts
    DROP TRIGGER IF EXISTS sync_token_transactions_trigger ON public.token_transactions;
    
    -- Create the new trigger
    CREATE TRIGGER sync_token_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.token_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_token_transaction_to_token_economy(FALSE);
    
    RAISE NOTICE 'Created sync trigger on public.token_transactions';
  END IF;
  
  IF invite_codes_exists THEN
    -- Drop existing triggers if they exist to avoid conflicts
    DROP TRIGGER IF EXISTS sync_invite_codes_trigger ON public.invite_codes;
    
    -- Create the new trigger
    CREATE TRIGGER sync_invite_codes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.invite_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_invite_code_to_token_economy(FALSE);
    
    RAISE NOTICE 'Created sync trigger on public.invite_codes';
  END IF;
  
  IF story_token_data_exists THEN
    -- Drop existing triggers if they exist to avoid conflicts
    DROP TRIGGER IF EXISTS sync_story_token_data_trigger ON public.story_token_data;
    
    -- Create the new trigger
    CREATE TRIGGER sync_story_token_data_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.story_token_data
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_story_token_data_to_token_economy(FALSE);
    
    RAISE NOTICE 'Created sync trigger on public.story_token_data';
  END IF;
END $$;

-- Create or replace the triggers on token_economy schema tables
DO $$
DECLARE
  te_schema_exists boolean;
  user_balances_exists boolean;
  token_transactions_exists boolean;
  invite_codes_exists boolean;
  story_token_data_exists boolean;
BEGIN
  -- Check if token_economy schema exists
  SELECT EXISTS (
    SELECT FROM information_schema.schemata
    WHERE schema_name = 'token_economy'
  ) INTO te_schema_exists;
  
  IF NOT te_schema_exists THEN
    RAISE NOTICE 'token_economy schema does not exist, skipping trigger creation';
    RETURN;
  END IF;
  
  -- Check if token_economy tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'token_economy'
    AND table_name = 'user_token_balances'
  ) INTO user_balances_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'token_economy'
    AND table_name = 'token_transactions'
  ) INTO token_transactions_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'token_economy'
    AND table_name = 'invite_codes'
  ) INTO invite_codes_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'token_economy'
    AND table_name = 'story_token_data'
  ) INTO story_token_data_exists;
  
  -- Create triggers on token_economy tables if they exist
  IF user_balances_exists THEN
    -- Drop existing triggers if they exist to avoid conflicts
    DROP TRIGGER IF EXISTS sync_user_balances_trigger ON token_economy.user_token_balances;
    
    -- Create the new trigger
    CREATE TRIGGER sync_user_balances_trigger
    AFTER INSERT OR UPDATE OR DELETE ON token_economy.user_token_balances
    FOR EACH ROW
    EXECUTE FUNCTION token_economy.sync_user_token_to_public(FALSE);
    
    RAISE NOTICE 'Created sync trigger on token_economy.user_token_balances';
  END IF;
  
  IF token_transactions_exists THEN
    -- Drop existing triggers if they exist to avoid conflicts
    DROP TRIGGER IF EXISTS sync_token_transactions_trigger ON token_economy.token_transactions;
    
    -- Create the new trigger
    CREATE TRIGGER sync_token_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON token_economy.token_transactions
    FOR EACH ROW
    EXECUTE FUNCTION token_economy.sync_token_transaction_to_public(FALSE);
    
    RAISE NOTICE 'Created sync trigger on token_economy.token_transactions';
  END IF;
  
  IF invite_codes_exists THEN
    -- Drop existing triggers if they exist to avoid conflicts
    DROP TRIGGER IF EXISTS sync_invite_codes_trigger ON token_economy.invite_codes;
    
    -- Create the new trigger
    CREATE TRIGGER sync_invite_codes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON token_economy.invite_codes
    FOR EACH ROW
    EXECUTE FUNCTION token_economy.sync_invite_code_to_public(FALSE);
    
    RAISE NOTICE 'Created sync trigger on token_economy.invite_codes';
  END IF;
  
  IF story_token_data_exists THEN
    -- Drop existing triggers if they exist to avoid conflicts
    DROP TRIGGER IF EXISTS sync_story_token_data_trigger ON token_economy.story_token_data;
    
    -- Create the new trigger
    CREATE TRIGGER sync_story_token_data_trigger
    AFTER INSERT OR UPDATE OR DELETE ON token_economy.story_token_data
    FOR EACH ROW
    EXECUTE FUNCTION token_economy.sync_story_token_data_to_public(FALSE);
    
    RAISE NOTICE 'Created sync trigger on token_economy.story_token_data';
  END IF;
END $$;

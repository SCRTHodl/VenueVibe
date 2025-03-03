-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own transactions" ON token_transactions;
  DROP POLICY IF EXISTS "Users can insert their own transactions" ON token_transactions;
  DROP POLICY IF EXISTS "Users can view their own wallet" ON user_wallets;
  DROP POLICY IF EXISTS "Users can update their own wallet" ON user_wallets;
  DROP POLICY IF EXISTS "token_transactions_select_policy" ON token_transactions;
  DROP POLICY IF EXISTS "token_transactions_insert_policy" ON token_transactions;
  DROP POLICY IF EXISTS "user_wallets_select_policy" ON user_wallets;
  DROP POLICY IF EXISTS "user_wallets_update_policy" ON user_wallets;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies for token transactions
CREATE POLICY "token_transactions_select_policy_v1"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "token_transactions_insert_policy_v1"
  ON token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create new policies for user wallets
CREATE POLICY "user_wallets_select_policy_v1"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_wallets_update_policy_v1"
  ON user_wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to handle token transactions without parameter name conflicts
CREATE OR REPLACE FUNCTION handle_token_transaction_v1(
  p_user_id uuid,
  p_type text,
  p_amount integer,
  p_reason text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id uuid;
  v_current_balance integer;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Check if spending would exceed balance
  IF p_type = 'spend' THEN
    SELECT balance INTO v_current_balance
    FROM user_wallets
    WHERE user_id = p_user_id;

    IF v_current_balance < p_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient balance'
      );
    END IF;
  END IF;

  -- Create transaction
  INSERT INTO token_transactions (
    user_id,
    type,
    amount,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_amount,
    p_reason,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  -- Update wallet balance
  PERFORM update_token_balance(
    p_user_id,
    p_amount,
    p_type = 'spend'
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'type', p_type,
    'amount', p_amount
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_token_transaction_v1 TO authenticated;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_type_v1
  ON token_transactions(user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_wallets_balance_v1
  ON user_wallets(user_id, balance);
-- Create table for payment processing
CREATE TABLE IF NOT EXISTS payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  stripe_session_id text UNIQUE NOT NULL,
  package_id text NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment sessions"
  ON payment_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create payment sessions"
  ON payment_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user 
  ON payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_stripe 
  ON payment_sessions(stripe_session_id);

-- Create function to handle successful payments
CREATE OR REPLACE FUNCTION handle_successful_payment(
  p_session_id text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_package_id text;
  v_token_amount integer;
BEGIN
  -- Update payment session
  UPDATE payment_sessions
  SET 
    status = 'completed',
    completed_at = now()
  WHERE stripe_session_id = p_session_id
  RETURNING package_id INTO v_package_id;
  
  -- Get token amount from package
  SELECT amount + COALESCE(bonus, 0)
  INTO v_token_amount
  FROM token_packages
  WHERE id = v_package_id;
  
  -- Add tokens to user's wallet
  PERFORM update_token_balance(p_user_id, v_token_amount, false);
  
  -- Record transaction
  INSERT INTO token_transactions (
    user_id,
    type,
    amount,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    'purchase',
    v_token_amount,
    'Token package purchase',
    jsonb_build_object(
      'package_id', v_package_id,
      'stripe_session_id', p_session_id
    )
  );
END;
$$;
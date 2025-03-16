-- Add triggers to update timestamps for token_economy tables
DROP TRIGGER IF EXISTS user_token_balances_update_timestamp ON token_economy.user_token_balances;
CREATE TRIGGER user_token_balances_update_timestamp
  BEFORE UPDATE ON token_economy.user_token_balances
  FOR EACH ROW
  EXECUTE FUNCTION token_economy.update_timestamp();

-- Add update timestamp trigger for promotion_settings
DROP TRIGGER IF EXISTS promotion_settings_update_timestamp ON token_economy.promotion_settings;
CREATE TRIGGER promotion_settings_update_timestamp
  BEFORE UPDATE ON token_economy.promotion_settings
  FOR EACH ROW
  EXECUTE FUNCTION token_economy.update_timestamp();

-- Add update timestamp trigger for token_transactions
DROP TRIGGER IF EXISTS token_transactions_update_timestamp ON token_economy.token_transactions;
CREATE TRIGGER token_transactions_update_timestamp
  BEFORE UPDATE ON token_economy.token_transactions
  FOR EACH ROW
  EXECUTE FUNCTION token_economy.update_timestamp();

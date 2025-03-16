-- Migration for token_economy triggers
-- Sets up triggers for automatic timestamp updates

-- Add triggers to update timestamps for token_economy tables
drop trigger if exists user_token_balances_update_timestamp on token_economy.user_token_balances;
create trigger user_token_balances_update_timestamp
  before update on token_economy.user_token_balances
  for each row
  execute function token_economy.update_timestamp();

-- Add update timestamp trigger for promotion_settings
drop trigger if exists promotion_settings_update_timestamp on token_economy.promotion_settings;
create trigger promotion_settings_update_timestamp
  before update on token_economy.promotion_settings
  for each row
  execute function token_economy.update_timestamp();

-- Add update timestamp trigger for token_transactions
drop trigger if exists token_transactions_update_timestamp on token_economy.token_transactions;
create trigger token_transactions_update_timestamp
  before update on token_economy.token_transactions
  for each row
  execute function token_economy.update_timestamp();

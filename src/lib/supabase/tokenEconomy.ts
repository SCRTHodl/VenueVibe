import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Use main Supabase instance for SottoTokenized
// The token economy schema is defined in the .env file
const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';

// Log initialization status for debugging
if (import.meta.env.DEV) {
  console.log('SottoTokenized using main Supabase with schema:', tokenEconomySchema);
}

// Use the main Supabase instance for SottoTokenized
export const tokenEconomySupabase = supabase;

// Re-export the main supabase instance for admin operations
export const tokenEconomyAdmin = supabase;

// No need for heartbeat as we're using the main Supabase instance

// Token transaction types
export type TokenTransactionType = 
  | 'creation_reward' 
  | 'view_reward' 
  | 'engagement_reward' 
  | 'tip' 
  | 'purchase' 
  | 'nft_minting';

// Token transaction interface
export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: TokenTransactionType;
  story_id?: string;
  recipient_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  metadata?: Record<string, any>;
}

// Get user token balance
export const getUserTokenBalance = async (userId: string): Promise<number> => {
  try {
    // First, check if we have this in local storage for quick access
    const cachedBalance = localStorage.getItem(`token_balance_${userId}`);
    const cachedTimestamp = localStorage.getItem(`token_balance_timestamp_${userId}`);
    
    // If we have a recent cached balance (less than 5 minutes old), use it
    if (cachedBalance && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return parseInt(cachedBalance, 10);
      }
    }
    
    // Otherwise, fetch from Supabase
    const { data, error } = await tokenEconomySupabase
      .from('user_token_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }

    // Cache the result
    if (data) {
      localStorage.setItem(`token_balance_${userId}`, data.balance.toString());
      localStorage.setItem(`token_balance_timestamp_${userId}`, Date.now().toString());
    }

    return data?.balance || 0;
  } catch (error) {
    console.error('Error in getUserTokenBalance:', error);
    return 0;
  }
};

// Create a token transaction
export const createTokenTransaction = async (
  transaction: Omit<TokenTransaction, 'id' | 'created_at' | 'status'>
): Promise<TokenTransaction | null> => {
  try {
    const { data, error } = await tokenEconomySupabase
      .from('token_transactions')
      .insert([{
        ...transaction,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating token transaction:', error);
      return null;
    }

    // Invalidate cached balance
    localStorage.removeItem(`token_balance_${transaction.user_id}`);
    if (transaction.recipient_id) {
      localStorage.removeItem(`token_balance_${transaction.recipient_id}`);
    }

    return data;
  } catch (error) {
    console.error('Error in createTokenTransaction:', error);
    return null;
  }
};

// Get story token data
export const getStoryTokenData = async (storyId: string) => {
  try {
    const { data, error } = await tokenEconomySupabase
      .from('story_token_data')
      .select('*')
      .eq('story_id', storyId)
      .single();

    if (error) {
      console.error('Error fetching story token data:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getStoryTokenData:', error);
    return null;
  }
};

// Send tokens as tip
export const sendTokenTip = async (
  senderId: string,
  recipientId: string,
  storyId: string,
  amount: number
): Promise<boolean> => {
  try {
    // Create the transaction
    const transaction = await createTokenTransaction({
      user_id: senderId,
      recipient_id: recipientId,
      story_id: storyId,
      amount: -amount, // Negative for sender
      transaction_type: 'tip',
      metadata: { tip_amount: amount }
    });

    if (!transaction) return false;

    // Create corresponding transaction for recipient
    const recipientTransaction = await createTokenTransaction({
      user_id: recipientId,
      amount: amount, // Positive for recipient
      transaction_type: 'tip',
      story_id: storyId,
      metadata: { from_user_id: senderId }
    });

    return !!recipientTransaction;
  } catch (error) {
    console.error('Error sending token tip:', error);
    return false;
  }
};

// Process creation reward
export const processCreationReward = async (
  userId: string,
  storyId: string,
  baseAmount: number,
  bonuses: Record<string, number>
): Promise<boolean> => {
  try {
    const totalAmount = baseAmount + Object.values(bonuses).reduce((sum, val) => sum + val, 0);
    
    const transaction = await createTokenTransaction({
      user_id: userId,
      amount: totalAmount,
      transaction_type: 'creation_reward',
      story_id: storyId,
      metadata: { base_amount: baseAmount, bonuses }
    });

    return !!transaction;
  } catch (error) {
    console.error('Error processing creation reward:', error);
    return false;
  }
};

// Subscribe to token balance changes
export const subscribeToTokenBalanceChanges = (
  userId: string,
  onBalanceChange: (newBalance: number) => void
) => {
  const subscription = tokenEconomySupabase
    .channel(`user_token_balances:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_token_balances',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        // Invalidate cache
        localStorage.removeItem(`token_balance_${userId}`);
        
        // Fetch new balance
        const newBalance = await getUserTokenBalance(userId);
        onBalanceChange(newBalance);
      }
    )
    .subscribe();

  return () => {
    tokenEconomySupabase.removeChannel(subscription);
  };
};

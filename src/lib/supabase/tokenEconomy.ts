import { supabase } from '../supabase';
import { getAdminClient } from '../../utils/supabaseClient';

// The token economy schema is defined in the .env file
const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';

// Log initialization status for debugging
if (import.meta.env.DEV) {
  console.log('Token economy using schema:', tokenEconomySchema);
}

// Get the admin client for token economy operations
export const tokenEconomyAdmin = getAdminClient();

// Regular client (only for public schema operations)
export const tokenEconomySupabase = supabase;

// No need for heartbeat as we're using the main Supabase instance

// Token transaction types
export type TokenTransactionType = 
  | 'creation_reward' 
  | 'view_reward' 
  | 'engagement_reward' 
  | 'tip' 
  | 'purchase' 
  | 'nft_minting'
  | 'premium_content_unlock'
  | 'premium_content_earnings';

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
    
    // Otherwise, fetch from Supabase using admin client for token_economy schema
    const { data, error } = await tokenEconomyAdmin
      .schema(tokenEconomySchema)
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
    // Use admin client for token transactions
    const { data, error } = await tokenEconomyAdmin
      .schema(tokenEconomySchema)
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
    // Use admin client for token_economy schema access
    const { data, error } = await tokenEconomyAdmin
      .schema(tokenEconomySchema)
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
        schema: tokenEconomySchema,
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

/**
 * Check if content is premium and if user has access
 * @param userId User ID checking for access
 * @param storyId Story ID to check
 * @returns Object with isPremium and hasAccess flags
 */
export const checkPremiumContentAccess = async (userId: string, storyId: string) => {
  try {
    // First check if the content is premium
    const storyData = await getStoryTokenData(storyId);
    
    if (!storyData || !storyData.premium_content) {
      return { isPremium: false, hasAccess: true, cost: 0 };
    }
    
    // Content is premium, check if user has already unlocked it
    const { data, error } = await tokenEconomySupabase
      .from(`${tokenEconomySchema}.content_access`)
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', storyId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking content access:', error);
    }
    
    return {
      isPremium: true,
      hasAccess: !!data,
      cost: storyData.unlock_cost || 15,
      creatorId: storyData.creator_id
    };
  } catch (error) {
    console.error('Error in checkPremiumContentAccess:', error);
    return { isPremium: false, hasAccess: true, cost: 0 };
  }
};

/**
 * Unlock premium content by spending tokens
 * @param userId User ID unlocking the content
 * @param storyId Story ID to unlock
 * @param creatorId Creator ID to receive earnings
 * @param cost Number of tokens to spend
 */
export const unlockPremiumContent = async (
  userId: string,
  storyId: string,
  creatorId: string,
  cost: number
) => {
  try {
    // Check if user already has access
    const { isPremium, hasAccess } = await checkPremiumContentAccess(userId, storyId);
    
    if (!isPremium || hasAccess) {
      return { success: true, message: 'Content already accessible' };
    }
    
    // Check user's token balance
    const userBalance = await getUserTokenBalance(userId);
    
    if (userBalance < cost) {
      return {
        success: false,
        message: `Not enough tokens. You need ${cost} tokens but have ${userBalance}.`
      };
    }
    
    // Deduct tokens from user
    const spendTransaction = await createTokenTransaction({
      user_id: userId,
      amount: -cost,
      transaction_type: 'premium_content_unlock',
      story_id: storyId,
      metadata: { storyId, cost }
    });
    
    if (!spendTransaction) {
      return { success: false, message: 'Transaction failed' };
    }
    
    // Calculate creator earnings (80% of cost)
    const creatorEarnings = Math.floor(cost * 0.8);
    
    // Credit creator
    if (creatorId) {
      await createTokenTransaction({
        user_id: creatorId,
        amount: creatorEarnings,
        transaction_type: 'premium_content_earnings',
        story_id: storyId,
        metadata: { from_user: userId, storyId }
      });
    }
    
    // Record the access
    const { error } = await tokenEconomySupabase
      .from(`${tokenEconomySchema}.content_access`)
      .insert({
        user_id: userId,
        content_id: storyId,
        access_type: 'premium_content',
        tokens_spent: cost
      });
    
    if (error) {
      console.error('Error recording content access:', error);
      return { success: false, message: 'Failed to record access' };
    }
    
    // Update story unlocks counter
    await tokenEconomySupabase
      .from(`${tokenEconomySchema}.story_token_data`)
      .update({ unlocks_count: tokenEconomySupabase.rpc('increment', { value: 1 }) })
      .eq('story_id', storyId);
    
    return {
      success: true,
      message: 'Content unlocked successfully',
      newBalance: userBalance - cost
    };
  } catch (error) {
    console.error('Error in unlockPremiumContent:', error);
    return { success: false, message: 'An error occurred' };
  }
};

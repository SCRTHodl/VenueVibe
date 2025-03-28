import { supabase } from './supabase';
import type { Database } from '../types/database.types';

export interface TokenTransaction {
  id: string;
  user_id: string;
  recipient_id?: string | null;
  amount: number;
  transaction_type: 'earn' | 'spend' | 'transfer';
  action: string;
  reference_id?: string | null;
  description?: string | null;
  created_at: string;
}

export interface TokenBalance {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  updated_at: string;
}

export interface UserTokenData {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  stories_count: number;
  nfts_count: number;
}

export type TokenReward = {
  base: number;
  locationBonus?: number;
  videoBonus?: number;
  tagBonus?: number;
  total: number;
};

/**
 * Token Economy Service
 * Provides methods for interacting with the token economy features
 */
export class TokenService {
  private static instance: TokenService;
  private schema: string;

  private constructor() {
    // Get schema from environment variable or use default
    this.schema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
  }

  /**
   * Get singleton instance of TokenService
   */
  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Get current user's token balance
   */
  public async getMyBalance(): Promise<TokenBalance | null> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from(`${this.schema}.user_token_balances`)
      .select('*')
      .eq('user_id', authUser.user.id)
      .single();

    if (error) {
      console.error('Error getting token balance:', error);
      return null;
    }

    return data as TokenBalance;
  }

  /**
   * Get user's token data including stories and NFTs count
   */
  public async getUserTokenData(userId?: string): Promise<UserTokenData | null> {
    const { data: authUser } = await supabase.auth.getUser();
    const targetUserId = userId || authUser.user?.id;
    
    if (!targetUserId) {
      console.error('No user ID provided and not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .rpc(`${this.schema}.get_user_token_data`, {
        p_user_id: targetUserId
      });

    if (error) {
      console.error('Error getting user token data:', error);
      return null;
    }

    return data as UserTokenData;
  }

  /**
   * Earn tokens for the current user
   * @param amount Amount of tokens to earn
   * @param action The action that earned tokens (e.g., 'story_creation')
   * @param referenceId Optional reference ID (e.g., story ID)
   * @param description Optional description
   */
  public async earnTokens(
    amount: number,
    action: string,
    referenceId?: string,
    description?: string
  ): Promise<number | null> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .rpc(`${this.schema}.earn_tokens`, {
        p_user_id: authUser.user.id,
        p_amount: amount,
        p_action: action,
        p_reference_id: referenceId || null,
        p_description: description || null
      });

    if (error) {
      console.error('Error inserting into token_transactions:', error);
      return null;
    }

    return data as number;
  }

  /**
   * Spend tokens from the current user
   * @param amount Amount of tokens to spend
   * @param action The action that spent tokens (e.g., 'nft_purchase')
   * @param recipientId Optional recipient user ID for transfers
   * @param referenceId Optional reference ID (e.g., NFT ID)
   * @param description Optional description
   */
  public async spendTokens(
    amount: number,
    action: string,
    recipientId?: string,
    referenceId?: string,
    description?: string
  ): Promise<number | null> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .rpc(`${this.schema}.spend_tokens`, {
        p_user_id: authUser.user.id,
        p_amount: amount,
        p_action: action,
        p_recipient_id: recipientId || null,
        p_reference_id: referenceId || null,
        p_description: description || null
      });

    if (error) {
      console.error('Error recording transaction:', error);
      return null;
    }

    return data as number;
  }

  /**
   * Get recent transactions for the current user
   * @param limit Maximum number of transactions to return
   */
  public async getMyTransactions(limit: number = 10): Promise<TokenTransaction[]> {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) {
      console.error('User not authenticated');
      return [];
    }

    const { data, error } = await supabase
      .from(`${this.schema}.token_transactions`)
      .select('*')
      .or(`user_id.eq.${authUser.user.id},recipient_id.eq.${authUser.user.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data as TokenTransaction[];
  }

  /**
   * Calculate token rewards for content creation
   * @param hasLocation Whether content includes location
   * @param hasVideo Whether content includes video
   * @param tagCount Number of tags added
   */
  public calculateReward(hasLocation: boolean, hasVideo: boolean, tagCount: number): TokenReward {
    const baseReward = Number(import.meta.env.VITE_TOKEN_CREATION_BASE_REWARD || 5);
    const locationBonus = hasLocation ? Number(import.meta.env.VITE_TOKEN_LOCATION_BONUS || 2) : 0;
    const videoBonus = hasVideo ? Number(import.meta.env.VITE_TOKEN_VIDEO_BONUS || 3) : 0;
    const tagBonus = tagCount * Number(import.meta.env.VITE_TOKEN_TAG_BONUS || 1);
    
    return {
      base: baseReward,
      locationBonus,
      videoBonus,
      tagBonus,
      total: baseReward + locationBonus + videoBonus + tagBonus
    };
  }

  /**
   * Admin: Get all user balances (admin only)
   */
  public async getAllUserBalances(): Promise<TokenBalance[]> {
    const { data, error } = await supabase
      .from(`${this.schema}.user_token_balances`)
      .select('*')
      .order('balance', { ascending: false });

    if (error) {
      console.error('Error fetching user balances:', error);
      return [];
    }

    return data as TokenBalance[];
  }

  /**
   * Admin: Get all transactions (admin only)
   * @param limit Maximum number of transactions to return
   */
  public async getAllTransactions(limit: number = 100): Promise<TokenTransaction[]> {
    const { data, error } = await supabase
      .from(`${this.schema}.token_transactions`)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }

    return data as TokenTransaction[];
  }
}

// Export a singleton instance for use throughout the app
export const tokenService = TokenService.getInstance();

// Example usage:
// 
// // Get user balance
// const balance = await tokenService.getMyBalance();
// 
// // Earn tokens for story creation
// const newBalance = await tokenService.earnTokens(
//   10, 
//   'story_creation',
//   'story-123',
//   'Created a story with location and video'
// );
// 
// // Calculate rewards for a new story
// const reward = tokenService.calculateReward(true, true, 3);
// console.log(`You earned ${reward.total} tokens!`);

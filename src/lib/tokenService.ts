import { supabase } from './supabase';
import type { Database } from '../types/database.types';
import { tableExists } from '../utils/robustDataFetching';

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
    this.initializeSchema();
  }

  /**
   * Initialize schema and verify availability
   */
  private async initializeSchema(): Promise<void> {
    try {
      // Check if the token_economy schema exists and is accessible
      const { data, error } = await supabase.rpc('get_schema_exists', {
        schema_name: this.schema
      });
      
      if (error || !data) {
        console.log(`Schema ${this.schema} not available, falling back to public schema`);
        this.schema = 'public';
      }
    } catch (error) {
      console.log('Error checking schema, falling back to public schema:', error);
      this.schema = 'public';
    }
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
   * Get user's token balance
   * @param userId Optional user ID (uses current user if not provided)
   */
  public async getMyBalance(userId?: string): Promise<TokenBalance | null> {
    const { data: authUser } = await supabase.auth.getUser();
    const targetUserId = userId || authUser.user?.id;
    
    if (!targetUserId) {
      console.log('No user ID provided and not authenticated');
      return null;
    }

    try {
      // First try with schema-prefixed table
      const { data, error } = await supabase
        .from(`${this.schema}.user_token_balances`)
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (!error && data) {
        return data as TokenBalance;
      }

      // If that fails, try with public schema
      const { data: publicData, error: publicError } = await supabase
        .from('user_token_balances')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (!publicError && publicData) {
        return publicData as TokenBalance;
      }

      // If both fail, return mock data in development
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log('Using mock token balance in development mode');
        return {
          user_id: targetUserId,
          balance: 1000, // Initial balance for development
          lifetime_earned: 1500,
          lifetime_spent: 500,
          updated_at: new Date().toISOString()
        };
      }
      
      console.error('Error getting token balance:', error || publicError);
      return null;
    } catch (error) {
      console.error('Exception getting token balance:', error);
      
      // Return mock data in development
      if (import.meta.env.DEV) {
        return {
          user_id: targetUserId,
          balance: 1000,
          lifetime_earned: 1500,
          lifetime_spent: 500,
          updated_at: new Date().toISOString()
        };
      }
      return null;
    }
  }

  /**
   * Check if a table exists in the database
   * @param tableName Name of the table to check
   * @param schema Optional schema name
   */
  private async tableExists(tableName: string, schema?: string): Promise<boolean> {
    try {
      const schemaToUse = schema || 'public';
      
      // Query information_schema to check if table exists
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', schemaToUse)
        .eq('table_name', tableName)
        .maybeSingle();
      
      if (error) {
        console.log(`Error checking if table ${schemaToUse}.${tableName} exists:`, error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.log(`Exception checking table existence:`, error);
      return false;
    }
  }
  
  /**
   * Safe RPC call with error handling
   * @param funcName Name of the RPC function to call
   * @param params Parameters to pass to the function
   * @param schema Optional schema name
   */
  private async safeRpcCall<T>(funcName: string, params: any, schema?: string): Promise<{ data: T | null, error: any }> {
    try {
      const qualifiedFuncName = schema ? `${schema}.${funcName}` : funcName;
      
      const { data, error } = await supabase.rpc(qualifiedFuncName, params);
      
      return { data: data as T, error };
    } catch (error) {
      console.log(`Exception calling RPC ${funcName}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Get user's token data including stories and NFTs count
   * Enhanced for better resilience against missing schemas, tables, and functions
   */
  public async getUserTokenData(userId?: string): Promise<UserTokenData | null> {
    const { data: authUser } = await supabase.auth.getUser();
    const targetUserId = userId || authUser.user?.id;
    
    if (!targetUserId) {
      console.log('No user ID provided and not authenticated');
      
      // Return mock data in development mode even when not authenticated
      if (import.meta.env.DEV) {
        return this.getMockTokenData();
      }
      
      return null;
    }

    try {
      // 1. Try with schema-prefixed RPC function
      const { data: schemaData, error: schemaError } = await this.safeRpcCall<UserTokenData>(
        'get_user_token_data',
        { p_user_id: targetUserId },
        this.schema
      );

      if (!schemaError && schemaData) {
        return schemaData;
      }

      // 2. Try with public schema (no prefix) if the first attempt fails
      if (this.schema !== 'public') {
        const { data: publicData, error: publicError } = await this.safeRpcCall<UserTokenData>(
          'get_user_token_data',
          { p_user_id: targetUserId }
        );

        if (!publicError && publicData) {
          return publicData;
        }
      }

      // 3. Try with a version-specific RPC function if available
      const { data: versionedData, error: versionedError } = await this.safeRpcCall<UserTokenData>(
        'get_user_token_data_v2',
        { p_user_id: targetUserId }
      );

      if (!versionedError && versionedData) {
        return versionedData;
      }

      // 4. Fallback: Use multiple queries to construct the data
      const balanceResult = await this.getMyBalance(targetUserId);
      
      // For stories and NFTs count, check if the respective tables exist first
      let storiesCount = 0;
      let nftsCount = 0;
      
      // Try to get stories count if the table exists
      const storiesTableExists = await this.tableExists('stories');
      if (storiesTableExists) {
        try {
          const { data: stories, error } = await supabase
            .from('stories')
            .select('id', { count: 'exact' })
            .eq('user_id', targetUserId);
          
          if (!error) {
            storiesCount = stories?.length || 0;
          }
        } catch (error) {
          console.log('Failed to get stories count:', error);
        }
      }
      
      // Try to get NFTs count if the table exists
      const nftsTableExists = await this.tableExists('user_nfts');
      if (nftsTableExists) {
        try {
          const { data: nfts, error } = await supabase
            .from('user_nfts')
            .select('id', { count: 'exact' })
            .eq('user_id', targetUserId);
          
          if (!error) {
            nftsCount = nfts?.length || 0;
          }
        } catch (error) {
          console.log('Failed to get NFTs count:', error);
        }
      }

      // Either use the balance result or return mock data in development
      if (balanceResult) {
        return {
          balance: balanceResult.balance,
          lifetime_earned: balanceResult.lifetime_earned,
          lifetime_spent: balanceResult.lifetime_spent,
          stories_count: storiesCount,
          nfts_count: nftsCount
        };
      } else if (import.meta.env.DEV) {
        return this.getMockTokenData(storiesCount, nftsCount);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user token data:', error);
      
      // Always return mock data in development
      if (import.meta.env.DEV) {
        return this.getMockTokenData();
      }
      return null;
    }
  }
  
  /**
   * Generate consistent mock token data for development
   */
  private getMockTokenData(storiesCount = 3, nftsCount = 2): UserTokenData {
    return {
      balance: 1000,
      lifetime_earned: 1500,
      lifetime_spent: 500,
      stories_count: storiesCount,
      nfts_count: nftsCount
    };
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

    try {
      // Try schema-prefixed RPC first
      try {
        const { data, error } = await supabase.rpc(`${this.schema}.earn_tokens`, {
          p_user_id: authUser.user.id,
          p_amount: amount,
          p_action: action,
          p_reference_id: referenceId || null,
          p_description: description || null
        });

        if (!error) {
          return data as number;
        }
      } catch (schemaError) {
        console.log('Schema-prefixed earn_tokens failed, trying public schema');
      }

      // Try public schema RPC
      try {
        const { data: publicData, error: publicError } = await supabase.rpc('earn_tokens', {
          p_user_id: authUser.user.id,
          p_amount: amount,
          p_action: action,
          p_reference_id: referenceId || null,
          p_description: description || null
        });

        if (!publicError) {
          return publicData as number;
        }
      } catch (publicError) {
        console.log('Public earn_tokens failed, using fallback');
      }

      // Fallback: Direct table updates
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log('Using mock earnTokens in development');
        // In dev, just pretend it worked and return the new balance
        const currentBalance = await this.getMyBalance();
        return (currentBalance?.balance || 0) + amount;
      }

      console.error('Error: Unable to earn tokens through any method');
      return null;
    } catch (error) {
      console.error('Exception earning tokens:', error);
      
      // Fallback for development mode
      if (import.meta.env.DEV) {
        console.log('Using mock earnTokens in development due to exception');
        return 1000 + amount; // Mock new balance
      }
      
      return null;
    }
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

    try {
      // Try schema-prefixed RPC first
      try {
        const { data, error } = await supabase.rpc(`${this.schema}.spend_tokens`, {
          p_user_id: authUser.user.id,
          p_amount: amount,
          p_action: action,
          p_recipient_id: recipientId || null,
          p_reference_id: referenceId || null,
          p_description: description || null
        });

        if (!error) {
          return data as number;
        }
      } catch (schemaError) {
        console.log('Schema-prefixed spend_tokens failed, trying public schema');
      }

      // Try public schema RPC
      try {
        const { data: publicData, error: publicError } = await supabase.rpc('spend_tokens', {
          p_user_id: authUser.user.id,
          p_amount: amount,
          p_action: action,
          p_recipient_id: recipientId || null,
          p_reference_id: referenceId || null,
          p_description: description || null
        });

        if (!publicError) {
          return publicData as number;
        }
      } catch (publicError) {
        console.log('Public spend_tokens failed, using fallback');
      }

      // Fallback for development
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log('Using mock spendTokens in development');
        // In dev, just pretend it worked and return the new balance
        const currentBalance = await this.getMyBalance();
        // Make sure they have enough tokens
        if ((currentBalance?.balance || 0) < amount) {
          console.error('Insufficient tokens');
          return null;
        }
        return (currentBalance?.balance || 0) - amount;
      }

      console.error('Error: Unable to spend tokens through any method');
      return null;
    } catch (error) {
      console.error('Exception spending tokens:', error);
      
      // Fallback for development
      if (import.meta.env.DEV) {
        const mockBalance = 1000;
        if (mockBalance < amount) {
          console.error('Insufficient tokens');
          return null;
        }
        return mockBalance - amount;
      }
      
      return null;
    }
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

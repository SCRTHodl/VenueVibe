import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
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
  private supabase: any;

  private constructor() {
    this.supabase = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  private async checkSchema(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('public.schemas')
        .select('schema_name')
        .eq('schema_name', 'token_economy');

      if (error) {
        console.error('Error checking schema existence:', error);
        return false;
      }

      return !!data?.length;
    } catch (error) {
      console.error('Error checking schema existence:', error);
      return false;
    }
  }

  private async init(): Promise<void> {
    try {
      const schemaExists = await this.checkSchema();
      if (schemaExists) {
        console.log('Using token_economy schema');
        this.supabase = createClient<Database>(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          {
            schema: 'token_economy'
          }
        );
      } else {
        console.log('Schema token_economy not available, falling back to public schema');
        this.supabase = createClient<Database>(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
      }
    } catch (error) {
      console.error('Error initializing token service:', error);
    }
  }

  public async initialize(): Promise<void> {
    await this.init();
  }

  private async tableExists(tableName: string, schema?: string): Promise<boolean> {
    try {
      const schemaToUse = schema || 'public';
      
      const { data, error } = await this.supabase
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
  
  private async safeRpcCall<T>(funcName: string, params: any, schema?: string): Promise<{ data: T | null, error: any }> {
    try {
      const qualifiedFuncName = schema ? `${schema}.${funcName}` : funcName;
      
      const { data, error } = await this.supabase.rpc(qualifiedFuncName, params);
      
      return { data: data as T, error };
    } catch (error) {
      console.log(`Exception calling RPC ${funcName}:`, error);
      return { data: null, error };
    }
  }

  public async getTokenBalance(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('user_tokens')
      .select('sum(amount) as total')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.total || 0;
  }

  public async mintNFT(userId: string, eventId: string, amount: number, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('event_nfts')
      .insert([{
        event_id: eventId,
        owner_id: userId,
        amount: amount,
        reason: reason,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
  }

  public async awardBadge(userId: string, eventId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('event_badges')
      .insert([{
        event_id: eventId,
        user_id: userId,
        reason: reason,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
  }

  public async getSpecialEvents(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('special_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  public async createSpecialEvent(event: any): Promise<void> {
    const { error } = await this.supabase
      .from('special_events')
      .insert({
        ...event,
        created_at: new Date().toISOString(),
        updated_by: 'admin',
        is_active: true
      });

    if (error) throw error;
  }

  public async updateSpecialEvent(eventId: string, updates: any): Promise<void> {
    const { error } = await this.supabase
      .from('special_events')
      .update({
        ...updates,
        updated_by: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) throw error;
  }

  public async deleteSpecialEvent(eventId: string): Promise<void> {
    const { error } = await this.supabase
      .from('special_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }

  /**
   * Get user's token balance
   * @param userId Optional user ID (uses current user if not provided)
   */
  public async getMyBalance(userId?: string): Promise<TokenBalance | null> {
    const { data: authUser } = await this.supabase.auth.getUser();
    const targetUserId = userId || authUser.user?.id;
    
    if (!targetUserId) {
      console.log('No user ID provided and not authenticated');
      return null;
    }

    try {
      // First try with schema-prefixed table
      const { data, error } = await this.supabase
        .from(`${this.supabase.schema}.user_token_balances`)
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (!error && data) {
        return data as TokenBalance;
      }

      // If that fails, try with public schema
      const { data: publicData, error: publicError } = await this.supabase
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
   * Get user's token data including stories and NFTs count
   * Enhanced for better resilience against missing schemas, tables, and functions
   */
  public async getUserTokenData(userId?: string): Promise<UserTokenData | null> {
    const { data: authUser } = await this.supabase.auth.getUser();
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
        this.supabase.schema
      );

      if (!schemaError && schemaData) {
        return schemaData;
      }

      // 2. Try with public schema (no prefix) if the first attempt fails
      if (this.supabase.schema !== 'public') {
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
          const { data: stories, error } = await this.supabase
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
          const { data: nfts, error } = await this.supabase
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
    const { data: authUser } = await this.supabase.auth.getUser();
    if (!authUser.user) {
      console.error('User not authenticated');
      return null;
    }

    try {
      // Try schema-prefixed RPC first
      try {
        const { data, error } = await this.supabase.rpc(`${this.supabase.schema}.earn_tokens`, {
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
        const { data: publicData, error: publicError } = await this.supabase.rpc('earn_tokens', {
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
    const { data: authUser } = await this.supabase.auth.getUser();
    if (!authUser.user) {
      console.error('User not authenticated');
      return null;
    }

    try {
      // Try schema-prefixed RPC first
      try {
        const { data, error } = await this.supabase.rpc(`${this.supabase.schema}.spend_tokens`, {
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
        const { data: publicData, error: publicError } = await this.supabase.rpc('spend_tokens', {
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
    const { data: authUser } = await this.supabase.auth.getUser();
    if (!authUser.user) {
      console.error('User not authenticated');
      return [];
    }

    const { data, error } = await this.supabase
      .from(`${this.supabase.schema}.token_transactions`)
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
    const { data, error } = await this.supabase
      .from(`${this.supabase.schema}.user_token_balances`)
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
    const { data, error } = await this.supabase
      .from(`${this.supabase.schema}.token_transactions`)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }

    return data as TokenTransaction[];
  }

  /**
   * Mint a unique NFT for a special event
   * @param eventId The ID of the event
   * @param userId The ID of the user receiving the NFT
   * @param metadata Additional metadata for the NFT
   */
  public async mintEventNFT(eventId: string, userId: string, metadata: Record<string, any> = {}): Promise<string> {
    try {
      const { data: nftData, error } = await this.supabase
        .from('event_nfts')
        .insert([
          {
            event_id: eventId,
            owner_id: userId,
            metadata: {
              ...metadata,
              minted_at: new Date().toISOString(),
              event_id: eventId
            }
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      return nftData.id;
    } catch (error) {
      console.error('Error minting event NFT:', error);
      throw error;
    }
  }

  /**
   * Award a badge to a user for a special event
   * @param eventId The ID of the event
   * @param userId The ID of the user receiving the badge
   * @param badgeType The type of badge (attendance, participant, contributor)
   * @param metadata Additional metadata for the badge
   */
  public async awardEventBadge(
    eventId: string,
    userId: string,
    badgeType: 'attendance' | 'participant' | 'contributor',
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      const { data: badgeData, error } = await this.supabase
        .from('event_badges')
        .insert([
          {
            event_id: eventId,
            user_id: userId,
            badge_type: badgeType,
            metadata: {
              ...metadata,
              awarded_at: new Date().toISOString(),
              event_id: eventId
            }
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      return badgeData.id;
    } catch (error) {
      console.error('Error awarding event badge:', error);
      throw error;
    }
  }

  /**
   * Get all NFTs owned by a user for a specific event
   * @param eventId The ID of the event
   * @param userId The ID of the user
   */
  public async getUserEventNFTs(eventId: string, userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('event_nfts')
      .select('*')
      .eq('event_id', eventId)
      .eq('owner_id', userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all badges earned by a user for a specific event
   * @param eventId The ID of the event
   * @param userId The ID of the user
   */
  public async getUserEventBadges(eventId: string, userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('event_badges')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  private async checkSchema(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('public.schemas')
        .select('schema_name')
        .eq('schema_name', 'token_economy');

      if (error) {
        console.error('Error checking schema existence:', error);
        return false;
      }

      return !!data?.length;
    } catch (error) {
      console.error('Error checking schema existence:', error);
      return false;
    }
  }

  private async init(): Promise<void> {
    try {
      const schemaExists = await this.checkSchema();
      if (schemaExists) {
        console.log('Using token_economy schema');
        this.supabase = createClient<Database>(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          {
            schema: 'token_economy'
          }
        );
      } else {
        console.log('Schema token_economy not available, falling back to public schema');
        this.supabase = createClient<Database>(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
      }
    } catch (error) {
      console.error('Error initializing token service:', error);
    }
  }
}

// Export a singleton instance for use throughout the app
export const tokenService = TokenService.getInstance();

// Example usage:
// const nftId = await tokenService.mintEventNFT('event-123', 'user-456', { name: 'Spring Launch Party NFT' });
// const badgeId = await tokenService.awardEventBadge('event-123', 'user-456', 'attendance', { name: 'Spring Launch Attendee' });

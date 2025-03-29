import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Extend the imported Database type with our specific tables
type ExtendedDatabase = Database & {
  public: {
    Tables: {
      user_token_balances: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          lifetime_earned: number;
          lifetime_spent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          lifetime_earned?: number;
          lifetime_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      token_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          transaction_type: string;
          created_at: string;
          reference_id?: string;
          description?: string;
          metadata?: Record<string, any>;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          transaction_type: string;
          created_at?: string;
          reference_id?: string;
          description?: string;
          metadata?: Record<string, any>;
        };
      };
      event_nfts: {
        Row: {
          id: string;
          event_id: string;
          token_id: string;
          owner_id: string;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          token_id: string;
          owner_id: string;
          metadata: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_badges: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          badge_type: 'attendance' | 'participant' | 'contributor';
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          badge_type: 'attendance' | 'participant' | 'contributor';
          metadata: Record<string, any>;
          created_at?: string;
        };
      };
      special_events: {
        Row: {
          id: string;
          name: string;
          description: string;
          start_date: string;
          end_date: string;
          location: string;
          theme?: string;
          special_offers: any[];
          created_at: string;
          updated_at: string;
          updated_by: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          start_date: string;
          end_date: string;
          location: string;
          theme?: string;
          special_offers: any[];
          created_at?: string;
          updated_at?: string;
          updated_by?: string;
          is_active?: boolean;
        };
      };
    };
  };
};

export class TokenService {
  private static instance: TokenService;
  private supabase: any;

  private constructor() {
    this.supabase = createClient<ExtendedDatabase>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  public async getTokenBalance(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('user_token_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.balance || 0;
  }

  public async mintNFT(userId: string, eventId: string, metadata: Record<string, any>): Promise<void> {
    const { error } = await this.supabase
      .from('event_nfts')
      .insert([{
        event_id: eventId,
        token_id: `event-${eventId}-nft-${Date.now()}`,
        owner_id: userId,
        metadata: metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (error) throw error;
  }

  public async awardBadge(userId: string, eventId: string, badgeType: 'attendance' | 'participant' | 'contributor', metadata: Record<string, any>): Promise<void> {
    const { error } = await this.supabase
      .from('event_badges')
      .insert([{
        event_id: eventId,
        user_id: userId,
        badge_type: badgeType,
        metadata: metadata,
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

  public async mintEventNFT(eventId: string, userId: string, metadata: Record<string, any> = {}): Promise<string> {
    const { data, error } = await this.supabase
      .from('event_nfts')
      .insert([{
        event_id: eventId,
        token_id: `event-${eventId}-nft-${Date.now()}`,
        owner_id: userId,
        metadata: metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || '';
  }

  public async awardEventBadge(eventId: string, userId: string, badgeType: 'attendance' | 'participant' | 'contributor', metadata: Record<string, any> = {}): Promise<string> {
    const { data, error } = await this.supabase
      .from('event_badges')
      .insert([{
        event_id: eventId,
        user_id: userId,
        badge_type: badgeType,
        metadata: metadata,
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || '';
  }

  public async getUserEventNFTs(eventId: string, userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('event_nfts')
      .select('*')
      .eq('event_id', eventId)
      .eq('owner_id', userId);

    if (error) throw error;
    return data || [];
  }

  public async getUserEventBadges(eventId: string, userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('event_badges')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }
}

// Export a singleton instance for use throughout the app
export const tokenService = TokenService.getInstance();

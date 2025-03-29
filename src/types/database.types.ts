/**
 * This file contains TypeScript types for the database schema
 * It is referenced by tokenService.ts and other files
 */

export interface Database {
  public: {
    Tables: {
      // Token economy tables
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
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          transaction_type?: string;
          created_at?: string;
          reference_id?: string;
          description?: string;
          metadata?: Record<string, any>;
        };
      };
      token_wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
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
        Update: {
          id?: string;
          event_id?: string;
          token_id?: string;
          owner_id?: string;
          metadata?: Record<string, any>;
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
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          badge_type?: 'attendance' | 'participant' | 'contributor';
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
    };
  };
}

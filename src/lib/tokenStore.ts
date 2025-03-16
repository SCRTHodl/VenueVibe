import { supabase } from './supabase';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAdminClient } from '../utils/supabaseClient';

// Get admin client for token_economy schema access
const tokenEconomyAdmin = getAdminClient();
const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';

// Update token economy constants to adjust costs and rewards
export const TOKEN_ECONOMY = {
  // Token costs for different actions
  COSTS: {
    PROMOTE_STORY: 5, // Base cost for story promotion
    BOOST_POST: 10,   // Base cost for post boost
    PREMIUM_CONTENT: 15, // Cost to access premium content
    SPECIAL_FEATURES: 20, // Cost for special features
    MIN_PREMIUM: 5,  // Minimum cost for premium content
    MAX_PREMIUM: 100 // Maximum cost for premium content
  },
  
  // Token rewards for different actions
  REWARDS: {
    POST_LIKE: 1,     // Reward for receiving a like
    POST_SHARE: 3,    // Reward for having content shared
    POST_COMMENT: 2,  // Reward for receiving a comment
    DAILY_STREAK: 5,  // Reward for maintaining daily activity
    VIRAL_POST: 25,   // Reward for achieving viral status
    SHARE_CONTENT: 2, // Reward for sharing content
    CHECK_IN: 5,      // Reward for checking in at a location
    ATTEND_EVENT: 10, // Reward for attending an event
    INVITE_FRIEND: 20, // Reward for inviting a friend
    COMPLETE_CHALLENGE: 15 // Reward for completing a challenge
  },
  
  // Token purchase packages
  PACKAGES: [
    { id: 'starter', name: 'Starter Pack', amount: 100, price: 4.99, bonus: 0 },
    { id: 'popular', name: 'Popular Pack', amount: 500, price: 19.99, bonus: 50 },
    { id: 'premium', name: 'Premium Pack', amount: 1000, price: 34.99, bonus: 150 },
    { id: 'ultimate', name: 'Ultimate Pack', amount: 5000, price: 99.99, bonus: 1000 }
  ]
};

// Token store interface
interface TokenState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Transaction[];
  isInitialized: boolean;
  isLoading: boolean;
  
  // Actions
  initializeWallet: () => Promise<void>;
  earnTokens: (amount: number, reason: string, locationId?: string) => Promise<boolean>;
  spendTokens: (amount: number, reason: string, itemId?: string) => Promise<boolean>;
  purchaseTokens: (packageId: string, paymentMethod?: string) => Promise<boolean>;
  getTransactionHistory: () => Promise<Transaction[]>;
  syncWithServer: () => Promise<void>;
}

// Transaction interface
export interface Transaction {
  id: string;
  userId?: string;
  type: 'earn' | 'spend' | 'purchase';
  amount: number;
  reason: string;
  metadata?: {
    locationId?: string;
    itemId?: string;
    packageId?: string;
  };
  timestamp: string;
}

// Create a token store with persistence
export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      transactions: [],
      isInitialized: false,
      isLoading: false,
      
      initializeWallet: async () => {
        if (get().isInitialized) return;
        
        set({ isLoading: true });
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const { data, error } = await tokenEconomyAdmin
              .schema(tokenEconomySchema)
              .from('user_wallets')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
              
            if (error && error.code !== 'PGRST116') {
              console.error('Error fetching wallet:', error);
            }
            
            if (data) {
              set({
                balance: data.balance,
                totalEarned: data.total_earned,
                totalSpent: data.total_spent,
                isInitialized: true
              });
              
              await get().getTransactionHistory();
            } else {
              await get().earnTokens(25, 'Welcome bonus');
              set({ isInitialized: true });
            }
          } else {
            if (get().balance === 0 && get().transactions.length === 0) {
              await get().earnTokens(10, 'Guest welcome');
            }
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error('Error initializing wallet:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      earnTokens: async (amount, reason, locationId) => {
        if (amount <= 0) return false;
        
        try {
          const transaction: Transaction = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'earn',
            amount,
            reason,
            metadata: locationId ? { locationId } : undefined,
            timestamp: new Date().toISOString()
          };
          
          set(state => ({
            balance: state.balance + amount,
            totalEarned: state.totalEarned + amount,
            transactions: [transaction, ...state.transactions].slice(0, 100)
          }));
          
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            transaction.userId = session.user.id;
            
            const { error: txError } = await supabase
              .from('token_economy.token_transactions')
              .insert([{
                user_id: session.user.id,
                type: 'earn',
                amount,
                reason,
                metadata: locationId ? { locationId } : null
              }]);
            
            if (txError) console.error('Error recording transaction:', txError);
            
            const { error: walletError } = await supabase.rpc('update_token_balance', {
              user_id: session.user.id,
              amount_change: amount,
              is_spend: false
            });
            
            if (walletError) console.error('Error updating wallet:', walletError);
          }
          
          return true;
        } catch (error) {
          console.error('Error earning tokens:', error);
          return false;
        }
      },
      
      spendTokens: async (amount, reason, itemId) => {
        if (amount <= 0) return false;
        if (get().balance < amount) return false;
        
        try {
          const transaction: Transaction = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'spend',
            amount: -amount,
            reason,
            metadata: itemId ? { itemId } : undefined,
            timestamp: new Date().toISOString()
          };
          
          set(state => ({
            balance: state.balance - amount,
            totalSpent: state.totalSpent + amount,
            transactions: [transaction, ...state.transactions].slice(0, 100)
          }));
          
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            transaction.userId = session.user.id;
            
            const { error: txError } = await supabase
              .from('token_economy.token_transactions')
              .insert([{
                user_id: session.user.id,
                type: 'spend',
                amount: -amount,
                reason,
                metadata: itemId ? { itemId } : null
              }]);
            
            if (txError) console.error('Error recording transaction:', txError);
            
            const { error: walletError } = await supabase.rpc('update_token_balance', {
              user_id: session.user.id,
              amount_change: amount,
              is_spend: true
            });
            
            if (walletError) console.error('Error updating wallet:', walletError);
          }
          
          return true;
        } catch (error) {
          console.error('Error spending tokens:', error);
          return false;
        }
      },
      
      purchaseTokens: async (packageId, paymentMethod = 'card') => {
        const tokenPackage = TOKEN_ECONOMY.PACKAGES.find(pkg => pkg.id === packageId);
        if (!tokenPackage) return false;
        
        try {
          const totalTokens = tokenPackage.amount + tokenPackage.bonus;
          
          const transaction: Transaction = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'purchase',
            amount: totalTokens,
            reason: `Purchased ${tokenPackage.name}`,
            metadata: { packageId },
            timestamp: new Date().toISOString()
          };
          
          set(state => ({
            balance: state.balance + totalTokens,
            totalEarned: state.totalEarned + totalTokens,
            transactions: [transaction, ...state.transactions].slice(0, 100)
          }));
          
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            transaction.userId = session.user.id;
            
            const { error: txError } = await supabase
              .from('token_economy.token_transactions')
              .insert([{
                user_id: session.user.id,
                type: 'purchase',
                amount: totalTokens,
                reason: `Purchased ${tokenPackage.name}`,
                metadata: { 
                  packageId,
                  price: tokenPackage.price,
                  paymentMethod
                }
              }]);
            
            if (txError) console.error('Error recording purchase:', txError);
            
            const { error: walletError } = await supabase.rpc('update_token_balance', {
              user_id: session.user.id,
              amount_change: totalTokens,
              is_spend: false
            });
            
            if (walletError) console.error('Error updating wallet:', walletError);
          }
          
          return true;
        } catch (error) {
          console.error('Error purchasing tokens:', error);
          return false;
        }
      },
      
      getTransactionHistory: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return get().transactions;
        
        try {
          const { data, error } = await supabase
            .from('token_economy.token_transactions')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(100);
            
          if (error) throw error;
          
          if (data) {
            const transactions: Transaction[] = data.map(tx => ({
              id: tx.id,
              userId: tx.user_id,
              type: tx.type as 'earn' | 'spend' | 'purchase',
              amount: tx.amount,
              reason: tx.reason,
              metadata: tx.metadata,
              timestamp: tx.created_at
            }));
            
            set({ transactions });
          }
          
          return get().transactions;
        } catch (error) {
          console.error('Error fetching transaction history:', error);
          return get().transactions;
        }
      },
      
      syncWithServer: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        try {
          set({ isLoading: true });
          
          const { data, error } = await supabase
            .from('token_economy.user_wallets')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
          if (error && error.code !== 'PGRST116') {
            console.error('Error syncing wallet:', error);
            return;
          }
          
          if (data) {
            set({
              balance: data.balance,
              totalEarned: data.total_earned,
              totalSpent: data.total_spent
            });
            
            await get().getTransactionHistory();
          } else {
            const { error: createError } = await supabase
              .from('token_economy.user_wallets')
              .insert([{
                user_id: session.user.id,
                balance: get().balance,
                total_earned: get().totalEarned,
                total_spent: get().totalSpent
              }]);
              
            if (createError) console.error('Error creating wallet:', createError);
          }
        } catch (error) {
          console.error('Error syncing with server:', error);
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'token-store',
      partialize: (state) => ({
        balance: state.balance,
        totalEarned: state.totalEarned,
        totalSpent: state.totalSpent,
        transactions: state.transactions,
        isInitialized: state.isInitialized
      })
    }
  )
);
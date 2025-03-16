import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowUpRight, ArrowDownLeft, Gift, Coins, RefreshCw } from 'lucide-react';
import { tokenEconomySupabase, TokenTransaction } from '../../lib/supabase/tokenEconomy';

interface TokenTransactionHistoryProps {
  userId: string;
  limit?: number;
  className?: string;
}

export const TokenTransactionHistory: React.FC<TokenTransactionHistoryProps> = ({
  userId,
  limit = 5,
  className = ''
}) => {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // Fetch transactions where the user is either sender or recipient
        const { data, error } = await tokenEconomySupabase
          .from('token_economy.token_transactions')
          .select('*')
          .or(`user_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching token transactions:', error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();

    // Subscribe to transaction updates
    const subscription = tokenEconomySupabase
      .channel(`user-transactions-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'token_economy',
          table: 'token_transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'token_economy',
          table: 'token_transactions',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      tokenEconomySupabase.removeChannel(subscription);
    };
  }, [userId, limit]);

  const getTransactionIcon = (type: string, amount: number) => {
    switch (type) {
      case 'creation_reward':
        return <Sparkles size={16} className="text-yellow-400" />;
      case 'view_reward':
        return <Sparkles size={16} className="text-green-400" />;
      case 'engagement_reward':
        return <Sparkles size={16} className="text-blue-400" />;
      case 'tip':
        return amount > 0 
          ? <Gift size={16} className="text-purple-400" /> 
          : <Gift size={16} className="text-red-400" />;
      case 'purchase':
        return <Coins size={16} className="text-gray-400" />;
      case 'nft_minting':
        return <RefreshCw size={16} className="text-indigo-400" />;
      default:
        return amount > 0 
          ? <ArrowDownLeft size={16} className="text-green-500" /> 
          : <ArrowUpRight size={16} className="text-red-500" />;
    }
  };

  const formatTransactionType = (type: string): string => {
    switch (type) {
      case 'creation_reward':
        return 'Creation Reward';
      case 'view_reward':
        return 'View Reward';
      case 'engagement_reward':
        return 'Engagement Reward';
      case 'tip':
        return 'Tip';
      case 'purchase':
        return 'Purchase';
      case 'nft_minting':
        return 'NFT Minting';
      default:
        return type.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="text-lg font-medium">Recent Transactions</div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center p-3 rounded-lg bg-gray-100 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
            <div className="flex-1">
              <div className="w-24 h-4 bg-gray-300 rounded mb-2"></div>
              <div className="w-16 h-3 bg-gray-300 rounded"></div>
            </div>
            <div className="w-12 h-5 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-lg font-medium mb-4">Recent Transactions</div>
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <Coins size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No transactions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create stories or engage with content to earn tokens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="text-lg font-medium mb-3">Recent Transactions</div>
      <div className="space-y-2">
        {transactions.map(transaction => (
          <div 
            key={transaction.id} 
            className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              {getTransactionIcon(transaction.transaction_type, transaction.amount)}
            </div>
            <div className="flex-1">
              <div className="font-medium">{formatTransactionType(transaction.transaction_type)}</div>
              <div className="text-xs text-gray-500">{formatDate(transaction.created_at)}</div>
            </div>
            <div className={`font-medium ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {transaction.amount > 0 ? '+' : ''}{transaction.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenTransactionHistory;

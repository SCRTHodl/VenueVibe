import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getUserTokenBalance, subscribeToTokenBalanceChanges } from '../../lib/supabase/tokenEconomy';

interface TokenDisplayProps {
  userId: string;
  className?: string;
  variant?: 'compact' | 'full';
  showLabel?: boolean;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({
  userId,
  className = '',
  variant = 'compact',
  showLabel = true
}) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const fetchBalance = async () => {
      setIsLoading(true);
      try {
        const userBalance = await getUserTokenBalance(userId);
        setBalance(userBalance);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();

    // Subscribe to balance changes
    unsubscribe = subscribeToTokenBalanceChanges(userId, (newBalance) => {
      setBalance(newBalance);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Sparkles size={16} className="text-yellow-400" />
        {isLoading ? (
          <div className="w-5 h-3 bg-gray-300 animate-pulse rounded"></div>
        ) : (
          <span className="font-medium">{balance}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center rounded-lg p-2 ${className}`}>
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 mr-2">
        <Sparkles size={20} className="text-white" />
      </div>
      <div>
        {showLabel && <div className="text-xs text-gray-500">Token Balance</div>}
        {isLoading ? (
          <div className="w-16 h-5 bg-gray-300 animate-pulse rounded"></div>
        ) : (
          <div className="font-bold text-lg">{balance}</div>
        )}
      </div>
    </div>
  );
};

export default TokenDisplay;

import React from 'react';
import { Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTokenStore } from '../../lib/tokenStore';

interface TokenBalanceProps {
  onClick?: () => void;
}

export const TokenBalance: React.FC<TokenBalanceProps> = ({ onClick }) => {
  const { balance } = useTokenStore();
  
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 bg-[#1a2234] px-3 py-1.5 rounded-full border border-[--color-accent-primary]/20"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Coins size={16} className="text-[--color-accent-primary]" />
      <span className="font-medium text-white">{balance}</span>
    </motion.button>
  );
};
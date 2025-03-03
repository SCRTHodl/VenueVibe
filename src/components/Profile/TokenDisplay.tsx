import React, { useEffect } from 'react';
import { Coins, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTokenStore } from '../../lib/tokenStore';

interface TokenDisplayProps {
  onOpenWallet: () => void;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({ onOpenWallet }) => {
  const { balance, isInitialized, initializeWallet } = useTokenStore();
  
  useEffect(() => {
    if (!isInitialized) {
      initializeWallet();
    }
  }, [isInitialized, initializeWallet]);
  
  return (
    <motion.div
      className="flex items-center gap-2 bg-[#1a2234] px-3 py-1.5 rounded-full border border-[--color-accent-primary]/20 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onOpenWallet}
    >
      <div className="flex items-center gap-1">
        <Coins size={16} className="text-[--color-accent-primary]" />
        <span className="text-white font-medium">{balance}</span>
      </div>
      <div className="bg-[--color-accent-primary]/20 p-1 rounded-full">
        <Plus size={12} className="text-[--color-accent-primary]" />
      </div>
    </motion.div>
  );
};
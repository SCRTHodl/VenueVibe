import React from 'react';
import { Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { TOKEN_ECONOMY } from '../../lib/tokenStore';

interface TokenRewardIndicatorProps {
  type: keyof typeof TOKEN_ECONOMY.REWARDS;
  onClick?: () => void;
  completed?: boolean;
}

export const TokenRewardIndicator: React.FC<TokenRewardIndicatorProps> = ({ 
  type,
  onClick,
  completed = false
}) => {
  const reward = TOKEN_ECONOMY.REWARDS[type] || 1;
  
  return (
    <motion.div
      className={`flex items-center gap-1 px-2 py-1 rounded-full ${
        completed 
          ? 'bg-green-600/20 border border-green-500/30' 
          : 'bg-[#1a2234] border border-[--color-accent-primary]/20'
      } ${onClick ? 'cursor-pointer' : ''} ${completed ? '' : 'hover:bg-[#1a2234]/80'}`}
      whileHover={onClick && !completed ? { scale: 1.05 } : {}}
      whileTap={onClick && !completed ? { scale: 0.95 } : {}}
      onClick={!completed && onClick ? onClick : undefined}
    >
      <Coins size={12} className={completed ? 'text-green-400' : 'text-[--color-accent-primary]'} />
      <span className="text-white text-xs">+{reward}</span>
      {completed && (
        <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
          <CheckIcon className="text-white w-2 h-2" />
        </div>
      )}
    </motion.div>
  );
};

// Simple check icon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={className}
  >
    <path 
      fillRule="evenodd" 
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
      clipRule="evenodd" 
    />
  </svg>
);
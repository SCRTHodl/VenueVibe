import React from 'react';
import { Lock } from 'lucide-react';
import { TOKEN_ECONOMY } from '../../../lib/tokenStore';

interface PremiumContentSettingsProps {
  isPremiumContent: boolean;
  setIsPremiumContent: (value: boolean) => void;
  tokenCost: number;
  setTokenCost: (value: number) => void;
  showTokenSettings: boolean;
  setShowTokenSettings: (value: boolean) => void;
}

export const PremiumContentSettings: React.FC<PremiumContentSettingsProps> = ({
  isPremiumContent,
  setIsPremiumContent,
  tokenCost,
  setTokenCost,
  showTokenSettings,
  setShowTokenSettings
}) => {
  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-yellow-500" />
          <span className="text-white font-medium">Premium Content</span>
        </div>
        <button 
          type="button"
          onClick={() => setIsPremiumContent(!isPremiumContent)}
          className={`w-12 h-6 rounded-full transition-colors ${isPremiumContent ? 'bg-yellow-500' : 'bg-gray-600'} relative`}
        >
          <span 
            className={`absolute top-1 transition-transform ${isPremiumContent ? 'right-1 translate-x-0' : 'left-1 -translate-x-0'} w-4 h-4 rounded-full bg-white`}
          />
        </button>
      </div>
      
      {isPremiumContent && (
        <div className="bg-gray-800/50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">Unlock cost:</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 font-semibold">{tokenCost}</span>
              <span className="text-gray-400 text-xs">tokens</span>
            </div>
          </div>
          
          <input 
            type="range" 
            min={TOKEN_ECONOMY.COSTS.MIN_PREMIUM} 
            max={TOKEN_ECONOMY.COSTS.MAX_PREMIUM} 
            value={tokenCost}
            onChange={(e) => setTokenCost(parseInt(e.target.value))}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{TOKEN_ECONOMY.COSTS.MIN_PREMIUM}</span>
            <span>{TOKEN_ECONOMY.COSTS.MAX_PREMIUM}</span>
          </div>
          
          <div className="mt-3 text-xs text-gray-300">
            <p>Creator earnings: <span className="text-green-400">{Math.floor(tokenCost * 0.8)} tokens</span> (80%)</p>
            <p>Platform fee: <span className="text-gray-400">{Math.ceil(tokenCost * 0.2)} tokens</span> (20%)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumContentSettings;

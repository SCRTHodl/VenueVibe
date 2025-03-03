import React, { useState } from 'react';
import { Sparkles, Tag, Clock, X } from 'lucide-react';
import { formatTimeAgo } from '../../lib/utils';
import { PromoCodeEntry } from './PromoCodeEntry';
import { PromoDetails } from './PromoDetails';
import type { Group, PromoEvent } from '../../types';

interface PromoCardProps {
  title: string;
  venue: Group;
  promoCode: string;
  discount: string;
}

export const PromoCard: React.FC<PromoCardProps> = ({ title, venue, promoCode, discount }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [promoEvent, setPromoEvent] = useState<PromoEvent | null>(null);
  
  const handlePromoSuccess = (event: PromoEvent) => {
    setPromoEvent(event);
  };
  
  if (promoEvent) {
    return (
      <div className="mb-4">
        <PromoDetails event={promoEvent} onClose={() => setPromoEvent(null)} />
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-blue-900/60 to-indigo-900/60 rounded-xl shadow-lg border border-blue-600/20 overflow-hidden mb-4">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-blue-700/30">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-400" />
          <h3 className="font-medium text-white">Featured Promotion</h3>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex gap-3 items-center mb-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h4 className="text-white font-medium">{title}</h4>
            <div className="text-xs text-blue-200">{venue.name}</div>
          </div>
        </div>
        
        <div className="bg-blue-900/30 rounded-lg p-3 mb-4 border border-blue-800/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-sm text-white">
              <Tag size={14} className="text-green-400" />
              <span>{discount} all drinks</span>
            </div>
            <div className="text-xs text-gray-300 flex items-center gap-1">
              <Clock size={12} />
              <span>Ends in 3 days</span>
            </div>
          </div>
          <div className="text-xs text-gray-300">
            Use code <span className="bg-blue-900/50 text-blue-200 font-mono px-1.5 py-0.5 rounded">{promoCode}</span> when ordering
          </div>
        </div>
        
        {isExpanded ? (
          <PromoCodeEntry onSuccess={handlePromoSuccess} />
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Claim Offer
          </button>
        )}
      </div>
    </div>
  );
};
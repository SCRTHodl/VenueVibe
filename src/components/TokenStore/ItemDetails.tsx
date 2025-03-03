import React from 'react';
import { X, Tag, Coins, ShoppingCart, ArrowRight, RefreshCcw, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { DigitalItem } from './TokenStore';

interface ItemDetailsProps {
  item: DigitalItem;
  onClose: () => void;
  onAddToCart: () => void;
  balance: number;
}

export const ItemDetails: React.FC<ItemDetailsProps> = ({ 
  item, 
  onClose,
  onAddToCart,
  balance
}) => {
  // Generate date display
  const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Get rarity color scheme
  const getRarityColors = () => {
    switch (item.rarity) {
      case 'legendary':
        return {
          bg: 'from-yellow-600/20 to-yellow-500/5',
          border: 'border-yellow-500/30',
          text: 'text-yellow-300',
          accent: 'bg-yellow-500/30'
        };
      case 'epic':
        return {
          bg: 'from-purple-600/20 to-purple-500/5',
          border: 'border-purple-500/30',
          text: 'text-purple-300',
          accent: 'bg-purple-500/30'
        };
      case 'rare':
        return {
          bg: 'from-blue-600/20 to-blue-500/5',
          border: 'border-blue-500/30',
          text: 'text-blue-300',
          accent: 'bg-blue-500/30'
        };
      case 'uncommon':
        return {
          bg: 'from-green-600/20 to-green-500/5',
          border: 'border-green-500/30',
          text: 'text-green-300',
          accent: 'bg-green-500/30'
        };
      default:
        return {
          bg: 'from-gray-600/20 to-gray-500/5',
          border: 'border-gray-500/30',
          text: 'text-gray-300',
          accent: 'bg-gray-500/30'
        };
    }
  };
  
  const rarityColors = getRarityColors();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div 
        className={`w-full max-w-md rounded-xl overflow-hidden shadow-2xl bg-gradient-to-b ${rarityColors.bg} border ${rarityColors.border}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Image */}
        <div className="aspect-square relative">
          <img 
            src={item.image_url} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X size={20} />
          </button>
          
          {/* Item type badge */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-medium">
            {item.item_type.toUpperCase()}
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
            <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${rarityColors.accent} ${rarityColors.text}`}>
              {item.rarity.toUpperCase()}
            </div>
            <h2 className="text-white text-2xl font-bold mb-1">{item.name}</h2>
            <p className="text-white/80 line-clamp-2">{item.description}</p>
          </div>
        </div>
        
        {/* Details */}
        <div className="p-5 bg-[#121826] border-t border-gray-700">
          {/* Item statistics */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#1a2234] p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Price</div>
              <div className="text-white font-bold flex items-center gap-1">
                <Coins size={16} className="text-[--color-accent-primary]" />
                {item.price} tokens
              </div>
            </div>
            
            <div className="bg-[#1a2234] p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Supply</div>
              <div className="text-white font-bold">
                {item.supply ? `${item.remaining}/${item.supply}` : 'Unlimited'}
              </div>
            </div>
            
            <div className="bg-[#1a2234] p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Transferable</div>
              <div className="text-white font-bold">
                {item.transferable ? 'Yes' : 'No'}
              </div>
            </div>
            
            <div className="bg-[#1a2234] p-3 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">Released</div>
              <div className="text-white font-bold flex items-center gap-1">
                <Calendar size={14} className="text-gray-400" />
                {formattedDate}
              </div>
            </div>
          </div>
          
          {/* Item usage information */}
          <div className="bg-[#1a2234] p-4 rounded-lg mb-4 border border-gray-700">
            <h3 className="text-white font-medium mb-2">How to use this item</h3>
            {item.item_type === 'nft' && (
              <p className="text-sm text-gray-300">
                This NFT can be displayed on your profile, gifted to friends, or used as exclusive access to special features.
              </p>
            )}
            {item.item_type === 'gift' && (
              <p className="text-sm text-gray-300">
                Send this gift to other users to show appreciation for their content. Gifts appear in their activity feed and profile.
              </p>
            )}
            {item.item_type === 'badge' && (
              <p className="text-sm text-gray-300">
                Award this badge to exceptional content. Badges show up on posts and boost the creator's reputation and token earnings.
              </p>
            )}
            {item.item_type === 'theme' && (
              <p className="text-sm text-gray-300">
                Apply this theme to customize the app's appearance. Themes change the color scheme, backgrounds, and visual elements.
              </p>
            )}
          </div>
          
          {/* Purchase button */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onAddToCart}
              disabled={balance < item.price}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={18} />
              {balance < item.price ? 'Insufficient Tokens' : 'Add to Cart'}
            </button>
            
            {balance < item.price && (
              <div className="text-center text-sm">
                <div className="text-yellow-400 mb-1">
                  You need {item.price - balance} more tokens
                </div>
                <button 
                  className="text-[--color-accent-primary] hover:underline flex items-center gap-1 mx-auto"
                >
                  Get more tokens <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
          
          {/* Scarcity indicator for rare items */}
          {item.supply && item.supply < 100 && (
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
              <RefreshCcw size={12} />
              <span>Item restocks every 30 days</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
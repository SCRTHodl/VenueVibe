import React from 'react';
import { Tag, Coins, ShoppingCart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { DigitalItem } from './TokenStore';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface DigitalItemCardProps {
  item: DigitalItem;
  onSelect: () => void;
  onAddToCart: () => void;
}

export const DigitalItemCard: React.FC<DigitalItemCardProps> = ({ 
  item, 
  onSelect,
  onAddToCart
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  // Get rarity badge color based on rarity
  const getRarityColor = () => {
    switch (item.rarity) {
      case 'legendary':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'rare':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'uncommon':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };
  
  // Get item type badge
  const getItemTypeBadge = () => {
    switch (item.item_type) {
      case 'nft':
        return {
          color: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
          label: 'NFT'
        };
      case 'gift':
        return {
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
          label: 'GIFT'
        };
      case 'badge':
        return {
          color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          label: 'BADGE'
        };
      case 'theme':
        return {
          color: 'bg-green-500/20 text-green-300 border-green-500/50',
          label: 'THEME'
        };
      default:
        return {
          color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
          label: 'ITEM'
        };
    }
  };
  
  const itemType = getItemTypeBadge();
  
  return (
    <motion.div
      ref={ref}
      className="bg-[#1a2234] rounded-lg border border-gray-700 overflow-hidden hover:border-[--color-accent-primary]/40 transition-colors cursor-pointer flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      transition={{ duration: 0.5 }}
      onClick={onSelect}
    >
      <div className="aspect-square relative">
        <img 
          src={item.image_url} 
          alt={item.name} 
          className="w-full h-full object-cover bg-[#0f1623]"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1614036417651-efe5912149d8?w=400&h=400&fit=crop';
          }}
        />
        
        {/* Rarity badge */}
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-xs font-medium border ${getRarityColor()}`}>
          {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
        </div>
        
        {/* Item type badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-xs font-medium border ${itemType.color}`}>
          {itemType.label}
        </div>
        
        {/* Limited edition indicator for NFTs and low supply items */}
        {(item.item_type === 'nft' || (item.supply && item.supply < 100)) && (
          <div className="absolute bottom-12 left-0 right-0 mx-auto w-max px-3 py-1 rounded-full bg-black/70 text-white text-xs font-medium flex items-center gap-1.5">
            <Sparkles size={12} className="text-yellow-400" />
            <span>Limited Edition {item.remaining}/{item.supply}</span>
          </div>
        )}
        
        {/* Gradient overlay with item name */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-white font-medium">{item.name}</h3>
          <p className="text-sm text-gray-300 line-clamp-1">{item.description}</p>
        </div>
      </div>
      
      <div className="p-3 border-t border-gray-700 mt-auto flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Coins size={16} className="text-[--color-accent-primary]" />
          <span className="text-white font-medium">{item.price}</span>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          className="p-2 rounded-full bg-[#121826] text-[--color-accent-primary] hover:bg-[--color-accent-primary]/10 transition-colors"
        >
          <ShoppingCart size={16} />
        </button>
      </div>
    </motion.div>
  );
};
import React, { useState, useEffect } from 'react';
import { Calendar, Info, X, Award, Tag, ExternalLink, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EventTheme } from '../../types';

// Define the interface here to avoid import issues
interface PromotionBox {
  title: string;
  description: string;
  discountText: string;
  isEnabled: boolean;
  displayOrder: number;
}

interface PromotionSettings {
  isEnabled: boolean;
  tokenReward: number;
  promotionTheme: EventTheme;
  moderationKeywords: string[];
  contentFocus: string;
  promotionalBoxes: PromotionBox[];
  specialOffer: string;
  customBannerUrl?: string; // Optional custom banner URL
}

interface EventBannerProps {
  theme: EventTheme;
  onDismiss: () => void;
  onLearn: () => void;
  promotionSettings?: PromotionSettings;
}

export const EventBanner: React.FC<EventBannerProps> = ({ theme, onDismiss, onLearn, promotionSettings }) => {
  // Return null if promotions are disabled
  if (promotionSettings && !promotionSettings.isEnabled) {
    return null;
  }
  const [highlight, setHighlight] = useState(false);
  const [showSponsor, setShowSponsor] = useState(false);
  
  // Format dates in a user-friendly way
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const startDate = formatDate(theme.startDate);
  const endDate = formatDate(theme.endDate);

  // Create a gradient based on theme colors
  const gradientStyle = {
    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
  };
  
  // Alternate between highlighting different elements
  useEffect(() => {
    const interval = setInterval(() => {
      setHighlight(prev => !prev);
    }, 3000);
    
    // Show sponsor after a delay
    const sponsorTimer = setTimeout(() => {
      setShowSponsor(true);
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(sponsorTimer);
    };
  }, []);

  return (
    <motion.div 
      className="rounded-xl shadow-lg overflow-hidden border relative glass-morphism glow-effect"
      style={{ borderColor: `${theme.accentColor}50` }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Animated decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute right-0 top-0 opacity-50"
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 80, opacity: 0.7 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="w-32 h-32 rounded-full"
            style={{ 
              background: `conic-gradient(${theme.accentColor}20, ${theme.primaryColor}40, transparent)`,
              filter: "blur(20px)"
            }}
          />
        </motion.div>
      </div>
      
      <div className="relative">
        {/* Banner Image with professional overlay */}
        <div className="h-28 overflow-hidden relative">
          {/* Use custom banner URL from promotionSettings if available, otherwise use theme's banner */}
          {((promotionSettings?.customBannerUrl) || theme.bannerUrl) && (
            <>
              <img 
                src={promotionSettings?.customBannerUrl || theme.bannerUrl} 
                alt={theme.name} 
                className="w-full h-full object-cover"
              />
              
              {/* Gradient overlay */}
              <motion.div 
                className="absolute inset-0"
                style={gradientStyle}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.6, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Pattern overlay for professional look */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, ${theme.accentColor}15 0%, transparent 50%)`,
                  mixBlendMode: "overlay"
                }}
              />
            </>
          )}
          
          {/* Sponsored tag - moved to top right to avoid overlap */}
          <AnimatePresence>
            {showSponsor && (
              <motion.div 
                className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/20 flex items-center gap-1.5 text-xs font-medium text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Award size={10} className="text-yellow-400" />
                <span>SPONSORED</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Animated call-to-action badge */}
          <motion.div 
            className="absolute top-2 right-8 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/20 text-xs font-medium"
            style={{ color: theme.accentColor }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: highlight ? 1 : 0.7, 
              scale: highlight ? 1.05 : 1,
              y: highlight ? -2 : 0
            }}
            transition={{ duration: 0.5 }}
          >
            <span>{promotionSettings?.specialOffer || 'SPECIAL OFFER'}</span>
          </motion.div>
          
          {/* Close button */}
          <button 
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/50 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
          
          {/* Event logo/icon - moved to center and up */}
      
        </div>
        
        {/* Content Section */}
        <div className="p-4 relative">
          {/* Main content */}
          <div className="flex justify-between items-start mb-2">
            <div className="w-full">
              <motion.h3 
                className="font-bold text-white text-lg leading-tight font-['Clash_Display'] text-center"
                style={{ color: theme.accentColor }}
                animate={{ 
                  textShadow: highlight 
                    ? `0 0 8px ${theme.accentColor}80` 
                    : `0 0 0px transparent` 
                }}
                transition={{ duration: 0.5 }}
              >
                {/* Removed rendering event name text to avoid duplication */}
              </motion.h3>
              
              {theme.description && (
                <p className="text-sm text-white/90 mt-1 text-center">{theme.description}</p>
              )}
            </div>
          </div>
          
          {/* Event details with icons */}
          <div className="flex flex-wrap justify-center gap-3 mb-3">
            {(theme.startDate && theme.endDate) && (
              <div className="flex items-center gap-1 text-xs text-white/80">
                <Calendar size={12} className="text-white" style={{ color: theme.accentColor }} />
                <span>{startDate} - {endDate}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-xs text-white/80">
              <MapPin size={12} className="text-white" style={{ color: theme.accentColor }} />
              <span>Multiple Venues</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-white/80">
              <Clock size={12} className="text-white" style={{ color: theme.accentColor }} />
              <span>Limited Time</span>
            </div>
          </div>
          
          {/* Special offer badge */}
          <motion.div 
            className="mb-3 flex justify-center"
            animate={{ 
              y: highlight ? 0 : 1,
              scale: highlight ? 1.02 : 1 
            }}
            transition={{ duration: 0.5 }}
          >
            {promotionSettings?.promotionalBoxes && promotionSettings.promotionalBoxes.length > 0 ? (
              // Find the first enabled promotional box or default to the first one
              (() => {
                const activeBoxes = promotionSettings.promotionalBoxes
                  .filter((box: { isEnabled: boolean }) => box.isEnabled)
                  .sort((a: { displayOrder: number }, b: { displayOrder: number }) => a.displayOrder - b.displayOrder);
                const box: PromotionBox = activeBoxes.length > 0 ? activeBoxes[0] : promotionSettings.promotionalBoxes[0];
                
                return (
                  <div 
                    className="px-2 py-1 rounded-lg text-xs flex items-center gap-1.5"
                    style={{ 
                      backgroundColor: `${theme.accentColor}20`,
                      color: theme.accentColor,
                      border: `1px solid ${theme.accentColor}30`
                    }}
                  >
                    <Tag size={10} />
                    <span className="font-semibold">{box.discountText}</span>
                  </div>
                );
              })()
            ) : (
              <div 
                className="px-2 py-1 rounded-lg text-xs flex items-center gap-1.5"
                style={{ 
                  backgroundColor: `${theme.accentColor}20`,
                  color: theme.accentColor,
                  border: `1px solid ${theme.accentColor}30`
                }}
              >
                <Tag size={10} />
                <span className="font-semibold">25% OFF DRINKS & APPETIZERS</span>
              </div>
            )}
          </motion.div>
          
          {/* Call to action */}
          <div className="flex justify-between items-center">
            <button
              onClick={onLearn}
              className="text-xs rounded-lg flex items-center gap-1 transition-all"
              style={{ 
                color: 'white',
                background: gradientStyle.background
              }}
            >
              <motion.div 
                className="px-3 py-1.5 flex items-center gap-1"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                animate={{ 
                  boxShadow: highlight 
                    ? `0 0 15px ${theme.accentColor}40` 
                    : '0 0 0 transparent' 
                }}
                transition={{ duration: 0.5 }}
              >
                <Info size={12} />
                <span className="font-medium">View Special Events</span>
                <ExternalLink size={10} className="ml-1" />
              </motion.div>
            </button>
            
            <motion.div 
              className="text-[10px] text-white/60 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              Sponsored Content
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
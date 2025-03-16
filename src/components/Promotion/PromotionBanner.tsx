import React from 'react';
import { usePromotion } from '../../contexts/PromotionContext';
import { X } from 'lucide-react';

const PromotionBanner: React.FC = () => {
  const { promotionSettings, showBanner, setShowBanner } = usePromotion();
  
  if (!showBanner || !promotionSettings.isEnabled) {
    return null;
  }
  
  const theme = promotionSettings.promotionTheme;
  
  // Style based on theme if available
  const bannerStyle = theme ? {
    backgroundColor: theme.primaryColor,
    color: theme.secondaryColor,
    fontWeight: 'bold'
  } : {
    backgroundColor: '#4F46E5',
    color: 'white',
    fontFamily: 'sans-serif'
  };
  
  // Button style based on theme
  const buttonStyle = theme ? {
    backgroundColor: theme.accentColor,
    color: 'white'
  } : {
    backgroundColor: '#E5E7EB',
    color: '#1F2937'
  };
  
  return (
    <div 
      className="relative py-3 px-4 text-center" 
      style={bannerStyle}
    >
      <button 
        onClick={() => setShowBanner(false)}
        className="absolute right-2 top-2 rounded-full p-1 hover:bg-white hover:bg-opacity-20"
        aria-label="Close banner"
      >
        <X size={16} />
      </button>
      
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
        <div className="flex-1">
          <p className="font-bold text-lg">{promotionSettings.specialOffer || 'Special Offer!'}</p>
        </div>
        
        <div>
          <button 
            className="px-4 py-1 rounded text-sm font-medium"
            style={buttonStyle}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionBanner;

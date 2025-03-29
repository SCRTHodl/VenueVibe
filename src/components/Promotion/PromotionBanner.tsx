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
      className="relative py-3 px-4 text-center sm:px-6 lg:px-8" 
      style={bannerStyle}
    >
      <button 
        onClick={() => setShowBanner(false)}
        className="absolute right-2 top-2 rounded-full p-1 hover:bg-white hover:bg-opacity-20 sm:right-4 lg:right-6"
        aria-label="Close banner"
      >
        <X size={16} />
      </button>
      
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <div className="flex-1">
          <p className="font-bold text-lg sm:text-xl lg:text-2xl">
            {promotionSettings.specialOffer || 'Special Offer!'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {promotionSettings.promotionalBoxes && promotionSettings.promotionalBoxes.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              {promotionSettings.promotionalBoxes.map((box, index) => (
                <div 
                  key={index} 
                  className="flex-1 min-w-0 p-3 bg-white/10 rounded-lg"
                  style={buttonStyle}
                >
                  <p className="text-sm truncate">
                    {box.title || 'Offer'}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {promotionSettings.customBannerUrl && (
            <div className="flex-1 min-w-0">
              <img 
                src={promotionSettings.customBannerUrl} 
                alt="Promotional" 
                className="w-full h-auto rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionBanner;

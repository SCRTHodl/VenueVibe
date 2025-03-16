import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { PromotionSettings, EventTheme } from '../types';

interface PromotionContextType {
  promotionSettings: PromotionSettings;
  setPromotionSettings: React.Dispatch<React.SetStateAction<PromotionSettings>>;
  showBanner: boolean;
  setShowBanner: React.Dispatch<React.SetStateAction<boolean>>;
  handleThemeChange: (theme: EventTheme) => void;
  handleUpdatePromotionSettings: (updatedSettings: Partial<PromotionSettings>) => Promise<void>;
}

// Create a default EventTheme since the interface requires it
const defaultEventTheme: EventTheme = {
  id: '0',
  name: 'Default',
  description: 'Default theme',
  primaryColor: '#4A90E2',
  secondaryColor: '#50E3C2',
  accentColor: '#F5A623',
  bannerUrl: '',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: false
};

const defaultPromotionSettings: PromotionSettings = {
  isEnabled: false,
  tokenReward: 50,
  promotionTheme: defaultEventTheme,
  moderationKeywords: [],
  contentFocus: 'General',
  promotionalBoxes: [],
  specialOffer: 'Special Promotion',
  customBannerUrl: ''
};

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

export const PromotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [promotionSettings, setPromotionSettings] = useState<PromotionSettings>(defaultPromotionSettings);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  const handleThemeChange = useCallback((theme: EventTheme) => {
    setPromotionSettings(prev => ({
      ...prev,
      promotionTheme: theme
    }));
    
    // Show a success message
    toast.success(`Theme changed to ${theme.name}`);
  }, []);

  const handleUpdatePromotionSettings = useCallback(async (updatedSettings: Partial<PromotionSettings>) => {
    try {
      // Check if Supabase client is available
      if (!supabase) {
        toast.error("Database connection not available");
        return;
      }
      
      // Verify user is logged in and has admin rights
      const userResponse = await supabase.auth.getUser();
      if (userResponse.error || !userResponse.data.user) {
        toast.error("You must be logged in to update promotion settings");
        return;
      }
      
      const user = userResponse.data.user;
      
      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error("Error checking admin status:", userError);
        toast.error("Failed to verify admin status");
        return;
      }
      
      if (!userData?.is_admin) {
        toast.error("You must be an admin to update promotion settings");
        return;
      }
      
      // Update the promotion settings
      const newSettings = {
        ...promotionSettings,
        ...updatedSettings
      };
      
      // Prepare the data for Supabase, ensuring proper serialization
      const promotionData = {
        id: 1, // Assuming there's only one set of promotion settings
        is_enabled: newSettings.isEnabled,
        token_reward: newSettings.tokenReward || 0,
        theme: newSettings.promotionTheme ? JSON.stringify(newSettings.promotionTheme) : null,
        moderation_keywords: Array.isArray(newSettings.moderationKeywords) 
          ? JSON.stringify(newSettings.moderationKeywords) 
          : JSON.stringify([]),
        content_focus: newSettings.contentFocus || 'General',
        promotional_boxes: Array.isArray(newSettings.promotionalBoxes) 
          ? JSON.stringify(newSettings.promotionalBoxes) 
          : JSON.stringify([]),
        special_offer: newSettings.specialOffer || '',
        custom_banner_url: newSettings.customBannerUrl || ''
      };
      
      // Save to database using regular client (no need for schema prefix anymore)
      const { error } = await supabase
        .from('te_promotion_settings')
        .upsert([promotionData]);
      
      if (error) {
        console.error("Database error when updating settings:", error);
        toast.error("Failed to save promotion settings");
        return;
      }
      
      // Update state
      setPromotionSettings(newSettings);
      toast.success("Promotion settings updated");
      
    } catch (error) {
      console.error("Error updating promotion settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update promotion settings");
    }
  }, [promotionSettings]);

  // Load promotion settings from database on mount
  React.useEffect(() => {
    let isMounted = true;
    
    const loadPromotionSettings = async () => {
      try {
        // Check if Supabase connection is available
        if (!supabase) {
          console.warn('Supabase client not initialized, using default promotion settings');
          return;
        }
        
        console.log('Loading promotion settings...');
        
        // Try both table approaches to ensure backward compatibility
        // First try with the public schema with te_ prefix
        let data, error;
        
        // APPROACH 1: Try using the new public schema with te_ prefix
        const publicResult = await supabase
          .from('te_promotion_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
          
        // APPROACH 2: If that fails, try using token_economy schema
        if (publicResult.error && !publicResult.data) {
          console.log('Falling back to token_economy schema...');
          const tokenResult = await supabase
            .schema('token_economy')
            .from('promotion_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();
            
          data = tokenResult.data;
          error = tokenResult.error;
        } else {
          data = publicResult.data;
          error = publicResult.error;
        }
        
        // Debug
        console.log('Promotion settings query result:', { data, error });
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        if (error) {
          // If no settings exist yet, we'll use the defaults
          if (error.code === 'PGRST116') {
            console.log('No promotion settings found, using defaults');
            return;
          }
          console.warn('Error loading promotion settings:', error.message);
          return;
        }
        
        if (data) {
          try {
            // Safely parse JSON fields
            const parsedTheme = data.theme ? 
              (typeof data.theme === 'string' ? JSON.parse(data.theme) : data.theme) : 
              defaultEventTheme;
              
            const parsedKeywords = data.moderation_keywords ? 
              (typeof data.moderation_keywords === 'string' ? JSON.parse(data.moderation_keywords) : data.moderation_keywords) : 
              [];
              
            const parsedBoxes = data.promotional_boxes ? 
              (typeof data.promotional_boxes === 'string' ? JSON.parse(data.promotional_boxes) : data.promotional_boxes) : 
              [];
            
            setPromotionSettings({
              isEnabled: data.is_enabled,
              tokenReward: data.token_reward || 50,
              promotionTheme: parsedTheme,
              moderationKeywords: parsedKeywords,
              contentFocus: data.content_focus || 'General',
              promotionalBoxes: parsedBoxes,
              specialOffer: data.special_offer || 'Special Promotion',
              customBannerUrl: data.custom_banner_url || ''
            });
            
            // If promotions are enabled, show the banner
            if (data.is_enabled) {
              setShowBanner(true);
            }
          } catch (parseError) {
            console.error('Error parsing promotion settings JSON:', parseError);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading promotion settings:", error);
        }
      }
    };
    
    loadPromotionSettings();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PromotionContext.Provider
      value={{
        promotionSettings,
        setPromotionSettings,
        showBanner,
        setShowBanner,
        handleThemeChange,
        handleUpdatePromotionSettings
      }}
    >
      {children}
    </PromotionContext.Provider>
  );
};

export const usePromotion = () => {
  const context = useContext(PromotionContext);
  if (context === undefined) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
};

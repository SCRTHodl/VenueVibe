import React, { useState } from 'react';
import { Settings, MapPin, RefreshCw, X, Coins } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { UserSettings as UserSettingsType } from '../../types';
import { motion } from 'framer-motion';

interface UserSettingsProps {
  userId: string;
  initialSettings?: UserSettingsType;
  onClose: () => void;
  onUpdate: (settings: UserSettingsType) => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ 
  userId, 
  initialSettings, 
  onClose,
  onUpdate
}) => {
  const [settings, setSettings] = useState<UserSettingsType>({
    locationRadius: initialSettings?.locationRadius || 60,
    autoRefresh: initialSettings?.autoRefresh || false,
    maxResults: initialSettings?.maxResults || 50,
    darkMode: initialSettings?.darkMode || true,
    notifications: initialSettings?.notifications || true,
    tokenRefreshEnabled: initialSettings?.tokenRefreshEnabled || true,
    tokenRefreshInterval: initialSettings?.tokenRefreshInterval || 60
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const radius = parseInt(e.target.value);
    setSettings(prev => ({ ...prev, locationRadius: radius }));
  };

  const handleAutoRefreshChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, autoRefresh: e.target.checked }));
  };

  const handleTokenRefreshEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, tokenRefreshEnabled: e.target.checked }));
  };

  const handleTokenRefreshIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = parseInt(e.target.value);
    setSettings(prev => ({ ...prev, tokenRefreshInterval: interval }));
  };

  const handleSaveSettings = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      // Update user settings in the database
      const { error } = await supabase
        .from('users')
        .update({
          settings
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Call the onUpdate callback to update settings in parent component
      onUpdate(settings);
      
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-gray-900 rounded-xl w-full max-w-md p-5 shadow-xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary" />
            <h2 className="text-xl font-semibold">User Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Location Radius Setting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-medium">
                <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                Location Radius
              </label>
              <span className="text-sm font-bold text-primary">{settings.locationRadius} miles</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={settings.locationRadius}
              onChange={handleRadiusChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>5 miles</span>
              <span>100 miles</span>
            </div>
          </div>
          
          {/* Auto Refresh Setting */}
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm font-medium">
              <RefreshCw className="w-4 h-4 mr-2 text-green-400" />
              Auto-refresh content with location changes
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={handleAutoRefreshChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* Token Economy Settings */}
          <div className="pt-2 pb-2">
            <h3 className="text-sm font-semibold flex items-center mb-3">
              <Coins className="w-4 h-4 mr-2 text-yellow-400" />
              Token Settings
            </h3>
            
            {/* Token Auto Refresh Setting */}
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center text-sm font-medium">
                <RefreshCw className="w-4 h-4 mr-2 text-yellow-400" />
                Auto-refresh tokens
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tokenRefreshEnabled}
                  onChange={handleTokenRefreshEnabledChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {/* Token Refresh Interval */}
            {settings.tokenRefreshEnabled && (
              <div className="space-y-2 mb-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Refresh Interval
                  </label>
                  <span className="text-sm font-bold text-primary">{settings.tokenRefreshInterval} minutes</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={settings.tokenRefreshInterval}
                  onChange={handleTokenRefreshIntervalChange}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>15 min</span>
                  <span>240 min</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors w-full"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

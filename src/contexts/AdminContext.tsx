import React, { createContext, useState, useContext, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { adminService } from '../lib/adminService';
import { Group, ContentModerationSettings } from '../types';
import { useUser } from './UserContext';

// Following the memory requirements for admin features:
// 1. User has is_admin=true in users table 
// 2. Using service role key for admin operations
// 3. RLS policies enforcing admin checks

interface AdminContextType {
  showAdminPanel: boolean;
  setShowAdminPanel: React.Dispatch<React.SetStateAction<boolean>>;
  moderationSettings: ContentModerationSettings;
  setModerationSettings: React.Dispatch<React.SetStateAction<ContentModerationSettings>>;
  handleUpdateLocation: (locationId: string, updatedData: Partial<Group>) => Promise<void>;
  handleContentModerationUpdate: (settings: Partial<ContentModerationSettings>) => Promise<void>;
}

const defaultModerationSettings: ContentModerationSettings = {
  imageModeration: true,
  textModeration: true,
  moderationLevel: 'medium',
  autoDeleteFlagged: false,
  notifyAdminsOnFlag: true
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [moderationSettings, setModerationSettings] = useState<ContentModerationSettings>(defaultModerationSettings);
  const { checkAdmin } = useUser();

  // Verify admin access for sensitive operations
  const verifyAdminAccess = useCallback(async () => {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      throw new Error("You must be an admin to perform this operation");
    }
    return true;
  }, [checkAdmin]);

  // Admin operation to update location details
  const handleUpdateLocation = useCallback(async (locationId: string, updatedData: Partial<Group>) => {
    try {
      // Verify admin access
      await verifyAdminAccess();
      
      // Use the admin client with service role key for admin operations
      const response = await fetch('/api/admin/locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId,
          updatedData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update location');
      }
      
      toast.success('Location updated successfully');
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update location');
    }
  }, [verifyAdminAccess]);

  // Update content moderation settings
  const handleContentModerationUpdate = useCallback(async (settings: Partial<ContentModerationSettings>) => {
    try {
      // Verify admin access
      await verifyAdminAccess();
      
      // Merge with current settings
      const updatedSettings = {
        ...moderationSettings,
        ...settings
      };
      
      // Use the service role key for admin operations through the admin endpoint
      const response = await fetch('/api/admin/moderation-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update moderation settings');
      }
      
      // Update local state
      setModerationSettings(updatedSettings);
      toast.success('Moderation settings updated');
    } catch (error) {
      console.error('Error updating moderation settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update moderation settings');
    }
  }, [moderationSettings, verifyAdminAccess]);

  // Load moderation settings from database
  React.useEffect(() => {
    const loadModerationSettings = async () => {
      try {
        // First check if user is admin
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
          return; // Non-admins don't need to load this data
        }
        
        try {
          // Use adminService for fetching moderation settings
          const settings = await adminService.getModerationSettings();
          
          if (settings) {
            setModerationSettings(settings);
          }
        } catch (serviceError) {
          // Fallback to regular client if the admin service fails
          console.warn('Admin service failed, falling back to regular client:', serviceError);
          
          const { data, error } = await supabase
            .from('moderation_settings')
            .select('*')
            .single();
          
          if (error) {
            if (error.code !== 'PGRST116') { // Not found error
              console.error('Error loading moderation settings:', error);
            }
            return;
          }
          
          if (data) {
            setModerationSettings({
              imageModeration: data.image_moderation,
              textModeration: data.text_moderation,
              moderationLevel: data.moderation_level,
              autoDeleteFlagged: data.auto_delete_flagged,
              notifyAdminsOnFlag: data.notify_admins_on_flag
            });
          }
        }
      } catch (error) {
        console.error('Error in loadModerationSettings:', error);
      }
    };
    
    loadModerationSettings();
  }, [checkAdmin]);

  return (
    <AdminContext.Provider
      value={{
        showAdminPanel,
        setShowAdminPanel,
        moderationSettings,
        setModerationSettings,
        handleUpdateLocation,
        handleContentModerationUpdate
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

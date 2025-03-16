import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
// User interface is imported from context
import { LogOut, Save, User as UserIcon, Shield, Coins, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface UserSettingsProps {
  onClose: () => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ onClose }) => {
  const { currentUser, setCurrentUser, logout, isAdmin } = useUser();
  
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [avatar, setAvatar] = useState<string>(currentUser?.avatar || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Handle saving profile changes
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Update user profile in database
      const { error } = await supabase
        .from('users')
        .update({
          name,
          email,
          avatar_url: avatar
        })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Update local user state
      setCurrentUser({
        ...currentUser,
        name,
        email,
        avatar
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <div className="flex items-center space-x-4">
                <img 
                  src={avatar} 
                  alt={name} 
                  className="w-16 h-16 rounded-full"
                />
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Avatar URL"
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isLoading ? (
                  <span className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Profile
              </button>
            </div>
          </div>
        );
        
      case 'preferences':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="h-4 w-4 mr-2"
                />
                <span>Dark Mode</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notifications</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="h-4 w-4 mr-2"
                />
                <span>Enable Notifications</span>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={() => {
                  toast.success('Preferences saved');
                }}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </button>
            </div>
          </div>
        );
        
      case 'tokens':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Coins className="w-6 h-6 text-blue-500" />
                <h3 className="font-bold text-lg">Your Token Balance</h3>
              </div>
              <div className="text-3xl font-bold text-blue-700">{currentUser?.tokens || 0}</div>
              <p className="text-sm text-blue-600 mt-2">Tokens can be used for premium features and content</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Recent Token Activity</h3>
              <div className="space-y-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">
                        {index === 0 ? 'Daily Login Bonus' : index === 1 ? 'Content Creation' : 'Comment Reward'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {index === 0 ? '2 hours ago' : index === 1 ? 'Yesterday' : '3 days ago'}
                      </p>
                    </div>
                    <div className="text-green-600 font-medium">+{(3 - index) * 5}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <button
                className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go to Token Store
              </button>
            </div>
          </div>
        );
        
      case 'security':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Change Password</h3>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Current Password"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <button
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update Password
              </button>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600 mb-2">
                Enable two-factor authentication for added security
              </p>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Enable 2FA
              </button>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 mb-2">
                Permanently delete your account and all data
              </p>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Account
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b">
        <div className="w-48 border-r bg-gray-50 p-4">
          <div className="flex flex-col items-center mb-6">
            <img 
              src={currentUser?.avatar || 'https://via.placeholder.com/80'} 
              alt={currentUser?.name || 'User'}
              className="w-16 h-16 rounded-full mb-2"
            />
            <div className="font-bold">{currentUser?.name || 'Guest User'}</div>
            <div className="text-xs text-gray-500">{currentUser?.email || ''}</div>
            {isAdmin && (
              <div className="mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                Admin
              </div>
            )}
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center w-full px-3 py-2 text-left text-sm rounded-md ${
                activeTab === 'profile' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <UserIcon className="w-4 h-4 mr-2" />
              <span>Profile</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center w-full px-3 py-2 text-left text-sm rounded-md ${
                activeTab === 'preferences' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Bell className="w-4 h-4 mr-2" />
              <span>Preferences</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('tokens')}
              className={`flex items-center w-full px-3 py-2 text-left text-sm rounded-md ${
                activeTab === 'tokens' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Coins className="w-4 h-4 mr-2" />
              <span>Tokens</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center w-full px-3 py-2 text-left text-sm rounded-md ${
                activeTab === 'security' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4 mr-2" />
              <span>Security</span>
            </button>
          </nav>
          
          <div className="mt-8 pt-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-left text-sm text-red-600 rounded-md hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-6">
          <h2 className="text-xl font-bold mb-4">
            {activeTab === 'profile' ? 'Profile Settings' : 
             activeTab === 'preferences' ? 'Preferences' : 
             activeTab === 'tokens' ? 'Token Wallet' : 'Security Settings'}
          </h2>
          
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default UserSettings;

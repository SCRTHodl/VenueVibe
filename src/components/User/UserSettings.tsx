import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
// User interface is imported from context
import { LogOut, Save, User as UserIcon, Shield, Coins, Bell, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface UserSettingsProps {
  onClose: () => void;
}

interface NFT {
  id: string;
  metadata: {
    image: string;
    name: string;
    description: string;
  };
}

interface Badge {
  id: string;
  badge_type: 'attendance' | 'participant' | 'contributor';
  metadata: {
    name: string;
    awarded_at: string;
  };
}

const UserSettings: React.FC<UserSettingsProps> = ({ onClose }) => {
  const { currentUser, setCurrentUser, logout, isAdmin, nfts, badges, loadUserAssets } = useUser();
  
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [avatar, setAvatar] = useState<string>(currentUser?.avatar || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load user assets when component mounts
  useEffect(() => {
    if (currentUser?.id) {
      loadUserAssets();
    }
  }, [currentUser?.id, loadUserAssets]);

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

            {/* NFTs Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Your NFT Collection</h3>
              <div className="grid grid-cols-2 gap-4">
                {(nfts as NFT[]).map((nft) => (
                  <div key={nft.id} className="border rounded-lg p-3">
                    <div className="w-24 h-24 mb-2">
                      <img 
                        src={nft.metadata.image || 'default-nft-image'}
                        alt={nft.metadata.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <p className="font-medium text-sm">{nft.metadata.name}</p>
                    <p className="text-xs text-gray-500">{nft.metadata.description}</p>
                  </div>
                ))}
                {nfts.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No NFTs in your collection yet
                  </div>
                )}
              </div>
            </div>

            {/* Badges Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Your Badges</h3>
              <div className="flex flex-wrap gap-2">
                {(badges as Badge[]).map((badge) => (
                  <div key={badge.id} className="bg-gray-800/50 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">{badge.badge_type.charAt(0).toUpperCase() + badge.badge_type.slice(1)}</span>
                      <p className="text-sm">{badge.metadata.name}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Earned: {new Date(badge.metadata.awarded_at).toLocaleDateString()}</p>
                  </div>
                ))}
                {badges.length === 0 && (
                  <div className="w-full text-center py-4 text-gray-500">
                    No badges earned yet
                  </div>
                )}
              </div>
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
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 mr-2"
                />
                <span>Enable Two-Factor Authentication</span>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">User Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mt-4">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 ${
                  activeTab === 'profile'
                    ? 'bg-blue-500 text-white rounded-t-lg'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-4 py-2 ${
                  activeTab === 'preferences'
                    ? 'bg-blue-500 text-white rounded-t-lg'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Preferences
              </button>
              <button
                onClick={() => setActiveTab('tokens')}
                className={`px-4 py-2 ${
                  activeTab === 'tokens'
                    ? 'bg-blue-500 text-white rounded-t-lg'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tokens
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 ${
                  activeTab === 'security'
                    ? 'bg-blue-500 text-white rounded-t-lg'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Security
              </button>
            </nav>
          </div>
        </div>

        <div className="p-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default UserSettings;

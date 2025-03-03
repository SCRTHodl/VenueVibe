import React from 'react';
import { Home, Search, Plus, Bell, User, Compass, Trophy, Store, Star } from 'lucide-react';

interface MobileNavBarProps {
  activeTab: 'home' | 'explore' | 'search' | 'create' | 'notifications' | 'profile' | 'leaderboard' | 'store' | 'ratings';
  onTabChange: (tab: 'home' | 'explore' | 'search' | 'create' | 'notifications' | 'profile' | 'leaderboard' | 'store' | 'ratings') => void;
  onShowTokenStore?: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onTabChange, onShowTokenStore }) => {
  const getTabClass = (tab: string) => {
    return activeTab === tab
      ? 'text-[--color-accent-primary]'
      : 'text-gray-400 hover:text-gray-200';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[--color-accent-primary]/10 shadow-lg z-40">
      <div className="flex justify-around items-center py-1">
        <button
          onClick={() => onTabChange('home')}
          className={`p-2.5 flex flex-col items-center ${getTabClass('home')}`}
        >
          <Home size={20} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => onTabChange('explore')}
          className={`p-2.5 flex flex-col items-center ${getTabClass('explore')}`}
        >
          <Compass size={20} />
          <span className="text-[10px] mt-0.5">Explore</span>
        </button>

        <button
          onClick={() => onTabChange('create')}
          className={`p-1.5 flex flex-col items-center ${getTabClass('create')}`}
        >
          <div className={`p-1 rounded-full ${activeTab === 'create' ? 'bg-[--color-accent-primary]' : 'bg-gray-500'}`}>
            <Plus size={20} color="white" />
          </div>
          <span className={`text-[10px] mt-0.5 ${getTabClass('create')}`}>Post</span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`p-2.5 flex flex-col items-center ${getTabClass('profile')}`}
        >
          <User size={20} />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>

        <button
          onClick={() => onShowTokenStore ? onShowTokenStore() : onTabChange('store')}
          className={`p-2.5 flex flex-col items-center ${getTabClass('store')}`}
        >
          <Store size={20} />
          <span className="text-[10px] mt-0.5">Store</span>
        </button>
      </div>
    </div>
  );
};
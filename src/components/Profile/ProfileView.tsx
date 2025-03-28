import React, { useState } from 'react';
import { Settings, Users, MapPin, Calendar, LogOut, Grid, Bookmark, Clock, Map as MapIcon, Coins } from 'lucide-react';
import type { AppStats, UserStory } from '../../types';
import { TokenDisplay } from './TokenDisplay';
import { TokenWallet } from '../TokenWallet';

interface ProfileViewProps {
  stats: AppStats;
  userStories?: UserStory[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ stats, userStories = [] }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'visited'>('posts');
  const [showWallet, setShowWallet] = useState(false);
  
  return (
    <div className="flex flex-col h-full bg-[#121826]">
      {showWallet && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <TokenWallet onClose={() => setShowWallet(false)} />
        </div>
      )}
      
      <div className="p-5 space-y-5">
        {/* Profile header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
              U
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">User123</h2>
              <p className="text-gray-400 text-sm">@user123</p>
            </div>
          </div>
          <div className="flex gap-2">
            <TokenDisplay onOpenWallet={() => setShowWallet(true)} />
            <button className="p-2 rounded-full bg-[#1a2234] text-gray-400 hover:text-white hover:bg-blue-900/40">
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Bio & stats */}
        <div className="space-y-3">
          <p className="text-gray-300">Exploring great places in the city! 📍 Map enthusiast and food lover.</p>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin size={14} className="text-blue-400" />
            <span>Phoenix, Arizona</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar size={14} className="text-blue-400" />
            <span>Joined July 2023</span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex justify-between border-y border-gray-700 py-3">
          <div className="text-center">
            <div className="text-white font-semibold">{userStories?.length || 0}</div>
            <div className="text-xs text-gray-400">Stories</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">42</div>
            <div className="text-xs text-gray-400">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">168</div>
            <div className="text-xs text-gray-400">Following</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">89</div>
            <div className="text-xs text-gray-400">Followers</div>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
            <Users size={16} />
            Edit Profile
          </button>
          <button
            onClick={() => setShowWallet(true)}
            className="bg-[#1a2234] hover:bg-[#1a2234]/80 text-gray-300 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Coins size={16} className="text-[--color-accent-primary]" />
            Wallet
          </button>
          <button className="bg-[#1a2234] hover:bg-red-900/20 text-gray-300 hover:text-red-400 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button 
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5
            ${activeTab === 'posts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid size={16} />
          Posts
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5
            ${activeTab === 'saved' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark size={16} />
          Saved
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5
            ${activeTab === 'visited' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('visited')}
        >
          <Clock size={16} />
          History
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-1">
            {/* Show user stories in the grid */}
            {userStories.map(story => (
              <div key={story.id} className="aspect-square bg-[#1a2234] rounded-md overflow-hidden">
                {story.media && story.media.length > 0 ? (
                  <img 
                    src={story.media[0].url} 
                    alt="User story" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-900/30 flex items-center justify-center">
                    <MapIcon size={20} className="text-blue-400" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Fill remaining grid with placeholders */}
            {Array.from({ length: Math.max(0, 9 - userStories.length) }).map((_, i) => (
              <div key={i} className="aspect-square bg-[#1a2234] rounded-md overflow-hidden">
                {i % 3 === 0 ? (
                  <div className="w-full h-full bg-blue-900/30 flex items-center justify-center">
                    <MapIcon size={20} className="text-blue-400" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-blue-900/50"></div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'saved' && (
          <div className="text-center py-10 text-gray-400">
            <Bookmark size={40} className="mx-auto mb-3 text-gray-500" />
            <h3 className="text-lg font-medium text-white mb-1">No Saved Items</h3>
            <p className="text-sm">Items you save will appear here</p>
          </div>
        )}
        
        {activeTab === 'visited' && (
          <div className="text-center py-10 text-gray-400">
            <Clock size={40} className="mx-auto mb-3 text-gray-500" />
            <h3 className="text-lg font-medium text-white mb-1">No History Yet</h3>
            <p className="text-sm">Places you visit will appear here</p>
          </div>
        )}
      </div>
      
      {/* App info */}
      <div className="p-4 text-center text-xs text-gray-500">
        <p>MapChat v{stats.version}</p>
        <p>© 2025 MapChat Inc.</p>
      </div>
      
      {/* Token Wallet Modal */}
      {showWallet && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <TokenWallet onClose={() => setShowWallet(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
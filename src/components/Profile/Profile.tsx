import React, { useState, useEffect } from 'react';
import { Settings, Users, MapPin, Calendar, LogOut, Grid, Bookmark, Clock, Map as MapIcon, Coins, Shield, AlertCircle, Loader2 } from 'lucide-react';
import type { AppStats, UserStory } from '../../types';
import { TokenDisplay } from './TokenDisplay';
import { TokenWallet } from '../TokenWallet';
import { supabase } from '../../lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

interface ProfileProps {
  stats: AppStats;
  userStories?: UserStory[];
  onShowAdminPanel?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ stats, userStories = [], onShowAdminPanel }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'visited'>('posts');
  const [showWallet, setShowWallet] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user) return;
      
      try {
        const { data, error } = await supabase
          .from('admin_panel.users')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, [session]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-[--color-accent-primary]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={[]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#121826]">
      {error && (
        <div className="p-4 bg-red-500/20 text-red-300 flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* Profile header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
              {session.user.email?.[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{session.user.email}</h2>
              <p className="text-gray-400 text-sm">@{session.user.email.split('@')[0]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <TokenDisplay onOpenWallet={() => setShowWallet(true)} />
            <button className="p-2 rounded-full bg-[#1a2234] text-gray-400 hover:text-white hover:bg-[#1a2234]/80">
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Bio & stats */}
        <div className="space-y-3">
          <p className="text-gray-300">Exploring great places in the city! 📍 Map enthusiast and food lover.</p>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin size={14} className="text-[--color-accent-primary]" />
            <span>Phoenix, Arizona</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar size={14} className="text-[--color-accent-primary]" />
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
        
        {/* Action buttons */}
        <div className="flex gap-3">
          <button className="flex-1 bg-[--color-accent-primary] hover:bg-[--color-accent-primary]/90 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
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
          
          {isAdmin && (
            <button
              onClick={onShowAdminPanel}
              className="bg-[#1a2234] hover:bg-[#1a2234]/80 text-gray-300 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Shield size={16} className="text-[--color-accent-primary]" />
              Admin
            </button>
          )}
          
          <button 
            onClick={handleSignOut}
            disabled={loading}
            className="bg-[#1a2234] hover:bg-red-900/20 text-gray-300 hover:text-red-400 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button 
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5
            ${activeTab === 'posts' ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' : 'text-gray-400'}`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid size={16} />
          Posts
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5
            ${activeTab === 'saved' ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' : 'text-gray-400'}`}
          onClick={() => setActiveTab('saved')}
        >
          <Bookmark size={16} />
          Saved
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5
            ${activeTab === 'visited' ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' : 'text-gray-400'}`}
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
                    <MapIcon size={20} className="text-[--color-accent-primary]" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Fill remaining grid with placeholders */}
            {Array.from({ length: Math.max(0, 9 - userStories.length) }).map((_, i) => (
              <div key={i} className="aspect-square bg-[#1a2234] rounded-md overflow-hidden">
                {i % 3 === 0 ? (
                  <div className="w-full h-full bg-blue-900/30 flex items-center justify-center">
                    <MapIcon size={20} className="text-[--color-accent-primary]" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a2234] to-[#121826]"></div>
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
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Map, ArrowLeft, Sparkles, QrCode, Palette } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { Feed } from './components/Feed/Feed';
import { getTokenBalance } from './lib/supabase/tokenEconomy';
import { TEST_GROUPS, MOCK_POSTS, EVENT_THEMES } from './constants';

// App statistics helper function
async function getAppStats() {
  try {
    // Use mock data for demo instead of real tables
    // This prevents 404 errors when tables don't exist yet
    console.log('Fetching app stats with mock data for development');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Create mock stats for demo purposes
    return {
      userCount: 342,
      storyCount: 1289,
      topBalances: [
        { user_id: 'user1', balance: 2500 },
        { user_id: 'user2', balance: 1800 },
        { user_id: 'user3', balance: 1250 },
        { user_id: 'user4', balance: 950 },
        { user_id: 'user5', balance: 780 }
      ],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching app stats:', error);
    return {
      userCount: 0,
      storyCount: 0,
      topBalances: [],
      lastUpdated: new Date().toISOString()
    };
  }
}
import { MobileNavBar } from './components/Navigation/MobileNavBar';
import { Stories } from './components/Stories/Stories';
import { Profile } from './components/Profile/Profile';
import { Notifications } from './components/Notifications/Notifications';
import { SearchView } from './components/Search/SearchView';
import { GroupDetail } from './components/Group/GroupDetail';
import { EventBanner } from './components/EventTheme/EventBanner';
import { EventModal } from './components/EventTheme/EventModal';
import { InviteCodeEntry } from './components/InviteCode/InviteCodeEntry';
import { ThemeCustomizer } from './components/ThemeCustomizer/ThemeCustomizer';
import { LocalContentFeed } from './components/Trending/LocalContentFeed';
import { StoryModal } from './components/Stories/StoryModal';
import { VoiceAssistant } from './components/VoiceAssistant';
import { TokenBalance } from './components/TokenBalance/TokenBalance';
import { TokenStore } from './components/TokenStore/TokenStore';
import { RatingsView } from './components/Ratings/RatingsView';
import { Leaderboard } from './components/Leaderboard/Leaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenStore } from './lib/tokenStore';
import { AdminLayout } from './components/Admin/AdminLayout';
import { CreatePost } from './components/Post/CreatePost';

// Lazy load the map component to improve initial load time
const MapView = lazy(() => import('./components/Map'));

import type { 
  Group, 
  Post,
  ActivityEvent, 
  GroupActivity, 
  UserLocation, 
  ViewState,
  AppStats as AppStatsType,
  EventTheme,
  AppTheme,
  UserStory
} from './types';

function App() {
  // State
  const [viewState, setViewState] = useState<ViewState>({
    latitude: 33.4942,
    longitude: -111.9261,
    zoom: 11
  });
  const [groups, setGroups] = useState<Group[]>(TEST_GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'create' | 'notifications' | 'profile' | 'store' | 'ratings' | 'leaderboard'>('home');
  const [groupActivities, setGroupActivities] = useState<GroupActivity[]>([]);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [appStats, setAppStats] = useState<AppStatsType>({ subscriberCount: 0, version: '1.0.0' });
  const [isMapVisible, setIsMapVisible] = useState(false);
  // Only load the map when it's actually needed
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [showTokenStore, setShowTokenStore] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showContentTypeModal, setShowContentTypeModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<{id: string, name: string} | null>(null);
  
  // New state for theme customizer, invite code and events
  const [activeEventTheme, setActiveEventTheme] = useState<EventTheme | null>(null);
  const [showInviteCodeEntry, setShowInviteCodeEntry] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [filteredByInviteCode, setFilteredByInviteCode] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>({
    primary: '#8b5cf6',
    secondary: '#3b82f6',
    accent: '#10b981',
    background: '#000000',
    cardBackground: '#0a0a0a',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa'
  });

  const feedRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  
  // Initialize token store
  const { initializeWallet } = useTokenStore();
  
  useEffect(() => {
    initializeWallet();
  }, [initializeWallet]);
  
  // Check if Mapbox token is configured
  useEffect(() => {
    if (!mapboxToken) {
      setMapError('Please configure your Mapbox token in the environment variables.');
    } else {
      setMapError(null);
    }
  }, [mapboxToken]);

  // Load app stats
  useEffect(() => {
    const loadAppStats = async () => {
      const stats = await getAppStats();
      setAppStats(stats);
      
      // Set default active event theme (Spring Training) for demo
      const springTheme = EVENT_THEMES.find(theme => theme.id === 'spring-training');
      if (springTheme) {
        setActiveEventTheme(springTheme);
      }
      
      // Apply CSS variable updates based on current theme
      document.documentElement.style.setProperty('--color-accent-primary', currentTheme.primary);
      document.documentElement.style.setProperty('--color-accent-secondary', currentTheme.secondary);
      document.documentElement.style.setProperty('--color-bg-primary', currentTheme.background);
      document.documentElement.style.setProperty('--color-bg-secondary', currentTheme.cardBackground);
      document.documentElement.style.setProperty('--color-text-primary', currentTheme.textPrimary);
      document.documentElement.style.setProperty('--color-text-secondary', currentTheme.textSecondary);
    };
    
    loadAppStats();
  }, [currentTheme]);

  // Generate activity events for real-time map feed
  useEffect(() => {
    const EVENT_TYPES = ['join', 'badge', 'gift', 'like'];
    const USER_NAMES = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Skyler', 'Jamie'];
    const BADGE_NAMES = ['Explorer Pro', 'Local Guide', 'Night Owl', 'Event Master', 'Social Butterfly'];
    const GROUP_NAMES = groups.map(g => g.name);
    const GIFT_TYPES = ['🍹 Drink', '🎁 Welcome Gift', '🏆 VIP Pass', '🎫 Event Ticket', '⭐ Premium Access'];
    
    // Create some initial events
    const initialEvents: ActivityEvent[] = [];
    for (let i = 0; i < 3; i++) {
      const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)] as 'join' | 'badge' | 'gift' | 'like';
      const event: ActivityEvent = {
        id: `event-${Date.now()}-${i}`,
        type,
        user_name: USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)],
        created_at: new Date().toISOString()
      };
      
      if (type === 'join') {
        event.group_name = GROUP_NAMES[Math.floor(Math.random() * GROUP_NAMES.length)];
      } else if (type === 'badge') {
        event.badge_name = BADGE_NAMES[Math.floor(Math.random() * BADGE_NAMES.length)];
      } else if (type === 'gift') {
        event.gift_type = GIFT_TYPES[Math.floor(Math.random() * GIFT_TYPES.length)];
        event.target_name = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
      } else if (type === 'like') {
        event.target_name = 'Your post';
      }
      
      initialEvents.push(event);
    }
    
    setActivityEvents(initialEvents);
    
    // Periodically add new events
    const interval = setInterval(() => {
      if (isMapVisible) {
        const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)] as 'join' | 'badge' | 'gift' | 'like';
        const newEvent: ActivityEvent = {
          id: `event-${Date.now()}`,
          type,
          user_name: USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)],
          created_at: new Date().toISOString()
        };
        
        if (type === 'join') {
          newEvent.group_name = GROUP_NAMES[Math.floor(Math.random() * GROUP_NAMES.length)];
        } else if (type === 'badge') {
          newEvent.badge_name = BADGE_NAMES[Math.floor(Math.random() * BADGE_NAMES.length)];
        } else if (type === 'gift') {
          newEvent.gift_type = GIFT_TYPES[Math.floor(Math.random() * GIFT_TYPES.length)];
          newEvent.target_name = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
        } else if (type === 'like') {
          newEvent.target_name = 'Your post';
        }
        
        setActivityEvents(prev => [...prev, newEvent]);
        
        // After 5 seconds, mark the event to fade out
        setTimeout(() => {
          setActivityEvents(prev => 
            prev.map(event => 
              event.id === newEvent.id ? { ...event, fadeOut: true } : event
            )
          );
          
          // After the fade out animation, remove the event
          setTimeout(() => {
            setActivityEvents(prev => prev.filter(event => event.id !== newEvent.id));
          }, 1000);
        }, 5000);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isMapVisible, groups]);

  // Generate user locations
  useEffect(() => {
    const generateUserLocations = () => {
      const locations: UserLocation[] = [];
      groups.forEach(group => {
        const userCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < userCount; i++) {
          const latOffset = (Math.random() - 0.5) * 0.01;
          const lngOffset = (Math.random() - 0.5) * 0.01;
          locations.push({
            id: `user-${group.id}-${i}`,
            latitude: group.latitude + latOffset,
            longitude: group.longitude + lngOffset,
            lastActive: Date.now() - Math.random() * 3600000
          });
        }
      });
      setUserLocations(locations);
    };

    generateUserLocations();
    
    // Update user locations less frequently
    const interval = setInterval(() => {
      if (isMapVisible) {
        setUserLocations(prev => prev.map(loc => ({
          ...loc,
          latitude: loc.latitude + (Math.random() - 0.5) * 0.001,
          longitude: loc.longitude + (Math.random() - 0.5) * 0.001,
          lastActive: Math.random() > 0.7 ? Date.now() : loc.lastActive
        })));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [groups, isMapVisible]);

  // Update group activities
  useEffect(() => {
    setGroupActivities(groups.map(group => ({
      id: group.id,
      level: Math.floor(Math.random() * 10) + 1,
      surgeCount: 0
    })));

    const interval = setInterval(() => {
      if (isMapVisible) {
        setGroupActivities(prev => prev.map(activity => ({
          ...activity,
          level: Math.min(10, Math.max(1, activity.level + (Math.random() > 0.5 ? 1 : -1))),
          surgeCount: Math.random() > 0.8 ? activity.surgeCount + 1 : activity.surgeCount
        })));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [groups, isMapVisible]);

  // Memoize the user heatmap data
  const userHeatmapData = React.useMemo(() => ({
    type: 'FeatureCollection',
    features: userLocations.map(user => ({
      type: 'Feature',
      properties: {
        weight: Math.max(0.2, 1 - (Date.now() - user.lastActive) / 3600000)
      },
      geometry: {
        type: 'Point',
        coordinates: [user.longitude, user.latitude]
      }
    }))
  }), [userLocations]);

  const userHeatmapLayer = {
    id: 'user-heat',
    type: 'heatmap',
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(139,92,246,0)',
        0.2, 'rgba(139,92,246,0.3)',
        0.4, 'rgba(139,92,246,0.5)',
        0.6, 'rgba(139,92,246,0.7)',
        0.8, 'rgba(139,92,246,0.8)',
        1, 'rgba(139,92,246,1)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 15],
      'heatmap-opacity': 0.6
    }
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupDetail(true);
    setIsMapVisible(false);
  };
  
  // Handle viewing venue posts and chats
  const handleViewVenuePosts = (venueId: string, venueName: string) => {
    setSelectedVenue({ id: venueId, name: venueName });
    setIsMapVisible(false);
    setActiveTab('home');
    
    // Scroll to venue-specific posts in the feed
    setTimeout(() => {
      if (feedRef.current) {
        // Scroll to any venue-specific content
        feedRef.current.scrollTop = 0;
        
        // In a real app, you would filter the feed for venue-specific posts
        // For now, we'll just display a message
        toast.success(`Viewing posts for ${venueName}`);
      }
    }, 300);
  };
  
  // Clear venue selection to return to main feed
  const clearVenueSelection = () => {
    setSelectedVenue(null);
    toast.success('Showing all posts');
    
    // Scroll back to top of feed
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  };

  const toggleMapView = () => {
    if (!mapLoaded && !isMapVisible) {
      // Start loading the map
      setMapLoading(true);
      setMapLoaded(true);
    }
    setIsMapVisible(!isMapVisible);
  };
  
  // Handle map loading and initialization
  useEffect(() => {
    if (mapLoading) {
      // Here we could add any data fetching required for the map
      // such as venues, markers, etc.
      
      // This setTimeout simulates actual data loading, but prevents the spinner flash
      const timer = setTimeout(() => {
        setMapLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [mapLoading]);
  
  const handleInviteCodeSuccess = (inviteCode: string, theme?: EventTheme) => {
    // Close modal
    setShowInviteCodeEntry(false);
    
    // Set active theme if provided
    if (theme) {
      setActiveEventTheme(theme);
      setShowBanner(true);
    }
    
    // Filter groups by invite code
    const filteredGroups = TEST_GROUPS.filter(group => 
      group.inviteCode === inviteCode || 
      (theme && group.eventTheme?.id === theme.id)
    );
    
    if (filteredGroups.length > 0) {
      setGroups(filteredGroups);
      setFilteredByInviteCode(true);
      
      // Filter posts to match the filtered groups
      const groupIds = filteredGroups.map(g => g.id);
      const filteredPosts = MOCK_POSTS.filter(post => 
        groupIds.includes(post.venue.id)
      );
      setPosts(filteredPosts);
    }
  };
  
  const resetFilters = () => {
    setGroups(TEST_GROUPS);
    setPosts(MOCK_POSTS);
    setFilteredByInviteCode(false);
  };
  
  const handleThemeChange = (newTheme: AppTheme) => {
    setCurrentTheme(newTheme);
  };

  // Handle content type selection
  const handleContentTypeSelect = (type: 'story' | 'post') => {
    setShowContentTypeModal(false);
    if (type === 'story') {
      setShowStoryModal(true);
    } else {
      setShowCreatePost(true);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: 'home' | 'explore' | 'create' | 'notifications' | 'profile' | 'store' | 'ratings' | 'leaderboard') => {
    if (tab === 'create') {
      setShowContentTypeModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Add admin check
  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;
      
      const { data, error } = await supabase
        .from('admin_panel.users')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  };

  const renderTabContent = () => {
    // If showing group detail, it takes precedence
    if (showGroupDetail && selectedGroup) {
      return (
        <GroupDetail 
          group={selectedGroup} 
          onBack={() => setShowGroupDetail(false)} 
        />
      );
    }
    
    // Otherwise show the tab content
    switch (activeTab) {
      case 'home':
        return (
          <div ref={feedRef} className="flex-1 overflow-y-auto pb-16 noise-texture">
            {activeEventTheme && showBanner && (
              <div className="px-3 pt-3">
                <EventBanner 
                  theme={activeEventTheme}
                  onDismiss={() => setShowBanner(false)}
                  onLearn={() => setShowEventModal(true)}
                />
              </div>
            )}
            <Stories 
              groups={groups} 
              userStories={userStories}
              onCreateStory={() => setShowStoryModal(true)}
            />
            <Feed 
              posts={posts} 
              groups={groups} 
              onGroupSelect={handleGroupSelect}
              onMapViewToggle={toggleMapView}
              selectedVenue={selectedVenue}
              onClearVenueSelection={clearVenueSelection}
            />
          </div>
        );
      case 'explore':
        return (
          <div className="flex-1 overflow-y-auto pb-16 noise-texture">
            <LocalContentFeed />
          </div>
        );
      case 'search':
        return <SearchView groups={groups} onGroupSelect={handleGroupSelect} />;
      case 'notifications':
        return <Notifications activityEvents={activityEvents} />;
      case 'profile':
        return (
          <Profile 
            stats={appStats} 
            userStories={userStories} 
            onShowAdminPanel={() => setShowAdminPanel(true)}
          />
        );
      case 'store':
        return <TokenStore onClose={() => setActiveTab('home')} />;
      case 'ratings':
        return <RatingsView onClose={() => setActiveTab('home')} />;
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return null;
    }
  };

  // Content type selection modal
  const ContentTypeModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121826] rounded-xl p-6 w-full max-w-sm border border-[--color-accent-primary]/20">
        <h3 className="text-xl font-bold text-white mb-6 text-center">Create Content</h3>
        <div className="space-y-4">
          <button
            onClick={() => handleContentTypeSelect('story')}
            className="w-full bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white p-4 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Create Story
          </button>
          <button
            onClick={() => handleContentTypeSelect('post')}
            className="w-full bg-[#1a2234] text-white p-4 rounded-xl font-medium hover:bg-[#1a2234]/80 transition-colors"
          >
            Create Post
          </button>
          <button
            onClick={() => setShowContentTypeModal(false)}
            className="w-full text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Determine header style based on active theme
  const getHeaderStyle = () => {
    if (activeEventTheme) {
      return {
        background: `linear-gradient(135deg, ${activeEventTheme.primaryColor}cc, ${activeEventTheme.secondaryColor}cc)`,
        borderBottom: `1px solid ${activeEventTheme.accentColor}50`
      };
    }
    return {
      background: 'linear-gradient(135deg, rgba(10,10,10,0.8), rgba(0,0,0,0.9))',
      borderBottom: '1px solid rgba(139,92,246,0.1)'
    };
  };

  return (
    <div className="flex flex-col h-screen bg-[--color-bg-primary] relative overflow-hidden noise-texture">
      {/* Voice Assistant */}
      <VoiceAssistant />

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminLayout onClose={() => setShowAdminPanel(false)} />
      )}

      {/* App Header */}
      <header 
        className="sticky top-0 z-40 p-4 shadow-lg transition-all duration-300 glass-morphism"
        style={getHeaderStyle()}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {activeEventTheme && (
              <Sparkles 
                size={0} 
                className="animate-pulse" 
                style={{ color: activeEventTheme.accentColor }} 
              />
            )}
            <Map size={22} className="text-[--color-accent-primary]" />
            <span className="font-['Clash_Display'] tracking-tight">
              {activeEventTheme ? activeEventTheme.name : 'SottoCity'}
            </span>
          </h1>
          
          <div className="flex gap-3 items-center">
            {filteredByInviteCode && (
              <button 
                onClick={resetFilters}
                className="text-xs bg-[--color-accent-primary]/20 hover:bg-[--color-accent-primary]/30 px-2 py-1 rounded-lg text-white"
              >
                Reset Filters
              </button>
            )}
            
            <TokenBalance onClick={() => setShowTokenStore(true)} />
            
            <button 
              onClick={() => setShowThemeCustomizer(true)}
              className="p-2 rounded-full bg-[--color-accent-primary]/10 text-[--color-text-primary] hover:bg-[--color-accent-primary]/20 transition-colors"
              title="Customize theme"
            >
              <Palette size={18} className="text-[--color-accent-primary]" />
            </button>
            
            <button 
              onClick={() => setShowInviteCodeEntry(true)}
              className="p-2 rounded-full bg-[--color-accent-primary]/10 text-[--color-text-primary] hover:bg-[--color-accent-primary]/20 transition-colors"
              title="Enter invitation code"
            >
              <QrCode size={18} className="text-[--color-accent-primary]" />
            </button>
            
            {(activeTab === 'home' || activeTab === 'explore') && !showGroupDetail && (
              <button 
                onClick={toggleMapView}
                className="bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] hover:opacity-90 px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-1.5 transition-all shadow-lg"
              >
                <Map size={16} />
                {isMapVisible ? 'Hide Map' : 'Map'}
              </button>
            )}
            
            {(activeTab !== 'home' && activeTab !== 'explore' || showGroupDetail) && (
              <button 
                onClick={() => {
                  setActiveTab('home');
                  setShowGroupDetail(false);
                }}
                className="p-2 rounded-full bg-[--color-accent-primary]/10 text-[--color-text-primary] hover:bg-[--color-accent-primary]/20 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {renderTabContent()}
        
        {/* Map Overlay */}
        <AnimatePresence mode="wait">
          {isMapVisible && (
            <motion.div 
              ref={mapContainerRef}
              className="absolute inset-0 z-30"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {!mapLoaded ? (
                <div className="h-full flex items-center justify-center bg-[--color-bg-primary]">
                  <div className="flex flex-col items-center">
                    <div className="premium-loader"></div>
                    <p className="mt-4 text-white">Loading Map...</p>
                  </div>
                </div>
              ) : (
                <Suspense fallback={null}>
                  {mapError ? (
                    <div className="h-full flex items-center justify-center bg-[--color-bg-secondary]">
                      <div className="text-center p-8 premium-card">
                        <h2 className="text-2xl font-bold text-white mb-4">Map Configuration Required</h2>
                        <p className="text-gray-300">{mapError}</p>
                        <p className="text-sm text-gray-400 mt-2">Please add your Mapbox token to the .env file.</p>
                      </div>
                    </div>
                  ) : (
                    <MapView
                      viewState={viewState}
                      onMove={evt => setViewState(evt.viewState)}
                      mapboxToken={mapboxToken}
                      groups={groups}
                      groupActivities={groupActivities}
                      userLocations={userLocations}
                      selectedGroup={selectedGroup}
                      onGroupSelect={handleGroupSelect}
                      userHeatmapData={userHeatmapData}
                      userHeatmapLayer={userHeatmapLayer}
                      appStats={appStats}
                      activityEvents={activityEvents}
                      onClose={() => setIsMapVisible(false)}
                      onViewVenuePosts={handleViewVenuePosts}
                    />
                  )}
                </Suspense>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Nav Bar */}
      <MobileNavBar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onShowTokenStore={() => setShowTokenStore(true)}
      />
      
      {/* Modals */}
      {showInviteCodeEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <InviteCodeEntry 
            onSuccess={handleInviteCodeSuccess}
            onCancel={() => setShowInviteCodeEntry(false)}
          />
        </div>
      )}
      
      {showEventModal && activeEventTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <EventModal 
            theme={activeEventTheme}
            onClose={() => setShowEventModal(false)}
          />
        </div>
      )}
      
      {showThemeCustomizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <ThemeCustomizer
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            onClose={() => setShowThemeCustomizer(false)}
          />
        </div>
      )}
      
      {/* Content type selection modal */}
      <AnimatePresence>
        {showContentTypeModal && <ContentTypeModal />}
      </AnimatePresence>

      {/* Story Modal */}
      {showStoryModal && (
        <StoryModal 
          onClose={() => setShowStoryModal(false)}
          onStoryCreated={(story) => {
            setUserStories(prev => [story, ...prev]);
            setShowStoryModal(false);
          }}
        />
      )}

      {/* Post Creation Modal */}
      {showCreatePost && (
        <CreatePost 
          onClose={() => setShowCreatePost(false)}
          onPostCreated={() => {
            setShowCreatePost(false);
            // Optionally refresh posts here
          }}
        />
      )}

      {/* Token Store Modal */}
      {showTokenStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <TokenStore onClose={() => setShowTokenStore(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
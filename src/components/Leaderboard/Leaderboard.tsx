import React, { useState, useEffect } from 'react';
import { Trophy, Crown, TrendingUp, Calendar, Filter, Search, Users, Star, ArrowUp, ArrowDown, Medal, Award, MapPin, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenStore } from '../../lib/tokenStore';

// Types
interface LeaderboardUser {
  id: string;
  username: string;
  avatarUrl: string;
  influence: number;
  rank: number;
  previousRank?: number;
  postCount: number;
  likeCount: number;
  badgeCount: number;
  level: number;
  location?: string;
  isVerified?: boolean;
}

export const Leaderboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('weekly');
  const [category, setCategory] = useState<'influence' | 'content' | 'badges' | 'growth'>('influence');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  
  const { balance } = useTokenStore();
  
  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate mock data
        const mockUsers: LeaderboardUser[] = Array.from({ length: 100 }, (_, i) => {
          const influence = Math.floor(Math.random() * 1000) + 100;
          const previousRank = i + 1 + Math.floor(Math.random() * 5) - 2;
          
          return {
            id: `user-${i + 1}`,
            username: MOCK_USERNAMES[i % MOCK_USERNAMES.length],
            avatarUrl: `https://i.pravatar.cc/150?img=${i + 1}`,
            influence,
            rank: i + 1,
            previousRank: previousRank <= 0 ? 1 : previousRank,
            postCount: Math.floor(Math.random() * 100) + 5,
            likeCount: Math.floor(Math.random() * 500) + 50,
            badgeCount: Math.floor(Math.random() * 20),
            level: Math.floor(influence / 100) + 1,
            location: MOCK_LOCATIONS[i % MOCK_LOCATIONS.length],
            isVerified: Math.random() > 0.8
          };
        });
        
        // Sort based on selected category
        let sortedUsers = [...mockUsers];
        
        switch (category) {
          case 'content':
            sortedUsers.sort((a, b) => b.postCount - a.postCount);
            break;
          case 'badges':
            sortedUsers.sort((a, b) => b.badgeCount - a.badgeCount);
            break;
          case 'growth':
            sortedUsers.sort((a, b) => {
              const aGrowth = a.rank - (a.previousRank || 0);
              const bGrowth = b.rank - (b.previousRank || 0);
              return aGrowth - bGrowth; // Negative is better (moved up in ranks)
            });
            break;
          case 'influence':
          default:
            sortedUsers.sort((a, b) => b.influence - a.influence);
            break;
        }
        
        // Update ranks after sorting
        sortedUsers = sortedUsers.map((user, index) => ({
          ...user,
          rank: index + 1
        }));
        
        // Filter by location if selected
        if (locationFilter) {
          sortedUsers = sortedUsers.filter(user => user.location === locationFilter);
        }
        
        // Filter by search query
        if (searchQuery) {
          sortedUsers = sortedUsers.filter(user => 
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        setUsers(sortedUsers);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [timeRange, category, searchQuery, locationFilter]);
  
  // Get unique locations for filter
  const uniqueLocations = Array.from(new Set(users.map(user => user.location).filter(Boolean)));
  
  // Generate category display name
  const getCategoryDisplayName = () => {
    switch (category) {
      case 'content': return 'Content Creation';
      case 'badges': return 'Badges & Awards';
      case 'growth': return 'Fastest Growing';
      case 'influence': return 'Top Influencers';
      default: return 'Top Influencers';
    }
  };
  
  // Get medal color for top ranks
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-blue-400';
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#121826] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[--color-accent-primary]" />
          <h1 className="text-xl font-bold text-white">
            City Leaderboard
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg bg-[#1a2234] text-gray-300 hover:text-white"
          >
            <Filter size={18} />
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-40 bg-[#1a2234] rounded-lg text-white border border-gray-700 focus:outline-none focus:border-[--color-accent-primary]"
            />
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-b border-gray-700 overflow-hidden"
          >
            <div className="p-4 bg-[#1a2234] space-y-4">
              {/* Time range filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[--color-accent-primary]" />
                  Time Range
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTimeRange('daily')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      timeRange === 'daily' 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setTimeRange('weekly')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      timeRange === 'weekly' 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimeRange('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      timeRange === 'monthly' 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setTimeRange('all-time')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      timeRange === 'all-time' 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                    }`}
                  >
                    All Time
                  </button>
                </div>
              </div>
              
              {/* Category filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-[--color-accent-primary]" />
                  Category
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategory('influence')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      category === 'influence' 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                    }`}
                  >
                    Influence
                  </button>
                  <button
                    onClick={() => setCategory('content')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      category === 'content' 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                    }`}
                  >
                    Content
                  </button>
                  <button
                    onClick={() => setCategory('badges')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      category === 'badges' 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                    }`}
                  >
                    Badges
                  </button>
                  <button
                    onClick={() => setCategory('growth')}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      category === 'growth' 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                    }`}
                  >
                    Growth
                  </button>
                </div>
              </div>
              
              {/* Location filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                  <MapPin size={14} className="text-[--color-accent-primary]" />
                  Location
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setLocationFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      locationFilter === null 
                        ? 'bg-[--color-accent-primary] text-white' 
                        : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                    }`}
                  >
                    All Locations
                  </button>
                  
                  {uniqueLocations.map((location) => (
                    <button
                      key={location}
                      onClick={() => setLocationFilter(location)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        locationFilter === location 
                          ? 'bg-[--color-accent-primary] text-white' 
                          : 'bg-[#121826] text-gray-300 hover:bg-[#121826]/70'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header with stats */}
      <div className="p-4 bg-[#1a2234]/50 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white mb-3">
          {getCategoryDisplayName()} - {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Ranking
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#1a2234] rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Total Participants</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-[--color-accent-primary]" />
              {users.length}
            </div>
          </div>
          
          <div className="bg-[#1a2234] rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Current Leader</div>
            <div className="text-lg font-bold text-white flex items-center gap-2 truncate">
              <Crown size={18} className="text-yellow-400" />
              <span className="truncate">{users[0]?.username || 'N/A'}</span>
            </div>
          </div>
          
          <div className="bg-[#1a2234] rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Top Influence Score</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <Star size={20} className="text-yellow-400" />
              {users[0]?.influence || 0}
            </div>
          </div>
          
          <div className="bg-[#1a2234] rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Rising Star</div>
            <div className="text-lg font-bold text-white flex items-center gap-2 truncate">
              <TrendingUp size={18} className="text-green-400" />
              <span className="truncate">
                {users.sort((a, b) => {
                  const aChange = (a.previousRank || a.rank) - a.rank;
                  const bChange = (b.previousRank || b.rank) - b.rank;
                  return bChange - aChange;
                })[0]?.username || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Leaderboard table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-accent-primary]"></div>
          </div>
        ) : users.length > 0 ? (
          <div className="divide-y divide-gray-700/50">
            {users.slice(0, 100).map((user) => {
              const rankChange = (user.previousRank || user.rank) - user.rank;
              
              return (
                <motion.div 
                  key={user.id} 
                  className={`p-4 hover:bg-[#1a2234]/30 transition-colors ${
                    user.rank <= 3 ? 'bg-[#1a2234]/20' : ''
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: user.rank * 0.03 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-10 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className={`font-bold text-lg ${getMedalColor(user.rank)}`}>
                          {user.rank}
                        </div>
                        
                        {rankChange !== 0 && (
                          <div className={`text-xs flex items-center ${rankChange > 0 ? 'text-green-400' : rankChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {rankChange > 0 ? (
                              <ArrowUp size={12} />
                            ) : rankChange < 0 ? (
                              <ArrowDown size={12} />
                            ) : null}
                            <span>{Math.abs(rankChange)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* User info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <img 
                          src={user.avatarUrl} 
                          alt={user.username} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        
                        {user.rank <= 3 && (
                          <div className={`absolute -top-1 -right-1 p-0.5 rounded-full ${
                            user.rank === 1 ? 'bg-yellow-400' : 
                            user.rank === 2 ? 'bg-gray-300' : 
                            'bg-amber-600'
                          }`}>
                            <Crown size={10} className="text-black" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <div className="font-medium text-white truncate">
                            {user.username}
                          </div>
                          
                          {user.isVerified && (
                            <div className="p-0.5 bg-blue-500 rounded-full">
                              <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin size={10} />
                            <span>{user.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award size={10} />
                            <span>Level {user.level}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="hidden sm:block text-center">
                        <div className="text-xs text-gray-400">Posts</div>
                        <div className="font-medium text-white">{user.postCount}</div>
                      </div>
                      
                      <div className="hidden sm:block text-center">
                        <div className="text-xs text-gray-400">Likes</div>
                        <div className="font-medium text-white">{user.likeCount}</div>
                      </div>
                      
                      <div className="hidden sm:block text-center">
                        <div className="text-xs text-gray-400">Badges</div>
                        <div className="font-medium text-white">{user.badgeCount}</div>
                      </div>
                      
                      <div className="text-center bg-[#1a2234] px-3 py-1.5 rounded-lg">
                        <div className="text-xs text-gray-400">Influence</div>
                        <div className="font-medium text-[--color-accent-primary]">{user.influence}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Trophy size={48} className="text-gray-500 mb-3" />
            <h3 className="text-xl font-medium text-white mb-1">No results found</h3>
            <p className="text-gray-400 max-w-md">
              {searchQuery
                ? `No users matching "${searchQuery}" found. Try a different search term.`
                : 'No users found with the current filters. Try adjusting your filters to see more results.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Footer with token rewards */}
      <div className="border-t border-gray-700 p-4 bg-[#1a2234]/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-white font-medium mb-1">Boost Your Rank!</h3>
            <p className="text-sm text-gray-400">Create quality content, engage with others, and earn badges to climb the ranks.</p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-lg bg-[#121826] text-white hover:bg-[#121826]/80 transition-colors">
              View My Rank
            </button>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white font-medium hover:opacity-90 transition-opacity">
              Boost Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock data for demonstration
const MOCK_USERNAMES = [
  'SottoKing', 'UrbanExplorer', 'CityScout', 'LocalLegend', 'DigitalNomad',
  'StreetSmart', 'CityWanderer', 'UrbanPioneer', 'MetroMaven', 'CitySlicker',
  'DowntownDiva', 'UrbanInsider', 'LocalHero', 'CityStrider', 'UrbanVoyager',
  'BlockCaptain', 'SottoStar', 'UrbanJunkie', 'CityDweller', 'LocalInfluencer'
];

const MOCK_LOCATIONS = [
  'Downtown', 'Midtown', 'Uptown', 'West Side', 'East Side',
  'North End', 'South District', 'Financial District', 'Arts District', 'Historic Center'
];
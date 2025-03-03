import React, { useState } from 'react';
import { Star, Award, TrendingUp, Filter, Search, X, ThumbsUp, MessageSquare, Share2, Coins, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenStore, TOKEN_ECONOMY } from '../../lib/tokenStore';
import { Group } from '../../types';
import { TEST_GROUPS } from '../../constants';

interface RatingsViewProps {
  onClose?: () => void;
}

interface Rating {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  groupId: string;
  rating: number;
  review: string;
  photos?: string[];
  likes: number;
  replies: number;
  shares: number;
  isLiked?: boolean;
  isVerified?: boolean;
  createdAt: string;
  badges?: string[];
}

export const RatingsView: React.FC<RatingsViewProps> = ({ onClose }) => {
  const [activeVenue, setActiveVenue] = useState<Group | null>(null);
  const [sortOrder, setSortOrder] = useState<'recent' | 'rating' | 'helpful'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  
  const { balance, earnTokens, spendTokens } = useTokenStore();

  // Mock ratings data
  const mockRatings: Rating[] = [
    {
      id: 'rating-1',
      userId: 'user-1',
      userName: 'Michael',
      userAvatar: 'M',
      groupId: TEST_GROUPS[0].id,
      rating: 5,
      review: "The pizza here is absolutely incredible! The crust is perfectly thin and crispy, and the toppings are always fresh. The ambiance is cozy and the service is top-notch. Definitely worth the wait!",
      photos: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop'],
      likes: 42,
      replies: 8,
      shares: 12,
      isLiked: false,
      isVerified: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      badges: ['Top Reviewer', 'Food Expert']
    },
    {
      id: 'rating-2',
      userId: 'user-2',
      userName: 'Sarah',
      userAvatar: 'S',
      groupId: TEST_GROUPS[0].id,
      rating: 4,
      review: "Great spot for date night! The wine selection is excellent and pairs perfectly with their bruschetta board. The only reason for 4 stars is the wait time can be a bit long on weekends.",
      photos: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop'],
      likes: 28,
      replies: 5,
      shares: 7,
      isLiked: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      badges: ['Wine Enthusiast']
    },
    {
      id: 'rating-3',
      userId: 'user-3',
      userName: 'David',
      userAvatar: 'D',
      groupId: TEST_GROUPS[1].id,
      rating: 5,
      review: "The Churchill has the best craft cocktails in town! The mixologists are true artists and the atmosphere is perfect for a night out. Try the smoked old fashioned - it's a game changer!",
      photos: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop'],
      likes: 56,
      replies: 12,
      shares: 15,
      isVerified: true,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      badges: ['Cocktail Connoisseur', 'Elite Reviewer']
    }
  ];

  // Filter and sort ratings
  const getFilteredRatings = () => {
    let filtered = mockRatings;
    
    if (activeVenue) {
      filtered = filtered.filter(r => r.groupId === activeVenue.id);
    }
    
    if (filterRating) {
      filtered = filtered.filter(r => r.rating === filterRating);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.review.toLowerCase().includes(query) ||
        r.userName.toLowerCase().includes(query)
      );
    }
    
    // Sort ratings
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'rating':
          return b.rating - a.rating;
        case 'helpful':
          return b.likes - a.likes;
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    return filtered;
  };

  // Handle rating interactions
  const handleLikeRating = async (rating: Rating) => {
    if (rating.isLiked) return;
    
    try {
      // Reward the reviewer with tokens
      const success = await earnTokens(
        TOKEN_ECONOMY.REWARDS.POST_LIKE,
        'Rating received a like',
        rating.id
      );
      
      if (success) {
        setShowRewardModal(true);
        setSelectedRating(rating);
        
        setTimeout(() => {
          setShowRewardModal(false);
          setSelectedRating(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error rewarding rating:', error);
    }
  };

  const handleShareRating = async (rating: Rating) => {
    try {
      // Reward the reviewer with tokens for having their content shared
      const success = await earnTokens(
        TOKEN_ECONOMY.REWARDS.SHARE_CONTENT,
        'Rating was shared',
        rating.id
      );
      
      if (success) {
        setShowRewardModal(true);
        setSelectedRating(rating);
        
        setTimeout(() => {
          setShowRewardModal(false);
          setSelectedRating(null);
        }, 2000);
      }
      
      // Simulate share action
      alert(`Sharing review from ${rating.userName}`);
    } catch (error) {
      console.error('Error rewarding share:', error);
    }
  };

  const handleAwardBadge = async (rating: Rating) => {
    const badgeCost = TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT;
    
    if (balance < badgeCost) {
      alert('Insufficient tokens to award a badge');
      return;
    }
    
    try {
      // Spend tokens to award the badge
      const success = await spendTokens(
        badgeCost,
        'Awarded rating badge',
        rating.id
      );
      
      if (success) {
        // Reward the reviewer
        await earnTokens(
          TOKEN_ECONOMY.REWARDS.POST_LIKE * 2,
          'Received rating badge',
          rating.id
        );
        
        setShowRewardModal(true);
        setSelectedRating(rating);
        
        setTimeout(() => {
          setShowRewardModal(false);
          setSelectedRating(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121826]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-[#1a2234]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="text-[--color-accent-primary]" size={24} />
            Ratings & Reviews
          </h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          )}
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews..."
              className="w-full pl-10 pr-4 py-2 bg-[#121826] border border-gray-700 rounded-lg text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#121826] border border-gray-700 rounded-lg text-white px-3 py-2"
            >
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
            
            <button
              onClick={() => setFilterRating(filterRating ? null : 5)}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 ${
                filterRating 
                  ? 'bg-[--color-accent-primary] text-white' 
                  : 'bg-[#121826] text-gray-300 border border-gray-700'
              }`}
            >
              <Filter size={18} />
              {filterRating ? `${filterRating}★ Only` : 'All Ratings'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Ratings list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {getFilteredRatings().map((rating) => (
            <motion.div
              key={rating.id}
              className="bg-[#1a2234] rounded-lg p-4 border border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Rating header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-semibold">
                    {rating.userAvatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{rating.userName}</span>
                      {rating.isVerified && (
                        <div className="p-0.5 bg-blue-500 rounded-full">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < rating.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Badges */}
                {rating.badges && rating.badges.length > 0 && (
                  <div className="flex gap-1">
                    {rating.badges.map(badge => (
                      <div
                        key={badge}
                        className="px-2 py-0.5 rounded-full text-xs bg-[--color-accent-primary]/20 text-[--color-accent-primary] border border-[--color-accent-primary]/30"
                      >
                        {badge}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Review content */}
              <p className="text-gray-300 mb-3">{rating.review}</p>
              
              {/* Review photos */}
              {rating.photos && rating.photos.length > 0 && (
                <div className="mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {rating.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className="rounded-lg w-full h-40 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLikeRating(rating)}
                    className={`flex items-center gap-1.5 ${
                      rating.isLiked ? 'text-[--color-accent-primary]' : 'text-gray-400 hover:text-[--color-accent-primary]'
                    }`}
                  >
                    <ThumbsUp size={18} />
                    <span>{rating.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-[--color-accent-primary]">
                    <MessageSquare size={18} />
                    <span>{rating.replies}</span>
                  </button>
                  <button
                    onClick={() => handleShareRating(rating)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-[--color-accent-primary]"
                  >
                    <Share2 size={18} />
                    <span>{rating.shares}</span>
                  </button>
                </div>
                
                <button
                  onClick={() => handleAwardBadge(rating)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[--color-accent-primary]/10 text-[--color-accent-primary] hover:bg-[--color-accent-primary]/20"
                >
                  <Award size={18} />
                  <span>Award Badge</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Reward modal */}
      <AnimatePresence>
        {showRewardModal && selectedRating && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#1a2234] rounded-lg p-6 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="w-16 h-16 rounded-full bg-[--color-accent-primary]/20 flex items-center justify-center mx-auto mb-4">
                <Coins size={32} className="text-[--color-accent-primary]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tokens Earned!</h3>
              <p className="text-gray-300">
                {selectedRating.userName} earned tokens for their helpful review.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
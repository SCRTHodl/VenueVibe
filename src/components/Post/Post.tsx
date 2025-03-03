import React, { useState } from 'react';
import { Heart, MessageSquare, Bookmark, Share2, MapPin, Clock, MoreHorizontal, Send, Award, Coins } from 'lucide-react';
import { formatTimeAgo } from '../../lib/utils';
import { useTokenStore, TOKEN_ECONOMY } from '../../lib/tokenStore';
import type { Post as PostType, Comment } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface PostProps {
  post: PostType;
}

export const Post: React.FC<PostProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  
  const { balance, earnTokens, spendTokens } = useTokenStore();
  
  const handleLike = async () => {
    if (isLiked) return;
    
    setIsLiked(true);
    
    try {
      // Reward the post creator
      await earnTokens(
        TOKEN_ECONOMY.REWARDS.POST_LIKE,
        'Post received a like',
        post.id
      );
    } catch (error) {
      console.error('Error rewarding like:', error);
    }
  };
  
  const handleShare = async () => {
    try {
      // Reward the post creator for having their content shared
      await earnTokens(
        TOKEN_ECONOMY.REWARDS.SHARE_CONTENT,
        'Post was shared',
        post.id
      );
      
      // Simulate share functionality
      alert(`Sharing post from ${post.userName} about ${post.venue.name}`);
    } catch (error) {
      console.error('Error rewarding share:', error);
    }
  };
  
  const handleAwardBadge = async () => {
    const badgeCost = TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT;
    
    if (balance < badgeCost) {
      alert('Insufficient tokens to award a badge');
      return;
    }
    
    try {
      // Spend tokens to award the badge
      const success = await spendTokens(
        badgeCost,
        'Awarded post badge',
        post.id
      );
      
      if (success) {
        // Reward the post creator
        await earnTokens(
          TOKEN_ECONOMY.REWARDS.POST_LIKE * 2,
          'Received post badge',
          post.id
        );
        
        setShowBadgeModal(true);
        setTimeout(() => setShowBadgeModal(false), 2000);
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };
  
  const handleSave = () => {
    setIsSaved(!isSaved);
  };
  
  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      loadComments();
    }
    setShowComments(!showComments);
  };
  
  const loadComments = async () => {
    setIsCommentLoading(true);
    
    // Simulate loading comments
    setTimeout(() => {
      const demoComments: Comment[] = [
        {
          id: `comment-${post.id}-1`,
          content: "This place has the best happy hour in town!",
          userId: "user-demo-1",
          userName: "Emily",
          userAvatar: "E",
          createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
          likes: 4
        },
        {
          id: `comment-${post.id}-2`,
          content: "Going there tonight. Anyone want to join?",
          userId: "user-demo-2",
          userName: "Jordan",
          userAvatar: "J",
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
          likes: 2
        }
      ];
      
      setComments(demoComments);
      setIsCommentLoading(false);
    }, 800);
  };
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const newComment: Comment = {
      id: `comment-${post.id}-${Date.now()}`,
      content: commentText,
      userId: "user-current",
      userName: "You",
      userAvatar: "Y",
      createdAt: new Date().toISOString(),
      likes: 0
    };
    
    setComments(prev => [...prev, newComment]);
    setCommentText('');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      italian: 'bg-red-600 text-red-100',
      bar: 'bg-amber-600 text-amber-100',
      gastropub: 'bg-blue-600 text-blue-100',
      'wine-bar': 'bg-purple-600 text-purple-100',
      latin: 'bg-emerald-600 text-emerald-100'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-600 text-gray-100';
  };
  
  return (
    <div className="bg-[#121826] rounded-xl shadow-lg border border-blue-900/20 overflow-hidden mb-4">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-blue-900/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
            {post.userAvatar}
          </div>
          <div>
            <div className="font-medium text-white">{post.userName}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              {formatTimeAgo(new Date(post.createdAt))}
              <span className="px-1">•</span>
              <MapPin size={12} className="inline" />
              <span className="hover:text-blue-400 cursor-pointer">{post.venue.name}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#1a2234]">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-white whitespace-pre-wrap mb-3">{post.content}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Photo */}
      {post.photos && post.photos.length > 0 && (
        <div className="aspect-video w-full">
          <img 
            src={post.photos[0]} 
            alt={`Post by ${post.userName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Venue Info */}
      <div className="p-4 bg-blue-900/20 border-t border-b border-blue-900/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(post.venue.category)}`}>
              {post.venue.category}
            </span>
            {post.venue.rating && (
              <div className="flex items-center gap-0.5 text-yellow-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-400 font-medium">{post.venue.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={12} className="text-gray-400" />
            <span>{post.venue.time.replace('Opens ', '')}</span>
          </div>
        </div>
        
        {post.venue.popularTimes && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className={`px-2 py-1 rounded-full ${
              post.venue.popularTimes.now === 'Very Busy' 
                ? 'bg-red-600/20 text-red-200' 
                : post.venue.popularTimes.now === 'Busy'
                  ? 'bg-orange-600/20 text-orange-200'
                  : 'bg-green-600/20 text-green-200'
            }`}>
              {post.venue.popularTimes.now} now
            </div>
            <div className="text-gray-400">
              Wait time: {post.venue.popularTimes.waitTime}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <motion.button 
            className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            onClick={handleLike}
            whileTap={{ scale: 0.95 }}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm font-medium">{isLiked ? post.likes + 1 : post.likes}</span>
          </motion.button>
          <motion.button 
            className={`flex items-center gap-2 ${showComments ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
            onClick={toggleComments}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare size={20} />
            <span className="text-sm font-medium">{post.comments}</span>
          </motion.button>
          <motion.button 
            className="flex items-center gap-2 text-gray-400 hover:text-[--color-accent-primary]"
            onClick={handleAwardBadge}
            whileTap={{ scale: 0.95 }}
          >
            <Award size={20} />
            <span className="text-sm font-medium flex items-center gap-1">
              <Coins size={14} />
              {TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT}
            </span>
          </motion.button>
        </div>
        <div className="flex items-center gap-4">
          <motion.button 
            className={`${isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
            onClick={handleSave}
            whileTap={{ scale: 0.95 }}
          >
            <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
          </motion.button>
          <motion.button 
            className="text-gray-400 hover:text-blue-400"
            onClick={handleShare}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 size={20} />
          </motion.button>
        </div>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-blue-900/10">
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-white">Comments</h4>
            
            {isCommentLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Comment form */}
                <form onSubmit={handleSubmitComment} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    Y
                  </div>
                  <div className="flex-1 flex">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-[#0f1623] rounded-l-lg border border-r-0 border-gray-600 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-r-lg flex items-center justify-center"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </form>
                
                {/* Comments list */}
                <div className="space-y-3 mt-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {comment.userAvatar}
                      </div>
                      <div className="flex-1">
                        <div className="bg-[#0f1623] rounded-lg p-3 break-words">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-semibold text-gray-200">
                              {comment.userName}
                            </p>
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(new Date(comment.createdAt))}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 ml-2 mt-1">
                          <button className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1">
                            <Heart size={12} />
                            <span>{comment.likes}</span>
                          </button>
                          <button className="text-xs text-gray-400 hover:text-blue-400">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Badge Award Modal */}
      <AnimatePresence>
        {showBadgeModal && (
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
                <Award size={32} className="text-[--color-accent-primary]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Badge Awarded!</h3>
              <p className="text-gray-300">
                {post.userName} received your badge and earned tokens!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
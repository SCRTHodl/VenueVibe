import React, { useState } from 'react';
import { Heart, MessageSquare, Bookmark, Share2, MoreHorizontal, MapPin, Clock, DollarSign, Star, Send } from 'lucide-react';
import type { Post, Comment } from '../../types';
import { formatTimeAgo } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialFeedProps {
  posts: Post[];
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ posts }) => {
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  
  const toggleLike = (postId: string) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };
  
  const toggleSave = (postId: string) => {
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleComments = (postId: string) => {
    if (openComments === postId) {
      setOpenComments(null);
    } else {
      setOpenComments(postId);
      
      // Simulate loading comments if none exist yet
      if (!postComments[postId]) {
        const demoComments: Comment[] = [
          {
            id: `comment-${postId}-1`,
            content: "This place has the best happy hour in town!",
            userId: "user-demo-1",
            userName: "Emily",
            userAvatar: "E",
            createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
            likes: 4
          },
          {
            id: `comment-${postId}-2`,
            content: "Going there tonight. Anyone want to join?",
            userId: "user-demo-2",
            userName: "Jordan",
            userAvatar: "J",
            createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
            likes: 2
          }
        ];
        
        setPostComments(prev => ({
          ...prev,
          [postId]: demoComments
        }));
      }
    }
  };

  const handleSubmitComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const newComment: Comment = {
      id: `comment-${postId}-${Date.now()}`,
      content: commentText,
      userId: "user-current",
      userName: "You",
      userAvatar: "Y",
      createdAt: new Date().toISOString(),
      likes: 0
    };
    
    setPostComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));
    
    setCommentText('');
  };

  const handleShare = (post: Post) => {
    // In a real app, this would open a share dialog
    console.log('Sharing post:', post.id);
    alert(`Sharing "${post.content.substring(0, 30)}..." from ${post.venue.name}`);
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

  const renderRating = (rating: number = 0) => {
    return (
      <div className="flex items-center gap-0.5 text-yellow-400">
        <Star size={14} fill="currentColor" />
        <span className="text-yellow-400 font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const renderPriceRange = (priceRange: string = '$') => {
    return (
      <span className="text-green-400 font-medium">{priceRange}</span>
    );
  };

  return (
    <div className="space-y-6">
      {posts.map((post) => {
        const isLiked = likedPosts[post.id] || post.isLiked;
        const isSaved = savedPosts[post.id] || post.isSaved;
        const showComments = openComments === post.id;
        const comments = postComments[post.id] || [];
        
        return (
          <motion.div 
            key={post.id} 
            className="bg-[#121826] rounded-xl shadow-lg border border-blue-900/20 overflow-hidden" 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            layout
          >
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
                  {post.venue.rating && renderRating(post.venue.rating)}
                  {post.venue.priceRange && renderPriceRange(post.venue.priceRange)}
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
                  onClick={() => toggleLike(post.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                  <span className="text-sm font-medium">{isLiked ? post.likes + 1 : post.likes}</span>
                </motion.button>
                <motion.button 
                  className={`flex items-center gap-2 ${showComments ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
                  onClick={() => toggleComments(post.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageSquare size={20} />
                  <span className="text-sm font-medium">{showComments ? comments.length + post.comments : post.comments}</span>
                </motion.button>
              </div>
              <div className="flex items-center gap-4">
                <motion.button 
                  className={`${isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                  onClick={() => toggleSave(post.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                </motion.button>
                <motion.button 
                  className="text-gray-400 hover:text-blue-400"
                  onClick={() => handleShare(post)}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 size={20} />
                </motion.button>
              </div>
            </div>
            
            {/* Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-blue-900/10 overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    <h4 className="font-medium text-white">Comments</h4>
                    
                    {/* Comment form */}
                    <form onSubmit={(e) => handleSubmitComment(post.id, e)} className="flex gap-2">
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
                        <motion.div 
                          key={comment.id} 
                          className="flex gap-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
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
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};
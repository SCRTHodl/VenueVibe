import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Image, MessageSquare, ThumbsUp, Share2 } from 'lucide-react';
import { GroupSelector } from './GroupSelector';
import { TEST_GROUPS } from '../../constants';
import { subscribeToMessages } from '../../lib/supabase';
import type { Group, Message, Channel, Post } from '../../types';

interface ChatPanelProps {
  group: Group;
  onClose: () => void;
  allGroups?: Group[];
  venuePosts?: Post[]; // Posts related to the venue
  onPostComment?: (postId: string, comment: string) => Promise<void>;
  onCreatePost?: (content: string, venueId: string) => Promise<void>;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ group, onClose, allGroups, venuePosts = [], onPostComment, onCreatePost }) => {
  const [activeChannel, setActiveChannel] = useState<Channel['id']>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  // Loading state used for initial data loading
  const [isLoading, setIsLoading] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group>(group);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // If allGroups is not provided, use TEST_GROUPS as fallback
  const availableGroups = allGroups || TEST_GROUPS;
  
  // Update currentGroup when group prop changes
  useEffect(() => {
    setCurrentGroup(group);
  }, [group]);
  
  useEffect(() => {
    // Set loading state when fetching posts for a venue
    setIsLoading(true);
    
    // Create a timeout to ensure loading state is always cleared
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    // If we have venue posts, clear loading state once they're available
    if (venuePosts && venuePosts.length > 0) {
      setIsLoading(false);
    }
    
    // For regular groups, subscribe to messages
    const unsubscribe = subscribeToMessages(currentGroup.id, activeChannel, (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    return () => {
      clearTimeout(loadingTimeout); // Always clear the timeout on cleanup
      unsubscribe();
    };
  }, [currentGroup.id, activeChannel, venuePosts]);
  
  // Reset loading state when venuePosts changes
  useEffect(() => {
    if (venuePosts && venuePosts.length > 0) {
      setIsLoading(false);
    }
  }, [venuePosts]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle creating a new venue post
  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    if (onCreatePost) {
      onCreatePost(newPostContent, group.id);
      setNewPostContent('');
    }
  };

  // This functionality is now handled within each post's comment section

  // Function to refresh location-based posts
  const refreshLocationPosts = () => {
    if (onCreatePost && typeof window !== 'undefined') {
      setIsLoading(true);
      // Dispatch an event to request new posts based on current location
      const refreshEvent = new CustomEvent('refreshVenuePosts', { 
        detail: { venueId: currentGroup.id }
      });
      window.dispatchEvent(refreshEvent);
      // Add a safety timeout
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121826] rounded-t-xl overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="bg-[#1a2234] border-b border-gray-700 p-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-blue-900/30 text-gray-200 hover:bg-blue-900/50"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 max-w-[200px]">
              <GroupSelector
                currentGroup={currentGroup}
                groups={availableGroups}
                onSelectGroup={(newGroup) => {
                  setCurrentGroup(newGroup);
                  setActiveChannel('general');
                  setMessages([]);
                  setIsLoading(true); // Show loading state while posts refresh
                  
                  // If we have onCreatePost function, it means we're in venue posts mode
                  // We need to tell the parent component to show posts for the new venue
                  if (onCreatePost && typeof window !== 'undefined') {
                    // Dispatch a custom event to notify App component about venue change
                    const event = new CustomEvent('venueChange', { 
                      detail: { venueId: newGroup.id, venueName: newGroup.name }
                    });
                    window.dispatchEvent(event);
                    
                    // Add a safety timeout to clear loading state if it doesn't happen otherwise
                    setTimeout(() => setIsLoading(false), 3000);
                  }
                }}
                isOpen={showGroupSelector}
                onToggle={() => setShowGroupSelector(!showGroupSelector)}
              />
            </div>
          </div>
          {/* Refresh button to get new posts */}
          <button
            onClick={refreshLocationPosts}
            className="p-2 rounded-full bg-blue-600/30 text-gray-200 hover:bg-blue-600/50 transition-colors"
            title="Refresh posts for this location"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Venue Info Bar with responsive design */}
      <div className="flex flex-wrap items-center justify-between bg-[#1a2234] px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
            {currentGroup.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-sm font-medium text-white">{currentGroup.name}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-xs text-gray-400">Location Feed</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <div className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">
            {currentGroup.category}
          </div>
          <div className="text-xs px-2 py-1 bg-blue-900/30 rounded-full text-blue-300">
            Trending
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-[#0f1623] p-4" onClick={(e) => e.stopPropagation()}>
        {/* Create new post section */}
        {onCreatePost && (
          <div className="sticky top-16 z-10 mb-5 bg-[#1a2234] rounded-lg p-3 border border-blue-900/20 shadow-lg">
            <h3 className="text-blue-300 text-sm font-medium mb-2">Share at {group.name}</h3>
            <textarea
              placeholder={`What's happening at ${group.name}?`}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full bg-[#0f1623] text-white rounded-lg p-3 mb-2 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-20"
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-300 text-sm transition-colors">
                  <Image size={18} />
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-300 text-sm transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </button>
              </div>
              <button 
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${newPostContent.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'} transition-colors`}
              >
                Post
              </button>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Venue Posts */}
        {!isLoading && venuePosts && venuePosts.length > 0 ? (
          <div className="space-y-3">
            <div className="sticky top-0 z-10 mb-3 bg-[#121826] p-3 border-b border-gray-800 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-blue-300 text-sm font-semibold">{currentGroup.name} Feed</h3>
                  <p className="text-gray-400 text-xs">Join the conversation and explore location-based posts</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs text-gray-400">Live</span>
                </div>
              </div>
            </div>
            
            {venuePosts.map((post) => {
              // Define local state for each post
              const postId = post.id || `post-${Math.random().toString(36).substring(2, 9)}`;
              const [showComments, setShowComments] = useState(false);
              const [newComment, setNewComment] = useState('');
              const [isCommenting, setIsCommenting] = useState(false);
              
              // Determine post date display
              const postDate = post.createdAt ? new Date(post.createdAt) : new Date();
              const dateDisplay = postDate.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric',
                year: postDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
              });
              
              // Calculate time since post
              const timeSince = () => {
                const seconds = Math.floor((new Date().getTime() - postDate.getTime()) / 1000);
                let interval = seconds / 31536000;
                if (interval > 1) return Math.floor(interval) + "y";
                interval = seconds / 2592000;
                if (interval > 1) return Math.floor(interval) + "mo";
                interval = seconds / 86400;
                if (interval > 1) return Math.floor(interval) + "d";
                interval = seconds / 3600;
                if (interval > 1) return Math.floor(interval) + "h";
                interval = seconds / 60;
                if (interval > 1) return Math.floor(interval) + "m";
                return Math.floor(seconds) + "s";
              };
              
              // Handle comment submission
              const handlePostComment = async (e: React.FormEvent) => {
                e.preventDefault();
                if (!newComment.trim() || !onPostComment) return;
                
                try {
                  await onPostComment(postId, newComment);
                  setNewComment('');
                  // After posting, show comments
                  setShowComments(true);
                } catch (error) {
                  console.error('Error posting comment:', error);
                }
              };
              
              return (
                <div key={postId} className="bg-[#1a2234] rounded-lg overflow-hidden shadow-md border border-gray-800 mb-5 hover:border-blue-900/40 transition-all">
                  {/* Post Header */}
                  <div className="p-3 border-b border-gray-800">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-700">
                        <img 
                          src={(post as any).user?.avatar || "/assets/default-avatar.png"}
                          alt={(post as any).user?.name || "User"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-white text-sm font-semibold">{(post as any).user?.name || "Anonymous"}</p>
                          <span className="mx-1 text-gray-500">•</span>
                          <p className="text-gray-400 text-xs">{timeSince()}</p>
                        </div>
                        {post.venue && (
                          <div className="text-blue-300 text-xs flex items-center">
                            <span>@{post.venue.name}</span>
                            {post.venue.category && (
                              <span className="ml-1 px-1.5 py-0.5 bg-blue-900/20 rounded-full text-[10px]">{post.venue.category}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3">
                    {/* Post Content */}
                    <p className="text-gray-200 text-sm mb-3">{post.content || (post as any).text || 'No content available'}</p>
                  </div>
                  
                  {/* Post Image (Full width for better display) */}
                  {((post as any).image || (post as any).media) && (
                    <div className="w-full mb-2">
                      <img 
                        src={(post as any).image || (post as any).media}
                        alt="Post content"
                        className="w-full h-auto object-cover max-h-[500px]"
                      />
                    </div>
                  )}
                  
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-4 py-2">
                      {post.tags.map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-300 hover:bg-blue-900/30 hover:text-blue-200 transition-colors cursor-pointer">#{tag}</span>
                      ))}
                    </div>
                  )}
                  
                  {/* Post Actions */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                    <button 
                      className="flex items-center gap-1.5 text-gray-400 hover:text-blue-400 text-sm font-medium transition-colors"
                      onClick={() => setShowComments(!showComments)}
                    >
                      <MessageSquare size={18} />
                      <span>{Array.isArray(post.comments) ? post.comments.length : 0}</span>
                    </button>
                    
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-400 text-sm font-medium transition-colors">
                        <ThumbsUp size={18} />
                        <span>{post.likes || 0}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-400 text-sm font-medium transition-colors">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Comments Section */}
                  {showComments && (
                    <div className="bg-[#131d30] p-3 border-t border-gray-800">
                      {Array.isArray(post.comments) && post.comments.length > 0 ? (
                        <div className="space-y-3 mb-3">
                          {Array.isArray(post.comments) && post.comments.map((comment, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                                <img 
                                  src={(comment as any).user?.avatar || "/assets/default-avatar.png"}
                                  alt={(comment as any).user?.name || "User"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="bg-[#1a2234] rounded-lg p-2 flex-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-white text-xs font-medium">{(comment as any).user?.name || "Anonymous"}</span>
                                  <span className="text-gray-500 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-300 text-sm">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 text-sm py-2 mb-3">
                          No comments yet. Be the first to comment!
                        </div>
                      )}
                      
                      {/* Comment Form */}
                      <div>
                        <button 
                          onClick={() => setIsCommenting(!isCommenting)}
                          className={`w-full py-2 px-3 text-sm ${isCommenting ? 'hidden' : 'block'} text-left rounded-lg border border-gray-700 text-gray-400 hover:border-blue-500 hover:text-white`}
                        >
                          Add a comment...
                        </button>
                        
                        {isCommenting && (
                          <form onSubmit={handlePostComment} className="mt-2">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Write your comment..."
                              className="w-full bg-[#0f1623] border border-gray-700 rounded-lg p-2 text-sm text-white resize-none focus:outline-none focus:border-blue-500"
                              rows={2}
                            />
                            <div className="flex justify-end mt-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCommenting(false);
                                  setNewComment('');
                                }}
                                className="px-3 py-1 text-sm text-gray-300 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-800 disabled:text-blue-200 disabled:cursor-not-allowed"
                              >
                                Comment
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No Posts Yet</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Be the first to create a post about this venue!
            </p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Plus size={18} />
              Create Post
            </button>
          </div>
        )}
      </div>
      
      {/* Create New Post Input */}
      <div className="border-t border-gray-700 p-3 bg-[#1a2234]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden mr-1 bg-gray-700">
            <img 
              src="/assets/default-avatar.png" 
              alt="Your Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <button 
            className="flex-1 bg-[#121826] text-gray-400 py-2 px-4 rounded-lg text-left hover:bg-[#1c2636] hover:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={() => console.log('Create new post')}
          >
            Create a post about {currentGroup.name}...
          </button>
          <button className="p-2 rounded-full bg-[#121826] text-gray-400 hover:text-blue-400">
            <Image size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
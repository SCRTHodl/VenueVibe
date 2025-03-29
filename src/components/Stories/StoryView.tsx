import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageSquare, Share2, ChevronLeft, ChevronRight, VolumeX, Volume2, Timer, Coins, Megaphone, Lock, Unlock, Gift } from 'lucide-react';
import { UserStory } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenStore } from '../../lib/tokenStore';
import { supabase } from '../../lib/supabase';
import { 
  getUserTokenBalance, 
  createTokenTransaction, 
  getStoryTokenData, 
  checkPremiumContentAccess,
  unlockPremiumContent
} from '../../lib/supabase/tokenEconomy';
import { TOKEN_ECONOMY } from '../../lib/tokenStore';

interface StoryViewProps {
  story: UserStory;
  onClose: () => void;
}

export const StoryView: React.FC<StoryViewProps> = ({ story, onClose }) => {
  // Validate story data
  if (!story?.media || (Array.isArray(story.media) && !story.media.length) || (typeof story.media === 'string' && !story.media)) {
    console.error('Invalid story data:', story);
    return null;
  }

  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(story.viewCount !== undefined ? story.viewCount : 0);
  const [comments, setComments] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isPremiumContent, setIsPremiumContent] = useState(false);
  const [isContentLocked, setIsContentLocked] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [unlockCost, setUnlockCost] = useState(TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { earnTokens, spendTokens } = useTokenStore();

  // Handle story playback
  useEffect(() => {
    if (isPaused) return;
    
    // Handle both string media and array media cases
    const mediaItem = Array.isArray(story.media) ? story.media[currentSlide] : null;
    if (Array.isArray(story.media) && !mediaItem) return;
    
    // Set duration based on media type (5 seconds for images, 15 for videos)
    const mediaType = Array.isArray(story.media) && mediaItem ? mediaItem.type : 'image';
    const storyDuration = mediaType === 'video' ? 15000 : 5000;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (storyDuration / 100));
        return Math.min(newProgress, 100);
      });
    }, 100);
    
    const timeout = setTimeout(() => {
      if (Array.isArray(story.media) && currentSlide < story.media.length - 1) {
        setCurrentSlide(prev => prev + 1);
        setProgress(0);
      } else {
        onClose();
      }
    }, storyDuration);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentSlide, isPaused, story.media, onClose]);

  // Check if content is premium and get user data
  useEffect(() => {
    const checkContentAndUser = async () => {
      try {
        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        setUserId(currentUserId);
        
        // Get story ID in proper format
        const storyId = story.id.includes('-') ? story.id : story.id;
        
        if (currentUserId) {
          // Get user token balance
          const balance = await getUserTokenBalance(currentUserId);
          setUserBalance(balance);
          
          // Check premium content access in one call
          const accessInfo = await checkPremiumContentAccess(currentUserId, storyId);
          
          setIsPremiumContent(accessInfo.isPremium);
          setIsContentLocked(accessInfo.isPremium && !accessInfo.hasAccess);
          
          if (accessInfo.isPremium) {
            setUnlockCost(accessInfo.cost || TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT);
          }
        } else {
          // No user logged in, check if premium content
          const tokenData = await getStoryTokenData(storyId);
          
          if (tokenData?.premium_content === true) {
            setIsPremiumContent(true);
            setIsContentLocked(true);
            setUnlockCost(tokenData.unlock_cost || TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT);
          }
        }
      } catch (error) {
        console.error('Error checking content status:', error);
        // Default to unlocked if there's an error
        setIsContentLocked(false);
      }
    };
    
    checkContentAndUser();
  }, [story.id]);
  
  // Record view and update story stats
  useEffect(() => {
    // Only record view if content is not locked
    if (isContentLocked) return;
    
    const recordView = async () => {
      try {
        if (userId && !story.viewedBy?.includes(userId)) {
          // Ensure story.id is a valid UUID
          const storyId = story.id.includes('-') ? story.id : crypto.randomUUID();
          
          // Get the token economy schema from env
          const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
          
          // Use schema-qualified RPC call
          const { error } = await supabase
            .schema(tokenEconomySchema)
            .rpc('record_story_view_v3', {
              p_story_id: storyId,
              p_user_id: userId
            });

          if (error) throw error;

          // Reward creator for getting views
          await earnTokens(1, 'Story view received', storyId);
        }
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };

    recordView();
  }, [story.id, story.viewedBy, earnTokens, userId, isContentLocked]);

  // Helper function for robust RPC calls with fallbacks
  const callStoryInteraction = async (storyId: string, interactionType: string, content?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || 'anonymous';
    
    try {
      // First try with handle_story_interaction_v3
      try {
        const { data, error } = await supabase.rpc('handle_story_interaction_v3', {
          p_story_id: storyId,
          p_user_id: userId,
          p_interaction_type: interactionType,
          p_content: content || null
        });
        
        if (!error) {
          return { success: true, data };
        }
      } catch (error) {
        console.log('handle_story_interaction_v3 failed, trying v2 version');
      }
      
      // Try with handle_story_interaction_v2 if v3 fails
      try {
        const { data, error } = await supabase.rpc('handle_story_interaction_v2', {
          p_story_id: storyId,
          p_user_id: userId,
          p_interaction_type: interactionType,
          p_content: content || null
        });
        
        if (!error) {
          return { success: true, data };
        }
      } catch (error) {
        console.log('handle_story_interaction_v2 failed, trying original version');
      }
      
      // Try with the original handle_story_interaction if v2 fails
      try {
        const { data, error } = await supabase.rpc('handle_story_interaction', {
          p_story_id: storyId,
          p_user_id: userId,
          p_interaction_type: interactionType,
          p_content: content || null
        });
        
        if (!error) {
          return { success: true, data };
        }
      } catch (error) {
        console.log('All RPC methods failed, using fallback for development');
      }
      
      // If in development, mock the functionality
      if (import.meta.env.DEV) {
        console.log(`Development mode: Mocking ${interactionType} interaction for story ${storyId}`);
        return { success: true, data: { interaction_id: crypto.randomUUID() } };
      }
      
      return { success: false, error: 'All interaction methods failed' };
    } catch (error) {
      console.error(`Error processing ${interactionType} interaction:`, error);
      
      // Mock success in development mode
      if (import.meta.env.DEV) {
        return { success: true, data: { interaction_id: crypto.randomUUID() } };
      }
      
      return { success: false, error };
    }
  };

  const handleLike = async () => {
    if (isLiked) return;
    
    // Ensure we have a valid UUID
    const storyId = story.id.includes('-') ? story.id : crypto.randomUUID();
    
    const result = await callStoryInteraction(storyId, 'like');
    
    if (result.success) {
      setIsLiked(true);
      setLikeCount((prev: number) => prev + 1);

      // Reward story creator
      await earnTokens(2, 'Story received a like', storyId);
    }
  };

  const handleComment = async () => {
    if (!commentInput.trim()) return;
    
    // Ensure we have a valid UUID
    const storyId = story.id.includes('-') ? story.id : crypto.randomUUID();
    
    // Get the current session for user info
    const { data: { session } } = await supabase.auth.getSession();
    
    // Use our robust interaction handler
    const result = await callStoryInteraction(storyId, 'comment', commentInput);
    
    if (result.success) {
      // Add the comment locally for immediate UI update
      setComments((prev: string[]) => [...prev, commentInput]);
      setCommentInput('');

      // Reward story creator
      await earnTokens(3, 'Story received a comment', storyId);
    } else {
      console.error('Error adding comment:', result.error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Story by ${story.userName}`,
        text: story.caption || 'Check out this story!',
        url: window.location.href
      });

      // Reward story creator
      await earnTokens(5, 'Story was shared', story.id);
    } catch (error) {
      console.error('Error sharing story:', error);
    }
  };

  // Handle unlocking premium content
  const handleUnlockContent = async () => {
    if (!userId || !isPremiumContent || !isContentLocked) return;
    
    try {
      // Spend tokens to unlock content using our new function
      const storyId = story.id.includes('-') ? story.id : story.id;
      
      // Show loading indicator
      const loadingElement = document.createElement('div');
      loadingElement.className = 'fixed inset-0 bg-black/80 flex items-center justify-center text-white z-50';
      loadingElement.innerHTML = `
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-t-yellow-500 border-gray-600 rounded-full animate-spin mb-4"></div>
          <p>Processing payment...</p>
        </div>
      `;
      document.body.appendChild(loadingElement);
      
      // Use the unlockPremiumContent function
      const result = await unlockPremiumContent(
        userId,
        storyId,
        story.userId,
        unlockCost
      );
      
      // Remove loading indicator
      document.body.removeChild(loadingElement);
      
      if (result.success) {
        // Update state to unlock content
        setIsContentLocked(false);
        
        // Update user balance if provided
        if (result.newBalance !== undefined) {
          setUserBalance(result.newBalance);
        } else {
          // Fallback to getting the balance again
          const newBalance = await getUserTokenBalance(userId);
          setUserBalance(newBalance);
        }
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed inset-0 bg-black/80 flex items-center justify-center text-white z-50';
        successMessage.innerHTML = `
          <div class="text-center p-6 bg-gray-900 rounded-xl max-w-md">
            <div class="w-16 h-16 rounded-full bg-green-500 mx-auto flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2">Content Unlocked!</h3>
            <p class="mb-4">You now have access to this premium content.</p>
            <p class="text-yellow-400 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              New Balance: ${result.newBalance} tokens
            </p>
            <button class="mt-6 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700" onclick="this.parentElement.parentElement.remove()">
              Continue Watching
            </button>
          </div>
        `;
        document.body.appendChild(successMessage);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      } else {
        // Show error
        alert(result.message || 'Failed to unlock content. Please try again.');
      }
    } catch (error) {
      console.error('Error unlocking content:', error);
      alert('Failed to unlock content. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-16 flex gap-1 z-20">
        {Array.isArray(story.media) ? story.media.map((_: any, index: number) => (
          <div key={index} className="h-1 bg-gray-600 rounded-full flex-1">
            <div 
              className={`h-full rounded-full ${
                index < currentSlide 
                  ? 'bg-[#ffffff] w-full'
                  : index === currentSlide
                    ? 'bg-[#ffffff] transition-all duration-100 ease-linear'
                    : 'bg-transparent'
              }`}
              style={{ width: index === currentSlide ? `${progress}%` : undefined }}
            ></div>
          </div>
        )) : null}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 text-white"
      >
        <X size={24} />
      </button>

      {/* Story media */}
      <div className="relative flex-1 flex items-center justify-center">
        {/* Lock overlay for premium content */}
        {isPremiumContent && isContentLocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative mb-8 w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-0 bg-yellow-600/40 rounded-full animate-ping" style={{ animationDelay: '300ms' }}></div>
              <div className="relative bg-yellow-700 rounded-full p-5">
                <Lock size={40} className="text-yellow-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Premium Content</h3>
            <p className="text-gray-300 mb-6 text-center px-6 max-w-md">
              This content is exclusive to premium users. Unlock it now to get full access.  
            </p>
            
            <div className="bg-gray-800/70 rounded-xl p-4 mb-6 max-w-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-yellow-400" />
                  <span className="text-white font-medium">Cost to Unlock:</span>
                </div>
                <span className="text-white font-bold text-xl">{unlockCost}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift size={18} className="text-green-400" />
                  <span className="text-white font-medium">Creator Earns:</span>
                </div>
                <span className="text-green-400 font-bold text-xl">{Math.floor(unlockCost * 0.8)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-6 bg-gray-800/50 px-4 py-2 rounded-full">
              <Coins size={20} className="text-yellow-400" />
              <span className="text-white font-medium">{userBalance} tokens available</span>
            </div>
            
            <button 
              onClick={handleUnlockContent}
              disabled={userBalance < unlockCost || !userId}
              className={`px-8 py-3 rounded-full flex items-center justify-center gap-2 font-bold text-lg transition-all
                ${userBalance >= unlockCost && userId ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white shadow-lg' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
            >
              <Unlock size={20} />
              Unlock Now
            </button>
            
            {userBalance < unlockCost && userId && (
              <p className="text-sm text-red-400 mt-3">Not enough tokens. You need {unlockCost - userBalance} more.</p>
            )}
            
            {!userId && (
              <p className="text-sm text-red-400 mt-3">You need to be logged in to unlock content.</p>
            )}
          </div>
        )}
        {Array.isArray(story.media) && story.media[currentSlide] ? (
          story.media[currentSlide].type === 'image' ? (
            <img
              src={story.media[currentSlide].url}
              alt={`Story from ${story.userName}`}
              className="w-full h-full object-contain"
              style={{ filter: story.filter || undefined }}
            />
          ) : (
            <video
              ref={videoRef}
              src={story.media[currentSlide].url}
              className="w-full h-full object-contain"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              style={{ filter: story.filter || undefined }}
            />
          )
        ) : typeof story.media === 'string' ? (
          <img
            src={story.media}
            alt={`Story from ${story.userName}`}
            className="w-full h-full object-contain"
            style={{ filter: story.filter || undefined }}
          />
        ) : null}

        {/* Story info with token balance */}
        <div className="absolute top-12 left-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-semibold">
            {story.userAvatar}
          </div>
          <div>
            <div className="text-white font-medium flex items-center gap-2">
              {story.userName}
              <div className="px-2 py-0.5 rounded-full bg-[--color-accent-primary]/20 text-[--color-accent-primary] text-xs">
                <Coins size={12} className="inline mr-1" />
                {story.tokenBalance || 0}
              </div>
            </div>
            <div className="text-xs text-gray-300">
              {new Date(story.createdAt || story.timestamp || new Date()).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-20 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <p className="text-white">{story.caption}</p>
          </div>
        )}
      </div>

      {/* Story actions */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLike}
            className={`p-2 rounded-full ${
              isLiked ? 'bg-red-500' : 'bg-black/50'
            } text-white`}
          >
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="p-2 rounded-full bg-black/50 text-white"
          >
            <MessageSquare size={24} />
          </button>
        </div>

        <button 
          onClick={handleShare}
          className="p-2 rounded-full bg-black/50 text-white"
        >
          <Share2 size={24} />
        </button>
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm rounded-t-xl p-4"
            style={{ height: '60%' }}
          >
            <div className="h-full flex flex-col">
              <h3 className="text-white font-medium mb-4">Comments</h3>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {comments.map((comment, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3">
                    <p className="text-white">{comment}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/10 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary]"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentInput.trim()}
                  className="px-4 py-2 rounded-full bg-[--color-accent-primary] text-white disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
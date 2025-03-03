import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageSquare, Share2, ChevronLeft, ChevronRight, VolumeX, Volume2, Timer } from 'lucide-react';
import { UserStory } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenStore } from '../../lib/tokenStore';
import { supabase } from '../../lib/supabase';

interface UserStoryViewProps {
  story: UserStory;
  onClose: () => void;
}

export const UserStoryView: React.FC<UserStoryViewProps> = ({ story, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(story.viewCount || 0);
  const [comments, setComments] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { earnTokens } = useTokenStore();

  // Handle story playback
  useEffect(() => {
    if (isPaused) return;
    
    const storyDuration = story.media[currentSlide]?.type === 'video' ? 15000 : 5000;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (storyDuration / 100));
        return newProgress;
      });
    }, 100);
    
    const timeout = setTimeout(() => {
      if (currentSlide < story.media.length - 1) {
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
  }, [currentSlide, isPaused, story.media.length, onClose]);

  // Handle video playback
  useEffect(() => {
    if (story.media[currentSlide]?.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [currentSlide, isPaused, story.media]);

  // Record view and update story stats
  useEffect(() => {
    const recordView = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (userId && !story.viewedBy?.includes(userId)) {
          // Update story stats in database
          const { error } = await supabase
            .from('stories')
            .update({ 
              view_count: (story.viewCount || 0) + 1,
              viewed_by: [...(story.viewedBy || []), userId]
            })
            .eq('id', story.id);

          if (error) throw error;

          // Reward creator for getting views
          await earnTokens(1, 'Story view received', story.id);
        }
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };

    recordView();
  }, [story.id, story.viewCount, story.viewedBy, earnTokens]);

  const handleLike = async () => {
    if (isLiked) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Update story likes in database
      const { error } = await supabase
        .from('story_likes')
        .insert([{
          story_id: story.id,
          user_id: session?.user?.id || 'anonymous',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setIsLiked(true);
      setLikeCount(prev => prev + 1);

      // Reward story creator
      await earnTokens(2, 'Story received a like', story.id);
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handleComment = async () => {
    if (!commentInput.trim()) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Add comment to database
      const { error } = await supabase
        .from('story_comments')
        .insert([{
          story_id: story.id,
          user_id: session?.user?.id || 'anonymous',
          content: commentInput,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setComments([...comments, commentInput]);
      setCommentInput('');

      // Reward story creator
      await earnTokens(3, 'Story received a comment', story.id);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async () => {
    try {
      // Implement share functionality
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

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Story content */}
      <div className="relative w-full h-full max-w-md max-h-[80vh] flex flex-col">
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-16 flex gap-1 z-20">
          {story.media.map((_, index) => (
            <div key={index} className="h-1 bg-gray-600 rounded-full flex-1">
              <div 
                className={`h-full rounded-full ${
                  index < currentSlide 
                    ? 'bg-white w-full' 
                    : index === currentSlide
                      ? 'bg-white transition-all duration-100 ease-linear'
                      : 'bg-transparent'
                }`}
                style={{ width: index === currentSlide ? `${progress}%` : undefined }}
              ></div>
            </div>
          ))}
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
          {story.media[currentSlide]?.type === 'image' ? (
            <img
              src={story.media[currentSlide].url}
              alt={`Story from ${story.userName}`}
              className="w-full h-full object-contain"
              style={{ filter: story.filter }}
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
              style={{ filter: story.filter }}
            />
          )}

          {/* Story info */}
          <div className="absolute top-12 left-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[--color-accent-primary] to-[--color-accent-secondary] flex items-center justify-center text-white font-semibold">
              {story.userAvatar}
            </div>
            <div>
              <div className="text-white font-medium">{story.userName}</div>
              <div className="text-sm text-gray-300">
                {new Date(story.createdAt).toLocaleTimeString([], { 
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
    </div>
  );
};
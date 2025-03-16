import React, { useState } from 'react';
import { Post, Comment } from '../../types';
import { usePosts } from '../../contexts/PostsContext';
import { useUser } from '../../contexts/UserContext';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostItemProps {
  post: Post;
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const { 
    handleLikePost, 
    deletePost,
    addComment
  } = usePosts();
  const { currentUser } = useUser();
  
  const [showComments, setShowComments] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');
  const [showOptions, setShowOptions] = useState<boolean>(false);
  
  // Check if current user has liked the post
  // Post.likes is currently a number in the interface, but we're using it as an array in code
  // For now, handle both possibilities to prevent errors
  const hasLiked = post.isLiked || false; // Use the isLiked flag if available
  
  // Handle like button click
  const handleLikeClick = () => {
    if (currentUser) {
      handleLikePost(post.id, currentUser);
    }
  };
  
  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !currentUser) {
      return;
    }
    
    const comment: Comment = {
      id: Date.now().toString(),
      postId: post.id,
      text: newComment,
      createdAt: new Date().toISOString(),
      user: currentUser
    };
    
    addComment(comment);
    setNewComment('');
  };
  
  // Handle post deletion
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost(post.id);
    }
    setShowOptions(false);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Post Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <img 
            src={post.userAvatar} 
            alt={post.userName}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <h3 className="font-bold">{post.userName}</h3>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="text-gray-500 hover:text-gray-700"
          >
            <MoreHorizontal size={20} />
          </button>
          
          {showOptions && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              {(currentUser?.id === post.userId || currentUser?.isAdmin) && (
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete Post
                </button>
              )}
              <button 
                onClick={() => setShowOptions(false)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Report
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Post Content */}
      <div className="mb-4">
        <p className="mb-3">{post.content}</p>
        
        {post.image && (
          <img 
            src={post.image} 
            alt="Post attachment"
            className="w-full h-auto rounded-lg"
          />
        )}
      </div>
      
      {/* Post Stats */}
      <div className="flex text-sm text-gray-500 mb-4">
        <span className="mr-4">{typeof post.likes === 'number' ? post.likes : 0} likes</span>
        <span>{post.comments.length} comments</span>
      </div>
      
      {/* Post Actions */}
      <div className="flex border-t border-b border-gray-200 py-2 mb-4">
        <button 
          onClick={handleLikeClick}
          className={`flex items-center justify-center flex-1 ${hasLiked ? 'text-red-500' : 'text-gray-500'} hover:bg-gray-50 py-1 rounded`}
        >
          <Heart size={18} className={hasLiked ? 'fill-current' : ''} />
          <span className="ml-2">Like</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center justify-center flex-1 text-gray-500 hover:bg-gray-50 py-1 rounded"
        >
          <MessageCircle size={18} />
          <span className="ml-2">Comment</span>
        </button>
        
        <button 
          className="flex items-center justify-center flex-1 text-gray-500 hover:bg-gray-50 py-1 rounded"
        >
          <Share2 size={18} />
          <span className="ml-2">Share</span>
        </button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4">
          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex items-center">
            <img 
              src={currentUser?.avatar || 'https://via.placeholder.com/40'} 
              alt="Your avatar"
              className="w-8 h-8 rounded-full mr-2"
            />
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 p-2 bg-gray-100 rounded-full text-sm"
            />
            <button 
              type="submit"
              className="ml-2 text-blue-500"
              disabled={!newComment.trim()}
            >
              <Send size={18} />
            </button>
          </form>
          
          {/* Comments List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {post.comments.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-2">No comments yet</p>
            ) : (
              post.comments.map(comment => (
                <div key={comment.id} className="flex space-x-2">
                  <img 
                    src={comment.user?.avatar || 'https://via.placeholder.com/40'} 
                    alt={comment.user?.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <div className="font-bold text-sm">{comment.user?.name || 'Anonymous'}</div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <button className="mr-2 hover:text-blue-500">Like</button>
                      <button className="mr-2 hover:text-blue-500">Reply</button>
                      <span>
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostItem;

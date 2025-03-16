import React from 'react';
import PostItem from './PostItem';
import { usePosts } from '../../contexts/PostsContext';

const PostsList: React.FC = () => {
  const { posts, activeLocationPosts, activeLocation } = usePosts();

  // Show location-specific posts or all posts
  const displayPosts = activeLocation ? activeLocationPosts : posts;

  return (
    <div className="space-y-4">
      {activeLocation && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-bold text-blue-700">
            Location: {activeLocation.name}
          </h3>
          <p className="text-sm text-blue-600">
            Showing posts for this location
          </p>
        </div>
      )}
      
      {displayPosts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No posts to display.</p>
          <p className="text-sm text-gray-400">Be the first to create a post!</p>
        </div>
      ) : (
        displayPosts.map(post => (
          <PostItem key={post.id} post={post} />
        ))
      )}
    </div>
  );
};

export default PostsList;

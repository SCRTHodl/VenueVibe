import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Post, Comment, User, Group, ActivityEvent } from '../types';
import { supabase } from '../lib/supabase';

// Temporary mock data directly in this file to avoid import issues
// This will be replaced with the external mockData.ts import when resolved
const TEST_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Jane Cooper',
    avatar: 'https://i.pravatar.cc/150?img=1',
    email: 'jane@example.com',
    tokens: 50,
    isAdmin: true,
    lastLogin: new Date().toISOString(),
    settings: {
      locationRadius: 60,
      darkMode: false,
      notifications: true,
      autoRefresh: true
    }
  }
];

const MOCK_POSTS: any[] = [
  {
    id: 'post-1',
    userId: 'user-1',
    userName: 'Jane Cooper',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    content: 'Just found the best coffee shop downtown! ☕',
    createdAt: new Date().toISOString(),
    likes: 24,
    comments: [],
    tags: ['coffee', 'downtown']
  },
  {
    id: 'post-2',
    userId: 'user-2',
    userName: 'Alex Johnson',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    content: 'Amazing view from the new rooftop bar!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 18,
    comments: [],
    tags: ['nightlife', 'views']
  }
];

interface PostsContextType {
  posts: Post[];
  venuePosts: Post[];
  activeLocation?: Group | null;
  activeLocationPosts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setVenuePosts: React.Dispatch<React.SetStateAction<Post[]>>;
  handleCreatePost: (content: string, venue?: Group) => void;
  handlePostComment: (postId: string, content: string) => void;
  handleLikePost: (postId: string, user: User) => void;
  deletePost: (postId: string) => void;
  addComment: (comment: Comment) => void;
  rotateLocationPosts: (locationId: string, user: User | null) => Promise<void>;
  generateLocationPosts: (locationId: string) => Post[];
  setExternalSetters: (
    userUpdater: React.Dispatch<React.SetStateAction<User | null>>,
    activityEventsUpdater: React.Dispatch<React.SetStateAction<ActivityEvent[]>>
  ) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS.map((post: any) => ({
    ...post,
    comments: Array.isArray(post.comments) ? post.comments : []
  })));
  const [venuePosts, setVenuePosts] = useState<Post[]>([]);
  const [activeLocationPosts, setActiveLocationPosts] = useState<Post[]>([]);
  // Store references to the external state setters
  const userUpdaterRef = useRef<React.Dispatch<React.SetStateAction<User | null>>>(() => {});
  const activityEventsUpdaterRef = useRef<React.Dispatch<React.SetStateAction<ActivityEvent[]>>>(() => {});

  // Set the external state setters from the parent component
  const setExternalSetters = useCallback((
    userUpdater: React.Dispatch<React.SetStateAction<User | null>>,
    activityEventsUpdater: React.Dispatch<React.SetStateAction<ActivityEvent[]>>
  ) => {
    userUpdaterRef.current = userUpdater;
    activityEventsUpdaterRef.current = activityEventsUpdater;
  }, []);

  const handleCreatePost = useCallback((content: string, venue?: Group) => {
    // Create a new post with the provided content
    const newPost: Post = {
      id: uuidv4(),
      content,
      user: TEST_USERS[0], // Assuming the first user in the test data
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      venue: venue || undefined
    };
    
    // Add to the posts state
    setPosts(prevPosts => [newPost, ...prevPosts]);
    
    // If the post is for a venue, also add to venue posts
    if (venue) {
      setVenuePosts(prevVenuePosts => [newPost, ...prevVenuePosts]);
    }
    
    // Success message
    toast.success("Post created!");
  }, []);

  const handlePostComment = useCallback((postId: string, content: string) => {
    // Create a new comment
    const newComment: Comment = {
      id: uuidv4(),
      text: content,
      user: TEST_USERS[0], // Assuming the first user in the test data
      createdAt: new Date().toISOString(),
      postId: postId
    };
    
    // Add the comment to the post
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments: [...(Array.isArray(post.comments) ? post.comments : []), newComment] 
            } 
          : post
      )
    );
    
    // Also update the comment in venue posts if applicable
    setVenuePosts(prevVenuePosts => 
      prevVenuePosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments: [...(Array.isArray(post.comments) ? post.comments : []), newComment] 
            } 
          : post
      )
    );
    
    // Success message
    toast.success("Comment added!");
  }, []);

  const generateLocationPosts = useCallback((locationId: string): Post[] => {
    // Generate mock posts for a specific location
    const locationPosts: Post[] = [];
    const postCount = Math.floor(Math.random() * 3) + 2; // 2-4 posts
    
    for (let i = 0; i < postCount; i++) {
      // Get a random user
      const userIndex = Math.floor(Math.random() * TEST_USERS.length);
      const user = TEST_USERS[userIndex];
      
      // Generate a random post
      const newPost: Post = {
        id: uuidv4(),
        content: `Location post ${i + 1} for ${locationId}`,
        user,
        createdAt: new Date().toISOString(),
        likes: Math.floor(Math.random() * 10),
        comments: [],
        venue: { id: locationId, name: `Venue ${locationId}` } as Group
      };
      
      locationPosts.push(newPost);
    }
    
    return locationPosts;
  }, []);

  const rotateLocationPosts = useCallback(async (locationId: string, user: User | null) => {
    // Store reference to state setters to avoid TypeScript scope issues
    const updateCurrentUser = userUpdaterRef.current;
    const updatePosts = setPosts;
    const updateVenuePosts = setVenuePosts;
    const updateActivityEvents = activityEventsUpdaterRef.current;
    
    // Check if user has enough tokens
    if (user && user.tokens && user.tokens < 2) {
      toast.error("Not enough tokens to refresh posts");
      return;
    }
    
    // Generate new posts for this location
    const postsWithComments = generateLocationPosts(locationId);
    
    // Add these to the beginning of venue posts and all posts
    updatePosts((prevPosts: Post[]) => [...postsWithComments, ...prevPosts]);
    // Add type annotation to fix the 'Cannot find name setVenuePosts' error
    if (updateVenuePosts) {
      updateVenuePosts((prevVenuePosts: Post[]) => [...postsWithComments, ...prevVenuePosts]);
    }
    
    // Deduct token from user and update state
    if (user) {
      try {
        // Deduct token in database using public schema with te_ prefix
        const { error } = await supabase
          .from('te_user_token_balances')
          .update({ 
            balance: (user.tokens || 0) - 2 
          })
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error deducting token:', error);
          toast.error('Failed to deduct token');
          return;
        }
        
        // Update local state
        if (updateCurrentUser) {
          updateCurrentUser((prevUser: User | null) => 
            prevUser ? {
              ...prevUser,
              tokens: (prevUser.tokens || 0) - 2
            } : null
          );
        }
        
        // Create activity event
        const newEvent: ActivityEvent = {
          id: uuidv4(),
          type: 'refresh',
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          content: `refreshed posts at a venue`,
          createdAt: new Date().toISOString()
        };
        
        if (updateActivityEvents) {
          updateActivityEvents((prevEvents: ActivityEvent[]) => [newEvent, ...prevEvents]);
        }
        
        toast.success('Posts refreshed! (-2 tokens)');
      } catch (error) {
        console.error('Error in rotateLocationPosts:', error);
        toast.error('An error occurred refreshing posts');
      }
    }
  }, [generateLocationPosts]);

  // Implement missing methods required by the interface
  const handleLikePost = useCallback((postId: string, user: User) => {
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
    ));
    
    setVenuePosts(prevPosts => prevPosts.map(post => 
      post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
    ));
    
    setActiveLocationPosts(prevPosts => prevPosts.map(post => 
      post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
    ));
    
    // Record the like activity
    const newActivity: ActivityEvent = {
      id: uuidv4(),
      type: 'like',
      createdAt: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content: `liked a post`,
      target: postId
    };
    
    activityEventsUpdaterRef.current(prevEvents => [...prevEvents, newActivity]); 
    toast.success("Post liked!");
  }, []);
  
  const deletePost = useCallback((postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setVenuePosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setActiveLocationPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    toast.success("Post deleted!");
  }, []);
  
  const addComment = useCallback((comment: Comment) => {
    // Add comment to the post
    const postId = comment.postId;
    
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...(post.comments || []), comment] } 
          : post
      )
    );
    
    setVenuePosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...(post.comments || []), comment] } 
          : post
      )
    );
    
    setActiveLocationPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...(post.comments || []), comment] } 
          : post
      )
    );
    
    toast.success("Comment added!");
  }, []);

  return (
    <PostsContext.Provider
      value={{
        posts,
        venuePosts,
        activeLocation: null,
        activeLocationPosts,
        setPosts,
        setVenuePosts,
        handleCreatePost,
        handlePostComment,
        handleLikePost,
        deletePost,
        addComment,
        rotateLocationPosts,
        generateLocationPosts,
        setExternalSetters
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};

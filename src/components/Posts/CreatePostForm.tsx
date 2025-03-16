import React, { useState, useEffect } from 'react';
import { usePosts } from '../../contexts/PostsContext';
import { useUser } from '../../contexts/UserContext';
import { Post, Venue, Comment } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Image, X, MapPin, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase, getAdminClient } from '../../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const CreatePostForm: React.FC = () => {
  const { handleCreatePost } = usePosts();
  const { currentUser } = useUser();
  
  const [content, setContent] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showImageInput, setShowImageInput] = useState<boolean>(false);
  const [showVenueSelector, setShowVenueSelector] = useState<boolean>(false);
  const [venueSearch, setVenueSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Search for venues when venueSearch changes
  useEffect(() => {
    const searchVenues = async () => {
      if (venueSearch.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .ilike('name', `%${venueSearch}%`)
          .limit(5);
          
        if (error) throw error;
        
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching venues:', error);
        toast.error('Failed to search venues');
      } finally {
        setIsSearching(false);
      }
    };
    
    const timer = setTimeout(() => {
      searchVenues();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [venueSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !currentUser) {
      return;
    }
    
    const newPost: Post = {
      id: uuidv4(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar || '',
      content: content,
      image: imageUrl || undefined,
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      locationId: null,
      venue: selectedVenue || undefined,
      photos: imageUrl ? [imageUrl] : [],
      isLiked: false,
      text: content,
    };
    
    // Add token reward for creating a post with venue
    if (selectedVenue) {
      try {
        // Use service role client for token economy operations
        const adminClient = getAdminClient();
        adminClient
          .schema('token_economy')
          .from('transactions')
          .insert({
            user_id: currentUser.id,
            amount: 5, // 5 tokens for creating a post with venue
            transaction_type: 'venue_post_reward',
            description: `Reward for creating a post about ${selectedVenue.name}`,
            status: 'completed'
          })
          .then(({ error }: { error: any }) => {
            if (error) {
              console.error('Error recording token transaction:', error);
            } else {
              toast.success('Earned 5 tokens for sharing venue info!');
            }
          });
      } catch (error) {
        console.error('Token transaction error:', error);
      }
    }
    
    // Use the handleCreatePost method from the context
    handleCreatePost(content, selectedVenue);
    
    // Reset form
    setContent('');
    setImageUrl('');
    setShowImageInput(false);
    setSelectedVenue(null);
    setShowVenueSelector(false);
    
    toast.success('Post created successfully!');
  };
  
  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenueSelector(false);
    setVenueSearch('');
  };
  
  const handleRemoveSelectedVenue = () => {
    setSelectedVenue(null);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center mb-4">
        <img 
          src={currentUser?.avatar || 'https://via.placeholder.com/40'} 
          alt="Your avatar"
          className="w-10 h-10 rounded-full mr-3"
        />
        <h3 className="font-bold">Create a post</h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 border border-gray-300 rounded-lg mb-3 resize-none min-h-[100px]"
          required
        />
        
        {showImageInput && (
          <div className="mb-3 relative">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL"
                className="flex-1 p-2 border border-gray-300 rounded"
              />
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl('');
                }}
                className="text-red-500 hover:text-red-700"
              >
                <X size={20} />
              </button>
            </div>
            
            {imageUrl && (
              <div className="mt-2">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="max-h-40 rounded border border-gray-200"
                  onError={() => {
                    toast.error('Invalid image URL');
                    setImageUrl('');
                  }}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Selected Venue Display */}
        {selectedVenue && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <MapPin size={16} className="text-blue-500 mr-2" />
              <div>
                <p className="font-medium">{selectedVenue.name}</p>
                {selectedVenue.category && (
                  <p className="text-xs text-gray-500">{selectedVenue.category}</p>
                )}
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleRemoveSelectedVenue}
              className="text-gray-400 hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {!showImageInput && (
              <button
                type="button"
                onClick={() => setShowImageInput(true)}
                className="flex items-center text-gray-500 hover:text-gray-700 p-2"
              >
                <Image size={20} className="mr-1" />
                <span>Add Image</span>
              </button>
            )}
            
            {!selectedVenue && (
              <button
                type="button"
                onClick={() => setShowVenueSelector(true)}
                className="flex items-center text-gray-500 hover:text-gray-700 p-2"
              >
                <MapPin size={20} className="mr-1" />
                <span>Add Venue</span>
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!content.trim()}
            className={`px-4 py-2 rounded-lg ${
              content.trim() 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Post
          </button>
        </div>
        
        {/* Venue Selector Modal */}
        <AnimatePresence>
          {showVenueSelector && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVenueSelector(false)}
            >
              <motion.div
                className="bg-white rounded-lg w-full max-w-md p-5"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Select a Venue</h3>
                  <button
                    onClick={() => setShowVenueSelector(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    placeholder="Search for venues..."
                    className="pl-10 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="py-8 flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul>
                      {searchResults.map((venue) => (
                        <li key={venue.id}>
                          <button
                            onClick={() => handleVenueSelect(venue)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-start rounded transition-colors"
                          >
                            <MapPin size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{venue.name}</p>
                              {venue.category && (
                                <p className="text-xs text-gray-500">{venue.category}</p>
                              )}
                              {venue.rating !== undefined && (
                                <div className="flex items-center mt-1">
                                  <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="text-xs text-gray-600">{venue.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : venueSearch.trim().length > 1 ? (
                    <div className="py-8 text-center text-gray-500">
                      No venues found. Try a different search term.
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      Start typing to search for a venue
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

export default CreatePostForm;

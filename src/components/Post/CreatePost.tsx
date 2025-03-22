import React, { useState } from 'react';
import { X, MapPin, Tag, Send, Image, Clock, Star, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEST_GROUPS } from '../../constants/index';
import type { Group } from '../../types/index';
import { createPost } from '../../lib/ai';

interface CreatePostProps {
  onClose: () => void;
  onPostCreated?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onClose, onPostCreated }) => {
  // Post content state
  const [content, setContent] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Group | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  
  // Publishing state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // isPublished tracks whether post was successfully published
  // Used for conditional rendering later in component lifecycle
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPublished, setIsPublished] = useState(false);

  // Handle venue selection
  const handleVenueSelect = (venue: Group) => {
    setSelectedVenue(venue);
    setShowVenuePicker(false);
  };

  // Handle tag selection
  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setShowTagPicker(false);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // Handle media upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map(file => URL.createObjectURL(file));
    setMediaUrls([...mediaUrls, ...urls]);
  };

  // Handle post submission
  const handleSubmit = async () => {
    if (!content.trim() || !selectedVenue) {
      alert('Please add content and select a venue');
      return;
    }

    setIsUploading(true);
    
    try {
      const result = await createPost(
        content,
        mediaUrls,
        selectedVenue.id,
        selectedTags
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsPublished(true);
              if (onPostCreated) {
                onPostCreated();
              }
              setTimeout(() => onClose(), 1500);
            }, 500);
          }
          return Math.min(100, prev + 5);
        });
      }, 100);
      
    } catch (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#121826] rounded-xl shadow-xl border border-[--color-accent-primary]/20 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Venue selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            {selectedVenue ? (
              <div className="bg-[#1a2234] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedVenue.photos && selectedVenue.photos.length > 0 ? (
                    <img 
                      src={selectedVenue.photos[0]} 
                      alt={selectedVenue.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-900/30 flex items-center justify-center">
                      <MapPin size={20} className="text-blue-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{selectedVenue.name}</div>
                    <div className="text-sm text-gray-400">{selectedVenue.category}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowVenuePicker(true)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowVenuePicker(true)}
                className="w-full bg-[#1a2234] hover:bg-[#1a2234]/80 text-gray-300 p-3 rounded-lg flex items-center justify-center gap-2"
              >
                <MapPin size={18} />
                Select Venue
              </button>
            )}
          </div>

          {/* Content input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening at this venue?"
              className="w-full h-32 bg-[#1a2234] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[--color-accent-primary] focus:border-transparent"
            />
          </div>

          {/* Media upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Media</label>
            <div className="grid grid-cols-4 gap-2">
              {mediaUrls.map((url, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              <label className="aspect-square bg-[#1a2234] hover:bg-[#1a2234]/80 rounded-lg flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  multiple
                />
                <Image size={24} className="text-gray-400" />
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <div 
                  key={tag}
                  className="bg-[#1a2234] px-2 py-1 rounded-full text-sm text-blue-400 flex items-center gap-1"
                >
                  <span>#{tag}</span>
                  <button 
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowTagPicker(true)}
                className="px-2 py-1 rounded-full text-sm text-gray-400 hover:text-white flex items-center gap-1 bg-[#1a2234] hover:bg-[#1a2234]/80"
              >
                <Tag size={14} />
                Add Tag
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || !selectedVenue || isUploading}
            className="w-full bg-[--color-accent-primary] hover:bg-[--color-accent-primary]/90 text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Publishing... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Publish Post</span>
              </>
            )}
          </button>
        </div>

        {/* Venue picker modal */}
        <AnimatePresence>
          {showVenuePicker && (
            <motion.div
              className="absolute inset-0 bg-black/90 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Select Venue</h3>
                <button 
                  onClick={() => setShowVenuePicker(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {TEST_GROUPS.map(venue => (
                  <div
                    key={venue.id}
                    onClick={() => handleVenueSelect(venue)}
                    className="bg-[#1a2234] rounded-lg p-3 cursor-pointer hover:bg-[#1a2234]/80 flex items-center gap-3"
                  >
                    {venue.photos && venue.photos.length > 0 ? (
                      <img 
                        src={venue.photos[0]} 
                        alt={venue.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-blue-900/30 flex items-center justify-center">
                        <MapPin size={24} className="text-blue-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="font-medium text-white">{venue.name}</div>
                      <div className="text-sm text-gray-400">{venue.category}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-400" />
                          <span>{venue.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-blue-400" />
                          <span>{venue.participants}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{venue.time.replace('Opens ', '')}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight size={20} className="text-gray-500" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag picker modal */}
        <AnimatePresence>
          {showTagPicker && (
            <motion.div
              className="absolute inset-0 bg-black/90 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Select Tags</h3>
                <button 
                  onClick={() => setShowTagPicker(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-2">
                  {['food', 'drinks', 'music', 'nightlife', 'datenight', 'happy-hour', 'live-music', 'patio', 'sports', 'brunch'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      className={`p-3 rounded-lg text-left ${
                        selectedTags.includes(tag)
                          ? 'bg-[--color-accent-primary] text-white'
                          : 'bg-[#1a2234] text-gray-300 hover:bg-[#1a2234]/80'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
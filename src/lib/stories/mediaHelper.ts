import { useState } from 'react';

/**
 * Custom hook for managing media operations in the StoryModal
 * This centralizes media-related functionality to improve code organization
 */
export const useMediaHelper = () => {
  const [mediaItems, setMediaItems] = useState<Array<{
    type: 'image' | 'video';
    url: string;
  }>>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);

  // Add a new media item to the list
  const addMediaItem = (type: 'image' | 'video', url: string) => {
    setMediaItems(prev => [...prev, { type, url }]);
    // Auto-select the newly added item
    setCurrentSlide(mediaItems.length);
  };
  
  // Remove a media item by index
  const removeMediaItem = (index: number) => {
    setMediaItems(prev => {
      const newItems = prev.filter((_, i) => i !== index);
      // Adjust current slide if needed
      if (currentSlide >= newItems.length && newItems.length > 0) {
        setCurrentSlide(newItems.length - 1);
      } else if (newItems.length === 0) {
        setCurrentSlide(0);
      }
      return newItems;
    });
  };
  
  // Clear all media items
  const clearAllMedia = () => {
    setMediaItems([]);
    setCapturedMedia(null);
    setCurrentSlide(0);
  };
  
  // Apply a filter to the current media
  const applyFilter = (filterName: string | null) => {
    setSelectedFilter(filterName);
  };
  
  // Navigate to the next slide
  const nextSlide = () => {
    if (currentSlide < mediaItems.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };
  
  // Navigate to the previous slide
  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };
  
  // Check if we have any media
  const hasMedia = () => mediaItems.length > 0;
  
  // Get the current media item
  const getCurrentMedia = () => 
    mediaItems.length > 0 && currentSlide < mediaItems.length 
      ? mediaItems[currentSlide] 
      : null;

  return {
    mediaItems,
    setMediaItems,
    currentSlide,
    setCurrentSlide,
    selectedFilter,
    setSelectedFilter,
    capturedMedia,
    setCapturedMedia,
    addMediaItem,
    removeMediaItem,
    clearAllMedia,
    applyFilter,
    nextSlide,
    prevSlide,
    hasMedia,
    getCurrentMedia
  };
};

import { useState } from 'react';

/**
 * Custom hook for managing story enhancements like location, music, and stickers
 * This centralizes enhancement-related functionality to improve code organization
 */
export const useEnhancementHelper = () => {
  // Location state
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // Music state
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  
  // Stickers and emoji state
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [addedStickers, setAddedStickers] = useState<Array<{
    id: string;
    emoji: string;
    x: number;
    y: number;
  }>>([]);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);

  // Location functions
  const toggleLocationPicker = () => setShowLocationPicker(prev => !prev);
  const selectLocation = (location: string | null) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
  };
  
  // Music functions
  const toggleMusicPicker = () => setShowMusicPicker(prev => !prev);
  const selectMusic = (music: string | null) => {
    setSelectedMusic(music);
    setShowMusicPicker(false);
  };
  
  // Sticker functions
  const toggleStickerPicker = () => setShowStickerPicker(prev => !prev);
  const addSticker = (emoji: string, x: number, y: number) => {
    const newSticker = {
      id: crypto.randomUUID(),
      emoji,
      x,
      y
    };
    setAddedStickers(prev => [...prev, newSticker]);
  };
  const removeSticker = (id: string) => {
    setAddedStickers(prev => prev.filter(sticker => sticker.id !== id));
  };
  
  // Emoji functions
  const toggleEmojiPicker = () => setShowEmojiPicker(prev => !prev);
  const addEmoji = (emoji: string) => {
    setSelectedEmojis(prev => [...prev, emoji]);
    setShowEmojiPicker(false);
  };
  const removeEmoji = (index: number) => {
    setSelectedEmojis(prev => prev.filter((_, i) => i !== index));
  };
  
  // Tag functions
  const toggleTagPicker = () => setShowTagPicker(prev => !prev);
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setShowTagPicker(false);
  };
  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  
  return {
    // Location
    selectedLocation,
    setSelectedLocation,
    showLocationPicker,
    setShowLocationPicker,
    toggleLocationPicker,
    selectLocation,
    
    // Music
    selectedMusic,
    setSelectedMusic,
    showMusicPicker,
    setShowMusicPicker,
    toggleMusicPicker,
    selectMusic,
    
    // Stickers
    addedStickers,
    setAddedStickers,
    showStickerPicker,
    setShowStickerPicker,
    toggleStickerPicker,
    addSticker,
    removeSticker,
    
    // Emojis
    selectedEmojis,
    setSelectedEmojis,
    showEmojiPicker,
    setShowEmojiPicker,
    toggleEmojiPicker,
    addEmoji,
    removeEmoji,
    
    // Tags
    selectedTags,
    setSelectedTags,
    showTagPicker,
    setShowTagPicker,
    toggleTagPicker,
    addTag,
    removeTag
  };
};

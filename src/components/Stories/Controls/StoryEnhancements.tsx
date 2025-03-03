import React from 'react';
import { MapPin, Tag, Smile, Music } from 'lucide-react';
import { motion } from 'framer-motion';

interface StoryEnhancementsProps {
  showLocationPicker: boolean;
  showMusicPicker: boolean;
  showTagPicker: boolean;
  showStickerPicker: boolean;
  onToggleLocation: () => void;
  onToggleMusic: () => void;
  onToggleTag: () => void;
  onToggleSticker: () => void;
}

export const StoryEnhancements: React.FC<StoryEnhancementsProps> = ({
  showLocationPicker,
  showMusicPicker,
  showTagPicker,
  showStickerPicker,
  onToggleLocation,
  onToggleMusic,
  onToggleTag,
  onToggleSticker
}) => {
  return (
    <div className="flex justify-center gap-4">
      <motion.button
        onClick={onToggleLocation}
        className={`p-3 rounded-full ${
          showLocationPicker ? 'bg-[--color-accent-primary] text-white' : 'bg-white/10 text-white'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MapPin size={20} />
      </motion.button>
      
      <motion.button
        onClick={onToggleTag}
        className={`p-3 rounded-full ${
          showTagPicker ? 'bg-[--color-accent-primary] text-white' : 'bg-white/10 text-white'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Tag size={20} />
      </motion.button>
      
      <motion.button
        onClick={onToggleSticker}
        className={`p-3 rounded-full ${
          showStickerPicker ? 'bg-[--color-accent-primary] text-white' : 'bg-white/10 text-white'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Smile size={20} />
      </motion.button>
      
      <motion.button
        onClick={onToggleMusic}
        className={`p-3 rounded-full ${
          showMusicPicker ? 'bg-[--color-accent-primary] text-white' : 'bg-white/10 text-white'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Music size={20} />
      </motion.button>
    </div>
  );
};
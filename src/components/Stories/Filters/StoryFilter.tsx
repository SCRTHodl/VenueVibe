import React from 'react';
import { motion } from 'framer-motion';

interface Filter {
  id: string;
  name: string;
  style: string;
  preview?: string;
}

interface StoryFilterProps {
  filters: Filter[];
  selectedFilter: string | null;
  onSelectFilter: (filterId: string) => void;
  previewImage: string;
}

export const StoryFilter: React.FC<StoryFilterProps> = ({
  filters,
  selectedFilter,
  onSelectFilter,
  previewImage
}) => {
  return (
    <motion.div 
      className="absolute bottom-24 left-0 right-0 bg-black/80 backdrop-blur-sm p-4"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
    >
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory">
        {filters.map(filter => (
          <motion.button
            key={filter.id}
            onClick={() => onSelectFilter(filter.id === selectedFilter ? '' : filter.id)}
            className={`flex-none snap-center flex flex-col items-center ${
              selectedFilter === filter.id ? 'opacity-100' : 'opacity-70'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div 
              className="w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors"
              style={{ 
                borderColor: selectedFilter === filter.id ? 'white' : 'transparent'
              }}
            >
              <img 
                src={filter.preview || previewImage} 
                alt={filter.name}
                className="w-full h-full object-cover transition-all"
                style={{ filter: filter.style }}
              />
            </div>
            <span className="text-white text-xs mt-1">{filter.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
import React from 'react';
import { Filter } from 'lucide-react';

// Define filter types
export interface StoryFilter {
  id: string;
  name: string;
  style: string;
  previewStyle?: React.CSSProperties;
}

interface FilterSelectionPanelProps {
  filters: StoryFilter[];
  selectedFilter: string | undefined;
  onSelectFilter: (filterId: string | undefined) => void;
  previewImageUrl?: string;
}

export const FilterSelectionPanel: React.FC<FilterSelectionPanelProps> = ({
  filters,
  selectedFilter,
  onSelectFilter,
  previewImageUrl
}) => {
  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-purple-400" />
          <span className="text-white font-medium">Filters</span>
        </div>
      </div>
      
      <div className="overflow-x-auto py-2">
        <div className="flex gap-3 min-w-max px-1">
          {/* No filter option */}
          <button
            type="button"
            onClick={() => onSelectFilter(undefined)}
            className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden ${!selectedFilter ? 'ring-2 ring-white' : 'ring-1 ring-gray-700'}`}
          >
            {previewImageUrl ? (
              <img 
                src={previewImageUrl} 
                alt="No filter"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-white text-xs">Original</span>
              </div>
            )}
          </button>
          
          {/* Filter options */}
          {filters.map(filter => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onSelectFilter(filter.id)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden ${selectedFilter === filter.id ? 'ring-2 ring-white' : 'ring-1 ring-gray-700'}`}
            >
              {previewImageUrl ? (
                <img 
                  src={previewImageUrl} 
                  alt={filter.name}
                  className="w-full h-full object-cover"
                  style={{ filter: filter.style }}
                />
              ) : (
                <div 
                  className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500"
                  style={filter.previewStyle || { filter: filter.style }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-xs px-1 text-center">{filter.name}</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSelectionPanel;

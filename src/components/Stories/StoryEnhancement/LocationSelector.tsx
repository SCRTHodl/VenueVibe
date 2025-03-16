import React, { useState, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';

// Define preset locations (this could come from an API in a real app)
const PRESET_LOCATIONS = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'San Francisco, CA',
  'Miami, FL',
  'Seattle, WA',
  'Boston, MA',
  'Denver, CO',
  'Atlanta, GA'
];

interface LocationSelectorProps {
  selectedLocation: string | null | undefined;
  onSelectLocation: (location: string | null | undefined) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocation,
  onSelectLocation
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  // Simulate location search with preset results
  useEffect(() => {
    if (searchTerm.length > 0) {
      // Simple filter for demo purposes
      const results = PRESET_LOCATIONS.filter(
        location => location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults(PRESET_LOCATIONS.slice(0, 5)); // Show some default options
    }
  }, [searchTerm]);

  const handleLocationSelect = (location: string) => {
    onSelectLocation(location);
    setIsSearching(false);
    setSearchTerm('');
  };

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-red-400" />
          <span className="text-white font-medium">Location</span>
        </div>
        
        {selectedLocation ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm">{selectedLocation}</span>
            <button
              type="button"
              onClick={() => onSelectLocation(undefined)}
              className="p-1 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSearching(true)}
            className="flex items-center gap-1 px-3 py-1 bg-gray-800 rounded-full text-gray-300 text-sm hover:bg-gray-700"
          >
            <MapPin size={14} />
            Add Location
          </button>
        )}
      </div>
      
      {isSearching && (
        <div className="bg-gray-800 rounded-lg overflow-hidden mb-3">
          <div className="p-2 flex items-center gap-2 border-b border-gray-700">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a location..."
              className="flex-1 bg-transparent text-white border-none focus:outline-none text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setIsSearching(false)}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {searchResults.length > 0 ? (
              <ul>
                {searchResults.map((location, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 text-gray-200 text-sm flex items-center gap-2"
                    >
                      <MapPin size={14} className="text-gray-400" />
                      {location}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">
                No locations found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;

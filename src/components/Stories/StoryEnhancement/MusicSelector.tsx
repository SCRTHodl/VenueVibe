import React, { useState, useEffect } from 'react';
import { Music, Search, X, Play, Pause } from 'lucide-react';

// Mock music tracks (in a real app, these would come from an API)
const SAMPLE_TRACKS = [
  { id: 'track1', title: 'Summer Vibes', artist: 'Chill Wave', duration: '0:30', previewUrl: '' },
  { id: 'track2', title: 'Electronic Dreams', artist: 'Synthwave', duration: '0:30', previewUrl: '' },
  { id: 'track3', title: 'Acoustic Morning', artist: 'Guitar Harmony', duration: '0:30', previewUrl: '' },
  { id: 'track4', title: 'Hip Hop Beats', artist: 'Urban Pulse', duration: '0:30', previewUrl: '' },
  { id: 'track5', title: 'Cinematic Score', artist: 'Film Orchestra', duration: '0:30', previewUrl: '' },
  { id: 'track6', title: 'Lo-Fi Study', artist: 'Chill Hop', duration: '0:30', previewUrl: '' },
  { id: 'track7', title: 'Dance Floor', artist: 'EDM Stars', duration: '0:30', previewUrl: '' },
  { id: 'track8', title: 'Pop Favorites', artist: 'Chart Toppers', duration: '0:30', previewUrl: '' }
];

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  previewUrl: string;
}

interface MusicSelectorProps {
  selectedMusic: string | null | undefined;
  onSelectMusic: (music: string | null | undefined) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const MusicSelector: React.FC<MusicSelectorProps> = ({
  selectedMusic,
  onSelectMusic
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Simulate music search with preset results
  useEffect(() => {
    if (searchTerm.length > 0) {
      // Filter tracks based on search term
      const results = SAMPLE_TRACKS.filter(
        track => 
          track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          track.artist.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults(SAMPLE_TRACKS.slice(0, 5)); // Show some default options
    }
  }, [searchTerm]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const handleMusicSelect = (track: Track) => {
    onSelectMusic(`${track.title} - ${track.artist}`);
    setIsSearching(false);
    setSearchTerm('');
    
    // Stop any playing preview
    if (audioElement) {
      audioElement.pause();
      setPlaying(null);
    }
  };

  const togglePlayPreview = (trackId: string, previewUrl: string) => {
    // In a real app, previewUrl would be a real audio URL
    // For this demo, we'll simulate the play/pause functionality without actual audio
    
    if (playing === trackId) {
      // Pause the currently playing track
      if (audioElement) {
        audioElement.pause();
      }
      setPlaying(null);
    } else {
      // Stop any currently playing track
      if (audioElement) {
        audioElement.pause();
      }
      
      // For a real implementation, uncomment this code and use actual preview URLs
      /*
      const audio = new Audio(previewUrl);
      audio.play().catch(err => console.error('Error playing audio:', err));
      setAudioElement(audio);
      */
      
      setPlaying(trackId);
      
      // Simulate stopping after 30 seconds
      setTimeout(() => {
        if (playing === trackId) {
          setPlaying(null);
        }
      }, 5000); // Use 5s for demo instead of 30s
    }
  };

  // Format the selected music for display
  const getSelectedMusicDisplay = () => {
    const track = SAMPLE_TRACKS.find(t => `${t.title} - ${t.artist}` === selectedMusic);
    return track ? `${track.title} - ${track.artist}` : selectedMusic;
  };

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Music size={18} className="text-blue-400" />
          <span className="text-white font-medium">Music</span>
        </div>
        
        {selectedMusic ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm max-w-[150px] truncate">
              {getSelectedMusicDisplay()}
            </span>
            <button
              type="button"
              onClick={() => onSelectMusic(undefined)}
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
            <Music size={14} />
            Add Music
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
              placeholder="Search for music..."
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
                {searchResults.map((track) => (
                  <li key={track.id}>
                    <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-700">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleMusicSelect(track)}
                      >
                        <div className="text-gray-200 text-sm font-medium">{track.title}</div>
                        <div className="text-gray-400 text-xs">{track.artist}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">{track.duration}</span>
                        <button
                          type="button"
                          onClick={() => togglePlayPreview(track.id, track.previewUrl)}
                          className="p-1 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600"
                        >
                          {playing === track.id ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">
                No music found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicSelector;

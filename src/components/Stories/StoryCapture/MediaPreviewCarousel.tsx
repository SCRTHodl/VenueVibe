import React from 'react';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Download } from 'lucide-react';

interface MediaPreviewCarouselProps {
  mediaItems: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  selectedFilter?: string | null;
  filters: Array<{
    id: string;
    name: string;
    style: string;
  }>;
  onRemoveMedia: (index: number) => void;
  onDownloadMedia?: (url: string) => void;
}

export const MediaPreviewCarousel: React.FC<MediaPreviewCarouselProps> = ({
  mediaItems,
  currentSlide,
  setCurrentSlide,
  isMuted,
  setIsMuted,
  selectedFilter,
  filters,
  onRemoveMedia,
  onDownloadMedia
}) => {
  if (mediaItems.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">No media selected</p>
      </div>
    );
  }

  const goToNextSlide = () => {
    setCurrentSlide((currentSlide + 1) % mediaItems.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((currentSlide - 1 + mediaItems.length) % mediaItems.length);
  };

  // Find the selected filter style if any
  const filterStyle = selectedFilter 
    ? filters.find(f => f.id === selectedFilter)?.style 
    : undefined;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Media carousel */}
      <div className="w-full h-full relative">
        {mediaItems.map((item, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-300 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {item.type === 'image' ? (
              <img 
                src={item.url} 
                alt={`Story media ${index + 1}`}
                className="w-full h-full object-contain"
                style={filterStyle ? { filter: filterStyle } : undefined}
              />
            ) : (
              <video 
                src={item.url}
                className="w-full h-full object-contain"
                autoPlay 
                loop 
                muted={isMuted}
                style={filterStyle ? { filter: filterStyle } : undefined}
              />
            )}
          </div>
        ))}
        
        {/* Controls overlay */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top controls */}
          <div className="px-4 py-3 flex justify-between items-center">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-white text-sm">
              {currentSlide + 1}/{mediaItems.length}
            </div>
            
            <div className="flex gap-2">
              {/* Volume control for videos */}
              {mediaItems[currentSlide]?.type === 'video' && (
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              )}
              
              {/* Remove current media */}
              <button
                type="button"
                onClick={() => onRemoveMedia(currentSlide)}
                className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Navigation arrows for multiple media */}
          {mediaItems.length > 1 && (
            <div className="flex-1 flex items-center justify-between px-2">
              <button
                type="button"
                onClick={goToPrevSlide}
                className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button
                type="button"
                onClick={goToNextSlide}
                className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
          
          {/* Bottom controls */}
          <div className="px-4 py-3 flex justify-end">
            {onDownloadMedia && (
              <button
                type="button"
                onClick={() => onDownloadMedia(mediaItems[currentSlide].url)}
                className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white"
              >
                <Download size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPreviewCarousel;

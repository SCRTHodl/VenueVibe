# StoryModal Refactoring Guide

This document provides guidance on how to further refactor the StoryModal component to use the newly created helper hooks.

## Using Helper Hooks

The StoryModal component can be significantly simplified by using the new custom hooks:

```tsx
import React from 'react';
import { 
  useMediaHelper, 
  useEnhancementHelper, 
  useModerationHelper,
  createStoryObject,
  publishStory
} from '../../lib/stories';
import { supabase } from '../../lib/supabase';
import { UserStory } from '../../types';

// Import components
import { PremiumContentSettings, ContentModerationManager } from './StoryModeration';
import { StickersPanel, FilterSelectionPanel, LocationSelector, MusicSelector } from './StoryEnhancement';
import { MediaCapturePanel, MediaPreviewCarousel, MediaUploader } from './StoryCapture';

interface StoryModalProps {
  onClose: () => void;
  onStoryCreated?: (story: UserStory) => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ onClose, onStoryCreated }) => {
  // Use custom hooks for state management
  const media = useMediaHelper();
  const enhancements = useEnhancementHelper();
  const moderation = useModerationHelper();
  
  // Story text content
  const [caption, setCaption] = useState('');
  
  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Primary camera functionality (simplified from original)
  const { 
    cameraRef, 
    streamRef, 
    isCameraReady, 
    setupCamera, 
    teardownCamera 
  } = useCamera();

  // Effect hooks for camera setup, cleanup, etc.
  // ...

  // Story publishing function (now much simpler)
  const publishStory = async () => {
    try {
      setIsPublishing(true);
      setUploadProgress(10);
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        alert('You need to be logged in to publish a story');
        return;
      }
      
      if (!media.hasMedia()) {
        alert('Please add at least one photo or video to your story');
        return;
      }
      
      // Check moderation if enabled
      if (!moderation.passesModeration()) {
        alert('Your content did not pass moderation. Please modify it before publishing.');
        return;
      }
      
      setUploadProgress(30);
      
      // Prepare story data using the helper
      const storyData = createStoryObject({
        userId,
        mediaItems: media.mediaItems,
        caption,
        location: enhancements.selectedLocation,
        music: enhancements.selectedMusic,
        filter: media.selectedFilter,
        isPremium: moderation.isPremiumContent,
        unlockCost: moderation.tokenCost,
        emojis: enhancements.selectedEmojis,
        stickers: enhancements.addedStickers
      });
      
      setUploadProgress(50);
      
      // Use the publisher helper function
      const result = await publishStory(storyData);
      
      setUploadProgress(90);
      
      if (result.success) {
        setUploadProgress(100);
        setIsPublished(true);
        
        if (onStoryCreated && result.story) {
          onStoryCreated(result.story);
        }
        
        if (result.warning) {
          console.warn(result.warning);
        }
        
        setTimeout(() => onClose(), 1500);
      } else {
        alert(result.error || 'Failed to publish story');
      }
    } catch (error) {
      console.error('Error publishing story:', error);
      alert('Failed to publish story. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // JSX rendering with all the components
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Component structure remains the same, but uses the helper functions */}
      {/* ... */}
      
      {/* Components now use the helper functions */}
      <MediaCapturePanel
        onCapture={media.addMediaItem} 
        isRecording={/* ... */}
        onStartRecording={/* ... */}
        onStopRecording={/* ... */}
      />
      
      <MediaPreviewCarousel
        mediaItems={media.mediaItems}
        currentSlide={media.currentSlide}
        onNextSlide={media.nextSlide}
        onPrevSlide={media.prevSlide}
        onRemoveMedia={media.removeMediaItem}
        selectedFilter={media.selectedFilter}
      />
      
      <LocationSelector
        isOpen={enhancements.showLocationPicker}
        onClose={enhancements.toggleLocationPicker}
        selectedLocation={enhancements.selectedLocation}
        onSelectLocation={enhancements.selectLocation}
      />
      
      {/* ... Other components similarly using the helpers */}
      
      <ContentModerationManager
        isChecking={moderation.isCheckingModeration}
        moderationResult={moderation.moderationResult}
        onCheckContent={() => moderation.checkContent(caption, media.mediaItems)}
      />
    </div>
  );
};
```

## Key Benefits

1. **Cleaner Component Code**: The main StoryModal component is more focused on UI structure and high-level user interactions
2. **Better Encapsulation**: Related functionality is grouped together in dedicated hooks
3. **Enhanced Testability**: Each hook can be tested independently
4. **Simplified Refactoring**: Changes to specific features are localized

## Integration Steps

1. Import the necessary hooks at the top of StoryModal.tsx
2. Replace direct state variables with the hook-provided state and functions
3. Update component props to use the helper functions
4. Test integration points between the hooks

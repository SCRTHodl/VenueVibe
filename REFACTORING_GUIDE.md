# StoryModal Refactoring Guide

This guide outlines how to refactor the large StoryModal.tsx component (1074 lines) into smaller, more maintainable components.

## New Component Structure

I've created several new components to extract functionality from StoryModal:

1. **StoryModeration/**
   - `PremiumContentSettings.tsx`: Handles premium content toggle and cost settings
   - `ContentModerationManager.tsx`: Manages content moderation checks and displays results

2. **StoryEnhancement/**
   - `StickersPanel.tsx`: Handles emoji selection and sticker placement
   - `FilterSelectionPanel.tsx`: Manages filter selection and preview
   - `LocationSelector.tsx`: Handles location search and selection
   - `MusicSelector.tsx`: Manages music track search and selection

3. **StoryCapture/**
   - `MediaCapturePanel.tsx`: Handles camera and video capture
   - `MediaPreviewCarousel.tsx`: Displays media preview with controls
   - `MediaUploader.tsx`: Handles file upload functionality

4. **lib/stories/**
   - `storyPublisher.ts`: Contains helper functions for creating and publishing stories with premium content

## Refactoring Steps

### 1. Update imports in StoryModal.tsx

```tsx
// Add these new imports
import { PremiumContentSettings, ContentModerationManager } from './StoryModeration';
import { StickersPanel, FilterSelectionPanel, LocationSelector, MusicSelector } from './StoryEnhancement'; 
import { MediaCapturePanel, MediaPreviewCarousel, MediaUploader } from './StoryCapture';
import { createStoryObject, publishStory } from '../../lib/stories/storyPublisher';
```

### 2. Replace camera and video capture section

Find the camera and video capture section and replace it with:

```tsx
{activeTab === 'camera' || activeTab === 'video' ? (
  <MediaCapturePanel
    activeTab={activeTab}
    isRecording={isRecording}
    recordingTime={recordingTime}
    isMuted={isMuted}
    flashMode={flashMode}
    cameraFacing={cameraFacing}
    zoomLevel={zoomLevel}
    onCapture={(mediaSrc, type) => {
      setCapturedMedia(mediaSrc);
      // Add other necessary logic
    }}
    onRecordingStart={() => {
      setIsRecording(true);
      // Add timer logic
    }}
    onRecordingStop={() => {
      setIsRecording(false);
      // Stop timer logic
    }}
    onChangeFlashMode={setFlashMode}
    onChangeCameraFacing={setCameraFacing}
    onChangeZoomLevel={setZoomLevel}
    onToggleMute={() => setIsMuted(!isMuted)}
  />
) : (
  <MediaUploader
    onMediaSelect={(file) => {
      // Handle file selection
      // Create mediaItems entry
    }}
  />
)}
```

### 3. Replace media preview section

Find the media preview carousel section and replace it with:

```tsx
{mediaItems.length > 0 && (
  <MediaPreviewCarousel
    mediaItems={mediaItems}
    currentSlide={currentSlide}
    setCurrentSlide={setCurrentSlide}
    isMuted={isMuted}
    setIsMuted={setIsMuted}
    selectedFilter={selectedFilter}
    filters={STORY_FILTERS}
    onRemoveMedia={(index) => {
      // Handle media removal
    }}
    onDownloadMedia={(url) => {
      // Handle download logic
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-${Date.now()}.${url.startsWith('data:image') ? 'jpg' : 'webm'}`;
      a.click();
    }}
  />
)}
```

### 4. Replace filters section

Find the filters UI section and replace it with:

```tsx
{/* Filter selection panel */}
<FilterSelectionPanel
  filters={STORY_FILTERS}
  selectedFilter={selectedFilter}
  onSelectFilter={setSelectedFilter}
  previewImageUrl={mediaItems.length > 0 ? mediaItems[currentSlide].url : undefined}
/>
```

### 5. Replace location section

Find the location UI section and replace it with:

```tsx
{/* Location selector */}
<LocationSelector
  selectedLocation={selectedLocation}
  onSelectLocation={setSelectedLocation}
/>
```

### 6. Replace music section

Find the music UI section and replace it with:

```tsx
{/* Music selector */}
<MusicSelector
  selectedMusic={selectedMusic}
  onSelectMusic={setSelectedMusic}
/>
```

### 7. Replace premium content UI section

Find the premium content toggle UI section (around line 922) and replace it with:

```tsx
{/* Premium content settings */}
<PremiumContentSettings
  isPremiumContent={isPremiumContent}
  setIsPremiumContent={setIsPremiumContent}
  tokenCost={tokenCost}
  setTokenCost={setTokenCost}
  showTokenSettings={showTokenSettings}
  setShowTokenSettings={setShowTokenSettings}
/>
```

### 8. Replace emoji/stickers section

Find the emoji/stickers UI section and replace it with:

```tsx
{/* Stickers panel */}
<StickersPanel
  selectedEmojis={selectedEmojis}
  setSelectedEmojis={setSelectedEmojis}
  addedStickers={addedStickers}
  setAddedStickers={setAddedStickers}
/>
```

### 9. Replace content moderation UI section

Find the content moderation UI section and replace it with:

```tsx
{/* Content moderation manager */}
<ContentModerationManager
  isChecking={isChecking}
  moderationResult={moderationResult}
  onCheckContent={checkContentModeration}
/>
```

### 10. Replace the publishStory function

Replace the existing `publishStory` function with this simplified version that uses the storyPublisher helper:

```tsx
const publishStory = async () => {
  try {
    setIsPublishing(true);
    
    // Prepare story data using the helper
    const storyData = createStoryObject({
      userId,
      mediaItems,
      caption,
      location: selectedLocation,
      music: selectedMusic,
      filter: selectedFilter,
      isPremium: isPremiumContent,
      unlockCost: tokenCost,
      emojis: selectedEmojis,
      stickers: addedStickers,
      // Add any other story properties
    });
    
    // Use the publisher helper function
    const result = await publishStory(storyData);
    
    if (result.success) {
      toast.success('Story published successfully!');
      onClose();
    } else {
      toast.error(result.error || 'Failed to publish story');
    }
  } catch (error) {
    console.error('Error publishing story:', error);
    toast.error('Failed to publish story');
  } finally {
    setIsPublishing(false);
  }
};
```

## Benefits of This Refactoring

1. **Improved Maintainability**: Smaller components are easier to understand, test, and maintain
2. **Separation of Concerns**: Each component has a focused responsibility
3. **Reusability**: Components like MediaCapturePanel and FilterSelectionPanel can be reused elsewhere
4. **Easier Future Development**: New features can be added to individual components without affecting others
5. **Better Testing**: Smaller components are easier to test in isolation

## Implementation Strategy

Implement this refactoring incrementally:

1. Start by integrating the already created components
2. Test thoroughly after each integration
3. Once stable, create additional components if needed
4. Update any references from other parts of the app if needed

## Integration Progress

Here's the progress of our ongoing refactoring effort:

### Completed Integrations

1. ✅ **PremiumContentSettings**: Integrated for managing premium content toggle and token cost
2. ✅ **MediaCapturePanel**: Integrated for handling camera and video capture
3. ✅ **MediaPreviewCarousel**: Integrated for displaying media previews with navigation controls
4. ✅ **FilterSelectionPanel**: Integrated for selecting and applying filters to media
5. ✅ **ContentModerationManager**: Integrated for checking content against community guidelines
6. ✅ **LocationSelector**: Integrated for searching and selecting location tags
7. ✅ **MusicSelector**: Integrated for searching and selecting music tracks
8. ✅ **StickersPanel**: Integrated for adding emojis and stickers to media

### Component Integration Details

#### LocationSelector Integration
- Added as a modal overlay triggered by the location button in StoryEnhancements
- Updates selectedLocation state when a location is selected
- Allows searching and selecting from preset locations (can be expanded to use Maps API)

#### MusicSelector Integration
- Added as a modal overlay triggered by the music button in StoryEnhancements
- Updates selectedMusic state when a track is selected
- Provides search functionality and music preview

#### StickersPanel Integration
- Added as a modal overlay triggered by the sticker button in StoryEnhancements
- Allows selecting emojis and placing stickers on media
- Manages both selectedEmojis and addedStickers states

#### ContentModerationManager Integration
- Added a handleCheckContent method to perform content moderation checks
- Integrated ContentModerationManager UI component to display results
- Added state variables for tracking moderation status and results

## Helper Functions

To further enhance code organization and maintainability, we've implemented several helper hooks that centralize related functionality:

### 1. Media Helper (`mediaHelper.ts`)

The `useMediaHelper` hook provides centralized management of media-related functionality:

- Manage media items (add, remove, navigate between items)
- Apply filters to media
- Handle media capture and preview
- Simplify media state management

### 2. Enhancement Helper (`enhancementHelper.ts`)

The `useEnhancementHelper` hook centralizes story enhancement features:

- Location selection and management
- Music track selection and management
- Stickers and emoji placement
- Tag management

### 3. Moderation Helper (`moderationHelper.ts`)

The `useModerationHelper` hook handles content moderation and premium content settings:

- Content moderation checks
- Premium content toggle
- Token cost management
- Moderation result tracking

### Benefits of Helper Functions

- **Separation of Concerns**: Each helper focuses on specific functionality
- **Code Reusability**: Functions can be used across different components
- **Simplified Component Logic**: Main component code becomes cleaner and more focused
- **Easier Testing**: Isolated functionality is easier to test
- **Better Maintainability**: Changes to specific features are localized to the relevant helper

## Future Considerations

1. Create unit tests for individual components and helper functions
2. Add storybook documentation for component showcasing
3. Consider implementing a global state management solution to further simplify prop passing
4. Implement advanced features in each component (e.g., real location API integration)
5. Add data persistence for draft stories
6. Implement analytics tracking for story interactions
6. Add animation transitions between different modal states

## Implementation Strategy

Our implementation strategy has been incremental:

1. ✅ Create the component structure and individual component files
2. ✅ Implement core functionality in each component
3. ✅ Integrate components one by one into the StoryModal
4. ✅ Update the publish flow to work with the new component structure
5. ✅ Test component integration thoroughly
6. 🔄 Continue refactoring remaining sections of StoryModal
7. 🔄 Add comprehensive test coverage
8. 🔄 Optimize performance of each component

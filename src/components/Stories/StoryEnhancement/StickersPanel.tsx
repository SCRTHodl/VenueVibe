import React, { useState } from 'react';
import { Smile, X } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface StickersPanelProps {
  selectedEmojis: string[];
  setSelectedEmojis: (emojis: string[]) => void;
  addedStickers: Array<{
    id: string;
    emoji: string;
    x: number;
    y: number;
  }>;
  setAddedStickers: React.Dispatch<React.SetStateAction<Array<{
    id: string;
    emoji: string;
    x: number;
    y: number;
  }>>>;
}

const StickersPanel: React.FC<StickersPanelProps> = ({
  selectedEmojis,
  setSelectedEmojis,
  addedStickers,
  setAddedStickers
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmojis([...selectedEmojis, emojiData.emoji]);
    setShowEmojiPicker(false);
  };

  const removeEmoji = (index: number) => {
    setSelectedEmojis(selectedEmojis.filter((_, i) => i !== index));
  };

  const addStickerToMedia = (emoji: string) => {
    setAddedStickers([
      ...addedStickers,
      {
        id: crypto.randomUUID(),
        emoji,
        x: Math.random() * 80 + 10, // Random position (10-90%)
        y: Math.random() * 80 + 10
      }
    ]);
  };

  const removeSticker = (stickerId: string) => {
    setAddedStickers(addedStickers.filter(sticker => sticker.id !== stickerId));
  };

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-white font-medium">Stickers</span>
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700"
        >
          <Smile size={20} />
        </button>
      </div>

      {showEmojiPicker && (
        <div className="relative z-10">
          <div className="absolute right-0 bottom-full mb-2">
            <div className="bg-gray-800 rounded-lg p-1 shadow-xl">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                searchPlaceHolder="Search emoji..."
                width={300}
                height={350}
                previewConfig={{ showPreview: false }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Selected emojis display */}
      {selectedEmojis.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedEmojis.map((emoji, index) => (
            <div 
              key={index} 
              className="flex items-center bg-gray-800 rounded-full pl-2 pr-1 py-1"
            >
              <span className="text-xl mr-1">{emoji}</span>
              <button
                type="button"
                onClick={() => removeEmoji(index)}
                className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stickers in media */}
      {addedStickers.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm text-gray-400 mb-2">Added Stickers:</h4>
          <div className="flex flex-wrap gap-2">
            {addedStickers.map(sticker => (
              <div key={sticker.id} className="relative group">
                <div className="text-2xl bg-gray-800/40 p-1 rounded">
                  {sticker.emoji}
                </div>
                <button
                  type="button"
                  onClick={() => removeSticker(sticker.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick sticker actions */}
      <div className="flex gap-2 mt-3">
        {selectedEmojis.length > 0 && (
          <button
            type="button"
            onClick={() => addStickerToMedia(selectedEmojis[selectedEmojis.length - 1])}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-sm"
          >
            Add as Sticker
          </button>
        )}
      </div>
    </div>
  );
};

export default StickersPanel;

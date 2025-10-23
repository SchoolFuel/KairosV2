import React, { useState } from 'react';

const REACTION_EMOJIS = ['😎', '🚀', '🙌', '🎉', '💡'];

export const ReactionPicker = ({ onReaction, currentReaction = null }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emoji) => {
    onReaction(emoji);
    setShowPicker(false);
  };

  const togglePicker = () => {
    setShowPicker(!showPicker);
  };

  return (
    <div className="relative">
      {/* Reaction Button */}
      <button
        onClick={togglePicker}
        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
      >
        {currentReaction ? (
          <>
            <span className="text-sm">{currentReaction}</span>
            <span className="text-gray-500">Reacted</span>
          </>
        ) : (
          <span className="text-gray-600">+</span>
        )}
      </button>

      {/* Emoji Picker */}
      {showPicker && (
        <div className="absolute top-8 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <div className="flex space-x-1">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-full transition-colors duration-200"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

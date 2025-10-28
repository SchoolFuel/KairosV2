import React from 'react';

export const EmojiSelector = ({ 
  emojis, 
  selectedEmoji, 
  onEmojiSelect, 
  disabled = false,
  title = "How are you feeling today?",
  lowEnergyLabel = "Low Energy",
  highEnergyLabel = "High Energy",
  className = "mb-6"
}) => (
  <div className={className}>
    <h4 className="text-center text-sm font-medium text-gray-700 mb-8">
      {title}
    </h4>
    <div className="flex justify-between items-center px-1 mb-3">
      {emojis.map((item) => (
        <div key={item.level} className="flex flex-col items-center relative group flex-1">
          <button
            onClick={() => onEmojiSelect(item.emoji)}
            disabled={disabled}
            className={`w-10 h-10 rounded-full text-lg transition-all duration-300 transform flex items-center justify-center hover:scale-110 ${
              selectedEmoji === item.emoji
                ? 'bg-gradient-to-br from-orange-100 to-orange-200 ring-2 ring-orange-500 scale-110 shadow-lg'
                : 'hover:bg-gray-100 hover:shadow-md'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {item.emoji}
          </button>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap hidden group-hover:block transition-all duration-200 pointer-events-none z-50 opacity-50">
            {item.label}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium">{item.level}</div>
        </div>
      ))}
    </div>
    <div className="flex justify-between text-xs text-gray-400">
      <span>{lowEnergyLabel}</span>
      <span>{highEnergyLabel}</span>
    </div>
  </div>
);
import React from 'react';

const StageTab = ({ index, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-colors ${
        isActive
          ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      Stage {index + 1}
    </button>
  );
};
export default StageTab;
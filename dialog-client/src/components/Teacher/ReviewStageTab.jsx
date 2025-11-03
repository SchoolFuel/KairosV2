import React from 'react';

const ReviewStageTab = ({ index, isActive, onClick, stage }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-colors relative ${
        isActive
          ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      Stage {index + 1}
      {stage?.status && (
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
          stage.status === 'Completed' ? 'bg-green-100 text-green-700' :
          stage.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {stage.status}
        </span>
      )}
    </button>
  );
};

export default ReviewStageTab;


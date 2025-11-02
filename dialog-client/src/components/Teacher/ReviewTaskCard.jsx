import React from 'react';

const ReviewTaskCard = ({ task, taskIndex }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          TASK {taskIndex + 1} TITLE
        </label>
        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-900">
          {task.title || '—'}
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          DESCRIPTION
        </label>
        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 min-h-[3rem] whitespace-pre-wrap">
          {task.description || '—'}
        </div>
      </div>
      {task.academic_standard && (
        <div className="text-xs text-gray-600 mb-2">
          <strong>Standard:</strong> {task.academic_standard}
        </div>
      )}
      {task.evidence_link && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            RESOURCE LINK
          </label>
          <a
            href={task.evidence_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
          >
            🔗 {task.evidence_link}
          </a>
        </div>
      )}
      {task.resource_id && !task.evidence_link && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            RESOURCE
          </label>
          <a
            href={task.resource_id.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            📚 {task.resource_id.label}
          </a>
        </div>
      )}
    </div>
  );
};

export default ReviewTaskCard;


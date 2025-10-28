import React from 'react';

const TaskCard = ({ task, stageIndex, taskIndex, onUpdate }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          TASK {taskIndex + 1} TITLE
        </label>
        <input
          type="text"
          value={task.title}
          onChange={(e) => onUpdate(stageIndex, taskIndex, 'title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm font-medium"
        />
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          DESCRIPTION
        </label>
        <textarea
          rows="2"
          value={task.description}
          onChange={(e) => onUpdate(stageIndex, taskIndex, 'description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm resize-none"
        />
      </div>
      <div className="text-xs text-gray-600">
        <strong>Standard:</strong> {task.academic_standard}
      </div>
      {task.resource_id && (
        <div className="mt-2">
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
export default TaskCard;
import React from "react";
import { Trash2 } from "lucide-react";

const TaskCard = ({
  task,
  stageIndex,
  taskIndex,
  onUpdate,
  onRequestDeletion,
  projectTitle,
  stageTitle,
}) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          TASK {taskIndex + 1} TITLE
        </label>
        <input
          type="text"
          value={task.title}
          onChange={(e) =>
            onUpdate(stageIndex, taskIndex, "title", e.target.value)
          }
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
          onChange={(e) =>
            onUpdate(stageIndex, taskIndex, "description", e.target.value)
          }
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

      {/* Request Deletion Button - Right side */}
      {onRequestDeletion && (
        <div className="absolute top-4 right-4">
          {task.deletion_requested ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">
                Deletion Requested
              </span>
              <button
                onClick={() => onRequestDeletion(stageIndex, taskIndex, false)}
                className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => onRequestDeletion(stageIndex, taskIndex, true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
              title="Request deletion of this task"
            >
              <Trash2 size={14} />
              Request Deletion
            </button>
          )}
        </div>
      )}
    </div>
  );
};
export default TaskCard;

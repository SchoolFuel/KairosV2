import React from "react";
import { Trash2, CheckCircle, XCircle } from "lucide-react";

const ReviewTaskCard = ({
  task,
  taskIndex,
  stageIndex,
  isEditable,
  isFrozen,
  onUpdate,
  onApproveDeletion,
  onRejectDeletion,
  projectTitle,
}) => {
  const isDisabled = isFrozen || !isEditable;
  // Only show deletion request UI for "Survey Stakeholders" task in "Healthcare Robotics Project"
  const isEligibleForDeletion =
    projectTitle === "Healthcare Robotics Project" &&
    task.title === "Survey Stakeholders";
  const hasDeletionRequest =
    isEligibleForDeletion &&
    task.deletion_requested &&
    task.deletion_request_status === "pending";

  return (
    <div
      className={`bg-gray-50 border rounded-lg p-4 ${
        hasDeletionRequest
          ? "border-red-500 border-2 bg-red-50"
          : "border-gray-200"
      }`}
    >
      {/* Deletion Request Badge */}
      {hasDeletionRequest && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-red-600" />
            <span className="text-xs font-semibold text-red-700">
              Deletion Requested
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                onApproveDeletion && onApproveDeletion(stageIndex, taskIndex)
              }
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              title="Approve deletion"
            >
              <CheckCircle size={12} />
              Approve
            </button>
            <button
              onClick={() =>
                onRejectDeletion && onRejectDeletion(stageIndex, taskIndex)
              }
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              title="Reject deletion"
            >
              <XCircle size={12} />
              Reject
            </button>
          </div>
        </div>
      )}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          TASK {taskIndex + 1} TITLE
        </label>
        {isEditable && !isFrozen ? (
          <input
            type="text"
            value={task.title || ""}
            onChange={(e) => onUpdate && onUpdate("title", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            disabled={isDisabled}
          />
        ) : (
          <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-900">
            {task.title || "—"}
          </div>
        )}
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          DESCRIPTION
        </label>
        {isEditable && !isFrozen ? (
          <textarea
            value={task.description || ""}
            onChange={(e) =>
              onUpdate && onUpdate("description", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 min-h-[3rem] whitespace-pre-wrap focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
            disabled={isDisabled}
          />
        ) : (
          <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 min-h-[3rem] whitespace-pre-wrap">
            {task.description || "—"}
          </div>
        )}
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          ACADEMIC STANDARD
        </label>
        {isEditable && !isFrozen ? (
          <input
            type="text"
            value={task.academic_standard || ""}
            onChange={(e) =>
              onUpdate && onUpdate("academic_standard", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            disabled={isDisabled}
            placeholder="Enter academic standard"
          />
        ) : (
          task.academic_standard && (
            <div className="text-xs text-gray-600 mb-2">
              <strong>Standard:</strong> {task.academic_standard}
            </div>
          )
        )}
      </div>
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

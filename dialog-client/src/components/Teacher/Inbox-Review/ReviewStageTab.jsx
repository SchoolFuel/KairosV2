import React from "react";
import { Trash2 } from "lucide-react";

const ReviewStageTab = ({ index, isActive, onClick, stage }) => {
  // Check if stage itself has deletion request
  const hasStageDeletionRequest =
    stage?.deletion_requested && stage?.deletion_request_status === "pending";

  // Check if any tasks in the stage have deletion requests
  const hasTaskDeletionRequest = stage?.tasks?.some(
    (task) => task?.deletion_requested && task?.deletion_request_status === "pending"
  );

  const hasDeletionRequest = hasStageDeletionRequest || hasTaskDeletionRequest;

  // Debug logging
  if (stage) {
    console.log(
      `ReviewStageTab - Stage ${index + 1}:`,
      `deletion_requested=${stage.deletion_requested}`,
      `deletion_request_status=${stage.deletion_request_status}`,
      `stage_id=${stage.stage_id}`,
      `hasTaskDeletionRequest=${hasTaskDeletionRequest}`
    );
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-colors relative ${
        isActive
          ? hasDeletionRequest
            ? "text-red-700 bg-red-50 border-b-2 border-purple-600"
            : "text-purple-600 border-b-2 border-purple-600 bg-white"
          : hasDeletionRequest
          ? "text-red-700 bg-red-50 hover:bg-red-100"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      Stage {index + 1}
      {hasDeletionRequest && (
        <Trash2
          size={12}
          className="inline-block ml-2 text-red-700"
          title={hasStageDeletionRequest ? "Stage deletion requested" : "Task deletion requested"}
        />
      )}
    </button>
  );
};

export default ReviewStageTab;

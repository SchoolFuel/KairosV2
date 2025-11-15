import React from "react";
import { Trash2 } from "lucide-react";

const ReviewStageTab = ({ index, isActive, onClick, stage }) => {
  const hasDeletionRequest =
    stage?.deletion_requested && stage?.deletion_request_status === "pending";

  // Debug logging
  if (stage) {
    console.log(
      `ReviewStageTab - Stage ${index + 1}:`,
      `deletion_requested=${stage.deletion_requested}`,
      `deletion_request_status=${stage.deletion_request_status}`,
      `stage_id=${stage.stage_id}`
    );
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-colors relative ${
        isActive
          ? "text-purple-600 border-b-2 border-purple-600 bg-white"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      } ${hasDeletionRequest ? "bg-red-50 border-red-500" : ""}`}
    >
      Stage {index + 1}
      {hasDeletionRequest && (
        <Trash2
          size={12}
          className="inline-block ml-2 text-red-600"
          title="Deletion Requested"
        />
      )}
    </button>
  );
};

export default ReviewStageTab;

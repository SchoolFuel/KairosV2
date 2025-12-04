import React from "react";
import { Trash2 } from "lucide-react";

const DeletionRequestsModal = ({
  isOpen,
  onClose,
  deletionRequests,
}) => {
  if (!isOpen) return null;

  return (
    <div className="tpq-modal-overlay" style={{ zIndex: 2000 }}>
      <div
        className="tpq-modal"
        style={{ maxWidth: "600px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tpq-modal-header">
          <h2>Deletion Requests</h2>
          <button className="tpq-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div
          className="tpq-modal-content"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          {deletionRequests.length === 0 ? (
            <p>No deletion requests found.</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {deletionRequests.map((request, index) => (
                <div
                  key={request.request_id || index}
                  style={{
                    border: "1px solid #fecaca",
                    backgroundColor: "#fef2f2",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <Trash2
                      size={20}
                      style={{
                        color: "#dc2626",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#991b1b",
                          marginBottom: "4px",
                        }}
                      >
                        {request.entity_type === "project"
                          ? "Project"
                          : request.entity_type === "stage"
                          ? "Stage"
                          : "Task"}{" "}
                        Deletion Request
                      </div>
                      {request.entity_type === "project" && (
                        <div style={{ fontSize: "14px", color: "#b91c1c" }}>
                          <strong>Project:</strong>{" "}
                          {request.project_title || "Untitled Project"}
                        </div>
                      )}
                      {request.entity_type === "stage" && (
                        <div style={{ fontSize: "14px", color: "#b91c1c" }}>
                          <strong>Stage:</strong>{" "}
                          {request.stage_title || "Untitled Stage"}
                        </div>
                      )}
                      {request.entity_type === "task" && (
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#b91c1c",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <div>
                            <strong>Stage:</strong>{" "}
                            {request.stage_title || "Untitled Stage"}
                          </div>
                          <div>
                            <strong>Task:</strong>{" "}
                            {request.task_title || "Untitled Task"}
                          </div>
                        </div>
                      )}
                      {request.reason && (
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#dc2626",
                            marginTop: "8px",
                          }}
                        >
                          <strong>Reason:</strong> {request.reason}
                        </div>
                      )}
                      {request.requested_by && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#dc2626",
                            marginTop: "8px",
                          }}
                        >
                          Requested by: {request.requested_by}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="tpq-modal-actions">
          <button className="tpq-btn tpq-btn--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletionRequestsModal;


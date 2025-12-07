import React from "react";
import { User, BookOpen } from "lucide-react";
import Badge from "../../Shared/LearningStandards/Badge";
import { pillClass, getStatusIcon } from "./utils.jsx";

function ProjectCard({
  project,
  onReview,
  onApprove,
  onReject,
}) {
  const title = project.title || project.project_title || "Untitled";
  const subject = project.subject_domain || "—";
  let status = (project.status || "—").trim();
  
  // Display "Project change" if deletion request is present (check multiple possible flags)
  if (
    (project.deletion_requested && project.deletion_request_status === "pending") ||
    project.hasDeletionRequests ||
    (project.status && project.status.toLowerCase().includes("project change"))
  ) {
    status = "Project change";
  }
  // Display "New Project" instead of "Pending"
  else if (
    status.toLowerCase().includes("pending") &&
    !status.toLowerCase().includes("new project")
  ) {
    status = "New Project";
  }
  const owner = project.owner_name || project.owner_email || "";
  const description = project.description || "";
  const createdAt = project.created_at || project.createdAt || "";

  return (
    <div className="tpq-card">
      <div className="tpq-card-header">
        <div className="tpq-card-title-section">
          <h3 className="tpq-card-title" title={title}>
            {title}
          </h3>
          <div className="tpq-card-meta">
            <Badge variant="subject">
              <BookOpen size={12} />
              {subject}
            </Badge>
            {owner && (
              <>
                <span className="tpq-separator">•</span>
                <span className="tpq-owner">
                  <User size={12} />
                  {owner}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="tpq-status-section">
          {getStatusIcon(status)}
          <span className={`tpq-status-pill ${pillClass(status)}`}>
            {status}
          </span>
        </div>
      </div>

      {description && (
        <div className="tpq-description">
          {description.length > 150
            ? `${description.substring(0, 150)}...`
            : description}
        </div>
      )}

      {createdAt && (
        <div className="tpq-timestamp">
          Submitted: {new Date(createdAt).toLocaleDateString()}
        </div>
      )}

      <div className="tpq-actions">
        <button
          className="tpq-btn tpq-btn--review"
          onClick={(e) => {
            e.stopPropagation();
            onReview(project);
          }}
          disabled={!project.project_id}
          title={
            project.project_id ? "Open detailed review" : "Missing project ID"
          }
        >
          <BookOpen size={14} />
          Review
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;

import React from "react";
import { CheckCircle, XCircle, User, BookOpen, Trash2 } from "lucide-react";
import Badge from "../../Shared/LearningStandards/Badge";
import { pillClass, getStatusIcon } from "./utils.jsx";

function ProjectCard({ project, onReview, onApprove, onReject }) {
  const title = project.title || project.project_title || "Untitled";
  const subject = project.subject_domain || "—";
  const status = (project.status || "—").trim();
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
            {project.hasDeletionRequests && (
              <>
                <span className="tpq-separator">•</span>
                <Badge
                  variant="warning"
                  style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                >
                  <Trash2 size={12} />
                  Delete Requested ({project.deletionRequestCount || 1})
                </Badge>
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
        <button
          className="tpq-btn tpq-btn--approve"
          onClick={(e) => {
            e.stopPropagation();
            onApprove(project);
          }}
          disabled={!project.project_id}
          title="Approve this project"
        >
          <CheckCircle size={14} />
          Approve
        </button>
        <button
          className="tpq-btn tpq-btn--reject"
          onClick={(e) => {
            e.stopPropagation();
            onReject(project);
          }}
          disabled={!project.project_id}
          title="Request revision"
        >
          <XCircle size={14} />
          Request Revision
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;


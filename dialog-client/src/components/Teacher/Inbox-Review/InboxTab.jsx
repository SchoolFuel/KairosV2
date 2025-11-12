import React from "react";
import { BookOpen, Loader2 } from "lucide-react";
import ProjectCard from "./ProjectCard";
import SubjectFilter from "./SubjectFilter";

const InboxTab = ({
  projects,
  filteredProjects,
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  onReview,
  onApprove,
  onReject,
  onViewDeletionRequests,
  hasSubjectFilter,
  loading,
  onApplySubjectFilter,
  selectedSubject,
}) => {
  // Show subject filter if no subject has been selected yet
  if (!hasSubjectFilter) {
    return (
      <>
        <SubjectFilter onApplyFilter={onApplySubjectFilter} loading={loading} />
        {loading && (
          <div className="tpq-loading">
            <div className="spin">
              <Loader2 size={32} />
            </div>
            <p>Loading projects...</p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Show selected subject */}
      {selectedSubject && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "6px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <BookOpen size={16} />
          <span style={{ fontWeight: "500", color: "#1e40af" }}>
            Showing projects for: <strong>{selectedSubject}</strong>
          </span>
        </div>
      )}

      {/* Filters and Search */}
      <div className="tpq-controls">
        <div className="tpq-filters">
          <button
            className={`tpq-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({projects.length})
          </button>
        </div>

        <div className="tpq-search">
          <input
            type="text"
            placeholder="Search projects,students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tpq-search-input"
          />
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="tpq-loading">
          <div className="spin">
            <Loader2 size={32} />
          </div>
          <p>Loading projects...</p>
        </div>
      ) : (
        <div className="tpq-projects">
          {filteredProjects.length === 0 ? (
            <div className="tpq-empty">
              <BookOpen size={48} />
              <h3>No projects found</h3>
              <p>
                {searchTerm || filter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : projects.length === 0
                  ? `No projects found for ${selectedSubject}`
                  : `No projects match your filters. Showing ${
                      projects.length
                    } total project${projects.length !== 1 ? "s" : ""}.`}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.project_id}
                project={project}
                onReview={onReview}
                onApprove={onApprove}
                onReject={onReject}
                onViewDeletionRequests={onViewDeletionRequests}
              />
            ))
          )}
        </div>
      )}
    </>
  );
};

export default InboxTab;

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
  startDate,
  setStartDate,
  endDate,
  setEndDate,
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
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Status Filter Dropdown */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <label
              htmlFor="statusFilter"
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#4a5568",
                margin: 0,
              }}
            >
              Status:
            </label>
            <select
              id="statusFilter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
                fontSize: "14px",
                minWidth: "150px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="all">All ({projects.length})</option>
              <option value="pending">
                New Project (
                {
                  projects.filter(
                    (p) =>
                      p.status.toLowerCase().includes("pending") ||
                      p.status.toLowerCase().includes("new project")
                  ).length
                }
                )
              </option>
              <option value="revision">
                Revision (
                {
                  projects.filter((p) =>
                    p.status.toLowerCase().includes("revision")
                  ).length
                }
                )
              </option>
              <option value="approve">
                Approve (
                {
                  projects.filter(
                    (p) =>
                      p.status.toLowerCase().includes("approve") ||
                      p.status.toLowerCase().includes("approved")
                  ).length
                }
                )
              </option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{ fontSize: "14px", fontWeight: 500, color: "#4a5568" }}
            >
              Submission Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              style={{
                padding: "6px 12px",
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
                fontSize: "14px",
                minWidth: "140px",
              }}
            />
            <span style={{ color: "#718096" }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              style={{
                padding: "6px 12px",
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
                fontSize: "14px",
                minWidth: "140px",
              }}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#e2e8f0",
                  border: "1px solid #cbd5e0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  color: "#4a5568",
                }}
              >
                Clear
              </button>
            )}
          </div>
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

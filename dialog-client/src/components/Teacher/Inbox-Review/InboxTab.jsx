import React, { useMemo } from "react";
import { BookOpen, Loader2, User } from "lucide-react";
import ProjectCard from "./ProjectCard";

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
  studentNameFilter,
  setStudentNameFilter,
  subjectFilter,
  setSubjectFilter,
  onReview,
  onApprove,
  onReject,
  onViewDeletionRequests,
  loading,
}) => {
  // Get unique subjects from projects
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set();
    projects.forEach((project) => {
      if (project.subject_domain) {
        subjects.add(project.subject_domain);
      }
    });
    return Array.from(subjects).sort();
  }, [projects]);

  return (
    <>
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

          {/* Student Name Filter */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <label
              htmlFor="studentNameFilter"
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#4a5568",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <User size={14} />
              Student Name:
            </label>
            <input
              id="studentNameFilter"
              type="text"
              value={studentNameFilter}
              onChange={(e) => setStudentNameFilter(e.target.value)}
              placeholder="Filter by student name..."
              style={{
                padding: "6px 12px",
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
                fontSize: "14px",
                minWidth: "180px",
              }}
            />
            {studentNameFilter && (
              <button
                onClick={() => setStudentNameFilter("")}
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

          {/* Subject Filter */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <label
              htmlFor="subjectFilter"
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#4a5568",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <BookOpen size={14} />
              Subject:
            </label>
            <select
              id="subjectFilter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
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
              <option value="">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {subjectFilter && (
              <button
                onClick={() => setSubjectFilter("")}
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
                  projects.filter((p) => {
                    const hasDeletionRequests = 
                      p.hasDeletionRequests ||
                      (p.deletion_requested && p.deletion_request_status === "pending");
                    return (
                      (p.status.toLowerCase().includes("pending") ||
                        p.status.toLowerCase().includes("new project")) &&
                      !hasDeletionRequests
                    );
                  }).length
                }
                )
              </option>
              <option value="revision">
                Revision (
                {
                  projects.filter((p) => {
                    const hasDeletionRequests = 
                      p.hasDeletionRequests ||
                      (p.deletion_requested && p.deletion_request_status === "pending");
                    return (
                      p.status.toLowerCase().includes("revision") &&
                      !hasDeletionRequests
                    );
                  }).length
                }
                )
              </option>
              <option value="project-change">
                Project change (
                {
                  projects.filter((p) =>
                    p.hasDeletionRequests ||
                    (p.deletion_requested && p.deletion_request_status === "pending")
                  ).length
                }
                )
              </option>
              <option value="approve">
                Approve (
                {
                  projects.filter((p) => {
                    const hasDeletionRequests = 
                      p.hasDeletionRequests ||
                      (p.deletion_requested && p.deletion_request_status === "pending");
                    return (
                      (p.status.toLowerCase().includes("approve") ||
                        p.status.toLowerCase().includes("approved")) &&
                      !hasDeletionRequests
                    );
                  }).length
                }
                )
              </option>
            </select>
          </div>
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
                {searchTerm ||
                filter !== "all" ||
                startDate ||
                endDate ||
                studentNameFilter ||
                subjectFilter
                  ? "Try adjusting your search or filter criteria"
                  : projects.length === 0
                  ? "No projects found"
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

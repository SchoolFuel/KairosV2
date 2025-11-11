import React from "react";
import { BookOpen } from "lucide-react";
import ProjectCard from "./ProjectCard";

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
}) => {
  return (
    <>
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
            placeholder="Search projects, subjects, or students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tpq-search-input"
          />
        </div>
      </div>

      {/* Projects List */}
      <div className="tpq-projects">
        {filteredProjects.length === 0 ? (
          <div className="tpq-empty">
            <BookOpen size={48} />
            <h3>No projects found</h3>
            <p>
              {searchTerm || filter !== "all"
                ? "Try adjusting your search or filter criteria"
                : projects.length === 0
                ? "No projects have been submitted yet"
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
    </>
  );
};

export default InboxTab;

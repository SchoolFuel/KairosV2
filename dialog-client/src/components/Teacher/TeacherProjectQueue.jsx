import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Clock, User, BookOpen } from "lucide-react";
import Badge from "../Shared/LearningStandards/Badge";
import Checkbox from "../Shared/LearningStandards/Checkbox";
import "./TeacherProjectQueue.css";

const parseMaybeJSON = (v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

const safePreview = (v, n = 240) => {
  try {
    return JSON.stringify(parseMaybeJSON(v)).slice(0, n);
  } catch {
    return String(v).slice(0, n);
  }
};

const deepClone = (obj) =>
  typeof structuredClone === "function"
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));

/* ---------- status pill helper ---------- */
function pillClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("approve")) return "is-approve";
  if (s.includes("reject") || s.includes("revision")) return "is-reject";
  if (s.includes("pending")) return "is-pending";
  return "is-neutral";
}

function getStatusIcon(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("approve")) return <CheckCircle className="status-icon approved" />;
  if (s.includes("reject") || s.includes("revision")) return <XCircle className="status-icon rejected" />;
  if (s.includes("pending")) return <Clock className="status-icon pending" />;
  return <Clock className="status-icon neutral" />;
}

/* ---------- Project Card Component using shared components ---------- */
function ProjectCard({ project, onReview, onApprove, onReject, isSelected, onToggle }) {
  const title = project.title || project.project_title || "Untitled";
  const subject = project.subject_domain || "—";
  const status = (project.status || "—").trim();
  const owner = project.owner_name || project.owner_email || "";
  const description = project.description || "";
  const createdAt = project.created_at || project.createdAt || "";

  const handleCardClick = () => {
    if (onToggle) {
      onToggle(project.project_id);
    }
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle(project.project_id);
    }
  };

  return (
    <div 
      className={`tpq-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
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
            : description
          }
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
          title={project.project_id ? "Open detailed review" : "Missing project ID"}
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

      {/* Checkbox for bulk selection */}
      {onToggle && (
        <div className="tpq-checkbox" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            id={`project-${project.project_id}`}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function TeacherProjectQueue() {
  // State management
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState(new Set()); // For bulk selection
  const [bulkMode, setBulkMode] = useState(false);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Mock data for now - replace with actual gsRun call
      const mockProjects = [
        {
          project_id: "1",
          title: "Solar System Model",
          project_title: "Solar System Model",
          subject_domain: "Science",
          status: "Pending Approval",
          owner_name: "John Doe",
          owner_email: "john@example.com",
          description: "A detailed model of our solar system with accurate planetary positions and sizes.",
          created_at: "2024-01-15T10:30:00Z"
        },
        {
          project_id: "2",
          title: "Ancient Rome Timeline",
          project_title: "Ancient Rome Timeline",
          subject_domain: "History",
          status: "Approved",
          owner_name: "Jane Smith",
          owner_email: "jane@example.com",
          description: "Interactive timeline showing key events in Ancient Roman history.",
          created_at: "2024-01-14T14:20:00Z"
        },
        {
          project_id: "3",
          title: "Math Word Problems",
          project_title: "Math Word Problems",
          subject_domain: "Mathematics",
          status: "Pending Revision",
          owner_name: "Mike Johnson",
          owner_email: "mike@example.com",
          description: "Collection of word problems covering algebra and geometry concepts.",
          created_at: "2024-01-13T09:15:00Z"
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProjects(mockProjects);
    } catch (err) {
      setError(err?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on status and search term
  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === "all" || 
      project.status.toLowerCase().includes(filter.toLowerCase());
    
    const matchesSearch = !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.subject_domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Action handlers
  const handleReview = (project) => {
    setSelectedProject(project);
    setShowDetails(true);
  };

  const handleApprove = async (project) => {
    try {
      // Update project status locally
      setProjects(prev => prev.map(p => 
        p.project_id === project.project_id 
          ? { ...p, status: "Approved" }
          : p
      ));
      
      // Here you would call the actual API
      console.log("Approving project:", project.project_id);
    } catch (err) {
      console.error("Error approving project:", err);
    }
  };

  const handleReject = async (project) => {
    try {
      // Update project status locally
      setProjects(prev => prev.map(p => 
        p.project_id === project.project_id 
          ? { ...p, status: "Pending Revision" }
          : p
      ));
      
      // Here you would call the actual API
      console.log("Requesting revision for project:", project.project_id);
    } catch (err) {
      console.error("Error requesting revision:", err);
    }
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedProject(null);
  };

  // Bulk selection handlers
  const handleToggleProject = (projectId) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allProjectIds = filteredProjects.map(p => p.project_id);
    setSelectedProjects(new Set(allProjectIds));
  };

  const handleClearSelection = () => {
    setSelectedProjects(new Set());
  };

  const handleBulkApprove = () => {
    const projectsToApprove = filteredProjects.filter(p => selectedProjects.has(p.project_id));
    projectsToApprove.forEach(project => handleApprove(project));
    setSelectedProjects(new Set());
  };

  const handleBulkReject = () => {
    const projectsToReject = filteredProjects.filter(p => selectedProjects.has(p.project_id));
    projectsToReject.forEach(project => handleReject(project));
    setSelectedProjects(new Set());
  };

  // Loading state
  if (loading) {
    return (
      <div className="tpq-container">
        <div className="tpq-loading">
          <Loader2 className="spin" size={24} />
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="tpq-container">
        <div className="tpq-error">
          <XCircle size={24} />
          <p>{error}</p>
          <button onClick={loadProjects} className="tpq-btn tpq-btn--primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tpq-container">
      {/* Header */}
      <div className="tpq-header">
        <h1>Teacher Project Queue</h1>
        <p>Review and manage student project submissions</p>
      </div>

      {/* Filters and Search */}
      <div className="tpq-controls">
        <div className="tpq-filters">
          <button 
            className={`tpq-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({projects.length})
          </button>
          <button 
            className={`tpq-filter-btn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending ({projects.filter(p => p.status.toLowerCase().includes("pending")).length})
          </button>
          <button 
            className={`tpq-filter-btn ${filter === "approved" ? "active" : ""}`}
            onClick={() => setFilter("approved")}
          >
            Approved ({projects.filter(p => p.status.toLowerCase().includes("approve")).length})
          </button>
          <button 
            className={`tpq-filter-btn ${filter === "rejected" ? "active" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            Revision ({projects.filter(p => p.status.toLowerCase().includes("revision")).length})
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

      {/* Bulk Actions */}
      <div className="tpq-bulk-controls">
        <div className="tpq-bulk-toggle">
          <button 
            className={`tpq-btn tpq-btn--secondary ${bulkMode ? 'active' : ''}`}
            onClick={() => {
              setBulkMode(!bulkMode);
              if (bulkMode) setSelectedProjects(new Set());
            }}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Actions'}
          </button>
        </div>

        {bulkMode && (
          <div className="tpq-bulk-actions">
            <span className="tpq-selection-count">
              {selectedProjects.size} selected
            </span>
            <button 
              className="tpq-btn tpq-btn--secondary"
              onClick={handleSelectAll}
              disabled={filteredProjects.length === 0}
            >
              Select All ({filteredProjects.length})
            </button>
            <button 
              className="tpq-btn tpq-btn--secondary"
              onClick={handleClearSelection}
              disabled={selectedProjects.size === 0}
            >
              Clear Selection
            </button>
            <button 
              className="tpq-btn tpq-btn--approve"
              onClick={handleBulkApprove}
              disabled={selectedProjects.size === 0}
            >
              <CheckCircle size={14} />
              Bulk Approve
            </button>
            <button 
              className="tpq-btn tpq-btn--reject"
              onClick={handleBulkReject}
              disabled={selectedProjects.size === 0}
            >
              <XCircle size={14} />
              Bulk Reject
            </button>
          </div>
        )}
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
                : "No projects have been submitted yet"
              }
            </p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <ProjectCard
              key={project.project_id}
              project={project}
              onReview={handleReview}
              onApprove={handleApprove}
              onReject={handleReject}
              isSelected={selectedProjects.has(project.project_id)}
              onToggle={bulkMode ? handleToggleProject : undefined}
            />
          ))
        )}
      </div>

      {/* Project Details Modal */}
      {showDetails && selectedProject && (
        <div className="tpq-modal-overlay" onClick={handleCloseDetails}>
          <div className="tpq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tpq-modal-header">
              <h2>{selectedProject.title}</h2>
              <button 
                className="tpq-modal-close"
                onClick={handleCloseDetails}
              >
                ×
              </button>
            </div>
            
            <div className="tpq-modal-content">
              <div className="tpq-modal-section">
                <h4>Project Details</h4>
                <p><strong>Subject:</strong> {selectedProject.subject_domain}</p>
                <p><strong>Student:</strong> {selectedProject.owner_name}</p>
                <p><strong>Status:</strong> 
                  <span className={`tpq-status-pill ${pillClass(selectedProject.status)}`}>
                    {selectedProject.status}
                  </span>
                </p>
                <p><strong>Submitted:</strong> {new Date(selectedProject.created_at).toLocaleString()}</p>
              </div>
              
              <div className="tpq-modal-section">
                <h4>Description</h4>
                <p>{selectedProject.description}</p>
              </div>
            </div>
            
            <div className="tpq-modal-actions">
              <button 
                className="tpq-btn tpq-btn--approve"
                onClick={() => {
                  handleApprove(selectedProject);
                  handleCloseDetails();
                }}
              >
                <CheckCircle size={14} />
                Approve
              </button>
              <button 
                className="tpq-btn tpq-btn--reject"
                onClick={() => {
                  handleReject(selectedProject);
                  handleCloseDetails();
                }}
              >
                <XCircle size={14} />
                Request Revision
              </button>
              <button 
                className="tpq-btn tpq-btn--secondary"
                onClick={handleCloseDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

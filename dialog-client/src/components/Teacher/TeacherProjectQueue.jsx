import React, { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
} from "lucide-react";
import Badge from "../Shared/LearningStandards/Badge";
import Checkbox from "../Shared/LearningStandards/Checkbox";
import ReviewStageTab from "./ReviewStageTab";
import ReviewTaskCard from "./ReviewTaskCard";
import ReviewAssessmentGate from "./ReviewAssessmentGate";
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
  if (s.includes("approve"))
    return <CheckCircle className="status-icon approved" />;
  if (s.includes("reject") || s.includes("revision"))
    return <XCircle className="status-icon rejected" />;
  if (s.includes("pending")) return <Clock className="status-icon pending" />;
  return <Clock className="status-icon neutral" />;
}

/* ---------- Project Card Component using shared components ---------- */
function ProjectCard({
  project,
  onReview,
  onApprove,
  onReject,
  isSelected,
  onToggle,
}) {
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
      className={`tpq-card ${isSelected ? "selected" : ""}`}
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
  const [filter, setFilter] = useState("all"); // all, pending
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState(new Set()); // For bulk selection
  const [bulkMode, setBulkMode] = useState(false);

  // Detailed project review state
  const [projectDetails, setProjectDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageStatuses, setStageStatuses] = useState({}); // Track individual stage approval/rejection
  const [overallComment, setOverallComment] = useState("");

  // Advanced features state
  const [activeTab, setActiveTab] = useState("inbox"); // inbox, rubrics, calendar, analytics
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [rubrics, setRubrics] = useState([]);
  const [rubricVals, setRubricVals] = useState({
    align: 0,
    evidence: 0,
    clarity: 0,
    complete: 0,
  });
  const [partialMarks, setPartialMarks] = useState({
    align: "",
    evidence: "",
    clarity: "",
    complete: "",
  });
  const [analytics, setAnalytics] = useState({
    totalProjects: 0,
    approvedProjects: 0,
    pendingProjects: 0,
    rejectedProjects: 0,
    averageReviewTime: 0,
    completionRate: 0,
    medianReviewTime: "2.4h",
    declineRate: "18%",
    throughput: 126,
  });

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Calculate analytics when projects change
  useEffect(() => {
    if (projects.length > 0) {
      const total = projects.length;
      const approved = projects.filter((p) =>
        p.status.toLowerCase().includes("approve")
      ).length;
      const pending = projects.filter((p) =>
        p.status.toLowerCase().includes("pending")
      ).length;
      const rejected = projects.filter(
        (p) =>
          p.status.toLowerCase().includes("reject") ||
          p.status.toLowerCase().includes("revision")
      ).length;

      setAnalytics((prev) => ({
        ...prev,
        totalProjects: total,
        approvedProjects: approved,
        pendingProjects: pending,
        rejectedProjects: rejected,
        completionRate: Math.round((approved / total) * 100),
      }));
    }
  }, [projects]);

  // Load mock rubrics
  useEffect(() => {
    const mockRubrics = [
      {
        id: 1,
        name: "Research Quality",
        criteria: [
          { name: "Sources", weight: 30, score: 0 },
          { name: "Accuracy", weight: 40, score: 0 },
          { name: "Depth", weight: 30, score: 0 },
        ],
      },
      {
        id: 2,
        name: "Presentation",
        criteria: [
          { name: "Clarity", weight: 50, score: 0 },
          { name: "Organization", weight: 50, score: 0 },
        ],
      },
    ];
    setRubrics(mockRubrics);
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      // Call Google Apps Script function to fetch all teacher projects
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler((response) => {
            try {
              // Handle the response structure: { statusCode, body: { action_response: { projects: [...] } } }
              let projects = [];

              if (response && response.body) {
                const body = response.body;
                // Check if projects are in action_response
                if (body.action_response && body.action_response.projects) {
                  projects = body.action_response.projects;
                } else if (Array.isArray(body.projects)) {
                  projects = body.projects;
                } else if (body.projects && Array.isArray(body.projects)) {
                  projects = body.projects;
                }
              } else if (
                response &&
                response.action_response &&
                response.action_response.projects
              ) {
                projects = response.action_response.projects;
              } else if (Array.isArray(response)) {
                projects = response;
              }

              // Map API response to component expected format
              const mappedProjects = projects.map((project) => ({
                project_id: project.project_id || project.id,
                user_id: project.user_id,
                title: project.title || project.project_title || "",
                project_title: project.title || project.project_title || "",
                subject_domain: project.subject_domain || "",
                status: project.status || "Pending",
                owner_name: project.Student_Name || project.owner_name || "",
                owner_email: project.owner_email || "",
                description: project.description || "",
                created_at: project.created_at || new Date().toISOString(),
                stages: project.stages || [], // Keep stages if available, otherwise empty array
              }));

              setProjects(mappedProjects);
              resolve(mappedProjects);
            } catch (parseError) {
              console.error("Error parsing projects response:", parseError);
              setError("Error parsing project data: " + parseError.message);
              reject(parseError);
            } finally {
              setLoading(false);
            }
          })
          .withFailureHandler((error) => {
            console.error("Error loading projects:", error);
            setError(error?.message || "Failed to load projects");
            setLoading(false);
            reject(error);
          })
          .getTeacherProjectsAll();
      });
    } catch (err) {
      setError(err?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on status and search term
  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      filter === "all" ||
      project.status.toLowerCase().includes(filter.toLowerCase());

    const matchesSearch =
      !searchTerm ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.subject_domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.owner_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Action handlers
  const handleReview = (project) => {
    setSelectedProject(project);
    setShowDetails(true);
    setCurrentStageIndex(0);
    setStageStatuses({}); // Reset stage statuses for new project
    setRubricVals({ align: 0, evidence: 0, clarity: 0, complete: 0 }); // Reset rubric
    setPartialMarks({ align: "", evidence: "", clarity: "", complete: "" }); // Reset partial marks
    setOverallComment(""); // Reset comments

    // Fetch detailed project data (including stages) when reviewing
    setDetailsLoading(true);
    setDetailsError("");

    google.script.run
      .withSuccessHandler((response) => {
        try {
          let projectDetails = project; // Start with basic project data
          let fetchedProject = null;

          // Handle nested response structure: response.body.action_response.json.project
          if (response?.body?.action_response?.json?.project) {
            fetchedProject = response.body.action_response.json.project;
          } else if (response?.body?.project) {
            fetchedProject = response.body.project;
          } else if (response?.project) {
            fetchedProject = response.project;
          } else if (response?.body?.action_response?.project) {
            fetchedProject = response.body.action_response.project;
          }

          if (fetchedProject) {
            // Merge detailed project data with basic data
            projectDetails = {
              ...project,
              ...fetchedProject,
              // Ensure required fields are present
              project_id: fetchedProject.project_id || project.project_id,
              title:
                fetchedProject.title ||
                fetchedProject.project_title ||
                project.title,
              project_title:
                fetchedProject.project_title ||
                fetchedProject.title ||
                project.project_title,
              description:
                fetchedProject.description || project.description || "",
              stages: fetchedProject.stages || project.stages || [],
            };
          }

          setProjectDetails(projectDetails);
          setDetailsLoading(false);
        } catch (parseError) {
          console.error("Error parsing project details:", parseError);
          setDetailsError("Error loading project details");
          setDetailsLoading(false);
          // Fallback to basic project data if detailed fetch fails
          setProjectDetails(project);
        }
      })
      .withFailureHandler((error) => {
        console.error("Error fetching project details:", error);
        setDetailsError("Failed to load project details");
        setDetailsLoading(false);
        // Fallback to basic project data
        setProjectDetails(project);
      })
      .getTeacherProjectDetails(project.project_id, project.user_id);
  };

  const handleApprove = async (project) => {
    try {
      // Update project status locally
      setProjects((prev) =>
        prev.map((p) =>
          p.project_id === project.project_id ? { ...p, status: "Approved" } : p
        )
      );

      // Here you would call the actual API
      console.log("Approving project:", project.project_id);
    } catch (err) {
      console.error("Error approving project:", err);
    }
  };

  const handleReject = async (project) => {
    try {
      // Update project status locally
      setProjects((prev) =>
        prev.map((p) =>
          p.project_id === project.project_id
            ? { ...p, status: "Pending Revision" }
            : p
        )
      );

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
    setSelectedProjects((prev) => {
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
    const allProjectIds = filteredProjects.map((p) => p.project_id);
    setSelectedProjects(new Set(allProjectIds));
  };

  const handleClearSelection = () => {
    setSelectedProjects(new Set());
  };

  const handleBulkApprove = () => {
    const projectsToApprove = filteredProjects.filter((p) =>
      selectedProjects.has(p.project_id)
    );
    projectsToApprove.forEach((project) => handleApprove(project));
    setSelectedProjects(new Set());
  };

  const handleBulkReject = () => {
    const projectsToReject = filteredProjects.filter((p) =>
      selectedProjects.has(p.project_id)
    );
    projectsToReject.forEach((project) => handleReject(project));
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

  // Tab configuration
  const tabs = [
    { key: "inbox", label: "Inbox", sub: "Under Review" },
    { key: "rubrics", label: "Gate Standards" },
    { key: "calendar", label: "Calendar", sub: "Scheduling" },
    { key: "analytics", label: "Analytics", sub: "SLA & trends" },
  ];

  return (
    <div className="tpq-container">
      {/* Header */}
      <div className="tpq-header">
        <h1>Teacher Project Queue</h1>
        <p>Review and manage student project submissions</p>
      </div>

      {/* Section Switcher */}
      <div className="tpq-section-switch">
        <label htmlFor="sectionSelect">Section</label>
        <select
          id="sectionSelect"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="tpq-section-select"
        >
          {tabs.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label} — {t.sub}
            </option>
          ))}
        </select>
      </div>

      {/* INBOX TAB */}
      {activeTab === "inbox" && (
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
              <button
                className={`tpq-filter-btn ${
                  filter === "pending" ? "active" : ""
                }`}
                onClick={() => setFilter("pending")}
              >
                Pending (
                {
                  projects.filter((p) =>
                    p.status.toLowerCase().includes("pending")
                  ).length
                }
                )
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
                className={`tpq-btn tpq-btn--secondary ${
                  bulkMode ? "active" : ""
                }`}
                onClick={() => {
                  setBulkMode(!bulkMode);
                  if (bulkMode) setSelectedProjects(new Set());
                }}
              >
                {bulkMode ? "Exit Bulk Mode" : "Bulk Actions"}
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
                    : "No projects have been submitted yet"}
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => (
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
        </>
      )}

      {/* RUBRICS & GATES TAB */}
      {activeTab === "rubrics" && (
        <div className="tpq-panel">{/* Content removed */}</div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === "calendar" && (
        <div className="tpq-panel">
          <div className="tpq-panel-head">
            <h3>Scheduling Assistant</h3>
            <span className="tpq-chip">Proposes slots</span>
          </div>

          <div className="tpq-stack">
            <div className="tpq-card">
              <div className="tpq-inline">
                <div>
                  <div style={{ fontWeight: 700 }}>Proposed Times</div>
                  <div className="tpq-muted">
                    Synced from Google Calendar (placeholder)
                  </div>
                </div>
                <button className="tpq-btn">Refresh</button>
              </div>
              <div className="tpq-stack" style={{ marginTop: 8 }}>
                <label className="tpq-inline">
                  <input type="radio" name="slot" /> Wed 10/08 10:30–10:50
                </label>
                <label className="tpq-inline">
                  <input type="radio" name="slot" /> Wed 10/08 11:10–11:30
                </label>
                <label className="tpq-inline">
                  <input type="radio" name="slot" /> Thu 10/09 09:00–09:20
                </label>
              </div>
              <div
                className="tpq-inline"
                style={{ justifyContent: "flex-end", marginTop: 8 }}
              >
                <button className="tpq-btn tpq-btn--primary">
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="tpq-panel">
          <div className="tpq-panel-head">
            <h3>Review Analytics</h3>
            <span className="tpq-chip">Last 14 days</span>
          </div>

          <div className="tpq-stack">
            <div className="tpq-card">
              <div className="tpq-inline">
                <div>
                  <div className="tpq-muted">Median Review Time</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {analytics.medianReviewTime}
                  </div>
                </div>
                <div>
                  <div className="tpq-muted">Decline Rate</div>
                  <div
                    style={{ fontSize: 22, fontWeight: 800, color: "#e53e3e" }}
                  >
                    {analytics.declineRate}
                  </div>
                </div>
                <div>
                  <div className="tpq-muted">Throughput</div>
                  <div
                    style={{ fontSize: 22, fontWeight: 800, color: "#38a169" }}
                  >
                    {analytics.throughput}
                  </div>
                </div>
              </div>
            </div>
            <div className="tpq-card">
              <div style={{ fontWeight: 700 }}>Top Decline Reasons</div>
              <ul className="tpq-muted">
                <li>Missing citations</li>
                <li>Insufficient evidence</li>
                <li>Wrong rubric attached</li>
              </ul>
            </div>
            <div className="tpq-card">
              <div style={{ fontWeight: 700 }}>Project Statistics</div>
              <div className="tpq-stats-grid">
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value">
                    {analytics.totalProjects}
                  </div>
                  <div className="tpq-stat-label">Total Projects</div>
                </div>
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value" style={{ color: "#38a169" }}>
                    {analytics.approvedProjects}
                  </div>
                  <div className="tpq-stat-label">Approved</div>
                </div>
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value" style={{ color: "#d69e2e" }}>
                    {analytics.pendingProjects}
                  </div>
                  <div className="tpq-stat-label">Pending</div>
                </div>
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value" style={{ color: "#e53e3e" }}>
                    {analytics.rejectedProjects}
                  </div>
                  <div className="tpq-stat-label">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Project Details Modal */}
      {showDetails && selectedProject && (
        <div
          className="tpq-modal-overlay"
          onClick={(e) => {
            // Only close if clicking the overlay background, not modal content
            if (e.target === e.currentTarget) {
              handleCloseDetails();
            }
          }}
        >
          <div
            className="tpq-modal tpq-modal--large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tpq-modal-header">
              <h2>{selectedProject.title}</h2>
              <button className="tpq-modal-close" onClick={handleCloseDetails}>
                ×
              </button>
            </div>

            <div className="tpq-modal-content">
              {/* Project Description */}
              {projectDetails?.description && (
                <div className="tpq-modal-section">
                  <h4>Description</h4>
                  <p>{projectDetails.description}</p>
                </div>
              )}

              {/* Stages Section - Replicated from CreateProject */}
              <div className="tpq-modal-section">
                <h4>Project Stages</h4>
                {projectDetails &&
                projectDetails.stages &&
                projectDetails.stages.length > 0 ? (
                  <>
                    {/* Stage Tabs Navigation */}
                    <div className="border-b border-gray-200 bg-gray-50">
                      <div className="flex gap-1">
                        {projectDetails.stages
                          .slice()
                          .sort(
                            (a, b) =>
                              (a?.stage_order || 0) - (b?.stage_order || 0)
                          )
                          .map((stage, index) => (
                            <ReviewStageTab
                              key={stage.stage_id}
                              index={index}
                              isActive={currentStageIndex === index}
                              onClick={() => setCurrentStageIndex(index)}
                              stage={stage}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Stage Content */}
                    <div className="mt-4 max-h-[50vh] overflow-y-auto">
                      {(() => {
                        const sortedStages = projectDetails.stages
                          .slice()
                          .sort(
                            (a, b) =>
                              (a?.stage_order || 0) - (b?.stage_order || 0)
                          );
                        const currentStage = sortedStages[currentStageIndex];

                        if (!currentStage) return null;

                        return (
                          <div className="space-y-6">
                            {/* Stage Title */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-2">
                                STAGE TITLE
                              </label>
                              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white font-semibold text-lg text-gray-900">
                                {currentStage.title || "Untitled Stage"}
                              </div>
                            </div>

                            {/* Tasks */}
                            {currentStage.tasks &&
                              currentStage.tasks.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                                    Tasks
                                  </h3>
                                  <div className="space-y-4">
                                    {currentStage.tasks.map(
                                      (task, taskIndex) => (
                                        <ReviewTaskCard
                                          key={taskIndex}
                                          task={task}
                                          taskIndex={taskIndex}
                                        />
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Assessment Gate */}
                            {currentStage.gate && (
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">
                                  Assessment Gate
                                </h3>
                                <ReviewAssessmentGate
                                  gate={currentStage.gate}
                                />
                              </div>
                            )}

                            {/* Stage Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => {
                                  const stageId = currentStage.stage_id;
                                  setStageStatuses((prev) => ({
                                    ...prev,
                                    [stageId]: "approved",
                                  }));
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                  stageStatuses[currentStage.stage_id] ===
                                  "approved"
                                    ? "bg-green-600 text-white"
                                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                                }`}
                              >
                                <CheckCircle size={16} />
                                Approve Stage
                              </button>
                              <button
                                onClick={() => {
                                  const stageId = currentStage.stage_id;
                                  setStageStatuses((prev) => ({
                                    ...prev,
                                    [stageId]: "revision",
                                  }));
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                  stageStatuses[currentStage.stage_id] ===
                                  "revision"
                                    ? "bg-yellow-600 text-white"
                                    : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200"
                                }`}
                              >
                                <XCircle size={16} />
                                Request Revision
                              </button>
                              {stageStatuses[currentStage.stage_id] && (
                                <span className="ml-auto px-3 py-2 text-sm font-medium text-gray-600">
                                  Status:{" "}
                                  <span
                                    className={`font-semibold ${
                                      stageStatuses[currentStage.stage_id] ===
                                      "approved"
                                        ? "text-green-600"
                                        : "text-yellow-600"
                                    }`}
                                  >
                                    {stageStatuses[currentStage.stage_id] ===
                                    "approved"
                                      ? "Approved"
                                      : "Revision Requested"}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <div
                    className="tpq-empty-state"
                    style={{
                      padding: "32px",
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    <BookOpen
                      size={48}
                      style={{ marginBottom: "16px", opacity: 0.5 }}
                    />
                    <p>No stages available for this project.</p>
                    <p style={{ fontSize: "14px", marginTop: "8px" }}>
                      Stages will appear here once the project structure is
                      defined.
                    </p>
                  </div>
                )}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseDetails();
                }}
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

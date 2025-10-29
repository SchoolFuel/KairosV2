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
  
  // Detailed project review state
  const [projectDetails, setProjectDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [overallComment, setOverallComment] = useState("");
  
  // Advanced features state
  const [activeTab, setActiveTab] = useState('inbox'); // inbox, rubrics, calendar, comments, analytics
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectComments, setProjectComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rubrics, setRubrics] = useState([]);
  const [rubricVals, setRubricVals] = useState({ align: 0, evidence: 0, clarity: 0, complete: 0 });
  const [compose, setCompose] = useState("");
  const [analytics, setAnalytics] = useState({
    totalProjects: 0,
    approvedProjects: 0,
    pendingProjects: 0,
    rejectedProjects: 0,
    averageReviewTime: 0,
    completionRate: 0,
    medianReviewTime: "2.4h",
    declineRate: "18%",
    throughput: 126
  });

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Calculate analytics when projects change
  useEffect(() => {
    if (projects.length > 0) {
      const total = projects.length;
      const approved = projects.filter(p => p.status.toLowerCase().includes('approve')).length;
      const pending = projects.filter(p => p.status.toLowerCase().includes('pending')).length;
      const rejected = projects.filter(p => p.status.toLowerCase().includes('reject') || p.status.toLowerCase().includes('revision')).length;
      
      setAnalytics(prev => ({
        ...prev,
        totalProjects: total,
        approvedProjects: approved,
        pendingProjects: pending,
        rejectedProjects: rejected,
        completionRate: Math.round((approved / total) * 100)
      }));
    }
  }, [projects]);

  // Load mock comments for selected project
  useEffect(() => {
    if (selectedProject) {
      const mockComments = [
        {
          id: 1,
          author: "Teacher",
          comment: "Great work on the research phase!",
          timestamp: "2024-01-15T10:30:00Z",
          type: "feedback"
        },
        {
          id: 2,
          author: "Student",
          comment: "Thank you! I'll work on the design phase next.",
          timestamp: "2024-01-15T11:00:00Z",
          type: "response"
        }
      ];
      setProjectComments(mockComments);
    }
  }, [selectedProject]);

  // Load mock rubrics
  useEffect(() => {
    const mockRubrics = [
      {
        id: 1,
        name: "Research Quality",
        criteria: [
          { name: "Sources", weight: 30, score: 0 },
          { name: "Accuracy", weight: 40, score: 0 },
          { name: "Depth", weight: 30, score: 0 }
        ]
      },
      {
        id: 2,
        name: "Presentation",
        criteria: [
          { name: "Clarity", weight: 50, score: 0 },
          { name: "Organization", weight: 50, score: 0 }
        ]
      }
    ];
    setRubrics(mockRubrics);
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Mock data with more detailed project information
      const mockProjects = [
        {
          project_id: "1",
          user_id: "user1",
          title: "Solar System Model",
          project_title: "Solar System Model",
          subject_domain: "Science",
          status: "Pending Approval",
          owner_name: "John Doe",
          owner_email: "john@example.com",
          description: "A detailed model of our solar system with accurate planetary positions and sizes.",
          created_at: "2024-01-15T10:30:00Z",
          stages: [
            {
              stage_id: "1",
              stage_order: 1,
              title: "Research Phase",
              status: "Completed",
              gate: {
                gate_id: "gate1",
                title: "Research Gate",
                checklist: ["Research completed", "Sources verified", "Notes organized"]
              }
            },
            {
              stage_id: "2", 
              stage_order: 2,
              title: "Design Phase",
              status: "In Progress",
              gate: {
                gate_id: "gate2",
                title: "Design Gate", 
                checklist: ["Design sketches", "Materials list", "Timeline created"]
              }
            }
          ]
        },
        {
          project_id: "2",
          user_id: "user2",
          title: "Ancient Rome Timeline",
          project_title: "Ancient Rome Timeline",
          subject_domain: "History",
          status: "Approved",
          owner_name: "Jane Smith",
          owner_email: "jane@example.com",
          description: "Interactive timeline showing key events in Ancient Roman history.",
          created_at: "2024-01-14T14:20:00Z",
          stages: [
            {
              stage_id: "3",
              stage_order: 1,
              title: "Historical Research",
              status: "Completed",
              gate: {
                gate_id: "gate3",
                title: "Research Gate",
                checklist: ["Primary sources found", "Timeline structure planned"]
              }
            }
          ]
        },
        {
          project_id: "3",
          user_id: "user3",
          title: "Math Word Problems",
          project_title: "Math Word Problems",
          subject_domain: "Mathematics",
          status: "Pending Revision",
          owner_name: "Mike Johnson",
          owner_email: "mike@example.com",
          description: "Collection of word problems covering algebra and geometry concepts.",
          created_at: "2024-01-13T09:15:00Z",
          stages: [
            {
              stage_id: "4",
              stage_order: 1,
              title: "Problem Creation",
              status: "Completed",
              gate: {
                gate_id: "gate4",
                title: "Problem Gate",
                checklist: ["Problems written", "Solutions provided", "Difficulty levels set"]
              }
            }
          ]
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
    
    // Use the project data directly from the mock data (which includes stages)
    setProjectDetails(project);
    setDetailsLoading(false);
    setDetailsError("");
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

  // Tab configuration
  const tabs = [
    { key: "inbox", label: "Inbox", sub: "Under Review" },
    { key: "rubrics", label: "Rubrics & Gates", sub: "Step-by-step" },
    { key: "calendar", label: "Calendar", sub: "Scheduling" },
    { key: "comments", label: "Comments", sub: "Canned + notes" },
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
        </>
      )}

      {/* RUBRICS & GATES TAB */}
      {activeTab === "rubrics" && (
        <div className="tpq-panel">
          <div className="tpq-panel-head">
            <h3>Rubrics & Gate Steps</h3>
            <span className="tpq-chip">Step: <strong>Prep</strong></span>
          </div>
          
          <div className="tpq-stack">
            <div className="tpq-card">
              <div className="tpq-inline">
                <div>
                  <div style={{ fontWeight: 700 }}>Selected Item</div>
                  <div className="tpq-muted">
                    {selectedProjects.size ? 
                      `${projects.find(p => selectedProjects.has(p.project_id))?.title} — ${projects.find(p => selectedProjects.has(p.project_id))?.owner_name}` : 
                      "None"
                    }
                  </div>
                </div>
                <button 
                  className="tpq-btn"
                  onClick={() => {
                    if (!selectedProjects.size) return;
                    const first = projects.find(p => selectedProjects.has(p.project_id));
                    handleReview(first);
                  }}
                >
                  Open Rubric
                </button>
              </div>
            </div>

            <div className="tpq-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Gate Stepper</div>
              <div className="tpq-inline" style={{ flexWrap: "wrap", gap: 8 }}>
                {['Prep','Schedule','Notify','Complete','Review/Evaluate','Final Report','Feedback/Reflection'].map((s) => (
                  <span key={s} className="tpq-chip">{s}</span>
                ))}
              </div>
            </div>

            <div className="tpq-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Required Fields</div>
              <div className="tpq-stack">
                <div className="tpq-field">
                  <label>Reviewer</label>
                  <input type="text" placeholder="teacher@example.org" defaultValue="teacher@example.org" />
                </div>
                <div className="tpq-field">
                  <label>Due Date</label>
                  <input type="text" placeholder="YYYY-MM-DD" />
                </div>
                <div className="tpq-field">
                  <label>Notes</label>
                  <textarea rows={3} placeholder="Internal notes" />
                </div>
                <div className="tpq-inline" style={{ justifyContent: "flex-end" }}>
                  <button className="tpq-btn tpq-btn--primary">Save Step</button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                  <div className="tpq-muted">Synced from Google Calendar (placeholder)</div>
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
              <div className="tpq-inline" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                <button className="tpq-btn tpq-btn--primary">Send Invite</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTS TAB */}
      {activeTab === "comments" && (
        <div className="tpq-panel">
          <div className="tpq-panel-head">
            <h3>Canned Comments</h3>
            <span className="tpq-chip">Merge fields</span>
          </div>
          
          <div className="tpq-stack">
            <div className="tpq-card">
              <div style={{ fontWeight: 700 }}>Templates</div>
              <div className="tpq-stack" style={{ marginTop: 6 }}>
                <button className="tpq-btn" onClick={() => setCompose("Great work – proceed to the next step. ✅")}>
                  Great
                </button>
                <button className="tpq-btn" onClick={() => setCompose("Please revise: clarify sources and attach citations.")}>
                  Revise
                </button>
                <button className="tpq-btn" onClick={() => setCompose("Please propose 2 time slots for your gate review.")}>
                  Schedule
                </button>
              </div>
            </div>
            <div className="tpq-card">
              <div style={{ fontWeight: 700 }}>Compose</div>
              <div className="tpq-stack" style={{ marginTop: 6 }}>
                <textarea 
                  rows={4} 
                  placeholder="Type feedback…" 
                  value={compose} 
                  onChange={(e) => setCompose(e.target.value)} 
                />
                <div className="tpq-inline" style={{ justifyContent: "flex-end", gap: 8 }}>
                  <button className="tpq-btn">Preview</button>
                  <button className="tpq-btn tpq-btn--primary">Send to Student</button>
                </div>
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
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{analytics.medianReviewTime}</div>
                </div>
                <div>
                  <div className="tpq-muted">Decline Rate</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#e53e3e" }}>{analytics.declineRate}</div>
                </div>
                <div>
                  <div className="tpq-muted">Throughput</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#38a169" }}>{analytics.throughput}</div>
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
                  <div className="tpq-stat-value">{analytics.totalProjects}</div>
                  <div className="tpq-stat-label">Total Projects</div>
                </div>
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value" style={{ color: "#38a169" }}>{analytics.approvedProjects}</div>
                  <div className="tpq-stat-label">Approved</div>
                </div>
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value" style={{ color: "#d69e2e" }}>{analytics.pendingProjects}</div>
                  <div className="tpq-stat-label">Pending</div>
                </div>
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value" style={{ color: "#e53e3e" }}>{analytics.rejectedProjects}</div>
                  <div className="tpq-stat-label">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Project Details Modal */}
      {showDetails && selectedProject && (
        <div className="tpq-modal-overlay" onClick={handleCloseDetails}>
          <div className="tpq-modal tpq-modal--large" onClick={(e) => e.stopPropagation()}>
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
              {/* Project Overview */}
              <div className="tpq-modal-section">
                <h4>Project Overview</h4>
                <div className="tpq-overview-grid">
                  <div className="tpq-overview-item">
                    <strong>Subject:</strong> {selectedProject.subject_domain}
                  </div>
                  <div className="tpq-overview-item">
                    <strong>Student:</strong> {selectedProject.owner_name}
                  </div>
                  <div className="tpq-overview-item">
                    <strong>Status:</strong> 
                    <span className={`tpq-status-pill ${pillClass(selectedProject.status)}`}>
                      {selectedProject.status}
                    </span>
                  </div>
                  <div className="tpq-overview-item">
                    <strong>Submitted:</strong> {new Date(selectedProject.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Project Description */}
              <div className="tpq-modal-section">
                <h4>Description</h4>
                <p>{selectedProject.description}</p>
              </div>

              {/* Stages Section */}
              {projectDetails && projectDetails.stages && projectDetails.stages.length > 0 && (
                <div className="tpq-modal-section">
                  <h4>Project Stages</h4>
                  <div className="tpq-stages-container">
                    {projectDetails.stages
                      .slice()
                      .sort((a, b) => (a?.stage_order || 0) - (b?.stage_order || 0))
                      .map((stage) => (
                        <div 
                          key={stage.stage_id}
                          className={`tpq-stage-card ${selectedStageId === stage.stage_id ? 'active' : ''}`}
                          onClick={() => setSelectedStageId(stage.stage_id)}
                        >
                          <div className="tpq-stage-header">
                            <h5>Stage {stage.stage_order}: {stage.title}</h5>
                            <span className={`tpq-status-pill ${pillClass(stage.status)}`}>
                              {stage.status}
                            </span>
                          </div>
                          
                          {stage.gate && (
                            <div className="tpq-gate-info">
                              <div className="tpq-gate-title">
                                <strong>Gate:</strong> {stage.gate.title}
                              </div>
                              {stage.gate.checklist && stage.gate.checklist.length > 0 && (
                                <div className="tpq-checklist">
                                  <strong>Checklist:</strong>
                                  <ul>
                                    {stage.gate.checklist.map((item, index) => (
                                      <li key={index}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Rubric Section */}
              <div className="tpq-modal-section">
                <h4>Rubric Assessment</h4>
                <div className="tpq-rubric">
                  <div className="tpq-rubric-item">
                    <div>Alignment to Standard</div>
                    <input 
                      type="range" 
                      min="0" 
                      max="4" 
                      value={rubricVals.align}
                      onChange={(e) => setRubricVals(prev => ({ ...prev, align: parseInt(e.target.value) }))}
                      className="tpq-rubric-meter"
                    />
                    <span className="tpq-rubric-score">{rubricVals.align}/4</span>
                  </div>
                  <div className="tpq-rubric-item">
                    <div>Evidence & Sources</div>
                    <input 
                      type="range" 
                      min="0" 
                      max="4" 
                      value={rubricVals.evidence}
                      onChange={(e) => setRubricVals(prev => ({ ...prev, evidence: parseInt(e.target.value) }))}
                      className="tpq-rubric-meter"
                    />
                    <span className="tpq-rubric-score">{rubricVals.evidence}/4</span>
                  </div>
                  <div className="tpq-rubric-item">
                    <div>Clarity & Organization</div>
                    <input 
                      type="range" 
                      min="0" 
                      max="4" 
                      value={rubricVals.clarity}
                      onChange={(e) => setRubricVals(prev => ({ ...prev, clarity: parseInt(e.target.value) }))}
                      className="tpq-rubric-meter"
                    />
                    <span className="tpq-rubric-score">{rubricVals.clarity}/4</span>
                  </div>
                  <div className="tpq-rubric-item">
                    <div>Completeness</div>
                    <input 
                      type="range" 
                      min="0" 
                      max="4" 
                      value={rubricVals.complete}
                      onChange={(e) => setRubricVals(prev => ({ ...prev, complete: parseInt(e.target.value) }))}
                      className="tpq-rubric-meter"
                    />
                    <span className="tpq-rubric-score">{rubricVals.complete}/4</span>
                  </div>
                </div>
              </div>

              {/* Overall Comments */}
              <div className="tpq-modal-section">
                <h4>Review Comments</h4>
                <textarea
                  className="tpq-comment-textarea"
                  rows={3}
                  value={overallComment}
                  onChange={(e) => setOverallComment(e.target.value)}
                  placeholder="Add your review comments here..."
                />
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

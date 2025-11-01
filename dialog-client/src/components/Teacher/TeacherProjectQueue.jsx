import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Clock, User, BookOpen } from "lucide-react";
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
  const [filter, setFilter] = useState("all"); // all, pending
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState(new Set()); // For bulk selection
  const [bulkMode, setBulkMode] = useState(false);
  const [isGateMode, setIsGateMode] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [aiText, setAiText] = useState("");
  const [imageViewer, setImageViewer] = useState({ open: false, src: "", alt: "" });

  function openImage(src, alt = "Artifact") {
    setImageViewer({ open: true, src, alt });
  }
  function closeImage() {
    setImageViewer({ open: false, src: "", alt: "" });
  }
  
  // Detailed project review state
  const [projectDetails, setProjectDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageStatuses, setStageStatuses] = useState({}); // Track individual stage approval/rejection
  const [overallComment, setOverallComment] = useState("");
  
  // Advanced features state
  const [activeTab, setActiveTab] = useState('inbox'); // inbox, rubrics, calendar, analytics
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rubrics, setRubrics] = useState([]);
  const [rubricVals, setRubricVals] = useState({ align: 0, evidence: 0, clarity: 0, complete: 0 });
  const [partialMarks, setPartialMarks] = useState({ align: '', evidence: '', clarity: '', complete: '' });
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

  // Detect dialog type from hash once (teacher-gate-assessment vs teacher-project-queue)
  useEffect(() => {
    const hash = (window.location && window.location.hash || "").replace('#','');
    const gate = hash === 'teacher-gate-assessment';
    setIsGateMode(gate);
    if (gate) setActiveTab('gate');
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
              tasks: [
                {
                  title: "Research planetary data",
                  description: "Gather accurate information about each planet including size, distance from sun, and orbital period.",
                  academic_standard: "HS.E1U1.13 — Analyze environmental data",
                  resource_id: {
                    label: "NASA Solar System Data",
                    url: "https://nasa.gov"
                  }
                },
                {
                  title: "Create reference materials",
                  description: "Compile notes and create a reference guide for the project.",
                  academic_standard: "HS.E1U1.13 — Analyze environmental data"
                }
              ],
              gate: {
                gate_id: "gate1",
                title: "Research Gate",
                description: "Complete research phase before moving to design",
                checklist: ["Research completed", "Sources verified", "Notes organized"]
              }
            },
            {
              stage_id: "2", 
              stage_order: 2,
              title: "Design Phase",
              status: "In Progress",
              tasks: [
                {
                  title: "Sketch model layout",
                  description: "Design the physical structure and layout of the solar system model.",
                  academic_standard: "HS.E2U1.15 — Evaluate solutions"
                },
                {
                  title: "Select materials",
                  description: "Choose appropriate materials for representing each planet accurately.",
                  academic_standard: "HS.E2U1.15 — Evaluate solutions"
                }
              ],
              gate: {
                gate_id: "gate2",
                title: "Design Gate", 
                description: "Complete design phase before construction",
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
              tasks: [
                {
                  title: "Research key events",
                  description: "Identify and document major events in Ancient Roman history.",
                  academic_standard: "HS.H1U1.8 — Analyze historical events"
                },
                {
                  title: "Organize timeline structure",
                  description: "Plan the chronological organization of events.",
                  academic_standard: "HS.H1U1.8 — Analyze historical events"
                }
              ],
              gate: {
                gate_id: "gate3",
                title: "Research Gate",
                description: "Complete historical research before creating timeline",
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
              tasks: [
                {
                  title: "Write algebra problems",
                  description: "Create 5 word problems covering linear equations and inequalities.",
                  academic_standard: "HS.M1U1.12 — Solve algebraic equations"
                },
                {
                  title: "Write geometry problems",
                  description: "Create 5 word problems covering area, perimeter, and volume.",
                  academic_standard: "HS.M2U1.15 — Apply geometric formulas"
                },
                {
                  title: "Create answer key",
                  description: "Provide detailed solutions for all problems.",
                  academic_standard: "HS.M1U1.12 — Solve algebraic equations"
                }
              ],
              gate: {
                gate_id: "gate4",
                title: "Problem Gate",
                description: "Complete problem set before submission",
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
    setCurrentStageIndex(0);
    setStageStatuses({}); // Reset stage statuses for new project
    setRubricVals({ align: 0, evidence: 0, clarity: 0, complete: 0 }); // Reset rubric
    setPartialMarks({ align: '', evidence: '', clarity: '', complete: '' }); // Reset partial marks
    setOverallComment(""); // Reset comments
    
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
    ...(isGateMode ? [{ key: "gate", label: "Gate Planner", sub: "Assessment" }] : []),
    { key: "inbox", label: "Inbox", sub: "Under Review" },
    { key: "rubrics", label: "Rubrics & Gates", sub: "Step-by-step" },
    { key: "calendar", label: "Calendar", sub: "Scheduling" },
    { key: "analytics", label: "Analytics", sub: "SLA & trends" },
  ];

  return (
    <div className="tpq-container">
      {/* Header */}
      <div className="tpq-header">
        <h1>{isGateMode ? 'Gate Assessment' : 'Teacher Project Queue'}</h1>
        <p>{isGateMode ? 'Plan, send, and record gate assessments' : 'Review and manage student project submissions'}</p>
      </div>
      {/* GATE PLANNER TAB (shown only in gate mode) */}
      {isGateMode && activeTab === "gate" && (
        <div className="tpq-panel">
          <div className="tpq-panel-head">
            <h3>Assessment Planner</h3>
            <span className="tpq-chip">Step-by-step</span>
          </div>

          <div className="tpq-grid-2" style={{ alignItems: 'stretch' }}>
            {/* Left stepper */}
            <div className="tpq-card" style={{ minWidth: 220, maxWidth: 260 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Steps</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  'Upcoming Assessment Notice',
                  'Review Details & Mastery',
                  'Assessment Type & Materials',
                  'Delivery Details',
                  'Summary & Approval',
                  'Send to Student & RDS',
                  'Completion & Evaluation',
                  'Finalize & Feedback',
                ].map((t, i) => (
                  <button
                    key={t}
                    className={`tpq-btn ${i === stepIdx ? 'tpq-btn--primary' : ''}`}
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => setStepIdx(i)}
                  >
                    <span style={{ display: 'inline-block', width: 18 }}>{i + 1}</span> {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Main content per step */}
            <div className="tpq-stack" style={{ flex: 1 }}>
              {/* Step title/sub */}
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{`${stepIdx + 1}) `}{[
                  'Upcoming Assessment Notice',
                  'Review Details & Mastery',
                  'Assessment Type & Materials',
                  'Delivery Details',
                  'Summary & Approval',
                  'Send to Student & RDS',
                  'Completion & Evaluation',
                  'Finalize & Feedback',
                ][stepIdx]}</div>
                <div className="tpq-muted" style={{ marginBottom: 8 }}>{[
                  'Teacher sees alert and key facts.',
                  'Standards, % mastery, due date.',
                  'Select type, attach files, or request AI help.',
                  'Time, duration, online/in-person, requirements.',
                  'Review + confirm or edit.',
                  'Submit plan to backend and notify.',
                  'Teacher receives artifacts for grading.',
                  'Assign grade, update standards, notify student.',
                ][stepIdx]}</div>
              </div>

              {/* Step body */}
              {stepIdx === 0 && (
                <div className="tpq-card">
                  <div className="tpq-inline" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Student: <span className="tpq-chip">Billy Johnson</span></div>
                      <div className="tpq-muted">Unit: Water Conservation · Due: 2025-11-05</div>
                    </div>
                    <span className="tpq-status-pill is-pending">Upcoming</span>
                  </div>
                </div>
              )}

              {stepIdx === 1 && (
                <div className="tpq-grid-2">
                  <div className="tpq-card">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Academic Standards</div>
                    <ul className="tpq-muted" style={{ marginLeft: 16 }}>
                      <li>HS.E1U1.13 — Analyze environmental data (mastery 20%)</li>
                      <li>HS.E2U1.15 — Evaluate solutions for water issues (mastery 10%)</li>
                    </ul>
                  </div>
                  <div className="tpq-card">
                    <div className="tpq-field">
                      <label>Due Date</label>
                      <input type="datetime-local" defaultValue="2025-11-05T10:00" />
                    </div>
                    <div className="tpq-field">
                      <label>Notes</label>
                      <textarea rows={3} placeholder="Any special considerations" />
                    </div>
                  </div>
                </div>
              )}

              {stepIdx === 2 && (
                <div className="tpq-grid-2">
                  <div className="tpq-card">
                    <div className="tpq-field">
                      <label>Assessment Type</label>
                      <select>
                        <option>Performance Task</option>
                        <option>Oral Defense</option>
                        <option>Project Artifact Review</option>
                        <option>Written Exam</option>
                      </select>
                    </div>
                    <div className="tpq-field">
                      <label>Context / Objectives</label>
                      <textarea rows={4} placeholder="Describe the assessment goal and constraints" />
                    </div>
                    <div className="tpq-inline" style={{ gap: 8 }}>
                      <button className="tpq-btn">Attach Files</button>
                      <button className="tpq-btn" onClick={() => setAiText('AI draft prepared: 3-step performance task, rubric (4 criteria), and sample answer key.')}>Ask AI to Draft Materials</button>
                    </div>
                  </div>
                  <div className="tpq-card">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>AI Suggestions</div>
                    <div className="tpq-muted">{aiText || 'No draft requested yet.'}</div>
                  </div>
                </div>
              )}

              {stepIdx === 3 && (
                <div className="tpq-grid-2">
                  <div className="tpq-card">
                    <div className="tpq-field">
                      <label>Delivery Mode</label>
                      <select>
                        <option>In-person</option>
                        <option>Online (proctored)</option>
                        <option>Online (asynchronous)</option>
                      </select>
                    </div>
                    <div className="tpq-field">
                      <label>Start</label>
                      <input type="datetime-local" />
                    </div>
                    <div className="tpq-field">
                      <label>Duration (minutes)</label>
                      <input type="text" placeholder="e.g., 45" />
                    </div>
                  </div>
                  <div className="tpq-card">
                    <div className="tpq-field">
                      <label>Requirements</label>
                      <textarea rows={3} placeholder="Devices, materials, accommodations, proctoring, group/individual, etc." />
                    </div>
                    <div className="tpq-field">
                      <label>Special Conditions</label>
                      <textarea rows={3} placeholder="Make‑up policy, late submissions, etc." />
                    </div>
                  </div>
                </div>
              )}

              {stepIdx === 4 && (
                <div className="tpq-card">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Plan Summary</div>
                  <ul className="tpq-muted" style={{ marginLeft: 18 }}>
                    <li><b>Type:</b> Performance Task</li>
                    <li><b>Standards:</b> HS.E1U1.13, HS.E2U1.15</li>
                    <li><b>When:</b> Nov 5, 10:00–10:45</li>
                    <li><b>Mode:</b> In‑person</li>
                    <li><b>Materials:</b> Prompt + rubric (attached)</li>
                  </ul>
                </div>
              )}

              {stepIdx === 5 && (
                <div className="tpq-card">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Sending to Student…</div>
                  <div className="tpq-muted">Plan will be persisted to RDS, and the student notified via in‑app + email.</div>
                  <div style={{ marginTop: 8 }}>Status: <span className="tpq-status-pill is-pending">Queued</span></div>
                </div>
              )}

              {stepIdx === 6 && (
                <div className="tpq-card">
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Assessment Completed</div>
                  <div className="tpq-muted">Artifacts available: report.pdf, presentation.pptx, observation-notes.md</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
                    {/* Sample image thumbnails; replace src with real artifact thumbnails when available */}
                    <img src="https://via.placeholder.com/200x120.png?text=Artifact+1" alt="Artifact 1" style={{ width: '100%', borderRadius: 8, cursor: 'pointer', border: '1px solid #e5e7eb' }} onClick={() => openImage('https://via.placeholder.com/1200x800.png?text=Artifact+1','Artifact 1')} />
                    <img src="https://via.placeholder.com/200x120.png?text=Artifact+2" alt="Artifact 2" style={{ width: '100%', borderRadius: 8, cursor: 'pointer', border: '1px solid #e5e7eb' }} onClick={() => openImage('https://via.placeholder.com/1200x800.png?text=Artifact+2','Artifact 2')} />
                    <img src="https://via.placeholder.com/200x120.png?text=Artifact+3" alt="Artifact 3" style={{ width: '100%', borderRadius: 8, cursor: 'pointer', border: '1px solid #e5e7eb' }} onClick={() => openImage('https://via.placeholder.com/1200x800.png?text=Artifact+3','Artifact 3')} />
                  </div>
                  <div className="tpq-inline" style={{ marginTop: 10, gap: 8 }}>
                    <button className="tpq-btn">Open Rubric</button>
                  </div>
                </div>
              )}

              {stepIdx === 7 && (
                <div className="tpq-grid-2">
                  <div className="tpq-card">
                    <div className="tpq-field">
                      <label>Final Grade</label>
                      <select>
                        <option>A</option><option>B</option><option>C</option><option>D</option><option>Incomplete</option>
                      </select>
                    </div>
                    <div className="tpq-field">
                      <label>Evidence → Standards Mapping</label>
                      <textarea rows={4} placeholder="Describe how evidence meets each standard" />
                    </div>
                  </div>
                  <div className="tpq-card">
                    <div className="tpq-field">
                      <label>Feedback to Student</label>
                      <textarea rows={4} placeholder="Strengths, next steps, and mastery guidance" />
                    </div>
                    <div className="tpq-inline" style={{ gap: 8 }}>
                      <button className="tpq-btn tpq-btn--approve">Publish Feedback</button>
                      <button className="tpq-btn tpq-btn--reject">Request Revision</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="tpq-inline" style={{ justifyContent: 'space-between' }}>
                <div className="tpq-inline" style={{ gap: 8 }}>
                  <button className="tpq-btn" onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}>Back</button>
                  <button className="tpq-btn">Save Draft</button>
                </div>
                <div className="tpq-inline" style={{ gap: 8 }}>
                  {stepIdx < 4 && (
                    <button className="tpq-btn tpq-btn--primary" onClick={() => setStepIdx(Math.min(7, stepIdx + 1))}>Next</button>
                  )}
                  {stepIdx === 4 && (
                    <button className="tpq-btn tpq-btn--approve" onClick={() => setStepIdx(5)}>Approve & Send</button>
                  )}
                </div>
              </div>

              {/* Workflow table toggle */}
              <div
                className="tpq-muted"
                style={{ cursor: 'pointer', fontSize: 12, marginTop: 8 }}
                onClick={() => setShowWorkflow(v => !v)}
              >
                {showWorkflow ? '▼ Hide step-by-step workflow table' : '▶ Show step-by-step workflow table'}
              </div>

              {showWorkflow && (
                <div className="tpq-card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>#</th>
                          <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>Step</th>
                          <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>Owner</th>
                          <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>Key Fields/UI</th>
                          <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>Backend Action</th>
                          <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>Outputs/Events</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>1</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Notification of upcoming gate</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>System → Teacher</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Banner + card (Student, Unit, Standards, Due date)</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Fetch gate data from RDS via API (/gate/upcoming)</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Teacher alerted and dialog launched</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>2</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Review details & mastery</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Teacher</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Read-only card showing academic standards, % mastery, and due date</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>None (view-only)</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Teacher reviews and proceeds</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>3</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Define Assessment Type & Materials</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Teacher</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Dropdown for type, textarea for context, file upload, “Ask AI” button</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Optional API call to /ai/generate for materials and rubrics</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Draft assessment plan saved</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>4</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Specify Delivery Details</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Teacher</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Date/time picker, mode, duration, requirements textarea</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Validate calendar conflicts, save to draft table</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Draft updated</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>5</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Review & Approve Assessment Plan</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Teacher</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Auto-generated summary view with editable fields</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>POST /gate/plan/finalize</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Plan locked and ready to send</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>6</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Send to Student & Update Backend</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>System</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Progress status display</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Write finalized plan to RDS; trigger notification service</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Student receives assignment notification</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>7</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Assessment Completion Notice</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>System → Teacher</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Notification card with artifact links and rubric</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Pull assessment artifacts (S3) and attach rubric reference</td>
                          <td style={{ padding: 10, borderBottom: '1px solid #e5e7eb' }}>Teacher opens evaluation screen</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 10 }}>8</td>
                          <td style={{ padding: 10 }}>Grade & Feedback Submission</td>
                          <td style={{ padding: 10 }}>Teacher</td>
                          <td style={{ padding: 10 }}>Grade dropdown, evidence-to-standards textarea, feedback field</td>
                          <td style={{ padding: 10 }}>POST /gate/grade → update RDS + standards mastery</td>
                          <td style={{ padding: 10 }}>Student notified with final feedback and mastery update</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image dialog (lightbox) */}
      {imageViewer.open && (
        <div
          className="tpq-modal-overlay"
          onClick={closeImage}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
          }}
        >
          <div
            className="tpq-modal tpq-modal--image"
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', padding: 8, borderRadius: 12, maxWidth: '90vw', maxHeight: '90vh', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
          >
            <div className="tpq-inline" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
              <div style={{ fontWeight: 700 }}>{imageViewer.alt}</div>
              <button className="tpq-btn" onClick={closeImage} aria-label="Close image">×</button>
            </div>
            <div style={{ overflow: 'auto' }}>
              <img src={imageViewer.src} alt={imageViewer.alt} style={{ display: 'block', maxWidth: '88vw', maxHeight: '80vh', borderRadius: 8 }} />
            </div>
          </div>
        </div>
      )}

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
        <div className="tpq-modal-overlay" onClick={(e) => {
          // Only close if clicking the overlay background, not modal content
          if (e.target === e.currentTarget) {
            handleCloseDetails();
          }
        }}>
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

              {/* Stages Section - Replicated from CreateProject */}
              <div className="tpq-modal-section">
                <h4>Project Stages</h4>
                {projectDetails && projectDetails.stages && projectDetails.stages.length > 0 ? (
                  <>
                  
                  {/* Stage Tabs Navigation */}
                  <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex gap-1">
                      {projectDetails.stages
                        .slice()
                        .sort((a, b) => (a?.stage_order || 0) - (b?.stage_order || 0))
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
                        .sort((a, b) => (a?.stage_order || 0) - (b?.stage_order || 0));
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
                              {currentStage.title || 'Untitled Stage'}
                            </div>
                          </div>

                          {/* Tasks */}
                          {currentStage.tasks && currentStage.tasks.length > 0 && (
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-4">Tasks</h3>
                              <div className="space-y-4">
                                {currentStage.tasks.map((task, taskIndex) => (
                                  <ReviewTaskCard
                                    key={taskIndex}
                                    task={task}
                                    taskIndex={taskIndex}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Assessment Gate */}
                          {currentStage.gate && (
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-4">Assessment Gate</h3>
                              <ReviewAssessmentGate gate={currentStage.gate} />
                            </div>
                          )}

                          {/* Stage Actions */}
                          <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => {
                                const stageId = currentStage.stage_id;
                                setStageStatuses(prev => ({ ...prev, [stageId]: 'approved' }));
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                stageStatuses[currentStage.stage_id] === 'approved'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                              }`}
                            >
                              <CheckCircle size={16} />
                              Approve Stage
                            </button>
                            <button
                              onClick={() => {
                                const stageId = currentStage.stage_id;
                                setStageStatuses(prev => ({ ...prev, [stageId]: 'revision' }));
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                stageStatuses[currentStage.stage_id] === 'revision'
                                  ? 'bg-yellow-600 text-white'
                                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                              }`}
                            >
                              <XCircle size={16} />
                              Request Revision
                            </button>
                            {stageStatuses[currentStage.stage_id] && (
                              <span className="ml-auto px-3 py-2 text-sm font-medium text-gray-600">
                                Status: <span className={`font-semibold ${
                                  stageStatuses[currentStage.stage_id] === 'approved' ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {stageStatuses[currentStage.stage_id] === 'approved' ? 'Approved' : 'Revision Requested'}
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
                  <div className="tpq-empty-state" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                    <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>No stages available for this project.</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>Stages will appear here once the project structure is defined.</p>
                  </div>
                )}
              </div>

              {/* Rubric Section */}
              <div className="tpq-modal-section">
                <h4>Rubric Assessment</h4>
                <div className="tpq-rubric">
                  <div className="tpq-rubric-item">
                    <div className="tpq-rubric-label">Alignment to Standard</div>
                    <div className="tpq-rubric-buttons">
                      {[0, 1, 2, 3, 4].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => {
                            setRubricVals(prev => ({ ...prev, align: score }));
                            setPartialMarks(prev => ({ ...prev, align: '' }));
                          }}
                          className={`tpq-rubric-btn ${Math.floor(rubricVals.align) === score ? 'active' : ''}`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      step="0.1"
                      value={partialMarks.align}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPartialMarks(prev => ({ ...prev, align: val }));
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 4) {
                          setRubricVals(prev => ({ ...prev, align: numVal }));
                        }
                      }}
                      placeholder="0.0"
                      className="tpq-rubric-input"
                    />
                    <span className="tpq-rubric-score">{typeof rubricVals.align === 'number' ? rubricVals.align.toFixed(1) : rubricVals.align}/4</span>
                  </div>
                  <div className="tpq-rubric-item">
                    <div className="tpq-rubric-label">Evidence & Sources</div>
                    <div className="tpq-rubric-buttons">
                      {[0, 1, 2, 3, 4].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => {
                            setRubricVals(prev => ({ ...prev, evidence: score }));
                            setPartialMarks(prev => ({ ...prev, evidence: '' }));
                          }}
                          className={`tpq-rubric-btn ${Math.floor(rubricVals.evidence) === score ? 'active' : ''}`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      step="0.1"
                      value={partialMarks.evidence}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPartialMarks(prev => ({ ...prev, evidence: val }));
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 4) {
                          setRubricVals(prev => ({ ...prev, evidence: numVal }));
                        }
                      }}
                      placeholder="0.0"
                      className="tpq-rubric-input"
                    />
                    <span className="tpq-rubric-score">{typeof rubricVals.evidence === 'number' ? rubricVals.evidence.toFixed(1) : rubricVals.evidence}/4</span>
                  </div>
                  <div className="tpq-rubric-item">
                    <div className="tpq-rubric-label">Clarity & Organization</div>
                    <div className="tpq-rubric-buttons">
                      {[0, 1, 2, 3, 4].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => {
                            setRubricVals(prev => ({ ...prev, clarity: score }));
                            setPartialMarks(prev => ({ ...prev, clarity: '' }));
                          }}
                          className={`tpq-rubric-btn ${Math.floor(rubricVals.clarity) === score ? 'active' : ''}`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      step="0.1"
                      value={partialMarks.clarity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPartialMarks(prev => ({ ...prev, clarity: val }));
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 4) {
                          setRubricVals(prev => ({ ...prev, clarity: numVal }));
                        }
                      }}
                      placeholder="0.0"
                      className="tpq-rubric-input"
                    />
                    <span className="tpq-rubric-score">{typeof rubricVals.clarity === 'number' ? rubricVals.clarity.toFixed(1) : rubricVals.clarity}/4</span>
                  </div>
                  <div className="tpq-rubric-item">
                    <div className="tpq-rubric-label">Completeness</div>
                    <div className="tpq-rubric-buttons">
                      {[0, 1, 2, 3, 4].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => {
                            setRubricVals(prev => ({ ...prev, complete: score }));
                            setPartialMarks(prev => ({ ...prev, complete: '' }));
                          }}
                          className={`tpq-rubric-btn ${Math.floor(rubricVals.complete) === score ? 'active' : ''}`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      step="0.1"
                      value={partialMarks.complete}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPartialMarks(prev => ({ ...prev, complete: val }));
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal) && numVal >= 0 && numVal <= 4) {
                          setRubricVals(prev => ({ ...prev, complete: numVal }));
                        }
                      }}
                      placeholder="0.0"
                      className="tpq-rubric-input"
                    />
                    <span className="tpq-rubric-score">{typeof rubricVals.complete === 'number' ? rubricVals.complete.toFixed(1) : rubricVals.complete}/4</span>
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

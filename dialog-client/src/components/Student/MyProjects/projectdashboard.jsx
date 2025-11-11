import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderOpen,
  Upload,
  X,
  CheckCircle2,
  Calendar,
  BookOpen,
  ExternalLink,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';

export default function ProjectDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Project object from backend (same shape as sidebar ProjectDetail)
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  // Local UI state for quick add and resources
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDue, setQuickTaskDue] = useState('');

  // Delete confirmation modal
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Stage deletion dialog
  const [showStageDeleteDialog, setShowStageDeleteDialog] = useState(false);
  const [deleteStageReason, setDeleteStageReason] = useState('');
  const [selectedStageId, setSelectedStageId] = useState(null);

  

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');


  // Gate UI state
  const DEFAULT_GATE_STEPS = ['Prep','Schedule','Notify','Complete','Review/Evaluate','Final Report','Feedback/Reflection'];
  const [activeGateStepIdx, setActiveGateStepIdx] = useState(0);
  const [gateObjective, setGateObjective] = useState('');
  const [gateEvidence, setGateEvidence] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const addActivity = (action, details) => {
    mutateProject((p) => {
      p.activity = p.activity || [];
      p.activity.unshift({
        id: `ACT-${Math.floor(Math.random()*9000+1000)}`,
        action,
        details: details || '',
        at: new Date().toISOString()
      });
    });
  };

  // Stats derived from project
  const { taskStats, gateStats } = useMemo(() => {
    if (!project) return { taskStats: { completed: 0, total: 0 }, gateStats: { completed: 0, total: 0 } };

    const stages = project.stages || [];
    const allTasks = stages.flatMap(s => s.tasks || []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => (t.done === true) || (t.status && String(t.status).toLowerCase() === 'completed')).length;

    const allGates = stages.map(s => s.gate).filter(Boolean);
    const totalGates = allGates.length;
    const completedGates = allGates.filter(g => g.status && String(g.status).toLowerCase() === 'completed').length;

    return {
      taskStats: { completed: completedTasks, total: totalTasks },
      gateStats: { completed: completedGates, total: totalGates }
    };
  }, [project]);

  // Resolve projectId from Dialog window (set in Code.js)
  const projectId = (typeof window !== 'undefined' && window.PROJECT_ID) ? window.PROJECT_ID : null;

  // Fetch from Apps Script
  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);

    google.script.run
      .withSuccessHandler(async (result) => {
        try {
          const p = result?.action_response?.json?.project;
          if (!p) throw new Error("Invalid response format");

          // ✅ Fetch delete requests
          const deleteRequests = await fetchDeleteRequests();

          // ✅ Merge stages and tasks with deleteRequests
          const mergedStages = (p.stages || []).map((stage) => {
            // Find any delete request linked to this stage
            const stageDeleteReq = deleteRequests.find(
              (r) =>
                r.entity_type === "stage" &&
                r.status === "pending" &&
                r.stage_id === stage.stage_id
            );

            // Find project-level pending delete (covers all stages)
            const projectDeleteReq = deleteRequests.find(
              (r) =>
                r.entity_type === "project" &&
                r.status === "pending" &&
                r.project_id === p.project_id
            );

            // ✅ Stage-level pending deletion overrides everything
            if (stageDeleteReq || projectDeleteReq) {
              stage.status = "Pending Deletion";
            }

            // ✅ Then check for task-level pending deletions
            stage.tasks = (stage.tasks || []).map((t) => {
              const pendingTaskReq = deleteRequests.find(
                (r) =>
                  r.task_id === t.task_id &&
                  r.status === "pending" &&
                  r.entity_type === "task"
              );
              if (pendingTaskReq) {
                t.status = "Pending Deletion";
              }
              return t;
            });

            return stage;
          });


          p.stages = mergedStages;

          // 🔹 1. Check if any task in the project is under revision
          let projectHasRevision = false;
          (p.stages || []).forEach(stage => {
            if ((stage.tasks || []).some(t => t.status === "Revision")) {
              projectHasRevision = true;
            }
          });

          // 🔹 2. Apply intelligent project status logic
          if (p.status === "Pending Deletion") {
            // Keep "Pending Deletion" untouched (highest priority)
            p.status = "Pending Deletion";
          } else if (p.status === "Pending") {
            // Keep backend "Pending" if it's still under review
            p.status = "Pending";
          } else if (projectHasRevision && (p.status === "Approved" || p.status === "Completed")) {
            // Show "Revision" only if the project was already approved
            p.status = "Revision";
          } // else, leave the backend-provided status as is

          setProject(p);
        } catch (e) {
          console.error("Error merging project with delete requests:", e);
          setError(e.message);
        } finally {
          setIsLoading(false);
        }
      })
      .withFailureHandler((err) => {
        console.error("Error fetching project details:", err);
        setError(err?.message || "Failed to load project details");
        setIsLoading(false);
      })
      .getProjectDetails(projectId);

  }, [projectId]);

  const stages = project?.stages || [];
  useEffect(() => {
    if (activeStageIdx >= stages.length) setActiveStageIdx(0);
  }, [stages.length]);

  const canSubmit = (taskStats.completed >= 1) && ((project?.resources?.length || 0) >= 1);

  // Normalized steps for current stage gate
  const currentGateSteps = (() => {
    const s = stages[activeStageIdx];
    const steps = s?.gate?.steps && Array.isArray(s.gate.steps) && s.gate.steps.length > 0
      ? s.gate.steps
      : DEFAULT_GATE_STEPS;
    return steps;
  })();

  // Load current step fields when stage/step changes
  useEffect(() => {
    const s = stages[activeStageIdx];
    const stepKey = currentGateSteps[activeGateStepIdx];
    const data = s?.gate?.step_data?.[stepKey] || {};
    setGateObjective(data.objective || '');
    setGateEvidence(data.evidence || '');
  }, [activeStageIdx, activeGateStepIdx, stages.length]);

  // Helpers
  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Completed: "bg-green-100 text-green-800",
      Revision: "bg-gray-100 text-gray-800", 
      PendingDeletion: "bg-yellow-100 text-yellow-800",
      default: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.default;
  };


  // Helpers to safely update project state
  const mutateProject = (updater) => {
    setProject(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      updater(copy);
      return copy;
    });
  };

  // Task actions
  const handleAddTask = () => {
    const title = prompt('Task title?');
    if (!title) return;
    mutateProject((p) => {
      const stage = p.stages?.[activeStageIdx];
      if (!stage) return;
      stage.tasks = stage.tasks || [];
      stage.tasks.push({
        task_id: `TSK-${Math.floor(Math.random()*9000+1000)}`,
        title,
        description: '',
        status: 'Pending',
        due_date: '',
      });
    });
    addActivity('Task Added', title);
  };
  const handleQuickAddTask = () => {
    if (!quickTaskTitle) return;
    mutateProject((p) => {
      const stage = p.stages?.[activeStageIdx];
      if (!stage) return;
      stage.tasks = stage.tasks || [];
      stage.tasks.push({
        task_id: `TSK-${Math.floor(Math.random()*9000+1000)}`,
        title: quickTaskTitle,
        description: '',
        status: 'Pending',
        due_date: quickTaskDue || '',
      });
    });
    addActivity('Task Added', quickTaskTitle);
    setQuickTaskTitle('');
    setQuickTaskDue('');
  };
  const handleMarkTaskDone = (taskId) => {
    let titleRef = '';
    mutateProject((p) => {
      const stage = p.stages?.[activeStageIdx];
      const t = stage?.tasks?.find(t=>t.task_id===taskId);
      if (t) {
        t.status = 'Completed';
        titleRef = t.title || '';
      }
    });
    addActivity('Task Completed', titleRef || taskId);
  };
  const handleEditTask = (taskId) => {
    const s = project?.stages?.[activeStageIdx];
    const t = s?.tasks?.find(t => t.task_id === taskId);
    if (!t) return;

    setEditTaskId(taskId);
    setEditTitle(t.title || '');
    setEditDesc(t.description || '');
    setShowEditDialog(true);
  };




  const handleDeleteTask = (taskId) => {
    setSelectedTaskId(taskId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = (taskId) => {
    if (!taskId || !project) return;

    const stage = project.stages?.[activeStageIdx];
    if (!stage) return;

    const payload = {
      action: "deleterequest",
      payload: {
        request: "student_create",
        actor: {
          role: "student",
          email_id: "mindspark.user1@schoolfuel.org",
          user_id: "23e228fa-4592-4bdc-852e-192973c388ce",
        },
        ids: {
          entity_type: "task",
          project_id: project.project_id,
          stage_id: stage.stage_id,
          task_id: taskId,                 // ← this is the one that must arrive
        },
        subject_domain: project.subject_domain || "General",
        reason: deleteReason || "No reason provided",
      },
    };

    // Optimistic UI
    mutateProject((p) => {
      const s = p.stages?.[activeStageIdx];
      const t = s?.tasks?.find((t) => t.task_id === taskId);
      if (t) t.status = "Pending Deletion";
    });
    addActivity("Task Deletion Requested", taskId);
    setShowDeleteDialog(false);

    // Hard guard before sending
    if (!payload.payload.ids.task_id) {
      alert("Could not prepare delete request (missing task id). Try again.");
      return;
    }

    console.log("🟡 Final delete payload before send:", payload);

    google.script.run
      .withSuccessHandler((res) => {
        console.log("✅ Delete initiation sent:", res);
        setDeleteReason("");
        setSelectedTaskId(null);
      })
      .withFailureHandler((err) => {
        console.error("❌ Failed to send delete initiation", err);
        alert("Failed to send delete request. Please try again later.");
      })
      .postToBackend(payload);            // ← pass OBJECT, not JSON string
  };



  const fetchDeleteRequests = () => {
    const payload = {
      action: "myprojects",
      payload: {
        user_id: "23e228fa-4592-4bdc-852e-192973c388ce",
        email_id: "mindspark.user1@schoolfuel.org",
        request: "delete_request_details_student",
      },
    };

    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((result) => {
          try {
            const parsed = typeof result === "string" ? JSON.parse(result) : result;
            resolve(parsed?.action_response?.requests || []);
          } catch (e) {
            reject(e);
          }
        })
        .withFailureHandler(reject)
        .postToBackend(payload);          // ← object, not JSON string
    });
  };

  const handleConfirmStageDelete = async (stageId) => {
    if (!stageId || !project) return;

    const subjectDomain = project.subject_domain || "General";
    const projectId = project.project_id;

    const payload = {
      action: "deleterequest",
      payload: {
        request: "student_create",
        actor: {
          role: "student",
          email_id: "mindspark.user1@schoolfuel.org",
          user_id: "23e228fa-4592-4bdc-852e-192973c388ce",
        },
        ids: {
          entity_type: "stage",
          project_id: projectId,
          stage_id: stageId,
        },
        subject_domain: subjectDomain,
        reason: deleteStageReason || "No reason provided",
      },
    };

    console.log("Sending stage delete request:", payload);

    // Update UI optimistically
    mutateProject((p) => {
      const s = p.stages?.find((s) => s.stage_id === stageId);
      if (s) s.status = "Pending Deletion";
    });

    // Close the dialog
    setShowStageDeleteDialog(false);

    try {
      google.script.run
        .withSuccessHandler((res) => {
          console.log("✅ Stage delete initiation sent:", res);
          alert("Stage delete request sent successfully.");
          setDeleteStageReason('');
          setSelectedStageId(null);
        })
        .withFailureHandler((err) => {
          console.error("❌ Failed to send stage delete initiation", err);
          alert("Failed to send delete request. Please try again later.");
        })
        .postToBackend(JSON.stringify(payload));
    } catch (err) {
      console.error("❌ Exception in handleConfirmStageDelete:", err);
    }
  };


  const postSaveProject = (updatedProject) => {
    const payload = {
      action: "saveproject",
      payload: {
        json: {
          project: updatedProject, // full project object
        },
        user_id: "23e228fa-4592-4bdc-852e-192973c388ce",
        generatedAt: new Date().toISOString(),
      },
    };

    google.script.run
      .withSuccessHandler((res) => {
        try {
          // Parse backend response (Apps Script usually returns a string)
          const parsed = typeof res === "string" ? JSON.parse(res) : res;

          if (parsed?.status === "success") {
            const msg =
              parsed?.action_response?.response ||
              "Revision sent successfully for approval!";
            alert(msg);
          } else {
            console.error("Backend error:", parsed);
            alert("Failed to send revision. Please retry.");
          }
        } catch (err) {
          console.error("Error parsing backend response:", err, res);
          alert("Unexpected response from backend. Please retry.");
        }
      })
      .withFailureHandler((err) => {
        console.error("Error sending to Apps Script:", err);
        alert("Failed to send revision. Please retry.");
      })
      .postToBackend(JSON.stringify(payload));
  };


  const handleSubmitRevision = async () => {
    if (!editTaskId) return;

    // 1️⃣ Build updated project synchronously
    const copy = JSON.parse(JSON.stringify(project));
    const s = copy.stages?.[activeStageIdx];
    if (s?.tasks) {
      const t = s.tasks.find(t => t.task_id === editTaskId);
      if (t) {
        t.title = editTitle.trim() || t.title;
        t.description = editDesc.trim() || t.description;
        t.status = "Revision";
      }
    }

    // 2️⃣ Update UI optimistically
    setProject(copy);
    setShowEditDialog(false);
    setEditTaskId(null);

    // 3️⃣ Send to backend
    try {
      await postSaveProject(copy);
    } catch (e) {
      console.error(e);
      alert("Failed to send revision. Your local edits are saved; please retry.");
    }
  };


  

  // Gate step save/submit
  const handleSaveGateStep = () => {
    const stepKey = currentGateSteps[activeGateStepIdx];
    mutateProject((p)=>{
      const s = p.stages?.[activeStageIdx];
      if (!s) return;
      s.gate = s.gate || {};
      s.gate.step_data = s.gate.step_data || {};
      s.gate.step_data[stepKey] = {
        ...(s.gate.step_data[stepKey] || {}),
        objective: gateObjective,
        evidence: gateEvidence,
        status: 'Draft'
      };
    });
    addActivity('Gate Step Saved', stepKey);
  };
  const handleSubmitGateStep = () => {
    const stepKey = currentGateSteps[activeGateStepIdx];
    mutateProject((p)=>{
      const s = p.stages?.[activeStageIdx];
      if (!s?.gate?.step_data?.[stepKey]) return;
      s.gate.step_data[stepKey].status = 'Submitted';
    });
    alert('Step submitted.');
    addActivity('Gate Step Submitted', stepKey);
  };

  // Gate checklist actions
  const handleAddChecklistItem = () => {
    let textRef = '';
    mutateProject((p) => {
      const stage = p.stages?.[activeStageIdx];
      if (!stage) return;
      stage.gate = stage.gate || {};
      stage.gate.checklist = stage.gate.checklist || [];
      const text = prompt('Add checklist item');
      if (!text) return;
      stage.gate.checklist.push(text);
      textRef = text;
    });
    if (textRef) addActivity('Checklist Item Added', textRef);
  };
  const handleRemoveChecklistItem = (idx) => {
    mutateProject((p) => {
      const stage = p.stages?.[activeStageIdx];
      if (!stage?.gate?.checklist) return;
      stage.gate.checklist.splice(idx,1);
    });
    addActivity('Checklist Item Removed', String(idx));
  };

  // Resource actions (mock attach/remove)
  const handleAttachResource = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleRemoveResource = (id) => {
    mutateProject((p) => {
      p.resources = (p.resources || []).filter(r=>r.id!==id);
    });
    addActivity('Resource Removed', id);
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = URL.createObjectURL(file);
      mutateProject((p) => {
        p.resources = p.resources || [];
        p.resources.push({ id: `RES-${Math.floor(Math.random()*9000+1000)}`, title: file.name, kind: file.type || 'File', url, size: file.size });
      });
      addActivity('Resource Uploaded', file.name);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // UI actions
  const handleSubmitProject = () => {
    if (!canSubmit) return;
    alert('Submitted for review.');
    addActivity('Project Submitted', '');
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 font-sans mt-4 mb-8 overflow-y-auto min-h-[85vh] pb-6">
        <div className="p-6 text-sm text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 font-sans mt-4 mb-8 overflow-y-auto min-h-[85vh] pb-6">
        <div className="p-6 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 font-sans mt-4 mb-8 overflow-y-auto min-h-[85vh] pb-6">
      {/* Header Section */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-purple-100 to-purple-50">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Project Prototype</h1>
        <p className="text-sm text-gray-600">
          Review and track your project’s progress, tasks, and resources.
        </p>
      </div>

      {/* Project Header */}
      <div className="p-6 pb-0">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {project?.project_title || 'Project Title'}
          </h2>
          <p className="text-gray-600 mb-4">
            {project?.description || 'Project description goes here. This should provide a brief overview of the project.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {project?.subject_domain && (
              <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {project.subject_domain}
              </span>
            )}
            {project?.status && (
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  project.status
                )}`}
              >
                {project.status}
              </span>
            )}

          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="flex items-center gap-6 border-b border-gray-300 mb-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'gate', label: 'Gate Checklist' },
            { id: 'resources', label: 'Resources & Activity' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`text-sm pb-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-600 text-purple-700 font-medium'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>


        {/* --- Overview Tab --- */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Project stats and other overview content will go here */}

            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-900">Project Snapshot</h3>
              <button
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  canSubmit
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!canSubmit}
                onClick={handleSubmitProject}
              >
                Submit for Review
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-700 mb-1">Tasks Done</div>
                <div className="text-2xl font-bold text-blue-900">
                  {taskStats.completed}/{taskStats.total}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-xs text-green-700 mb-1">Gate Progress</div>
                <div className="text-2xl font-bold text-green-900">
                  {gateStats.completed}/{gateStats.total}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="font-semibold text-sm text-yellow-900 mb-1">Next Action</div>
              <div className="text-xs text-yellow-800">
                {canSubmit
                  ? 'Ready to submit: click "Submit for Review".'
                  : 'Complete at least 1 task and upload 1 resource to enable submission.'}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="font-semibold text-sm text-gray-900 mb-1">Reviewer</div>
              <div className="text-xs text-gray-600">Unassigned</div>
            </div>
          </div>
        )}

        {/* --- Tasks Tab --- */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 border-b border-gray-200">
                {stages.map((s, idx) => (
                  <button
                    key={s.stage_id || idx}
                    className={`px-3 py-1.5 text-xs rounded-t border-b-2 ${
                      idx === activeStageIdx
                        ? 'border-purple-600 text-purple-700 font-medium'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveStageIdx(idx)}
                  >
                    Stage {s.stage_order || idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {stages[activeStageIdx] && (
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="p-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{stages[activeStageIdx].title}</h4>
                    <div className="text-xs text-gray-500 mt-1">
                      {stages[activeStageIdx].tasks?.length || 0} tasks
                    </div>
                  </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* 🗑️ Delete Stage button */}
                      <button
                        onClick={() => {
                          setSelectedStageId(stages[activeStageIdx].stage_id);
                          setShowStageDeleteDialog(true);
                        }}
                        disabled={stages[activeStageIdx].status === "Pending Deletion"}
                        className={`text-xs px-3 py-1.5 rounded-md inline-flex items-center justify-center gap-1 w-[110px] shadow-sm transition-all ${
                          stages[activeStageIdx].status === "Pending Deletion"
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        <Trash2 size={12} />
                        {stages[activeStageIdx].status === "Pending Deletion"
                          ? "Pending Deletion"
                          : "Delete Stage"}
                      </button>
                      </div>
                  </div>

                </div>

                <div className="p-2 space-y-3">
                  {(stages[activeStageIdx].tasks || []).map((task) => (
                    <div
                      key={task.task_id}
                      className={`border border-gray-200 rounded-lg p-4 shadow-sm transition text-sm flex justify-between items-start gap-4 ${
                        task.status === 'Completed'
                          ? 'bg-green-50 opacity-80 cursor-not-allowed'
                          : 'bg-white hover:shadow'
                      }`}
                    >
                      {/* Left Column: Task Info */}
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                          {task.title || "Untitled Task"}

                          {task.status && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded ${
                                task.status === "Revision"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : task.status === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {task.status}
                            </span>
                          )}
                        </h5>


                        {/* Description */}
                        {task.description && (
                          <p className="text-gray-700 mt-1">{task.description}</p>
                        )}

                        {/* Due + Standards row */}
                        <div className="text-xs text-gray-600 mt-2 mb-2 flex flex-wrap gap-4">
                          <div>
                            <span className="font-medium">Due:</span>{' '}
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : <span className="italic text-gray-400">N/A</span>}
                          </div>
                          <div>
                            <span className="font-medium">Standards:</span>{' '}
                            {task.standards
                              ? (Array.isArray(task.standards)
                                  ? task.standards.join(', ')
                                  : task.standards)
                              : <span className="italic text-gray-400">N/A</span>}
                          </div>
                        </div>

                        {/* Resource link */}
                        {task.evidence_link && (
                          <div className="mt-1">
                            <a
                              href={task.evidence_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 text-xs"
                            >
                              <BookOpen size={12} /> View Resource <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {/* Complete Button */}
                        <button
                          onClick={() => handleMarkTaskDone(task.task_id)}
                          disabled={
                            task.status === "Completed" ||
                            task.status === "Pending Deletion" ||
                            task.status === "Revision"
                          }
                          className={`text-xs px-3 py-1.5 rounded-md w-[90px] ${
                            task.status === "Completed" ||
                            task.status === "Pending Deletion" ||
                            task.status === "Revision"
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {task.status === "Completed" ? "Completed" : "Complete"}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditTask(task.task_id)}
                          disabled={task.status === "Completed" || task.status === "Pending Deletion"}
                          className={`text-xs px-3 py-1.5 rounded-md inline-flex items-center justify-center gap-1 w-[90px] ${
                            task.status === "Completed" || task.status === "Pending Deletion"
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          <Pencil size={12} /> Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            setSelectedTaskId(task.task_id);
                            setShowDeleteDialog(true);
                          }}
                          disabled={
                            task.status === "Completed" ||
                            task.status === "Pending Deletion" ||
                            task.status === "Revision"
                          }
                          className={`text-xs px-3 py-1.5 rounded-md inline-flex items-center justify-center gap-1 w-[90px] ${
                            task.status === "Completed" ||
                            task.status === "Pending Deletion" ||
                            task.status === "Revision"
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          <Trash2 size={12} />
                          {task.status === "Pending Deletion" ? "Pending Deletion" : "Delete"}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Quick Add */}
                <div className="p-2 space-y-3">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow transition text-sm">
                    <h5 className="font-semibold text-gray-900 mb-3">Quick Add</h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        className="text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                        placeholder="e.g., Draft hypothesis"
                        value={quickTaskTitle}
                        onChange={(e) => setQuickTaskTitle(e.target.value)}
                      />
                      <input
                        type="date"
                        className="text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                        value={quickTaskDue}
                        onChange={(e) => setQuickTaskDue(e.target.value)}
                      />
                    </div>

                    {/* Buttons aligned bottom right */}
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => {
                          setQuickTaskTitle('');
                          setQuickTaskDue('');
                        }}
                        className="text-sm px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleQuickAddTask}
                        className="text-sm px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                      >
                        Save Task
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* --- Gate Checklist Tab --- */}
        {activeTab === 'gate' && (
          <div className="space-y-3">
            {/* Stage Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2 border-b border-gray-200">
                {stages.map((s, idx) => (
                  <button
                    key={s.stage_id || idx}
                    className={`px-3 py-1.5 text-xs rounded-t border-b-2 ${
                      idx === activeStageIdx
                        ? 'border-purple-600 text-purple-700 font-medium'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveStageIdx(idx)}
                  >
                    Stage {s.stage_order || idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Gate Section */}
            {stages[activeStageIdx] && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header Section - matches Tasks style */}
                <div className="p-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-medium text-gray-900">
                        {stages[activeStageIdx].gate?.description || 'Gate Description'}
                      </h4>
                      <div className="text-xs text-gray-500 mt-1">
                        {(stages[activeStageIdx].gate?.checklist?.length || 0)} checklist item
                        {(stages[activeStageIdx].gate?.checklist?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist Items */}
                <div className="p-2 space-y-4">
                  {(stages[activeStageIdx].gate?.checklist || []).length > 0 ? (
                    stages[activeStageIdx].gate.checklist.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow transition text-sm"
                      >
                        {/* Top-right Buttons - stacked vertically */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <button
                            onClick={() => handleEditGateItem(idx)}
                            className="text-xs px-3 py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 w-[90px]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleReflectionGateItem(idx)}
                            className="text-xs px-3 py-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 w-[90px]"
                          >
                            Reflection
                          </button>
                        </div>

                        {/* Checklist Item Title */}
                        <h5 className="font-semibold text-gray-900 pr-28">
                          {item?.title || item || `Checklist Item ${idx + 1}`}
                        </h5>

                        {/* Due + Standards Row */}
                        <div className="text-xs text-gray-600 mt-2 mb-2 flex flex-wrap gap-4">
                          <div>
                            <span className="font-medium">Due:</span>{' '}
                            {item?.due_date ? (
                              new Date(item.due_date).toLocaleDateString()
                            ) : (
                              <span className="italic text-gray-400">N/A</span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Standards:</span>{' '}
                            {item?.standards ? (
                              Array.isArray(item.standards)
                                ? item.standards.join(', ')
                                : item.standards
                            ) : (
                              <span className="italic text-gray-400">N/A</span>
                            )}
                          </div>
                        </div>

                        {/* Feedback + Final Grade */}
                        <div className="grid grid-cols-2 gap-3 mt-6 pt-2">
                          <div className="border border-gray-100 rounded p-3 bg-gray-50">
                            <h6 className="text-xs font-semibold text-gray-700 mb-1">FEEDBACK</h6>
                            <p className="text-xs text-gray-600">
                              No feedback yet. Awaiting instructor evaluation.
                            </p>
                          </div>
                          <div className="border border-gray-100 rounded p-3 bg-gray-50">
                            <h6 className="text-xs font-semibold text-gray-700 mb-1">FINAL GRADE</h6>
                            <p className="text-xs text-gray-800 font-medium">Not Yet Proficient</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm italic mt-3">
                      No checklist items found for this stage.
                    </p>
                  )}

                  {/* Add Item Button */}
                  <div className="pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Resources & Activity Tab (light placeholder using existing state shape if provided) --- */}
        {activeTab === 'resources' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Resources</h3>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
                <button onClick={handleAttachResource} disabled={uploading} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${uploading ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                  <Upload size={12}/>{uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {(project?.resources || []).length === 0 && (
                <div className="text-xs text-gray-500">No resources yet.</div>
              )}
              {(project?.resources || []).map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs border border-gray-200 rounded p-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={14} className="text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">{r.title}</div>
                      <div className="text-gray-500">{r.kind}{r.size ? ` • ${(r.size/1024).toFixed(1)} KB` : ''}</div>
                      {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1 mt-1">Open <ExternalLink size={10} /></a>}
                    </div>
                  </div>
                  <button onClick={()=>handleRemoveResource(r.id)} className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-1"><Trash2 size={12}/>Remove</button>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Activity</h3>
              {!(project?.activity?.length) && (
                <div className="text-xs text-gray-500">No activity yet.</div>
              )}
              <div className="space-y-2">
                {(project?.activity || []).map(a => (
                  <div key={a.id} className="flex items-center justify-between text-xs border border-gray-200 rounded p-2">
                    <div>
                      <div className="font-medium text-gray-900">{a.action}</div>
                      <div className="text-gray-600">{a.details}</div>
                    </div>
                    <div className="text-gray-500">{new Date(a.at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {showDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[420px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h2>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete this task?
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for deletion:
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full border border-gray-300 rounded-md p-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteReason('');     // ← reset on close
                }}
                className="text-sm px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                No
              </button>

              <button
                 onClick={() => handleConfirmDelete(selectedTaskId)}
                className="text-sm px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-[520px] rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Edit Task</h2>

            <label className="mb-1 block text-xs font-medium text-gray-700">
              Title
            </label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="mb-3 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Task title"
            />

            <label className="mb-1 block text-xs font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={4}
              className="mb-5 w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Task description"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setEditTaskId(null);
                }}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-800 hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleSubmitRevision}
                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
              >
                Send for Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {showStageDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[420px] border border-gray-200 p-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Confirm Stage Deletion</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this stage?
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for deletion
            </label>
            <textarea
              value={deleteStageReason}
              onChange={(e) => setDeleteStageReason(e.target.value)}
              placeholder="Enter your reason..."
              className="w-full border border-gray-300 rounded-md p-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStageDeleteDialog(false);
                  setDeleteStageReason('');
                }}
                className="text-sm px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancel
              </button>

              <button
                onClick={() => handleConfirmStageDelete(selectedStageId)}
                className="text-sm px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

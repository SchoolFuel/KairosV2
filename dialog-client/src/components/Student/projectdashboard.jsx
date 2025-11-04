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
      .withSuccessHandler((result) => {
        try {
          // Expecting result.action_response.json.project like in sidebar ProjectDetail
          const p = result?.action_response?.json?.project;
          if (!p) throw new Error('Invalid response format');
          setProject(p);
        } catch (e) {
          setError(e.message);
        } finally {
          setIsLoading(false);
        }
      })
      .withFailureHandler((err) => {
        console.error('Error fetching project details:', err);
        setError(err?.message || 'Failed to load project details');
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
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-gray-100 text-gray-800',
      'default': 'bg-gray-100 text-gray-800'
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
    let newTitleRef = '';
    mutateProject((p) => {
      const stage = p.stages?.[activeStageIdx];
      const t = stage?.tasks?.find(t=>t.task_id===taskId);
      if (!t) return;
      const newTitle = prompt('Edit title', t.title) ?? t.title;
      const newDesc = prompt('Edit description', t.description || '') ?? t.description;
      t.title = newTitle;
      t.description = newDesc;
      newTitleRef = newTitle;
    });
    addActivity('Task Edited', newTitleRef || taskId);
  };
  const handleDeleteTask = (taskId) => {
    if (!confirm('Delete this task?')) return;
    mutateProject((p) => {
      const stage = p.stages?.[activeStageIdx];
      if (!stage?.tasks) return;
      stage.tasks = stage.tasks.filter(t=>t.task_id!==taskId);
    });
    addActivity('Task Deleted', taskId);
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
              <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {project.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6">
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
                  ? 'border-b-2 border-current font-medium'
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
                      <h4 className="text-xs font-medium text-gray-900">{stages[activeStageIdx].title}</h4>
                      <div className="text-xs text-gray-500 mt-1">{stages[activeStageIdx].tasks?.length || 0} task{(stages[activeStageIdx].tasks?.length || 0) !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>

                <div className="p-2 space-y-3">
                  {(stages[activeStageIdx].tasks || []).map((task) => (
                    <div
                      key={task.task_id}
                      className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow transition text-sm flex justify-between items-start gap-4"
                    >
                      {/* Left Column: Details */}
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">
                          {task.title || "Untitled Task"}
                        </h5>
                        {task.description && (
                          <p className="text-gray-700 mt-1">{task.description}</p>
                        )}

                        {/* Due + Standards */}
                        <div className="text-xs text-gray-600 mt-2 mb-2 flex flex-wrap gap-4">
                          {task.due_date && (
                            <div>
                              <span className="font-medium">Due:</span>{" "}
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                          {task.standards && (
                            <div>
                              <span className="font-medium">Standards:</span>{" "}
                              {Array.isArray(task.standards)
                                ? task.standards.join(", ")
                                : task.standards}
                            </div>
                          )}
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

                      {/* Right Column: Actions (vertically stacked beside text) */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleMarkTaskDone(task.task_id)}
                          className="text-xs px-3 py-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 w-[100px]"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleEditTask(task.task_id)}
                          className="text-xs px-3 py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 inline-flex items-center justify-center gap-1 w-[100px]"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.task_id)}
                          className="text-xs px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 inline-flex items-center justify-center gap-1 w-[100px]"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>



                {/* Quick Add */}
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Quick Add</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      className="text-xs px-2 py-2 border border-gray-300 rounded"
                      placeholder="e.g., Draft hypothesis"
                      value={quickTaskTitle}
                      onChange={(e)=>setQuickTaskTitle(e.target.value)}
                    />
                    <input
                      type="date"
                      className="text-xs px-2 py-2 border border-gray-300 rounded"
                      value={quickTaskDue}
                      onChange={(e)=>setQuickTaskDue(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={()=>{setQuickTaskTitle(''); setQuickTaskDue('');}} className="text-xs px-3 py-2 rounded bg-gray-200 text-gray-700">Clear</button>
                      <button onClick={handleQuickAddTask} className="text-xs px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700">Save Task</button>
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
            <div className="flex gap-2 border-b border-gray-200">
              {stages.map((s, idx) => (
                <button
                  key={s.stage_id || idx}
                  className={`px-3 py-1.5 text-sm rounded-t border-b-2 transition-all ${
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

            {/* Stage Content */}
            {stages[activeStageIdx] && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="p-3 bg-gray-50 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {stages[activeStageIdx].title || 'Untitled Stage'}
                  </h4>
                  {stages[activeStageIdx].gate?.status && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        stages[activeStageIdx].gate.status
                      )}`}
                    >
                      {stages[activeStageIdx].gate.status}
                    </span>
                  )}
                </div>

                {/* Gate Checklist */}
                {stages[activeStageIdx].gate && (
                  <div className="p-4 text-sm space-y-4 bg-white">
                    {/* Description */}
                    {stages[activeStageIdx].gate.description && (
                      <p className="text-gray-800">
                        {stages[activeStageIdx].gate.description}
                      </p>
                    )}

                    {/* Checklist */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        Checklist:
                      </div>

                      {(stages[activeStageIdx].gate.checklist || []).length > 0 ? (
                        <div className="space-y-2">
                          {stages[activeStageIdx].gate.checklist.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between border-b border-green-100 last:border-none py-1"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-800">{item}</span>
                              </div>
                              <button
                                onClick={() => handleRemoveChecklistItem(idx)}
                                className="text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 inline-flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 italic">
                          No checklist items available.
                        </p>
                      )}
                    </div>
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
    </div>
  );
}

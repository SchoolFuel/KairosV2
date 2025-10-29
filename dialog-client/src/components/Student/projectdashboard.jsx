import { useState, useEffect, useMemo } from 'react';
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
  ChevronRight
} from 'lucide-react';

export default function ProjectDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Project object from backend (same shape as sidebar ProjectDetail)
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStageIdx, setActiveStageIdx] = useState(0);

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

  // UI actions
  const handleSubmitProject = () => {
    if (!canSubmit) return;
    alert('Submitted for review.');
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 font-sans mt-6 mb-10">
        <div className="p-6 text-sm text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 font-sans mt-6 mb-10">
        <div className="p-6 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 font-sans mt-6 mb-10">
      {/* Header Section */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-purple-100 to-purple-50">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Project Prototype</h1>
        <p className="text-sm text-gray-600">
          Review and track your project’s progress, tasks, and resources.
        </p>
      </div>

      {/* Tabs */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {['overview', 'tasks', 'gate', 'resources'].map((tab) => (
            <button
              key={tab}
              className={`py-2 px-2 text-xs rounded-lg transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-purple-100 text-purple-800 font-medium'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview'
                ? 'Overview'
                : tab === 'tasks'
                ? 'Tasks'
                : tab === 'gate'
                ? 'Gate Checklist'
                : 'Resources & Activity'}
            </button>
          ))}
        </div>

        {/* --- Overview Tab --- */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {project && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">{project.project_title}</h3>
                {project.description && (
                  <p className="text-sm text-gray-600">{project.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {project.subject_domain && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">{project.subject_domain}</span>
                  )}
                  {project.status && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>{project.status}</span>
                  )}
                </div>
              </div>
            )}

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

            {stages[activeStageIdx] && (
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="p-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-medium text-gray-900">{stages[activeStageIdx].title}</h4>
                      <div className="text-xs text-gray-500 mt-1">{stages[activeStageIdx].tasks?.length || 0} task{(stages[activeStageIdx].tasks?.length || 0) !== 1 ? 's' : ''}</div>
                    </div>
                    {stages[activeStageIdx].status && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(stages[activeStageIdx].status)}`}>{stages[activeStageIdx].status}</span>
                    )}
                  </div>
                </div>

                <div className="p-2 space-y-2">
                  {(stages[activeStageIdx].tasks || []).map(task => (
                    <div key={task.task_id} className="p-2 bg-blue-50 rounded text-xs space-y-1">
                      <h5 className="font-medium text-gray-900">{task.title}</h5>
                      {task.description && <p className="text-gray-600">{task.description}</p>}
                      <div className="flex items-center justify-between text-gray-500">
                        <div className="flex items-center gap-3">
                          {task.status && (
                            <span className={`px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>{task.status}</span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1"><Calendar size={10} />{new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      {task.evidence_link && (
                        <div>
                          <a href={task.evidence_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline">
                            <BookOpen size={12} /> View Resource <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Gate Checklist Tab --- */}
        {activeTab === 'gate' && (
          <div className="space-y-3">
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

            {stages[activeStageIdx] && (
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="p-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-900">{stages[activeStageIdx].title}</h4>
                    {stages[activeStageIdx].gate?.status && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(stages[activeStageIdx].gate.status)}`}>Gate: {stages[activeStageIdx].gate.status}</span>
                    )}
                  </div>
                </div>

                {stages[activeStageIdx].gate && (
                  <div className="p-2 bg-green-50 text-xs space-y-1">
                    {stages[activeStageIdx].gate.description && <p className="text-gray-700">{stages[activeStageIdx].gate.description}</p>}
                    {Array.isArray(stages[activeStageIdx].gate.checklist) && stages[activeStageIdx].gate.checklist.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <div className="text-xs font-medium text-gray-700 mb-1">Checklist:</div>
                        {stages[activeStageIdx].gate.checklist.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span className="text-xs text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- Resources & Activity Tab (light placeholder using existing state shape if provided) --- */}
        {activeTab === 'resources' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Resources</h3>
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
                      <div className="text-gray-500">{r.kind}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
